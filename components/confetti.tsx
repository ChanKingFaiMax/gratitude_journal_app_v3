import { useEffect } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONFETTI_COUNT = 50;

interface ConfettiProps {
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"];

export function Confetti({ onComplete }: ConfettiProps) {
  const pieces: ConfettiPiece[] = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 500,
    rotation: Math.random() * 360,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </View>
  );
}

function ConfettiPiece({ x, color, delay, rotation }: Omit<ConfettiPiece, "id">) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(rotation);

  useEffect(() => {
    setTimeout(() => {
      translateY.value = withTiming(SCREEN_HEIGHT + 50, {
        duration: 2500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });

      opacity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 2000 })
      );

      rotate.value = withRepeat(
        withTiming(rotation + 360, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: x,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  piece: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
