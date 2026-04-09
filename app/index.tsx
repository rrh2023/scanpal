import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const session = useAuthStore((s) => s.session);

  // While hydrating from AsyncStorage, session is null on first render.
  // Show a brief loader — the root layout's onAuthStateChange will set it.
  if (session === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/scan" />;
}
