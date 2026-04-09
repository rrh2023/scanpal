import { useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { isPro } from "@/lib/revenuecat";

type Mode = "export" | "solve" | "summarize";
type ModeCardData = { id: Mode; icon: keyof typeof Ionicons.glyphMap; title: string; description: string; requiresPro: boolean };

const MODES: ModeCardData[] = [
  { id: "export", icon: "document-outline", title: "Save as PDF or Image", description: "Export the scan to your library or share it.", requiresPro: false },
  { id: "solve", icon: "bulb-outline", title: "Solve this problem", description: "Get a step-by-step solution powered by AI.", requiresPro: true },
  { id: "summarize", icon: "sparkles-outline", title: "Summarize the text", description: "Turn long passages into a concise summary.", requiresPro: true },
];

export default function ModeSelectScreen() {
  const router = useRouter();
  const { imageUri, text } = useLocalSearchParams<{ imageUri?: string; text?: string }>();
  const [checkingMode, setCheckingMode] = useState<Mode | null>(null);

  const handleSelect = async (mode: ModeCardData) => {
    if (!mode.requiresPro) {
      router.push({ pathname: "/result", params: { mode: mode.id, imageUri, text } });
      return;
    }
    setCheckingMode(mode.id);
    try {
      const pro = await isPro();
      if (!pro) { router.push("/paywall"); return; }
      router.push({ pathname: "/result", params: { mode: mode.id, imageUri, text } });
    } catch {
      router.push("/paywall");
    } finally {
      setCheckingMode(null);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>What next?</Text>

        <View style={s.thumbWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={s.thumbImg} resizeMode="cover" />
          ) : (
            <View style={s.thumbEmpty}>
              <Ionicons name="image-outline" size={48} color="#9ca3af" />
              <Text style={s.thumbLabel}>No preview</Text>
            </View>
          )}
        </View>

        <View style={s.cards}>
          {MODES.map((mode) => {
            const loading = checkingMode === mode.id;
            return (
              <Pressable key={mode.id} onPress={() => handleSelect(mode)} disabled={loading} style={s.card}>
                <View style={s.cardIcon}>
                  {loading ? <ActivityIndicator /> : <Ionicons name={mode.icon} size={24} color="#111827" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.cardTitleRow}>
                    <Text style={s.cardTitle}>{mode.title}</Text>
                    {mode.requiresPro ? (
                      <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>
                    ) : null}
                  </View>
                  <Text style={s.cardDesc}>{mode.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 16 },
  thumbWrap: { borderRadius: 16, overflow: "hidden", backgroundColor: "#f3f4f6", marginBottom: 24 },
  thumbImg: { width: "100%", height: 220 },
  thumbEmpty: { width: "100%", height: 220, alignItems: "center", justifyContent: "center" },
  thumbLabel: { marginTop: 8, color: "#9ca3af" },
  cards: { gap: 12 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 16,
    borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  proBadge: { borderRadius: 12, backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 2 },
  proBadgeText: { fontSize: 10, fontWeight: "700", color: "#92400e" },
  cardDesc: { marginTop: 4, fontSize: 14, color: "#6b7280" },
});
