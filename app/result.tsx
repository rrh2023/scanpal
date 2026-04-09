import { useEffect, useRef, useState } from "react";
import {
  View, Text, Image, Pressable, ActivityIndicator, Alert, ScrollView, StyleSheet,
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
import { ResultHeader } from "@/components/UI/ResultHeader";

type Params = { mode?: "export" | "solve" | "summarize"; imageUri?: string; text?: string; fromHistory?: string };

export default function ResultScreen() {
  const router = useRouter();
  const { mode = "export", imageUri, text } = useLocalSearchParams<Params>();
  const watermarkRef = useRef<View>(null);
  const user = useAuthStore((s) => s.user);

  const [pro, setPro] = useState<boolean | null>(null);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState<"pdf" | "jpeg" | "share" | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => { isPro().then(setPro).catch(() => setPro(false)); }, []);

  useEffect(() => {
    if (pro === null || !imageUri) return;
    (async () => {
      try {
        if (pro) {
          const out = await ImageManipulator.manipulateAsync(imageUri, [], { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG });
          setProcessedUri(out.uri);
        } else {
          await new Promise((r) => setTimeout(r, 50));
          if (!watermarkRef.current) return;
          const snapshotUri = await captureRef(watermarkRef, { format: "jpg", quality: 0.92, result: "tmpfile" });
          setProcessedUri(snapshotUri);
        }
      } catch { setProcessedUri(imageUri); }
    })();
  }, [pro, imageUri]);

  const saveScanRecord = async () => {
    if (!user || savedId) return;
    const { data, error } = await supabase.from("scans").insert({ user_id: user.id, mode: "export", input_text: text ?? "", result_text: "", image_path: processedUri ?? imageUri ?? null }).select("id").single();
    if (!error && data?.id) setSavedId(data.id);
    await supabase.rpc("increment_scan_usage");
  };

  const exportPdf = async () => {
    if (!processedUri) return; setBusy("pdf");
    try {
      const base64 = await FileSystem.readAsStringAsync(processedUri, { encoding: FileSystem.EncodingType.Base64 });
      const html = `<html><body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;"><img src="data:image/jpeg;base64,${base64}" style="max-width:100%;max-height:100vh;" /></body></html>`;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await saveScanRecord();
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Save PDF", UTI: "com.adobe.pdf" });
      else Alert.alert("PDF ready", uri);
    } catch (e) { Alert.alert("PDF export failed", String(e)); }
    finally { setBusy(null); }
  };

  const exportJpeg = async () => {
    if (!processedUri) return; setBusy("jpeg");
    try { await saveScanRecord(); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(processedUri, { mimeType: "image/jpeg", dialogTitle: "Save JPEG", UTI: "public.jpeg" }); else Alert.alert("JPEG ready", processedUri); }
    catch (e) { Alert.alert("JPEG export failed", String(e)); }
    finally { setBusy(null); }
  };

  const shareAny = async () => {
    if (!processedUri) return; setBusy("share");
    try { if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(processedUri); }
    finally { setBusy(null); }
  };

  if (mode === "solve") return (
    <SafeAreaView style={s.flex}>
      <View style={s.headerPad}><ResultHeader title="Solver" /></View>
      <SolverResult text={text ?? ""} imageUri={imageUri} />
    </SafeAreaView>
  );
  if (mode === "summarize") return (
    <SafeAreaView style={s.flex}>
      <View style={s.headerPad}><ResultHeader title="Summary" /></View>
      <SummaryResult text={text ?? ""} imageUri={imageUri} />
    </SafeAreaView>
  );

  const ready = !!processedUri && pro !== null;

  return (
    <SafeAreaView style={s.flex}>
      <ScrollView contentContainerStyle={s.scroll}>
        <ResultHeader title="Export" />

        {imageUri && pro === false ? (
          <View style={{ position: "absolute", left: -9999, top: -9999 }}>
            <View ref={watermarkRef} collapsable={false} style={{ width: 800 }}>
              <Image source={{ uri: imageUri }} style={{ width: 800, height: 1000 }} resizeMode="cover" />
              <View style={s.watermark}><Text style={s.watermarkText}>ScanPal Free</Text></View>
            </View>
          </View>
        ) : null}

        <View style={s.previewWrap}>
          {ready && processedUri ? (
            <Image source={{ uri: processedUri }} style={s.previewImg} resizeMode="contain" />
          ) : (
            <View style={s.previewLoading}><ActivityIndicator /><Text style={s.previewLabel}>Preparing export…</Text></View>
          )}
        </View>

        {pro === false ? (
          <View style={s.freeBanner}><Text style={s.freeBannerText}>Free tier: exports include a "ScanPal Free" watermark. Upgrade to remove it.</Text></View>
        ) : null}

        <View style={s.actions}>
          <Pressable onPress={exportPdf} disabled={!ready || busy !== null} style={[s.btnDark, (!ready || busy !== null) && s.btnDisabled]}>
            {busy === "pdf" ? <ActivityIndicator color="#fff" /> : <Ionicons name="document-text-outline" size={20} color="#fff" />}
            <Text style={s.btnDarkText}>Download PDF</Text>
          </Pressable>
          <Pressable onPress={exportJpeg} disabled={!ready || busy !== null} style={[s.btnLight, (!ready || busy !== null) && s.btnDisabled]}>
            {busy === "jpeg" ? <ActivityIndicator /> : <Ionicons name="image-outline" size={20} color="#111827" />}
            <Text style={s.btnLightText}>Download JPEG</Text>
          </Pressable>
          <Pressable onPress={shareAny} disabled={!ready || busy !== null} style={[s.btnGray, (!ready || busy !== null) && s.btnDisabled]}>
            {busy === "share" ? <ActivityIndicator /> : <Ionicons name="share-outline" size={20} color="#111827" />}
            <Text style={s.btnLightText}>Share</Text>
          </Pressable>

          <Pressable onPress={() => router.replace("/(tabs)/scan")} style={s.newScanBtn}>
            <Ionicons name="scan-outline" size={20} color="#0d9488" />
            <Text style={s.newScanText}>New Scan</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  headerPad: { paddingHorizontal: 20, paddingTop: 12 },
  scroll: { padding: 20, paddingBottom: 40 },
  watermark: { position: "absolute", right: 20, bottom: 20, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  watermarkText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  previewWrap: { borderRadius: 16, overflow: "hidden", backgroundColor: "#f3f4f6", marginBottom: 24 },
  previewImg: { width: "100%", height: 320 },
  previewLoading: { width: "100%", height: 320, alignItems: "center", justifyContent: "center" },
  previewLabel: { marginTop: 8, color: "#6b7280" },
  freeBanner: { borderRadius: 12, backgroundColor: "#fffbeb", padding: 12, marginBottom: 16 },
  freeBannerText: { fontSize: 14, color: "#92400e" },
  actions: { gap: 12 },
  btnDark: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, backgroundColor: "#111827", padding: 16 },
  btnDarkText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  btnLight: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff", padding: 16 },
  btnLightText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  btnGray: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, backgroundColor: "#f3f4f6", padding: 16 },
  btnDisabled: { opacity: 0.6 },
  newScanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, borderColor: "#99f6e4", backgroundColor: "#f0fdfa", padding: 16, marginTop: 4 },
  newScanText: { fontSize: 16, fontWeight: "600", color: "#0d9488" },
});
