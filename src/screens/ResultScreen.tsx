import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { solveImage, SolveResult } from '../lib/solver';
import { usePro } from '../context/ProContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { imageUri, mode } = route.params;
  const { isPro } = usePro();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResult | null>(null);

  const gated = (mode === 'solve' || mode === 'summarize') && !isPro;

  useEffect(() => {
    if (gated) {
      navigation.replace('Paywall');
      return;
    }
    if (mode !== 'solve') return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await solveImage(imageUri);
        if (!cancelled) setResult(r);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageUri, mode, gated]);

  if (gated) return null;

  if (mode !== 'solve') {
    return (
      <View style={styles.center}>
        <Text>Mode "{mode}" coming soon.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Solving…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!result) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Solution</Text>
      {result.steps.map((step, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.stepNumber}>Step {i + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
      <View style={[styles.card, styles.answerCard]}>
        <Text style={styles.answerLabel}>Final answer</Text>
        <Text style={styles.answerText}>{result.final_answer}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12, color: '#555' },
  error: { color: '#c0392b', textAlign: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: {
    backgroundColor: '#f6f6f8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ececf0',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b6bff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  stepText: { fontSize: 15, lineHeight: 21, color: '#111' },
  answerCard: {
    backgroundColor: '#0a0a0a',
    borderColor: '#0a0a0a',
    marginTop: 8,
  },
  answerLabel: {
    color: '#00E5A8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  answerText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
