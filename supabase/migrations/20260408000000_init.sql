-- ScanPal initial schema
-- users: profile row keyed to auth.users
-- scans: one row per scan performed
-- usage_month: per-user monthly scan counter for free-tier enforcement

------------------------------------------------------------
-- users
------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- scans
------------------------------------------------------------
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('solve', 'summarize', 'ocr')),
  input_text text,
  result_text text,
  image_path text,
  created_at timestamptz not null default now()
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

------------------------------------------------------------
-- usage_month
------------------------------------------------------------
create table if not exists public.usage_month (
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null, -- first day of month
  scan_count integer not null default 0,
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

-- Atomic increment helper for the current month
create or replace function public.increment_scan_usage()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month date := date_trunc('month', now())::date;
  new_count integer;
begin
  insert into public.usage_month (user_id, month, scan_count)
  values (auth.uid(), current_month, 1)
  on conflict (user_id, month)
  do update set scan_count = public.usage_month.scan_count + 1
  returning scan_count into new_count;
  return new_count;
end;
$$;
