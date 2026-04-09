import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type Step = { title: string; explanation: string };
type Parsed = { steps: Step[]; answer: string };

type Props = {
  text: string;
  imageUri?: string;
};

/**
 * Parse the solver output into numbered steps + final answer.
 * The edge-function prompt asks the model to label steps and prefix
 * the final answer with "Answer:" on its own line.
 */
function parseSolution(raw: string): Parsed {
  if (!raw) return { steps: [], answer: "" };

  // Pull out the final answer line (case-insensitive).
  let answer = "";
  const answerMatch = raw.match(/^\s*answer\s*:\s*(.+)$/im);
  if (answerMatch) answer = answerMatch[1].trim();

  // Remove the answer line from the body before splitting steps.
  const body = answerMatch ? raw.replace(answerMatch[0], "").trim() : raw.trim();

  // Split on "Step N" or "N." at the start of a line.
  const parts = body
    .split(/\n(?=\s*(?:step\s*\d+|[0-9]+\.)\b)/i)
    .map((p) => p.trim())
    .filter(Boolean);

  const steps: Step[] = parts.map((chunk, idx) => {
    // First line → title, rest → explanation.
    const [firstLine, ...rest] = chunk.split("\n");
    const cleanTitle = firstLine
      .replace(/^\s*(?:step\s*\d+[:.)-]?|[0-9]+[.)-])\s*/i, "")
      .trim();
    return {
      title: cleanTitle || `Step ${idx + 1}`,
      explanation: rest.join("\n").trim(),
    };
  });

  // Fallback: if parsing produced nothing, treat the whole body as one step.
  if (steps.length === 0 && body) {
    steps.push({ title: "Solution", explanation: body });
  }

  return { steps, answer };
}

export function SolverResult({ text, imageUri }: Props) {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [parsed, setParsed] = useState<Parsed>({ steps: [], answer: "" });
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke<{ result: string }>(
        "solve",
        { body: { text } }
      );
      if (error) throw error;
      const result = data?.result ?? "";
      setRaw(result);
      setParsed(parseSolution(result));
    } catch (e) {
      setError((e as Error).message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [text]);

  useEffect(() => {
    run();
  }, [run]);

  const handleSave = async () => {
    if (!user || !raw || savedId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          mode: "solve",
          input_text: text,
          result_text: raw,
          image_path: imageUri ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (data?.id) setSavedId(data.id);
    } catch (e) {
      setError((e as Error).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <ActivityIndicator size="large" color="#0d9488" />
        <Text className="mt-4 text-base text-gray-600">Solving…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text className="mt-3 text-center text-base text-gray-800">
          {error}
        </Text>
        <Pressable
          onPress={run}
          className="mt-5 flex-row items-center gap-2 rounded-full bg-gray-900 px-6 py-3 active:opacity-80"
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text className="font-semibold text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <Text className="mb-4 text-2xl font-bold text-gray-900">Solution</Text>

      {/* Steps */}
      <View className="gap-3">
        {parsed.steps.map((step, i) => (
          <View
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-4"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.04,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            }}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                <Text className="text-sm font-bold text-teal-700">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-base font-semibold text-gray-900">
                {step.title}
              </Text>
            </View>
            {step.explanation ? (
              <Text className="mt-2 text-sm leading-5 text-gray-700">
                {step.explanation}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Final answer */}
      {parsed.answer ? (
        <View className="mt-5 rounded-2xl border border-teal-300 bg-teal-50 p-5">
          <Text className="text-xs font-bold uppercase tracking-wide text-teal-700">
            Answer
          </Text>
          <Text className="mt-1 text-xl font-bold text-teal-900">
            {parsed.answer}
          </Text>
        </View>
      ) : null}

      {/* Save button */}
      <Pressable
        onPress={handleSave}
        disabled={saving || !!savedId}
        className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl bg-gray-900 p-4 active:opacity-80"
        style={{ opacity: saving || savedId ? 0.6 : 1 }}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons
            name={savedId ? "checkmark-circle" : "bookmark-outline"}
            size={20}
            color="#fff"
          />
        )}
        <Text className="text-base font-semibold text-white">
          {savedId ? "Saved" : "Save solution"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
