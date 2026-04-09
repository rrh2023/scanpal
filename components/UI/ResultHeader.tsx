import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
};

/**
 * Shared header for all result screens.
 * - Back chevron → go back to mode-select
 * - Home icon → jump straight to the scan tab (clears the stack)
 */
export function ResultHeader({ title }: Props) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/scan");
    }
  };

  const goHome = () => {
    router.replace("/(tabs)/scan");
  };

  return (
    <View style={s.header}>
      <Pressable onPress={goBack} style={s.btn} accessibilityLabel="Go back">
        <Ionicons name="chevron-back" size={24} color="#111827" />
      </Pressable>
      <Text style={s.title}>{title}</Text>
      <Pressable onPress={goHome} style={s.btn} accessibilityLabel="Back to scanner">
        <Ionicons name="scan-outline" size={22} color="#111827" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  btn: { padding: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
});
