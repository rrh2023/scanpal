-- ScanPal initial schema
-- Tables: users (profile mirror of auth.users), scans, usage_month
-- All tables have RLS enabled with owner-only policies.

------------------------------------------------------------------------------
-- users: profile row mirroring auth.users, keyed by auth uid.
------------------------------------------------------------------------------
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  is_pro       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users_select_self"
  on public.users for select
  using (auth.uid() = id);

create policy "users_insert_self"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users_update_self"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------------
-- scans: one row per scan the user performs.
------------------------------------------------------------------------------
create table if not exists public.scans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  mode         text not null check (mode in ('solve','summarize','ocr')),
  image_path   text,                -- storage path in the 'scans' bucket
  ocr_text     text,
  result       jsonb,               -- solver steps / summary / etc.
  created_at   timestamptz not null default now()
);

create index if not exists scans_user_id_created_at_idx
  on public.scans (user_id, created_at desc);

alter table public.scans enable row level security;

create policy "scans_select_own"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "scans_insert_own"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "scans_update_own"
  on public.scans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "scans_delete_own"
  on public.scans for delete
  using (auth.uid() = user_id);

------------------------------------------------------------------------------
-- usage_month: monthly scan counter, used to enforce the 10-scan free tier.
-- Keyed by (user_id, month) where month is the first day of the month (UTC).
------------------------------------------------------------------------------
create table if not exists public.usage_month (
  user_id      uuid not null references auth.users(id) on delete cascade,
  month        date not null,
  scan_count   integer not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.usage_month enable row level security;

create policy "usage_month_select_own"
  on public.usage_month for select
  using (auth.uid() = user_id);

create policy "usage_month_insert_own"
  on public.usage_month for insert
  with check (auth.uid() = user_id);

create policy "usage_month_update_own"
  on public.usage_month for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helper: atomically increment the current month's scan count for the caller.
create or replace function public.increment_scan_usage()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m   date := date_trunc('month', now() at time zone 'utc')::date;
  new_count integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.usage_month (user_id, month, scan_count)
  values (uid, m, 1)
  on conflict (user_id, month)
  do update set scan_count = public.usage_month.scan_count + 1,
                updated_at = now()
  returning scan_count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_scan_usage() to authenticated;
