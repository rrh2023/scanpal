import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type Summary = {
  tldr: string;
  bullet_points: string[];
  action_items: string[];
  tags: string[];
};

type Props = {
  text: string;
  imageUri?: string;
};

const EMPTY: Summary = {
  tldr: "",
  bullet_points: [],
  action_items: [],
  tags: [],
};

/** Parse the edge function's JSON string, tolerating stray fences or prose. */
function parseSummary(raw: string): Summary {
  if (!raw) return EMPTY;
  const match = raw.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : raw;
  try {
    const obj = JSON.parse(jsonStr);
    return {
      tldr: typeof obj.tldr === "string" ? obj.tldr : "",
      bullet_points: Array.isArray(obj.bullet_points)
        ? obj.bullet_points.filter((x: unknown) => typeof x === "string")
        : [],
      action_items: Array.isArray(obj.action_items)
        ? obj.action_items.filter((x: unknown) => typeof x === "string")
        : [],
      tags: Array.isArray(obj.tags)
        ? obj.tags.filter((x: unknown) => typeof x === "string")
        : [],
    };
  } catch {
    return { ...EMPTY, tldr: raw.trim() };
  }
}

function toPlainText(s: Summary): string {
  const lines: string[] = [];
  if (s.tldr) lines.push(`TL;DR: ${s.tldr}`, "");
  if (s.bullet_points.length) {
    lines.push("Key points:");
    for (const b of s.bullet_points) lines.push(`• ${b}`);
    lines.push("");
  }
  if (s.action_items.length) {
    lines.push("Action items:");
    for (const a of s.action_items) lines.push(`- ${a}`);
    lines.push("");
  }
  if (s.tags.length) lines.push(`Tags: ${s.tags.join(", ")}`);
  return lines.join("\n").trim();
}

export function SummaryResult({ text, imageUri }: Props) {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [summary, setSummary] = useState<Summary>(EMPTY);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke<{ result: string }>(
        "summarize",
        { body: { text } }
      );
      if (error) throw error;
      const result = data?.result ?? "";
      setRaw(result);
      setSummary(parseSummary(result));
    } catch (e) {
      setError((e as Error).message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [text]);

  useEffect(() => {
    run();
  }, [run]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(toPlainText(summary));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = async () => {
    if (!user || !raw || savedId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          mode: "summarize",
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
        <Text className="mt-4 text-base text-gray-600">Summarizing…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text className="mt-3 text-center text-base text-gray-800">{error}</Text>
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
      <Text className="mb-4 text-2xl font-bold text-gray-900">Summary</Text>

      {/* TL;DR */}
      {summary.tldr ? (
        <View className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <Text className="text-xs font-bold uppercase tracking-wide text-teal-700">
            TL;DR
          </Text>
          <Text className="mt-1 text-base leading-5 text-teal-900">
            {summary.tldr}
          </Text>
        </View>
      ) : null}

      {/* Key points */}
      {summary.bullet_points.length > 0 ? (
        <View className="mb-5">
          <Text className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            Key points
          </Text>
          <View className="gap-2">
            {summary.bullet_points.map((point, i) => (
              <View key={i} className="flex-row gap-3">
                <View className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-900" />
                <Text className="flex-1 text-base leading-5 text-gray-800">
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Action items */}
      {summary.action_items.length > 0 ? (
        <View className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="flash" size={16} color="#b45309" />
            <Text className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Action items
            </Text>
          </View>
          <View className="gap-2">
            {summary.action_items.map((item, i) => (
              <View key={i} className="flex-row gap-2">
                <Ionicons
                  name="square-outline"
                  size={18}
                  color="#b45309"
                  style={{ marginTop: 1 }}
                />
                <Text className="flex-1 text-base leading-5 text-amber-900">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Tags */}
      {summary.tags.length > 0 ? (
        <View className="mb-6">
          <Text className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
            Tags
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {summary.tags.map((tag, i) => (
              <View
                key={i}
                className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1"
              >
                <Text className="text-xs font-medium text-gray-700">#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Actions */}
      <View className="mt-2 gap-3">
        <Pressable
          onPress={handleCopy}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white p-4 active:bg-gray-50"
        >
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={20}
            color="#111827"
          />
          <Text className="text-base font-semibold text-gray-900">
            {copied ? "Copied" : "Copy text"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={saving || !!savedId}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-gray-900 p-4 active:opacity-80"
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
            {savedId ? "Saved" : "Save note"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
