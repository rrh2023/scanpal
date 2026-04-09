import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type ScanMode = "export" | "solve" | "summarize";
type ScanRow = {
  id: string;
  mode: ScanMode;
  input_text: string | null;
  result_text: string | null;
  image_path: string | null;
  created_at: string;
};

const MODE_META: Record<ScanMode, { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  export: { label: "Export", icon: "document-outline", bg: "#f3f4f6", fg: "#374151" },
  solve: { label: "Solver", icon: "bulb-outline", bg: "#ccfbf1", fg: "#0f766e" },
  summarize: { label: "Summarizer", icon: "sparkles-outline", bg: "#f3e8ff", fg: "#7e22ce" },
};

const FREE_HISTORY_LIMIT = 3;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function HistoryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const isPro = tier === "pro";

  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setScans([]); setLoading(false); return; }
    setError(null);
    try {
      let query = supabase
        .from("scans")
        .select("id, mode, input_text, result_text, image_path, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!isPro) query = query.limit(FREE_HISTORY_LIMIT);
      const { data, error } = await query;
      if (error) throw error;
      setScans((data ?? []) as ScanRow[]);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isPro]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const openScan = (scan: ScanRow) => {
    router.push({ pathname: "/result", params: { mode: scan.mode, imageUri: scan.image_path ?? undefined, text: scan.input_text ?? "", fromHistory: "1" } });
  };

  const renderItem = ({ item }: { item: ScanRow }) => {
    const meta = MODE_META[item.mode];
    const preview = item.input_text?.trim() || item.result_text?.trim() || "";
    return (
      <Pressable onPress={() => openScan(item)} style={s.card}>
        <View style={s.thumb}>
          {item.image_path ? (
            <Image source={{ uri: item.image_path }} style={s.thumbImg} resizeMode="cover" />
          ) : (
            <View style={s.thumbEmpty}><Ionicons name="image-outline" size={24} color="#9ca3af" /></View>
          )}
        </View>
        <View style={s.cardBody}>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={12} color={meta.fg} />
              <Text style={[s.badgeText, { color: meta.fg }]}>{meta.label}</Text>
            </View>
            <Text style={s.date}>{formatDate(item.created_at)}</Text>
          </View>
          {preview ? (
            <Text style={s.preview} numberOfLines={2}>{preview}</Text>
          ) : (
            <Text style={s.noText}>No text</Text>
          )}
        </View>
        <View style={s.chevron}><Ionicons name="chevron-forward" size={20} color="#9ca3af" /></View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.titleRow}><Text style={s.title}>History</Text></View>

      {loading ? (
        <View style={s.center}><ActivityIndicator /></View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
          <Text style={s.errorText}>{error}</Text>
          <Pressable onPress={load} style={s.retryBtn}><Text style={s.retryText}>Retry</Text></Pressable>
        </View>
      ) : scans.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="time-outline" size={56} color="#9ca3af" />
          <Text style={s.emptyTitle}>No scans yet</Text>
          <Text style={s.emptySubtitle}>Your scanned documents will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListFooterComponent={
            !isPro ? (
              <Pressable onPress={() => router.push("/paywall")} style={s.upgradeCard}>
                <View style={s.upgradeBadge}><Ionicons name="lock-closed" size={18} color="#92400e" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.upgradeTitle}>See your full history</Text>
                  <Text style={s.upgradeSub}>Free tier shows only your last {FREE_HISTORY_LIMIT} scans. Upgrade to Pro for unlimited history.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#92400e" />
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  titleRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  list: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  card: {
    flexDirection: "row", gap: 12, borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb",
    backgroundColor: "#fff", padding: 12, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  thumb: { width: 80, height: 80, borderRadius: 12, overflow: "hidden", backgroundColor: "#f3f4f6" },
  thumbImg: { width: "100%", height: "100%" },
  thumbEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  date: { fontSize: 12, color: "#6b7280" },
  preview: { marginTop: 4, fontSize: 14, color: "#374151" },
  noText: { marginTop: 4, fontSize: 14, fontStyle: "italic", color: "#9ca3af" },
  chevron: { alignSelf: "center" },
  errorText: { marginTop: 12, textAlign: "center", fontSize: 16, color: "#111827" },
  retryBtn: { marginTop: 20, borderRadius: 24, backgroundColor: "#111827", paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { fontWeight: "600", color: "#fff" },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: "600", color: "#111827" },
  emptySubtitle: { marginTop: 4, textAlign: "center", fontSize: 14, color: "#6b7280" },
  upgradeCard: {
    marginTop: 8, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16,
    borderWidth: 1, borderColor: "#fcd34d", backgroundColor: "#fffbeb", padding: 16,
  },
  upgradeBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fde68a", alignItems: "center", justifyContent: "center" },
  upgradeTitle: { fontSize: 14, fontWeight: "700", color: "#78350f" },
  upgradeSub: { marginTop: 2, fontSize: 12, color: "#92400e" },
});
