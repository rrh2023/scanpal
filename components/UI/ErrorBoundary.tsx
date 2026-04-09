import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-white p-8">
          <Ionicons name="alert-circle-outline" size={56} color="#dc2626" />
          <Text className="mt-3 text-lg font-bold text-gray-900">Something went wrong</Text>
          <Text className="mt-2 text-center text-sm text-gray-600">
            {this.state.error.message}
          </Text>
          <Pressable
            onPress={this.reset}
            className="mt-5 rounded-full bg-gray-900 px-6 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
