import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();

  const handleFeedback = () => {
    const subject = language === 'en' ? 'Enlighten Journal Feedback' : '开悟日志反馈';
    Linking.openURL(`mailto:feedback@example.com?subject=${encodeURIComponent(subject)}`);
  };

  return (
    <ScreenContainer>
      <View className="px-5 py-4 border-b flex-row items-center" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <Text className="text-base" style={{ color: colors.primary }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-foreground mr-8">{t('about')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* App Info */}
        <View className="items-center mb-8">
          <Text className="text-6xl mb-4">🙏</Text>
          <Text className="text-2xl font-bold text-foreground mb-2">{t('appName')}</Text>
          <Text className="text-sm text-muted">{t('version')} 1.0.0</Text>
        </View>

        {/* Description */}
        <View className="bg-surface rounded-2xl p-5 mb-6">
          <Text className="text-base text-foreground leading-7">
            {t('aboutDescription')}
          </Text>
        </View>

        {/* Features */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">{t('coreFeatures')}</Text>
          <View className="gap-3">
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">🌱</Text>
              <Text className="text-base text-foreground flex-1">{language === 'en' ? 'Daily gratitude prompts' : '每日感恩题目引导'}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">🤔</Text>
              <Text className="text-base text-foreground flex-1">{language === 'en' ? 'Deep philosophical reflection' : '哲思问题深度思考'}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">✍️</Text>
              <Text className="text-base text-foreground flex-1">{language === 'en' ? 'Free-form journaling' : '自由笔记随心记录'}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">🙏</Text>
              <Text className="text-base text-foreground flex-1">{t('featureWisdom')}</Text>
            </View>
          </View>
        </View>

        {/* Wise Masters */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">{t('wiseMasters')}</Text>
          <View className="gap-3">
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">🙏</Text>
              <Text className="text-base text-foreground">{t('buddha')} - {language === 'en' ? 'Compassion & Awakening' : '慈悲与觉悟'}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">☯️</Text>
              <Text className="text-base text-foreground">{t('laozi')} - {language === 'en' ? 'Way of Nature' : '道法自然'}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">🏛️</Text>
              <Text className="text-base text-foreground">{t('plato')} - {language === 'en' ? 'Reason & Virtue' : '理性与美德'}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">✝️</Text>
              <Text className="text-base text-foreground">{t('jesus')} - {language === 'en' ? 'Love & Forgiveness' : '爱与宽恕'}</Text>
            </View>
          </View>
        </View>

        {/* Links */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => router.push("/terms")}
            className="bg-surface rounded-xl p-4 flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-base text-foreground">{t('terms')}</Text>
            <Text className="text-muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/privacy")}
            className="bg-surface rounded-xl p-4 flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-base text-foreground">{t('privacy')}</Text>
            <Text className="text-muted">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFeedback}
            className="bg-surface rounded-xl p-4 flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-base text-foreground">{language === 'en' ? 'Feedback' : '意见反馈'}</Text>
            <Text className="text-muted">›</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View className="items-center mt-8">
          <Text className="text-xs text-muted">© 2025 {t('appName')}</Text>
          <Text className="text-xs text-muted mt-1">{language === 'en' ? 'Record with heart, live with gratitude' : '用心记录，感恩生活'}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
