import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScanScreen from '../screens/ScanScreen';
import ModeSelectScreen from '../screens/ModeSelectScreen';
import ResultScreen from '../screens/ResultScreen';
import PaywallScreen from '../screens/PaywallScreen';

export type RootStackParamList = {
  Scan: undefined;
  ModeSelect: { imageUri: string; width: number; height: number };
  Result: { imageUri: string; mode: string };
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Scan">
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
