import { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";

export function DailyReportCard() {
  const colors = useColors();
  const { t, language } = useLanguage();
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    // Fade in and scale animation
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ marginBottom: 16 }, animatedStyle]}>
      <TouchableOpacity
        onPress={() => router.push("/daily-report")}
        style={{
          padding: 16,
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.tint + "30",
        }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                {t("todayProgress")}
              </Text>
              <Text style={{ fontSize: 14, color: "#34C759", fontWeight: "600" }}>
                {t("progressCompleted")} ✓
              </Text>
            </View>
            
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 4 }}>
              <Text style={{ fontSize: 20, lineHeight: 20 }}>✨</Text>
              <Text 
                style={{ 
                  fontSize: 15, 
                  fontWeight: "600", 
                  color: colors.tint,
                  flexShrink: 1,
                  lineHeight: 20
                }}
              >
                {t("dailyReportGenerated")}
              </Text>
            </View>
            
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
              {t("viewReport")} →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
