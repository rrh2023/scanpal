import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
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
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center gap-4 rounded-xl px-2 py-3.5 active:bg-gray-50"
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-lg ${
          danger ? "bg-red-100" : "bg-gray-100"
        }`}
      >
        <Ionicons name={icon} size={18} color={danger ? "#dc2626" : "#374151"} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base ${danger ? "font-semibold text-red-600" : "text-gray-900"}`}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-gray-500">{subtitle}</Text>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const [loggingOut, setLoggingOut] = useState(false);

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
            // onAuthStateChange in _layout clears the store; index.tsx redirects to login.
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
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="mb-6 text-3xl font-bold text-gray-900">Settings</Text>

        {/* Account card */}
        <View className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <Ionicons name="person" size={22} color="#0d9488" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                {user?.email ?? "—"}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    tier === "pro" ? "bg-teal-100" : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      tier === "pro" ? "text-teal-700" : "text-gray-600"
                    }`}
                  >
                    {tier === "pro" ? "PRO" : "FREE"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {tier !== "pro" ? (
          <SettingsRow
            icon="sparkles"
            label="Upgrade to Pro"
            subtitle="Unlimited scans, AI solver & summarizer"
            onPress={() => router.push("/paywall")}
          />
        ) : null}

        <SettingsRow
          icon="time-outline"
          label="Scan History"
          onPress={() => router.push("/(tabs)/history")}
        />

        <SettingsRow
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() =>
            Alert.alert("Support", "Email us at support@scanpal.app")
          }
        />

        <View className="my-4 h-px bg-gray-200" />

        <SettingsRow
          icon="log-out-outline"
          label="Sign out"
          onPress={handleLogout}
          danger
          loading={loggingOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
