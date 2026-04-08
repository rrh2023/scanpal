import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export type SolveResult = {
  steps: string[];
  final_answer: string;
};

export async function solveImage(imageUri: string): Promise<SolveResult> {
  const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { data, error } = await supabase.functions.invoke<SolveResult>('solve', {
    body: { imageBase64, mediaType: 'image/jpeg' },
  });

  if (error) throw error;
  if (!data) throw new Error('Empty response from solver');
  return data;
}
