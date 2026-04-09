// Shared Anthropic client + prompt templates for ScanPal Edge Functions.
// Model pinned to claude-haiku-4-5 per CLAUDE.md.

export const MODEL = "claude-haiku-4-5";

export const PROMPTS = {
  solve: {
    system:
      "You are a patient tutor. Given a problem extracted from a scanned image, solve it step by step. Show your reasoning clearly, label each step, and state the final answer on its own line prefixed with 'Answer:'. If the input is ambiguous, state your assumptions.",
    user: (text: string) => `Problem:\n\n${text}`,
  },
  summarize: {
    system:
      'You are a concise summarizer. Return STRICT JSON only — no prose, no markdown fences — matching this schema exactly: {"tldr": string, "bullet_points": string[], "action_items": string[], "tags": string[]}. bullet_points: 3–5 key points in plain language. action_items: imperative tasks (empty array if none). tags: 3–6 short lowercase topic labels.',
    user: (text: string) =>
      `Summarize the following text and return JSON only:\n\n${text}`,
  },
} as const;

export type PromptKind = keyof typeof PROMPTS;

export async function callAnthropic(
  kind: PromptKind,
  text: string,
  apiKey: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: PROMPTS[kind].system,
      messages: [{ role: "user", content: PROMPTS[kind].user(text) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`anthropic ${res.status}: ${detail}`);
  }
  const data = await res.json();
  return String(data?.content?.[0]?.text ?? "");
}
