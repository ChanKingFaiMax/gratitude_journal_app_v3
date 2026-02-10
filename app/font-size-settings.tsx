import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { FontSizeSelector } from "@/components/font-size-selector";

/**
 * Font Size Settings Screen
 * Dedicated page for adjusting font size across the app
 */
export default function FontSizeSettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useLanguage();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <ScreenContainer className="bg-background">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity
          onPress={handleBack}
          className="flex-row items-center"
          style={{ opacity: 0.8 }}
        >
          <Text className="text-primary text-base">
            {language === 'zh' ? '← 返回' : '← Back'}
          </Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">
          {language === 'zh' ? '字体大小' : 'Font Size'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Content */}
      <View className="flex-1 px-5 py-6">
        {/* Description */}
        <View className="mb-6">
          <Text className="text-sm text-muted leading-6">
            {language === 'zh'
              ? '调整字体大小将影响日记正文、智者启示和智慧总结的文字显示。'
              : 'Adjusting font size will affect the text display in journal entries, sage wisdom, and wisdom summaries.'}
          </Text>
        </View>

        {/* Font Size Selector */}
        <FontSizeSelector />

        {/* Tip */}
        <View className="mt-8 p-4 rounded-xl" style={{ backgroundColor: colors.primary + '10' }}>
          <Text className="text-sm text-foreground leading-6">
            💡 {language === 'zh'
              ? '提示：字体设置会自动保存，您可以随时返回调整。'
              : 'Tip: Font settings are saved automatically. You can adjust them anytime.'}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
