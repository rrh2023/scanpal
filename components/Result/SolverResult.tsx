import { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type Step = { title: string; explanation: string };
type Parsed = { steps: Step[]; answer: string };
type Props = { text: string; imageUri?: string };

function parseSolution(raw: string): Parsed {
  if (!raw) return { steps: [], answer: "" };
  let answer = "";
  const answerMatch = raw.match(/^\s*answer\s*:\s*(.+)$/im);
  if (answerMatch) answer = answerMatch[1].trim();
  const body = answerMatch ? raw.replace(answerMatch[0], "").trim() : raw.trim();
  const parts = body.split(/\n(?=\s*(?:step\s*\d+|[0-9]+\.)\b)/i).map((p) => p.trim()).filter(Boolean);
  const steps: Step[] = parts.map((chunk, idx) => {
    const [firstLine, ...rest] = chunk.split("\n");
    const cleanTitle = firstLine.replace(/^\s*(?:step\s*\d+[:.)-]?|[0-9]+[.)-])\s*/i, "").trim();
    return { title: cleanTitle || `Step ${idx + 1}`, explanation: rest.join("\n").trim() };
  });
  if (steps.length === 0 && body) steps.push({ title: "Solution", explanation: body });
  return { steps, answer };
}

export function SolverResult({ text, imageUri }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<Parsed>({ steps: [], answer: "" });
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke<{ result: string }>("solve", { body: { text } });
      if (error) throw error;
      const result = data?.result ?? "";
      setRaw(result); setParsed(parseSolution(result));
    } catch (e) { setError((e as Error).message ?? "Something went wrong"); }
    finally { setLoading(false); }
  }, [text]);

  useEffect(() => { run(); }, [run]);

  const handleSave = async () => {
    if (!user || !raw || savedId) return; setSaving(true);
    try {
      const { data, error } = await supabase.from("scans").insert({ user_id: user.id, mode: "solve", input_text: text, result_text: raw, image_path: imageUri ?? null }).select("id").single();
      if (error) throw error;
      if (data?.id) setSavedId(data.id);
    } catch (e) { setError((e as Error).message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0d9488" /><Text style={s.loadText}>Solving…</Text></View>;

  if (error) return (
    <View style={s.center}>
      <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
      <Text style={s.errorText}>{error}</Text>
      <Pressable onPress={run} style={s.retryBtn}><Ionicons name="refresh" size={18} color="#fff" /><Text style={s.retryText}>Retry</Text></Pressable>
    </View>
  );

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Solution</Text>
      <View style={s.steps}>
        {parsed.steps.map((step, i) => (
          <View key={i} style={s.stepCard}>
            <View style={s.stepHeader}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
              <Text style={s.stepTitle}>{step.title}</Text>
            </View>
            {step.explanation ? <Text style={s.stepBody}>{step.explanation}</Text> : null}
          </View>
        ))}
      </View>
      {parsed.answer ? (
        <View style={s.answerBox}>
          <Text style={s.answerLabel}>ANSWER</Text>
          <Text style={s.answerText}>{parsed.answer}</Text>
        </View>
      ) : null}
      <Pressable onPress={handleSave} disabled={saving || !!savedId} style={[s.saveBtn, (saving || savedId) && s.saveBtnDone]}>
        {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name={savedId ? "checkmark-circle" : "bookmark-outline"} size={20} color="#fff" />}
        <Text style={s.saveBtnText}>{savedId ? "Saved" : "Save solution"}</Text>
      </Pressable>
      <Pressable onPress={() => router.replace("/(tabs)/scan")} style={s.newScanBtn}>
        <Ionicons name="scan-outline" size={20} color="#0d9488" />
        <Text style={s.newScanText}>New Scan</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 32 },
  loadText: { marginTop: 16, fontSize: 16, color: "#6b7280" },
  errorText: { marginTop: 12, textAlign: "center", fontSize: 16, color: "#111827" },
  retryBtn: { marginTop: 20, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 24, backgroundColor: "#111827", paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { fontWeight: "600", color: "#fff" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 16 },
  steps: { gap: 12 },
  stepCard: {
    borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 14, fontWeight: "700", color: "#0f766e" },
  stepTitle: { flex: 1, fontSize: 16, fontWeight: "600", color: "#111827" },
  stepBody: { marginTop: 8, fontSize: 14, lineHeight: 20, color: "#374151" },
  answerBox: { marginTop: 20, borderRadius: 16, borderWidth: 1, borderColor: "#5eead4", backgroundColor: "#f0fdfa", padding: 20 },
  answerLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: "#0f766e" },
  answerText: { marginTop: 4, fontSize: 20, fontWeight: "700", color: "#134e4a" },
  saveBtn: { marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, backgroundColor: "#111827", padding: 16 },
  saveBtnDone: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  newScanBtn: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, borderColor: "#99f6e4", backgroundColor: "#f0fdfa", padding: 16 },
  newScanText: { fontSize: 16, fontWeight: "600", color: "#0d9488" },
});
