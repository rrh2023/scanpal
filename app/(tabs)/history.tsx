import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type ScanMode = "export" | "solve" | "summarize";

type ScanRow = {
  id: string;
  mode: ScanMode;
  input_text: string | null;
  result_text: string | null;
  image_path: string | null;
  created_at: string;
};

const MODE_META: Record<ScanMode, { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  export: { label: "Export", icon: "document-outline", bg: "bg-gray-100", fg: "text-gray-700" },
  solve: { label: "Solver", icon: "bulb-outline", bg: "bg-teal-100", fg: "text-teal-700" },
  summarize: { label: "Summarizer", icon: "sparkles-outline", bg: "bg-purple-100", fg: "text-purple-700" },
};

const FREE_HISTORY_LIMIT = 3;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const isPro = tier === "pro";

  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setScans([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      let query = supabase
        .from("scans")
        .select("id, mode, input_text, result_text, image_path, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!isPro) query = query.limit(FREE_HISTORY_LIMIT);

      const { data, error } = await query;
      if (error) throw error;
      setScans((data ?? []) as ScanRow[]);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isPro]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const openScan = (scan: ScanRow) => {
    router.push({
      pathname: "/result",
      params: {
        mode: scan.mode,
        imageUri: scan.image_path ?? undefined,
        text: scan.input_text ?? "",
        fromHistory: "1",
      },
    });
  };

  const renderItem = ({ item }: { item: ScanRow }) => {
    const meta = MODE_META[item.mode];
    const preview = item.input_text?.trim() || item.result_text?.trim() || "";
    return (
      <Pressable
        onPress={() => openScan(item)}
        className="mb-3 flex-row gap-3 rounded-2xl border border-gray-200 bg-white p-3 active:bg-gray-50"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}
      >
        <View className="h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
          {item.image_path ? (
            <Image
              source={{ uri: item.image_path }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Ionicons name="image-outline" size={24} color="#9ca3af" />
            </View>
          )}
        </View>

        <View className="flex-1 justify-between py-0.5">
          <View className="flex-row items-center gap-2">
            <View className={`flex-row items-center gap-1 rounded-full ${meta.bg} px-2 py-1`}>
              <Ionicons name={meta.icon} size={12} color="#374151" />
              <Text className={`text-[11px] font-semibold ${meta.fg}`}>{meta.label}</Text>
            </View>
            <Text className="text-xs text-gray-500">{formatDate(item.created_at)}</Text>
          </View>

          {preview ? (
            <Text className="mt-1 text-sm text-gray-700" numberOfLines={2}>
              {preview}
            </Text>
          ) : (
            <Text className="mt-1 text-sm italic text-gray-400">No text</Text>
          )}
        </View>

        <View className="self-center">
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-5 pb-2 pt-4">
        <Text className="text-3xl font-bold text-gray-900">History</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
          <Text className="mt-3 text-center text-base text-gray-800">{error}</Text>
          <Pressable
            onPress={load}
            className="mt-5 rounded-full bg-gray-900 px-6 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : scans.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="time-outline" size={56} color="#9ca3af" />
          <Text className="mt-3 text-lg font-semibold text-gray-800">No scans yet</Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            Your scanned documents will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListFooterComponent={
            !isPro ? (
              <Pressable
                onPress={() => router.push("/paywall")}
                className="mt-2 flex-row items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 active:opacity-80"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-200">
                  <Ionicons name="lock-closed" size={18} color="#92400e" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-amber-900">
                    See your full history
                  </Text>
                  <Text className="mt-0.5 text-xs text-amber-800">
                    Free tier shows only your last {FREE_HISTORY_LIMIT} scans. Upgrade to
                    Pro for unlimited history.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#92400e" />
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
