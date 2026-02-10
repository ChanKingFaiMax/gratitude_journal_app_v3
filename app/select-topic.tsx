import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { SwipeCards } from "@/components/swipe-cards";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { trpc } from "@/lib/trpc";
import { getFallbackTopics } from "@/lib/ai-service";
import { DailyTopic } from "@/types/journal";

export default function SelectTopicScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language, t } = useLanguage();
  const params = useLocalSearchParams<{ currentCount: string }>();
  const currentCount = parseInt(params.currentCount || "0");
  
  const [topics, setTopics] = useState<DailyTopic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const generateTopicsMutation = trpc.ai.generateTopics.useMutation();

  // Load topics
  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    try {
      const result = await generateTopicsMutation.mutateAsync({ count: 5, language: language as 'zh' | 'en' });
      setTopics(result.topics);
    } catch (error) {
      console.error('Failed to generate topics:', error);
      setTopics(getFallbackTopics(language as 'zh' | 'en'));
    } finally {
      setIsLoadingTopics(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTopics();
    setRefreshing(false);
  }, [loadTopics]);

  // Handle swipe right - select topic
  const handleSwipeRight = (topic: DailyTopic) => {
    router.push({
      pathname: '/write' as any,
      params: { 
        topic: topic.text, 
        topicId: topic.id,
        currentCount: currentCount.toString()
      }
    });
  };

  // Handle swipe left - skip topic
  const handleSwipeLeft = (topic: DailyTopic) => {
    // Just skip, do nothing
  };

  // Handle all cards swiped
  const handleAllSwiped = () => {
    // Auto-refresh topics
    loadTopics();
  };

  const handleRefreshTopics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loadTopics();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">
              {language === 'en' ? 'Select Topic' : '选择题目'}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {language === 'en' ? `Entry ${currentCount + 1}/3` : `第 ${currentCount + 1}/3 篇`}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View className="mb-6 bg-surface rounded-2xl p-4 border border-border">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-foreground">
              {language === 'en' ? "Today's Progress" : '今日进度'}
            </Text>
            <Text className="text-sm text-muted">{currentCount}/3</Text>
          </View>
          <View className="flex-row gap-2">
            {[0, 1, 2].map(index => (
              <View
                key={index}
                className="flex-1 h-2 rounded-full"
                style={{
                  backgroundColor: index < currentCount ? colors.primary : colors.border
                }}
              />
            ))}
          </View>
        </View>

        {/* Swipe Cards Section */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-foreground">
              {language === 'en' ? "Today's Topics" : '今日题目'}
            </Text>
            <TouchableOpacity
              onPress={handleRefreshTopics}
              disabled={isLoadingTopics}
              className="flex-row items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol
                name="paperplane.fill"
                size={16}
                color={colors.primary}
              />
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                {language === 'en' ? 'Refresh' : '换一批'}
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingTopics ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-sm text-muted mt-4">
                {language === 'en' ? 'Generating topics...' : '正在生成题目...'}
              </Text>
            </View>
          ) : (
            <SwipeCards
              topics={topics}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onAllSwiped={handleAllSwiped}
            />
          )}
        </View>

        {/* Tip */}
        <View className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.primary + '10' }}>
          <Text className="text-sm text-muted text-center leading-relaxed">
            {language === 'en' 
              ? '💡 Swipe right to select, swipe left to skip'
              : '💡 向右滑选择题目,向左滑跳过'}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
