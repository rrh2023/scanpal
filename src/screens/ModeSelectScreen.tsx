import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { usePro } from '../context/ProContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeSelect'>;

type Mode = {
  key: 'solve' | 'summarize' | 'ocr';
  label: string;
  proOnly: boolean;
};

const MODES: Mode[] = [
  { key: 'solve', label: 'Solve this problem', proOnly: true },
  { key: 'summarize', label: 'Summarize', proOnly: true },
  { key: 'ocr', label: 'Extract text (OCR)', proOnly: false },
];

export default function ModeSelectScreen({ route, navigation }: Props) {
  const { imageUri } = route.params;
  const { isPro } = usePro();

  const onPick = (m: Mode) => {
    if (m.proOnly && !isPro) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('Result', { imageUri, mode: m.key });
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      <Text style={styles.title}>What should ScanPal do?</Text>
      {MODES.map((m) => {
        const locked = m.proOnly && !isPro;
        return (
          <TouchableOpacity
            key={m.key}
            style={styles.button}
            onPress={() => onPick(m)}
          >
            <Text style={styles.buttonText}>{m.label}</Text>
            {locked && <Text style={styles.lock}>PRO</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  preview: { width: '100%', height: 220, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  button: {
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  lock: {
    color: '#00E5A8',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
});
