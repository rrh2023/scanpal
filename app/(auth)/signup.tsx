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
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Toast } from "@/components/UI/Toast";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleSignup = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setToast({ message: "Please fill in all fields.", type: "error" });
      return;
    }
    if (password.length < 6) {
      setToast({ message: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    if (password !== confirm) {
      setToast({ message: "Passwords do not match.", type: "error" });
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (error) throw error;
      if (data.session) {
        setToast({ message: "Account created!", type: "success" });
        setTimeout(() => router.replace("/(tabs)/scan"), 400);
      } else {
        setToast({ message: "Check your email for a confirmation link.", type: "success" });
        setTimeout(() => router.replace("/(auth)/login"), 2000);
      }
    } catch (e) {
      setToast({ message: (e as Error).message ?? "Signup failed", type: "error" });
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
          <View style={s.header}>
            <Text style={s.title}>Create account</Text>
            <Text style={s.subtitle}>Get 10 free scans every month</Text>
          </View>

          <View style={s.fields}>
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

            <View>
              <Text style={s.label}>Password</Text>
              <View style={s.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  style={s.passwordInput}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={s.eyeBtn}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#6b7280"
                  />
                </Pressable>
              </View>
            </View>

            <View>
              <Text style={s.label}>Confirm password</Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                style={s.input}
              />
            </View>
          </View>

          <Pressable
            onPress={handleSignup}
            disabled={loading}
            style={[s.btn, loading && s.btnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Create account</Text>
            )}
          </Pressable>

          <View style={s.linkRow}>
            <Text style={s.linkLabel}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={s.link}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 16, color: "#6b7280" },
  fields: { gap: 16 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#374151" },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#f9fafb",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#111827",
  },
  passwordRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#f9fafb", borderRadius: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#111827" },
  eyeBtn: { paddingHorizontal: 12 },
  btn: {
    marginTop: 24, backgroundColor: "#111827", borderRadius: 12,
    paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  linkRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  linkLabel: { fontSize: 14, color: "#6b7280" },
  link: { fontSize: 14, fontWeight: "600", color: "#0d9488" },
});
