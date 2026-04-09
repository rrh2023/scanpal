import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo): void { console.error("ErrorBoundary caught:", error, info.componentStack); }
  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={56} color="#dc2626" />
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.message}>{this.state.error.message}</Text>
          <Pressable onPress={this.reset} style={s.btn}>
            <Text style={s.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 32 },
  title: { marginTop: 12, fontSize: 18, fontWeight: "700", color: "#111827" },
  message: { marginTop: 8, textAlign: "center", fontSize: 14, color: "#6b7280" },
  btn: { marginTop: 20, borderRadius: 24, backgroundColor: "#111827", paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontWeight: "600", color: "#fff" },
});
