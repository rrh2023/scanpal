// Supabase Edge Function: solve
// Verifies JWT → checks usage cap → calls Anthropic claude-haiku-4-5 → increments usage.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callAnthropic } from "../_shared/anthropic.ts";
import { authenticate, assertWithinLimit, incrementUsage } from "../_shared/usage.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "missing ANTHROPIC_API_KEY" }, 500);

  let text: string;
  try {
    const body = await req.json();
    text = String(body?.text ?? "").trim();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (!text) return json({ error: "text is required" }, 400);

  try {
    const ctx = await authenticate(req);
    await assertWithinLimit(ctx);

    const result = await callAnthropic("solve", text, apiKey);
    const usage = await incrementUsage(ctx);

    return json({ result, usage, tier: ctx.tier });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return json({ error: (e as Error).message }, status);
  }
});
