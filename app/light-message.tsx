import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { trpc } from "@/lib/trpc";

/**
 * Light Message Screen
 * Displays formless reflection after completing a journal entry
 * "来自光的讯息" - wisdom from the realm of light
 */
export default function LightMessageScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useLanguage();
  const params = useLocalSearchParams<{ topic: string; content: string }>();
  const [reflection, setReflection] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const generateReflectionMutation = trpc.ai.generateFormlessReflection.useMutation();

  useEffect(() => {
    loadReflection();
  }, []);

  const loadReflection = async () => {
    try {
      const result = await generateReflectionMutation.mutateAsync({
        topic: params.topic || "",
        content: params.content || "",
        language: language as 'zh' | 'en',
      });
      setReflection(result.reflection);
    } catch (error) {
      console.error("Failed to generate reflection:", error);
      setReflection(language === 'en' 
        ? "Thank you for recording this gratitude. In your words, I see the light of love shining. Every moment of gratitude is a moment of connection with the source. Keep this awareness, let gratitude become the foundation of your life, and you will discover more beauty and joy."
        : "感谢你记录下这份感恩。在你的文字中，我看到了爱的光芒在闪耀。每一个感恩的瞬间，都是你与宇宙本源连接的时刻。继续保持这份觉察，让感恩成为你生活的底色，你会发现更多的美好和喜悦。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        {/* Header */}
        <View className="items-center mb-8 mt-8">
          <Text className="text-3xl mb-2">✨</Text>
          <Text className="text-2xl font-bold text-foreground">{language === 'en' ? 'Message from the Light' : '来自光的讯息'}</Text>
          <Text className="text-sm text-muted mt-2">{language === 'en' ? 'A reflection for you' : 'Message from the Light'}</Text>
        </View>

        {/* Reflection Card */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{
            backgroundColor: colors.surface,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-4">{language === 'en' ? 'Receiving message from the light...' : '正在接收来自光的讯息...'}</Text>
            </View>
          ) : (
            <Text
              className="text-foreground leading-7"
              style={{ fontSize: 16, lineHeight: 28 }}
            >
              {reflection}
            </Text>
          )}
        </View>

        {/* Decorative Elements */}
        <View className="items-center mb-8">
          <Text className="text-muted text-sm">💫 ✨ 🌟</Text>
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          onPress={handleComplete}
          disabled={isLoading}
          style={{
            backgroundColor: colors.primary,
            opacity: isLoading ? 0.5 : 1,
          }}
          className="rounded-full py-4 px-8"
        >
          <Text className="text-background text-center font-semibold text-lg">
            {language === 'en' ? 'Complete' : '完成'}
          </Text>
        </TouchableOpacity>

        {/* Bottom Spacer */}
        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
