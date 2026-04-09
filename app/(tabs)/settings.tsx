import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import { restorePurchases, hasProEntitlement } from "@/lib/revenuecat";
import { useAuthStore } from "@/store/authStore";

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
};

function SettingsRow({ icon, label, subtitle, onPress, danger, loading }: SettingsRowProps) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={s.row}>
      <View style={[s.rowIcon, danger && s.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? "#dc2626" : "#374151"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && s.rowLabelDanger]}>{label}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      {loading ? <ActivityIndicator /> : <Ionicons name="chevron-forward" size={18} color="#9ca3af" />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const setTier = useAuthStore((s) => s.setTier);
  const [loggingOut, setLoggingOut] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (hasProEntitlement(info)) {
        setTier("pro");
        Alert.alert("Restored", "Your Pro subscription has been restored.");
      } else {
        Alert.alert("Nothing to restore", "No active Pro subscription found.");
      }
    } catch (e) {
      Alert.alert("Restore failed", (e as Error).message ?? "Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await supabase.auth.signOut();
            router.replace("/(auth)/login");
          } catch (e) {
            Alert.alert("Error", (e as Error).message ?? "Sign out failed");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Settings</Text>

        <View style={s.accountCard}>
          <View style={s.avatar}><Ionicons name="person" size={22} color="#0d9488" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.email} numberOfLines={1}>{user?.email ?? "—"}</Text>
            <View style={[s.tierBadge, tier === "pro" ? s.tierPro : s.tierFree]}>
              <Text style={[s.tierText, tier === "pro" ? s.tierProText : s.tierFreeText]}>
                {tier === "pro" ? "PRO" : "FREE"}
              </Text>
            </View>
          </View>
        </View>

        {tier !== "pro" ? (
          <SettingsRow icon="sparkles" label="Upgrade to Pro" subtitle="Unlimited scans, AI solver & summarizer" onPress={() => router.push("/paywall")} />
        ) : null}
        <SettingsRow icon="time-outline" label="Scan History" onPress={() => router.push("/(tabs)/history")} />
        <SettingsRow icon="refresh-outline" label="Restore Purchases" subtitle="Recover a previous Pro subscription" onPress={handleRestore} loading={restoring} />
        <SettingsRow icon="help-circle-outline" label="Help & Support" onPress={() => Alert.alert("Support", "Email us at support@scanpal.app")} />

        <View style={s.divider} />
        <SettingsRow icon="log-out-outline" label="Sign out" onPress={handleLogout} danger loading={loggingOut} />

        <Text style={s.version}>ScanPal v{appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 24 },
  accountCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", padding: 16, marginBottom: 24,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  email: { fontSize: 16, fontWeight: "600", color: "#111827" },
  tierBadge: { marginTop: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  tierPro: { backgroundColor: "#ccfbf1" },
  tierFree: { backgroundColor: "#e5e7eb" },
  tierText: { fontSize: 11, fontWeight: "700" },
  tierProText: { color: "#0f766e" },
  tierFreeText: { color: "#4b5563" },
  row: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  rowIconDanger: { backgroundColor: "#fee2e2" },
  rowLabel: { fontSize: 16, color: "#111827" },
  rowLabelDanger: { fontWeight: "600", color: "#dc2626" },
  rowSub: { marginTop: 2, fontSize: 12, color: "#6b7280" },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 16 },
  version: { marginTop: 24, textAlign: "center", fontSize: 12, color: "#9ca3af" },
});
