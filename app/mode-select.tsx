import { useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { isPro } from "@/lib/revenuecat";

type Mode = "export" | "solve" | "summarize";

type ModeCardData = {
  id: Mode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  requiresPro: boolean;
};

const MODES: ModeCardData[] = [
  {
    id: "export",
    icon: "document-outline",
    title: "Save as PDF or Image",
    description: "Export the scan to your library or share it.",
    requiresPro: false,
  },
  {
    id: "solve",
    icon: "bulb-outline",
    title: "Solve this problem",
    description: "Get a step-by-step solution powered by AI.",
    requiresPro: true,
  },
  {
    id: "summarize",
    icon: "sparkles-outline",
    title: "Summarize the text",
    description: "Turn long passages into a concise summary.",
    requiresPro: true,
  },
];

export default function ModeSelectScreen() {
  const router = useRouter();
  const { imageUri, text } = useLocalSearchParams<{
    imageUri?: string;
    text?: string;
  }>();
  const [checkingMode, setCheckingMode] = useState<Mode | null>(null);

  const handleSelect = async (mode: ModeCardData) => {
    if (!mode.requiresPro) {
      router.push({ pathname: "/result", params: { mode: mode.id, imageUri, text } });
      return;
    }

    setCheckingMode(mode.id);
    try {
      const pro = await isPro();
      if (!pro) {
        router.push("/paywall");
        return;
      }
      router.push({ pathname: "/result", params: { mode: mode.id, imageUri, text } });
    } catch (e) {
      console.warn("Entitlement check failed:", e);
      router.push("/paywall");
    } finally {
      setCheckingMode(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="mb-4 text-3xl font-bold text-gray-900">What next?</Text>

        {/* Thumbnail */}
        <View className="mb-6 overflow-hidden rounded-2xl bg-gray-100">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              className="h-56 w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-56 w-full items-center justify-center">
              <Ionicons name="image-outline" size={48} color="#9ca3af" />
              <Text className="mt-2 text-gray-400">No preview</Text>
            </View>
          )}
        </View>

        {/* Cards */}
        <View className="gap-3">
          {MODES.map((mode) => {
            const loading = checkingMode === mode.id;
            return (
              <Pressable
                key={mode.id}
                onPress={() => handleSelect(mode)}
                disabled={loading}
                className="flex-row items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 1,
                }}
              >
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                  {loading ? (
                    <ActivityIndicator />
                  ) : (
                    <Ionicons name={mode.icon} size={24} color="#111827" />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-gray-900">
                      {mode.title}
                    </Text>
                    {mode.requiresPro ? (
                      <View className="rounded-full bg-amber-100 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-amber-700">PRO</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="mt-1 text-sm text-gray-500">
                    {mode.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
