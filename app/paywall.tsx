import { useEffect, useMemo, useState } from "react";
import {
  View, Text, Pressable, ActivityIndicator, ScrollView, Alert, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { PurchasesPackage } from "react-native-purchases";
import { getCurrentOffering, purchase, restorePurchases, hasProEntitlement } from "@/lib/revenuecat";
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
      } catch (e) { setError((e as Error).message ?? "Failed to load plans"); }
      finally { setLoading(false); }
    })();
  }, []);

  const monthlyPrice = monthly?.product.priceString ?? "$4.99";
  const annualPrice = annual?.product.priceString ?? "$39.00";
  const selectedPackage = useMemo(() => (selected === "annual" ? annual : monthly), [selected, monthly, annual]);

  const handlePurchase = async () => {
    if (!selectedPackage) { Alert.alert("Unavailable", "This plan isn't available right now."); return; }
    setPurchasing(true); setError(null);
    const result = await purchase(selectedPackage);
    setPurchasing(false);
    if (result.ok) {
      if (hasProEntitlement(result.info)) { setTier("pro"); router.back(); }
      else { setError("Purchase completed but entitlement not active. Contact support."); }
      return;
    }
    if (result.userCancelled) return;
    setError(result.message);
  };

  const handleRestore = async () => {
    setRestoring(true); setError(null);
    try {
      const info = await restorePurchases();
      if (hasProEntitlement(info)) { setTier("pro"); Alert.alert("Restored", "Your Pro subscription has been restored."); router.back(); }
      else { Alert.alert("Nothing to restore", "No active Pro subscription found."); }
    } catch (e) { setError((e as Error).message ?? "Restore failed"); }
    finally { setRestoring(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.closeRow}>
          <Pressable onPress={() => router.back()} style={s.closeBtn}>
            <Ionicons name="close" size={28} color="#111827" />
          </Pressable>
        </View>

        <Text style={s.title}>Unlock ScanPal Pro</Text>
        <Text style={s.subtitle}>Everything you need, without limits.</Text>

        <View style={s.featureBox}>
          {FEATURES.map((f) => (
            <View key={f.label} style={s.featureRow}>
              <View style={s.featureIcon}><Ionicons name={f.icon} size={18} color="#0d9488" /></View>
              <Text style={s.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={s.loadCenter}><ActivityIndicator /><Text style={s.loadText}>Loading plans…</Text></View>
        ) : (
          <View style={s.plans}>
            <Pressable onPress={() => setSelected("annual")} style={[s.plan, selected === "annual" ? s.planSelectedAnnual : s.planDefault]}>
              <View style={s.offBadge}><Text style={s.offBadgeText}>35% OFF</Text></View>
              <View style={s.planInner}>
                <View>
                  <Text style={s.planTitle}>Annual</Text>
                  <Text style={s.planSub}>Best value — billed yearly</Text>
                </View>
                <View style={s.planPriceCol}>
                  <Text style={s.planPrice}>{annualPrice}</Text>
                  <Text style={s.planPer}>/year</Text>
                </View>
              </View>
            </Pressable>

            <Pressable onPress={() => setSelected("monthly")} style={[s.plan, selected === "monthly" ? s.planSelectedMonthly : s.planDefault]}>
              <View style={s.planInner}>
                <View>
                  <Text style={s.planTitle}>Monthly</Text>
                  <Text style={s.planSub}>Billed every month</Text>
                </View>
                <View style={s.planPriceCol}>
                  <Text style={s.planPrice}>{monthlyPrice}</Text>
                  <Text style={s.planPer}>/month</Text>
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        <Pressable onPress={handlePurchase} disabled={loading || purchasing || !selectedPackage} style={[s.cta, (loading || purchasing) && s.ctaDisabled]}>
          {purchasing ? <ActivityIndicator color="#fff" /> : <Text style={s.ctaText}>Start {selected === "annual" ? "Annual" : "Monthly"}</Text>}
        </Pressable>

        <Pressable onPress={handleRestore} disabled={restoring} style={s.restoreBtn}>
          {restoring ? <ActivityIndicator /> : <Text style={s.restoreText}>Restore Purchases</Text>}
        </Pressable>

        <Text style={s.disclaimer}>Subscriptions auto-renew until canceled. Cancel anytime in your store account settings.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20, paddingBottom: 40 },
  closeRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
  closeBtn: { padding: 8 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 16, color: "#6b7280" },
  featureBox: { marginVertical: 24, gap: 12, borderRadius: 16, backgroundColor: "#f9fafb", padding: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  featureLabel: { fontSize: 16, color: "#111827" },
  loadCenter: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  loadText: { marginTop: 12, color: "#6b7280" },
  plans: { gap: 12 },
  plan: { borderRadius: 16, borderWidth: 2, padding: 16, position: "relative" },
  planDefault: { borderColor: "#e5e7eb", backgroundColor: "#fff" },
  planSelectedAnnual: { borderColor: "#22c55e", backgroundColor: "#f0fdf4" },
  planSelectedMonthly: { borderColor: "#111827", backgroundColor: "#f9fafb" },
  offBadge: { position: "absolute", top: -12, right: 16, borderRadius: 12, backgroundColor: "#22c55e", paddingHorizontal: 12, paddingVertical: 4 },
  offBadgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  planInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  planSub: { marginTop: 4, fontSize: 14, color: "#6b7280" },
  planPriceCol: { alignItems: "flex-end" },
  planPrice: { fontSize: 20, fontWeight: "700", color: "#111827" },
  planPer: { fontSize: 12, color: "#6b7280" },
  errorBox: { marginTop: 16, borderRadius: 12, backgroundColor: "#fef2f2", padding: 12 },
  errorText: { fontSize: 14, color: "#b91c1c" },
  cta: { marginTop: 24, backgroundColor: "#111827", borderRadius: 16, paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  restoreBtn: { marginTop: 16, alignItems: "center", padding: 8 },
  restoreText: { fontSize: 14, fontWeight: "500", color: "#6b7280", textDecorationLine: "underline" },
  disclaimer: { marginTop: 16, textAlign: "center", fontSize: 12, color: "#9ca3af" },
});
