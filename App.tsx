import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { ProProvider } from './src/context/ProContext';

export default function App() {
  return (
    <ProProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </ProProvider>
  );
}
