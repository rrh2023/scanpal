import { useEffect, useRef } from "react";
import { Text, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  message: string;
  type?: "error" | "success";
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
};

export function Toast({
  message,
  type = "error",
  visible,
  onDismiss,
  duration = 3500,
}: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Auto-dismiss after duration
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          delay: duration,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            translateY.setValue(-100);
            onDismiss();
          }
        });
      });
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible, duration, onDismiss, translateY, opacity]);

  if (!visible) return null;

  const isError = type === "error";

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: isError ? "#fef2f2" : "#f0fdf4",
        borderWidth: 1,
        borderColor: isError ? "#fecaca" : "#bbf7d0",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Ionicons
        name={isError ? "alert-circle" : "checkmark-circle"}
        size={20}
        color={isError ? "#dc2626" : "#16a34a"}
      />
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          color: isError ? "#991b1b" : "#166534",
        }}
        numberOfLines={2}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
