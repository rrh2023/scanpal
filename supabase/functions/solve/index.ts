// Supabase Edge Function: solve
// Calls Anthropic claude-haiku-4-5 server-side. Never expose the key to clients.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

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
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system:
          "You are a helpful tutor. Solve the problem step by step, showing your reasoning clearly.",
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return json({ error: "anthropic error", detail: err }, 502);
    }

    const data = await res.json();
    const result: string = data?.content?.[0]?.text ?? "";
    return json({ result });
  } catch (e) {
    return json({ error: "request failed", detail: String(e) }, 500);
  }
});
