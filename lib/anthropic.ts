// IMPORTANT: never call Anthropic from the client. Route through Supabase Edge Functions.
import { supabase } from "@/lib/supabase";

export async function solveProblem(text: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ result: string }>("solve", {
    body: { text },
  });
  if (error) throw error;
  return data?.result ?? "";
}

export async function summarizeText(text: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ result: string }>("summarize", {
    body: { text },
  });
  if (error) throw error;
  return data?.result ?? "";
}
