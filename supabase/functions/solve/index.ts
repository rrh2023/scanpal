// Supabase Edge Function: solve
//
// Receives a base64 image from the client and asks Claude to solve the problem.
// Returns: { steps: string[], final_answer: string }
//
// Deploy:  supabase functions deploy solve
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import Anthropic from 'npm:@anthropic-ai/sdk';
import { corsHeaders } from '../_shared/cors.ts';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
});

const SYSTEM_PROMPT = `You are ScanPal's problem solver. The user will send you a photo of a problem (math, physics, chemistry, logic, etc.).

Solve the problem and respond with ONLY a JSON object, no prose, no markdown fences, matching this exact schema:

{
  "steps": [ "string", "string", ... ],
  "final_answer": "string"
}

Rules:
- "steps" is an ordered array of concise, human-readable reasoning steps.
- Each step should be 1-3 sentences.
- "final_answer" is the final result only.
- If the image does not contain a solvable problem, return { "steps": [], "final_answer": "No problem detected." }.
- Output valid JSON. No trailing commas. No comments.`;

type SolveResponse = { steps: string[]; final_answer: string };

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) {
      return json({ error: 'imageBase64 required' }, 400);
    }

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType ?? 'image/jpeg',
                data: imageBase64,
              },
            },
            { type: 'text', text: 'Solve the problem in this image.' },
          ],
        },
      ],
    });

    const text = msg.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();

    let parsed: SolveResponse;
    try {
      parsed = JSON.parse(stripFences(text));
    } catch {
      return json({ error: 'Model returned invalid JSON', raw: text }, 502);
    }

    return json(parsed);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
