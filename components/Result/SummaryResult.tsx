import { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type Summary = { tldr: string; bullet_points: string[]; action_items: string[]; tags: string[] };
type Props = { text: string; imageUri?: string };
const EMPTY: Summary = { tldr: "", bullet_points: [], action_items: [], tags: [] };

function parseSummary(raw: string): Summary {
  if (!raw) return EMPTY;
  const match = raw.match(/\{[\s\S]*\}/);
  try {
    const obj = JSON.parse(match ? match[0] : raw);
    return {
      tldr: typeof obj.tldr === "string" ? obj.tldr : "",
      bullet_points: Array.isArray(obj.bullet_points) ? obj.bullet_points.filter((x: unknown) => typeof x === "string") : [],
      action_items: Array.isArray(obj.action_items) ? obj.action_items.filter((x: unknown) => typeof x === "string") : [],
      tags: Array.isArray(obj.tags) ? obj.tags.filter((x: unknown) => typeof x === "string") : [],
    };
  } catch { return { ...EMPTY, tldr: raw.trim() }; }
}

function toPlainText(s: Summary): string {
  const lines: string[] = [];
  if (s.tldr) lines.push(`TL;DR: ${s.tldr}`, "");
  if (s.bullet_points.length) { lines.push("Key points:"); for (const b of s.bullet_points) lines.push(`• ${b}`); lines.push(""); }
  if (s.action_items.length) { lines.push("Action items:"); for (const a of s.action_items) lines.push(`- ${a}`); lines.push(""); }
  if (s.tags.length) lines.push(`Tags: ${s.tags.join(", ")}`);
  return lines.join("\n").trim();
}

export function SummaryResult({ text, imageUri }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [summary, setSummary] = useState<Summary>(EMPTY);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke<{ result: string }>("summarize", { body: { text } });
      if (error) throw error;
      const result = data?.result ?? "";
      setRaw(result); setSummary(parseSummary(result));
    } catch (e) { setError((e as Error).message ?? "Something went wrong"); }
    finally { setLoading(false); }
  }, [text]);

  useEffect(() => { run(); }, [run]);

  const handleCopy = async () => { await Clipboard.setStringAsync(toPlainText(summary)); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const handleSave = async () => {
    if (!user || !raw || savedId) return; setSaving(true);
    try {
      const { data, error } = await supabase.from("scans").insert({ user_id: user.id, mode: "summarize", input_text: text, result_text: raw, image_path: imageUri ?? null }).select("id").single();
      if (error) throw error;
      if (data?.id) setSavedId(data.id);
    } catch (e) { setError((e as Error).message ?? "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color="#0d9488" /><Text style={st.loadText}>Summarizing…</Text></View>;
  if (error) return (
    <View style={st.center}>
      <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
      <Text style={st.errorText}>{error}</Text>
      <Pressable onPress={run} style={st.retryBtn}><Ionicons name="refresh" size={18} color="#fff" /><Text style={st.retryBtnText}>Retry</Text></Pressable>
    </View>
  );

  return (
    <ScrollView style={st.flex} contentContainerStyle={st.scroll}>
      <Text style={st.title}>Summary</Text>

      {summary.tldr ? (
        <View style={st.tldrBox}><Text style={st.tldrLabel}>TL;DR</Text><Text style={st.tldrText}>{summary.tldr}</Text></View>
      ) : null}

      {summary.bullet_points.length > 0 ? (
        <View style={st.section}>
          <Text style={st.sectionLabel}>KEY POINTS</Text>
          <View style={st.bulletList}>
            {summary.bullet_points.map((p, i) => (
              <View key={i} style={st.bulletRow}>
                <View style={st.bulletDot} />
                <Text style={st.bulletText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {summary.action_items.length > 0 ? (
        <View style={st.actionBox}>
          <View style={st.actionHeader}><Ionicons name="flash" size={16} color="#b45309" /><Text style={st.actionLabel}>ACTION ITEMS</Text></View>
          <View style={st.bulletList}>
            {summary.action_items.map((item, i) => (
              <View key={i} style={st.bulletRow}>
                <Ionicons name="square-outline" size={18} color="#b45309" style={{ marginTop: 1 }} />
                <Text style={st.actionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {summary.tags.length > 0 ? (
        <View style={st.section}>
          <Text style={st.sectionLabel}>TAGS</Text>
          <View style={st.tagRow}>
            {summary.tags.map((tag, i) => (
              <View key={i} style={st.tag}><Text style={st.tagText}>#{tag}</Text></View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={st.actions}>
        <Pressable onPress={handleCopy} style={st.btnLight}>
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color="#111827" />
          <Text style={st.btnLightText}>{copied ? "Copied" : "Copy text"}</Text>
        </Pressable>
        <Pressable onPress={handleSave} disabled={saving || !!savedId} style={[st.btnDark, (saving || savedId) && st.btnDisabled]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name={savedId ? "checkmark-circle" : "bookmark-outline"} size={20} color="#fff" />}
          <Text style={st.btnDarkText}>{savedId ? "Saved" : "Save note"}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)/scan")} style={st.newScanBtn}>
          <Ionicons name="scan-outline" size={20} color="#0d9488" />
          <Text style={st.newScanText}>New Scan</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 32 },
  loadText: { marginTop: 16, fontSize: 16, color: "#6b7280" },
  errorText: { marginTop: 12, textAlign: "center", fontSize: 16, color: "#111827" },
  retryBtn: { marginTop: 20, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 24, backgroundColor: "#111827", paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { fontWeight: "600", color: "#fff" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 16 },
  tldrBox: { borderRadius: 16, borderWidth: 1, borderColor: "#99f6e4", backgroundColor: "#f0fdfa", padding: 16, marginBottom: 20 },
  tldrLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: "#0f766e" },
  tldrText: { marginTop: 4, fontSize: 16, lineHeight: 22, color: "#134e4a" },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 1, color: "#6b7280", marginBottom: 8 },
  bulletList: { gap: 8 },
  bulletRow: { flexDirection: "row", gap: 12 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#111827", marginTop: 7 },
  bulletText: { flex: 1, fontSize: 16, lineHeight: 22, color: "#111827" },
  actionBox: { borderRadius: 16, borderWidth: 1, borderColor: "#fcd34d", backgroundColor: "#fffbeb", padding: 16, marginBottom: 20 },
  actionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: "#92400e" },
  actionText: { flex: 1, fontSize: 16, lineHeight: 22, color: "#78350f" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: "500", color: "#374151" },
  actions: { marginTop: 8, gap: 12 },
  btnLight: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff", padding: 16 },
  btnLightText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  btnDark: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, backgroundColor: "#111827", padding: 16 },
  btnDarkText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  btnDisabled: { opacity: 0.6 },
  newScanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, borderColor: "#99f6e4", backgroundColor: "#f0fdfa", padding: 16 },
  newScanText: { fontSize: 16, fontWeight: "600", color: "#0d9488" },
});
