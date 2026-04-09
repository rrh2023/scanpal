import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

type Props = { size?: number };

/**
 * Viewfinder with four animated corner brackets that gently pulse.
 */
export function CornerBrackets({ size = 280 }: Props) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const bracket = "border-white";
  const thickness = 4;
  const length = 32;

  return (
    <Animated.View
      style={[{ width: size, height: size }, animatedStyle]}
      className="relative"
    >
      {/* top-left */}
      <View
        className={`absolute top-0 left-0 ${bracket} rounded-tl-lg`}
        style={{
          width: length,
          height: length,
          borderTopWidth: thickness,
          borderLeftWidth: thickness,
        }}
      />
      {/* top-right */}
      <View
        className={`absolute top-0 right-0 ${bracket} rounded-tr-lg`}
        style={{
          width: length,
          height: length,
          borderTopWidth: thickness,
          borderRightWidth: thickness,
        }}
      />
      {/* bottom-left */}
      <View
        className={`absolute bottom-0 left-0 ${bracket} rounded-bl-lg`}
        style={{
          width: length,
          height: length,
          borderBottomWidth: thickness,
          borderLeftWidth: thickness,
        }}
      />
      {/* bottom-right */}
      <View
        className={`absolute bottom-0 right-0 ${bracket} rounded-br-lg`}
        style={{
          width: length,
          height: length,
          borderBottomWidth: thickness,
          borderRightWidth: thickness,
        }}
      />
    </Animated.View>
  );
}
