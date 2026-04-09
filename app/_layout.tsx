import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Purchases from "react-native-purchases";
import { ErrorBoundary } from "@/components/UI/ErrorBoundary";
import { supabase } from "@/lib/supabase";
import { configureRevenueCat, hasProEntitlement } from "@/lib/revenuecat";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const setTier = useAuthStore((s) => s.setTier);

  // Hydrate auth + RevenueCat state on launch.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      if (data.session?.user) {
        try {
          configureRevenueCat(data.session.user.id);
        } catch (e) {
          console.warn("RevenueCat configure failed:", e);
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Listen for entitlement changes from RevenueCat.
    const listener = (info: Parameters<Parameters<typeof Purchases.addCustomerInfoUpdateListener>[0]>[0]) => {
      setTier(hasProEntitlement(info) ? "pro" : "free");
    };
    try {
      Purchases.addCustomerInfoUpdateListener(listener);
      Purchases.getCustomerInfo()
        .then((info) => setTier(hasProEntitlement(info) ? "pro" : "free"))
        .catch(() => {});
    } catch {
      // RC not configured yet (e.g. signed out) — ignore.
    }

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      try {
        Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {}
    };
  }, [setSession, setTier]);

  return (
    <ErrorBoundary>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mode-select" options={{ presentation: "modal" }} />
        <Stack.Screen name="result" />
        <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
      </Stack>
    </ErrorBoundary>
  );
}
