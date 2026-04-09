import { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";

type Props = { size?: number };

/**
 * Viewfinder with four animated corner brackets that gently pulse.
 */
export function CornerBrackets({ size = 280 }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const thickness = 4;
  const length = 32;

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        position: "relative",
        transform: [{ scale: pulse }],
      }}
    >
      {/* top-left */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: length,
          height: length,
          borderTopWidth: thickness,
          borderLeftWidth: thickness,
          borderColor: "white",
          borderTopLeftRadius: 8,
        }}
      />
      {/* top-right */}
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: length,
          height: length,
          borderTopWidth: thickness,
          borderRightWidth: thickness,
          borderColor: "white",
          borderTopRightRadius: 8,
        }}
      />
      {/* bottom-left */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: length,
          height: length,
          borderBottomWidth: thickness,
          borderLeftWidth: thickness,
          borderColor: "white",
          borderBottomLeftRadius: 8,
        }}
      />
      {/* bottom-right */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: length,
          height: length,
          borderBottomWidth: thickness,
          borderRightWidth: thickness,
          borderColor: "white",
          borderBottomRightRadius: 8,
        }}
      />
    </Animated.View>
  );
}
