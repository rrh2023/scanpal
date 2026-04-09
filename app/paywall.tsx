import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { PurchasesPackage } from "react-native-purchases";
import {
  getCurrentOffering,
  purchase,
  restorePurchases,
  hasProEntitlement,
} from "@/lib/revenuecat";
import { useAuthStore } from "@/store/authStore";

type PlanId = "monthly" | "annual";

const FEATURES = [
  { icon: "infinite", label: "Unlimited scans" },
  { icon: "bulb", label: "AI solver" },
  { icon: "sparkles", label: "AI summarizer" },
  { icon: "water-outline", label: "No watermark" },
  { icon: "cloud-upload-outline", label: "Cloud sync" },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const setTier = useAuthStore((s) => s.setTier);

  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [annual, setAnnual] = useState<PurchasesPackage | null>(null);
  const [selected, setSelected] = useState<PlanId>("annual");
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const offering = await getCurrentOffering();
        setMonthly(offering?.monthly ?? null);
        setAnnual(offering?.annual ?? null);
      } catch (e) {
        setError((e as Error).message ?? "Failed to load plans");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthlyPrice = monthly?.product.priceString ?? "$4.99";
  const annualPrice = annual?.product.priceString ?? "$39.00";

  const selectedPackage = useMemo(
    () => (selected === "annual" ? annual : monthly),
    [selected, monthly, annual]
  );

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert("Unavailable", "This plan isn't available right now.");
      return;
    }
    setPurchasing(true);
    setError(null);
    const result = await purchase(selectedPackage);
    setPurchasing(false);

    if (result.ok) {
      if (hasProEntitlement(result.info)) {
        setTier("pro");
        router.back();
      } else {
        setError("Purchase completed but entitlement not active. Contact support.");
      }
      return;
    }
    if (result.userCancelled) return; // silent
    setError(result.message);
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    try {
      const info = await restorePurchases();
      if (hasProEntitlement(info)) {
        setTier("pro");
        Alert.alert("Restored", "Your Pro subscription has been restored.");
        router.back();
      } else {
        Alert.alert("Nothing to restore", "No active Pro subscription found.");
      }
    } catch (e) {
      setError((e as Error).message ?? "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Close */}
        <View className="mb-4 flex-row justify-end">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="close" size={28} color="#111827" />
          </Pressable>
        </View>

        <Text className="text-3xl font-bold text-gray-900">Unlock ScanPal Pro</Text>
        <Text className="mt-2 text-base text-gray-600">
          Everything you need, without limits.
        </Text>

        {/* Features */}
        <View className="my-6 gap-3 rounded-2xl bg-gray-50 p-4">
          {FEATURES.map((f) => (
            <View key={f.label} className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                <Ionicons name={f.icon} size={18} color="#0d9488" />
              </View>
              <Text className="text-base text-gray-800">{f.label}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator />
            <Text className="mt-3 text-gray-500">Loading plans…</Text>
          </View>
        ) : (
          <View className="gap-3">
            {/* Annual — highlighted */}
            <Pressable
              onPress={() => setSelected("annual")}
              className={`relative rounded-2xl border-2 p-4 ${
                selected === "annual"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="absolute -top-3 right-4 rounded-full bg-green-500 px-3 py-1">
                <Text className="text-xs font-bold text-white">35% OFF</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-bold text-gray-900">Annual</Text>
                  <Text className="mt-1 text-sm text-gray-600">
                    Best value — billed yearly
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold text-gray-900">{annualPrice}</Text>
                  <Text className="text-xs text-gray-500">/year</Text>
                </View>
              </View>
            </Pressable>

            {/* Monthly */}
            <Pressable
              onPress={() => setSelected("monthly")}
              className={`rounded-2xl border-2 p-4 ${
                selected === "monthly"
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-bold text-gray-900">Monthly</Text>
                  <Text className="mt-1 text-sm text-gray-600">Billed every month</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold text-gray-900">{monthlyPrice}</Text>
                  <Text className="text-xs text-gray-500">/month</Text>
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {error ? (
          <View className="mt-4 rounded-xl bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {/* CTA */}
        <Pressable
          onPress={handlePurchase}
          disabled={loading || purchasing || !selectedPackage}
          className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl bg-gray-900 p-4 active:opacity-80"
          style={{ opacity: loading || purchasing || !selectedPackage ? 0.6 : 1 }}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-bold text-white">
              Start {selected === "annual" ? "Annual" : "Monthly"}
            </Text>
          )}
        </Pressable>

        {/* Restore */}
        <Pressable
          onPress={handleRestore}
          disabled={restoring}
          className="mt-4 items-center p-2"
        >
          {restoring ? (
            <ActivityIndicator />
          ) : (
            <Text className="text-sm font-medium text-gray-600 underline">
              Restore Purchases
            </Text>
          )}
        </Pressable>

        <Text className="mt-4 text-center text-xs text-gray-400">
          Subscriptions auto-renew until canceled. Cancel anytime in your store
          account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
