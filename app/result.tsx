import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import { supabase } from "@/lib/supabase";
import { isPro } from "@/lib/revenuecat";
import { useAuthStore } from "@/store/authStore";
import { SolverResult } from "@/components/Result/SolverResult";
import { SummaryResult } from "@/components/Result/SummaryResult";

type Params = {
  mode?: "export" | "solve" | "summarize";
  imageUri?: string;
  text?: string;
  fromHistory?: string;
};

export default function ResultScreen() {
  const router = useRouter();
  const { mode = "export", imageUri, text } = useLocalSearchParams<Params>();
  const watermarkRef = useRef<View>(null);
  const user = useAuthStore((s) => s.user);

  const [pro, setPro] = useState<boolean | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState<"pdf" | "jpeg" | "share" | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Check entitlement on mount
  useEffect(() => {
    isPro()
      .then(setPro)
      .catch(() => setPro(false));
  }, []);

  // Once we know pro status, build the export-ready image (watermarked for free)
  useEffect(() => {
    if (pro === null || !imageUri) return;
    (async () => {
      try {
        if (pro) {
          // Pro: normalize to JPEG, no watermark
          const out = await ImageManipulator.manipulateAsync(imageUri, [], {
            compress: 0.92,
            format: ImageManipulator.SaveFormat.JPEG,
          });
          setProcessedUri(out.uri);
        } else {
          // Free: capture the watermark overlay view
          // Wait one frame so the offscreen view is laid out
          await new Promise((r) => setTimeout(r, 50));
          if (!watermarkRef.current) return;
          const snapshotUri = await captureRef(watermarkRef, {
            format: "jpg",
            quality: 0.92,
            result: "tmpfile",
          });
          setProcessedUri(snapshotUri);
        }
      } catch (e) {
        console.warn("Image processing failed:", e);
        setProcessedUri(imageUri);
      }
    })();
  }, [pro, imageUri]);

  const saveScanRecord = async (resultText?: string) => {
    if (!user || savedId) return;
    const { data, error } = await supabase
      .from("scans")
      .insert({
        user_id: user.id,
        mode: "export",
        input_text: text ?? "",
        result_text: resultText ?? "",
        image_path: processedUri ?? imageUri ?? null,
      })
      .select("id")
      .single();
    if (error) {
      console.warn("saveScanRecord error:", error.message);
      return;
    }
    if (data?.id) setSavedId(data.id);
    await supabase.rpc("increment_scan_usage");
  };

  const exportPdf = async () => {
    if (!processedUri) return;
    setBusy("pdf");
    try {
      // Embed the (possibly watermarked) image as base64 in HTML for expo-print
      const base64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const html = `
        <html>
          <body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;">
            <img src="data:image/jpeg;base64,${base64}" style="max-width:100%;max-height:100vh;" />
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await saveScanRecord();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Save PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF ready", uri);
      }
    } catch (e) {
      Alert.alert("PDF export failed", String(e));
    } finally {
      setBusy(null);
    }
  };

  const exportJpeg = async () => {
    if (!processedUri) return;
    setBusy("jpeg");
    try {
      await saveScanRecord();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(processedUri, {
          mimeType: "image/jpeg",
          dialogTitle: "Save JPEG",
          UTI: "public.jpeg",
        });
      } else {
        Alert.alert("JPEG ready", processedUri);
      }
    } catch (e) {
      Alert.alert("JPEG export failed", String(e));
    } finally {
      setBusy(null);
    }
  };

  const shareAny = async () => {
    if (!processedUri) return;
    setBusy("share");
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(processedUri);
      }
    } finally {
      setBusy(null);
    }
  };

  if (mode === "solve") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <SolverResult text={text ?? ""} imageUri={imageUri} />
      </SafeAreaView>
    );
  }

  if (mode === "summarize") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <SummaryResult text={text ?? ""} imageUri={imageUri} />
      </SafeAreaView>
    );
  }

  const ready = !!processedUri && pro !== null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Export</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Offscreen view for watermark composition (free tier only).
            Rendered into layout but visually hidden by placing at -9999. */}
        {imageUri && pro === false ? (
          <View style={{ position: "absolute", left: -9999, top: -9999 }}>
            <View ref={watermarkRef} collapsable={false} style={{ width: 800 }}>
              <Image
                source={{ uri: imageUri }}
                style={{ width: 800, height: 1000 }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  right: 20,
                  bottom: 20,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>
                  ScanPal Free
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Preview */}
        <View className="mb-6 overflow-hidden rounded-2xl bg-gray-100">
          {ready && processedUri ? (
            <Image
              source={{ uri: processedUri }}
              className="h-80 w-full"
              resizeMode="contain"
            />
          ) : (
            <View className="h-80 w-full items-center justify-center">
              <ActivityIndicator />
              <Text className="mt-2 text-gray-500">Preparing export…</Text>
            </View>
          )}
        </View>

        {pro === false ? (
          <View className="mb-4 rounded-xl bg-amber-50 p-3">
            <Text className="text-sm text-amber-800">
              Free tier: exports include a &quot;ScanPal Free&quot; watermark. Upgrade
              to remove it.
            </Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View className="gap-3">
          <Pressable
            onPress={exportPdf}
            disabled={!ready || busy !== null}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-gray-900 p-4 active:opacity-80"
            style={{ opacity: !ready || busy !== null ? 0.6 : 1 }}
          >
            {busy === "pdf" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="document-text-outline" size={20} color="#fff" />
            )}
            <Text className="text-base font-semibold text-white">Download PDF</Text>
          </Pressable>

          <Pressable
            onPress={exportJpeg}
            disabled={!ready || busy !== null}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white p-4 active:bg-gray-50"
            style={{ opacity: !ready || busy !== null ? 0.6 : 1 }}
          >
            {busy === "jpeg" ? (
              <ActivityIndicator />
            ) : (
              <Ionicons name="image-outline" size={20} color="#111827" />
            )}
            <Text className="text-base font-semibold text-gray-900">Download JPEG</Text>
          </Pressable>

          <Pressable
            onPress={shareAny}
            disabled={!ready || busy !== null}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-gray-100 p-4 active:opacity-80"
            style={{ opacity: !ready || busy !== null ? 0.6 : 1 }}
          >
            {busy === "share" ? (
              <ActivityIndicator />
            ) : (
              <Ionicons name="share-outline" size={20} color="#111827" />
            )}
            <Text className="text-base font-semibold text-gray-900">Share</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
