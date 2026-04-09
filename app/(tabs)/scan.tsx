import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
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
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black px-8">
        <Text className="mb-4 text-center text-lg text-white">
          ScanPal needs camera access to scan documents.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="rounded-full bg-white px-6 py-3"
        >
          <Text className="font-semibold text-black">Grant permission</Text>
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
        // OCR module may not be available in Expo Go — continue without text
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
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
          {/* Header */}
          <View className="px-6 pt-4">
            <Text className="text-center text-base font-medium text-white/90">
              Align the document inside the frame
            </Text>
          </View>

          {/* Viewfinder */}
          <View className="flex-1 items-center justify-center">
            <CornerBrackets size={290} />
          </View>

          {/* Capture button */}
          <View className="items-center pb-10">
            <Pressable
              onPress={handleCapture}
              disabled={busy}
              className="h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/10 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Capture"
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="h-14 w-14 rounded-full bg-white" />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
