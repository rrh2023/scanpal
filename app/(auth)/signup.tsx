import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (authError) throw authError;

      // Supabase may require email confirmation depending on project settings.
      if (data.session) {
        // Auto-confirmed — go straight in.
        router.replace("/(tabs)/scan");
      } else {
        Alert.alert(
          "Check your email",
          "We sent a confirmation link to " + trimmedEmail + ". Tap it and come back to sign in.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      }
    } catch (e) {
      setError((e as Error).message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900">Create account</Text>
            <Text className="mt-2 text-base text-gray-500">
              Get 10 free scans every month
            </Text>
          </View>

          {error ? (
            <View className="mb-4 rounded-xl bg-red-50 p-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          ) : null}

          <View className="gap-4">
            <View>
              <Text className="mb-1.5 text-sm font-medium text-gray-700">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
              />
            </View>

            <View>
              <Text className="mb-1.5 text-sm font-medium text-gray-700">Password</Text>
              <View className="flex-row items-center rounded-xl border border-gray-300 bg-gray-50">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  className="flex-1 px-4 py-3.5 text-base text-gray-900"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  className="px-3"
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
              <Text className="mb-1.5 text-sm font-medium text-gray-700">
                Confirm password
              </Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSignup}
            disabled={loading}
            className="mt-6 flex-row items-center justify-center rounded-xl bg-gray-900 py-4 active:opacity-80"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">Create account</Text>
            )}
          </Pressable>

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-gray-500">Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-teal-600">Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
