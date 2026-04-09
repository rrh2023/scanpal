// On-device OCR via Google ML Kit.
// Requires a dev build: `npx expo install @react-native-ml-kit/text-recognition`
import TextRecognition from "@react-native-ml-kit/text-recognition";

export async function recognizeText(imageUri: string): Promise<string> {
  const result = await TextRecognition.recognize(imageUri);
  return result?.text ?? "";
}
