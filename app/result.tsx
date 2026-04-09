import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Result</Text>
      {id ? <Text className="mt-2 text-gray-500">id: {id}</Text> : null}
    </View>
  );
}
