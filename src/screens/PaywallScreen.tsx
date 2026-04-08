import { View, Text, StyleSheet } from 'react-native';

export default function PaywallScreen() {
  return (
    <View style={styles.container}>
      <Text>Paywall</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
