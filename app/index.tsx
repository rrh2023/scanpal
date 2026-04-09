import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const session = useAuthStore((s) => s.session);

  if (session === undefined) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/scan" />;
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
});
