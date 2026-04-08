import { View, Text, StyleSheet } from 'react-native';

export default function ModeSelectScreen() {
  return (
    <View style={styles.container}>
      <Text>Mode Select</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
