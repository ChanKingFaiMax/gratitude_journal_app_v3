import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { getLoginUrl } from "@/constants/oauth";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleAppleLogin = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);

      const loginUrl = getLoginUrl();
      console.log("[Login] Opening auth URL:", loginUrl);

      if (Platform.OS === "web") {
        // Web: redirect to OAuth URL
        window.location.href = loginUrl;
      } else {
        // Native: open auth session
        const result = await WebBrowser.openAuthSessionAsync(loginUrl);
        console.log("[Login] Auth session result:", result);
        
        if (result.type === "success") {
          // OAuth callback will handle the rest
          router.replace("/(tabs)");
        }
      }
    } catch (error) {
      console.error("[Login] Error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 px-6 justify-center">
        {/* Logo and Title */}
        <View className="items-center mb-12">
          <Text className="text-6xl mb-4">🙏</Text>
          <Text className="text-3xl font-bold text-foreground mb-2">
            {language === 'en' ? 'Enlighten Journal' : '开悟日志'}
          </Text>
          <Text className="text-base text-muted text-center">
            {language === 'en' ? 'Record gratitude, gain wisdom' : '记录感恩，收获智慧'}
          </Text>
        </View>

        {/* Login Buttons */}
        <View className="gap-4 mb-8">
          {/* Apple Login Button */}
          <TouchableOpacity
            onPress={handleAppleLogin}
            disabled={loading}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl"
            style={{ backgroundColor: colors.foreground }}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Text className="text-2xl mr-3"></Text>
                <Text className="text-lg font-semibold" style={{ color: colors.background }}>
                  {language === 'en' ? 'Sign in with Apple' : '通过 Apple 登录'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            onPress={handleSkip}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl border"
            style={{ borderColor: colors.border }}
            activeOpacity={0.7}
          >
            <Text className="text-base text-muted">
              {language === 'en' ? 'Skip for now' : '暂不登录，先体验'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View className="items-center">
          <Text className="text-xs text-muted text-center leading-5">
            {language === 'en' ? 'By signing in, you agree to our' : '登录即表示您同意我们的'}
          </Text>
          <View className="flex-row items-center gap-1">
            <TouchableOpacity onPress={() => router.push("/terms")}>
              <Text className="text-xs" style={{ color: colors.primary }}>
                {language === 'en' ? 'Terms of Service' : '用户协议'}
              </Text>
            </TouchableOpacity>
            <Text className="text-xs text-muted">{language === 'en' ? 'and' : '和'}</Text>
            <TouchableOpacity onPress={() => router.push("/privacy")}>
              <Text className="text-xs" style={{ color: colors.primary }}>
                {language === 'en' ? 'Privacy Policy' : '隐私政策'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
