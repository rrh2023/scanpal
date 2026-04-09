import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Toast } from "@/components/UI/Toast";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleReset = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setToast({ message: "Please enter your email address.", type: "error" });
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
      if (error) throw error;
      setSent(true);
      setToast({
        message: "Password reset link sent! Check your inbox.",
        type: "success",
      });
    } catch (e) {
      setToast({
        message: (e as Error).message ?? "Failed to send reset email",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.flex}>
      <Toast
        message={toast?.message ?? ""}
        type={toast?.type ?? "error"}
        visible={!!toast}
        onDismiss={dismissToast}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>

          <View style={s.header}>
            <Text style={s.title}>Reset password</Text>
            <Text style={s.subtitle}>
              Enter the email address associated with your account and
              we&apos;ll send you a link to reset your password.
            </Text>
          </View>

          {sent ? (
            <View style={s.sentBox}>
              <Ionicons name="mail-outline" size={40} color="#0d9488" />
              <Text style={s.sentTitle}>Check your email</Text>
              <Text style={s.sentSubtitle}>
                We sent a password reset link to{"\n"}
                <Text style={s.sentEmail}>{email.trim().toLowerCase()}</Text>
              </Text>
              <Pressable
                onPress={() => router.replace("/(auth)/login")}
                style={s.btn}
              >
                <Text style={s.btnText}>Back to sign in</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View>
                <Text style={s.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  style={s.input}
                />
              </View>

              <Pressable
                onPress={handleReset}
                disabled={loading}
                style={[s.btn, loading && s.btnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>Send reset link</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                style={s.cancelRow}
              >
                <Text style={s.cancelText}>Back to sign in</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 8 },
  backBtn: { padding: 8, alignSelf: "flex-start", marginBottom: 16 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: "#6b7280" },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  btn: {
    marginTop: 24,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  cancelRow: { alignItems: "center", marginTop: 20 },
  cancelText: { fontSize: 14, fontWeight: "500", color: "#6b7280" },
  sentBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  sentTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  sentSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6b7280",
    textAlign: "center",
  },
  sentEmail: { fontWeight: "600", color: "#111827" },
});
