// Supabase Edge Function: summarize
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const { text } = await req.json();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        { role: "user", content: `Summarize the following:\n\n${text}` },
      ],
    }),
  });
  const data = await res.json();
  const result = data?.content?.[0]?.text ?? "";
  return new Response(JSON.stringify({ result }), {
    headers: { "content-type": "application/json" },
  });
});
