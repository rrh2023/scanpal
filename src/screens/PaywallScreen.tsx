import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
  getOfferingPackages,
  purchasePackage,
  restorePurchases,
} from '../lib/revenuecat';
import { usePro } from '../context/ProContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const FEATURES = [
  'Unlimited scans',
  'AI problem solver',
  'AI summarizer',
  'No watermark on exports',
];

export default function PaywallScreen({ navigation }: Props) {
  const { refresh } = usePro();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [monthly, setMonthly] = useState<PurchasesPackage | undefined>();
  const [annual, setAnnual] = useState<PurchasesPackage | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const pkgs = await getOfferingPackages();
        setMonthly(pkgs.monthly);
        setAnnual(pkgs.annual);
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buy = async (pkg?: PurchasesPackage) => {
    if (!pkg) return;
    try {
      setBusy(true);
      const ok = await purchasePackage(pkg);
      await refresh();
      if (ok) navigation.goBack();
    } catch (e: any) {
      if (!e?.userCancelled) Alert.alert('Purchase failed', e?.message ?? '');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    try {
      setBusy(true);
      const ok = await restorePurchases();
      await refresh();
      if (ok) navigation.goBack();
      else Alert.alert('No purchases found');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ScanPal Pro</Text>
      <Text style={styles.subtitle}>Unlock everything</Text>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <Text key={f} style={styles.feature}>
            ✓ {f}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.card, styles.annualCard]}
        disabled={busy}
        onPress={() => buy(annual)}
      >
        <Text style={styles.cardTitle}>Annual</Text>
        <Text style={styles.cardPrice}>
          {annual?.product.priceString ?? '$39.00'} / year
        </Text>
        <Text style={styles.badge}>Best value</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        disabled={busy}
        onPress={() => buy(monthly)}
      >
        <Text style={styles.cardTitle}>Monthly</Text>
        <Text style={styles.cardPrice}>
          {monthly?.product.priceString ?? '$4.99'} / month
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={restore} disabled={busy}>
        <Text style={styles.restore}>Restore purchases</Text>
      </TouchableOpacity>

      {busy && <ActivityIndicator style={{ marginTop: 16 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginTop: 24 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  features: { marginBottom: 24 },
  feature: { fontSize: 16, marginVertical: 4 },
  card: {
    borderWidth: 1,
    borderColor: '#e3e3e8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  annualCard: { borderColor: '#0a0a0a', borderWidth: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardPrice: { fontSize: 18, marginTop: 4 },
  badge: {
    marginTop: 6,
    color: '#00A37A',
    fontWeight: '700',
    fontSize: 12,
  },
  restore: {
    textAlign: 'center',
    marginTop: 16,
    color: '#6b6bff',
    fontWeight: '600',
  },
});
