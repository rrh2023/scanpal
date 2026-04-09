// On-device OCR via Google ML Kit. Wire up an ML Kit module in a dev build.
export async function recognizeText(_imageUri: string): Promise<string> {
  throw new Error("OCR not implemented — wire up Google ML Kit in a dev build.");
}
