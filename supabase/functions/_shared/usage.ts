// Shared auth + usage-limit helpers for ScanPal Edge Functions.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const FREE_LIMIT = 10;

export type AuthedContext = {
  userId: string;
  tier: "free" | "pro";
  client: SupabaseClient;
};

/** Authenticate via the request's JWT and return the user id + tier. */
export async function authenticate(req: Request): Promise<AuthedContext> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    throw Object.assign(new Error("missing bearer token"), { status: 401 });
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) {
    throw Object.assign(new Error("invalid token"), { status: 401 });
  }

  const { data: profile } = await client
    .from("users")
    .select("tier")
    .eq("id", user.id)
    .single();

  const tier: "free" | "pro" = profile?.tier === "pro" ? "pro" : "free";
  return { userId: user.id, tier, client };
}

/** Throw if the user has hit their monthly scan limit. */
export async function assertWithinLimit(ctx: AuthedContext): Promise<number> {
  if (ctx.tier === "pro") return 0;

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStr = monthStart.toISOString().slice(0, 10);

  const { data, error } = await ctx.client
    .from("usage_month")
    .select("scan_count")
    .eq("user_id", ctx.userId)
    .eq("month", monthStr)
    .maybeSingle();
  if (error) throw Object.assign(new Error(error.message), { status: 500 });

  const count = data?.scan_count ?? 0;
  if (count >= FREE_LIMIT) {
    throw Object.assign(new Error("monthly scan limit reached"), { status: 402 });
  }
  return count;
}

/** Atomically increment the current month's scan counter. Returns the new count. */
export async function incrementUsage(ctx: AuthedContext): Promise<number> {
  const { data, error } = await ctx.client.rpc("increment_scan_usage");
  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return Number(data ?? 0);
}
