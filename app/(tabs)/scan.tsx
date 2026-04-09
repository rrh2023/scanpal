import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from "expo-camera";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CornerBrackets } from "@/components/Scanner/CornerBrackets";
import { recognizeText } from "@/lib/ocr";

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  if (!permission) {
    return (
      <View style={s.centerDark}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.centerDark}>
        <Text style={s.permText}>ScanPal needs camera access to scan documents.</Text>
        <Pressable onPress={requestPermission} style={s.permBtn}>
          <Text style={s.permBtnText}>Grant permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo: CameraCapturedPicture | undefined =
        await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: true });
      if (!photo?.uri) throw new Error("Capture failed");

      let text = "";
      try {
        text = await recognizeText(photo.uri);
      } catch (e) {
        console.warn("OCR failed:", e);
      }

      router.push({
        pathname: "/mode-select",
        params: { imageUri: photo.uri, text },
      });
    } catch (e) {
      Alert.alert("Capture failed", String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.flex}>
      <CameraView ref={cameraRef} style={s.flex} facing="back">
        <SafeAreaView style={s.flex} edges={["top", "bottom"]}>
          <View style={s.headerBar}>
            <Text style={s.headerText}>Align the document inside the frame</Text>
          </View>

          <View style={s.viewfinder}>
            <CornerBrackets size={290} />
          </View>

          <View style={s.captureRow}>
            <Pressable
              onPress={handleCapture}
              disabled={busy}
              style={s.captureOuter}
              accessibilityRole="button"
              accessibilityLabel="Capture"
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={s.captureInner} />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  centerDark: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000", paddingHorizontal: 32 },
  permText: { marginBottom: 16, textAlign: "center", fontSize: 16, color: "#fff" },
  permBtn: { borderRadius: 24, backgroundColor: "#fff", paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { fontWeight: "600", color: "#000" },
  headerBar: { paddingHorizontal: 24, paddingTop: 16 },
  headerText: { textAlign: "center", fontSize: 15, fontWeight: "500", color: "rgba(255,255,255,0.9)" },
  viewfinder: { flex: 1, alignItems: "center", justifyContent: "center" },
  captureRow: { alignItems: "center", paddingBottom: 40 },
  captureOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
});
