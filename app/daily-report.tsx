import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/hooks/use-language";
import { getCachedInsight, cacheInsight } from "@/lib/daily-insight-cache";

interface InsightSection {
  title: string;
  content: string;
}

interface TodayInsight {
  pattern: InsightSection;
  archetype: InsightSection;
  shadow: InsightSection;
  collective: InsightSection;
  individuation: InsightSection;
  exercise: InsightSection;
}

export default function DailyReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { language } = useLanguage();
  const isEn = language === 'en';
  
  const [insight, setInsight] = useState<TodayInsight | null>(null);
  const [loading, setLoading] = useState(true);

  const generateInsight = trpc.generateTodayInsight.useMutation();

  useEffect(() => {
    loadInsight();
  }, []);

  const loadInsight = async () => {
    try {
      setLoading(true);
      
      // Check if we have cached insight for today
      const cached = await getCachedInsight();
      if (cached) {
        console.log('Using cached insight for today');
        setInsight(cached);
        setLoading(false);
        return;
      }
      
      // No cache, generate new insight
      console.log('No cache found, generating new insight');
      
      // Get recent entries from storage (use getJournalEntries helper)
      const { getJournalEntries } = await import('@/lib/storage');
      const allEntries = await getJournalEntries();
      
      // Use the most recent 3 entries (not limited to today)
      const recentEntries = allEntries.slice(0, 3);
      
      if (recentEntries.length < 3) {
        // Not enough entries
        setLoading(false);
        return;
      }

      // Generate insight
      const result = await generateInsight.mutateAsync({
        entries: recentEntries.map((e: any) => ({
          topic: e.topic,
          content: e.content,
        })),
        language: language,
      });

      // Cache the result for today
      await cacheInsight(result);
      console.log('Insight generated and cached');
      
      setInsight(result);
    } catch (error) {
      console.error('Failed to load insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.back();
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.tint} />
        <Text className="mt-4 text-muted">
          {isEn ? 'Generating insights...' : '正在生成洞察...'}
        </Text>
      </ScreenContainer>
    );
  }

  if (!insight) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-lg text-foreground text-center">
          {isEn ? 'No insights available yet' : '暂无洞察'}
        </Text>
        <Text className="mt-2 text-sm text-muted text-center">
          {isEn ? 'Complete 3 journal entries to unlock insights' : '完成3篇日记后解锁洞察'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 rounded-full"
          style={{ backgroundColor: colors.tint }}
        >
          <Text className="text-white font-semibold">
            {isEn ? 'Go Back' : '返回'}
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-lg" style={{ color: colors.tint }}>← {isEn ? 'Back' : '返回'}</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">
            {isEn ? "Today's Insight" : '今日洞察'}
          </Text>
          <Text className="text-sm text-muted mt-1">
            {isEn ? 'Based on Analytical Psychology' : '基于分析心理学视角'}
          </Text>
        </View>

        {/* Expert Card */}
        <View className="mx-6 mb-6 p-6 rounded-2xl" style={{ backgroundColor: colors.surface }}>
          <Text className="text-4xl mb-3">🌙</Text>
          <Text className="text-xl font-bold text-foreground">Carl Jung</Text>
          <Text className="text-sm text-muted mt-1">(1875-1961)</Text>
          <Text className="text-sm text-muted mt-3">
            {isEn ? 'Founder of Analytical Psychology' : '分析心理学创始人'}
          </Text>
          <Text className="text-sm text-muted mt-1 italic">
            {isEn ? '"Know yourself, become yourself"' : '"认识你自己，成为你自己"'}
          </Text>
        </View>

        {/* Divider */}
        <View className="mx-6 mb-6 h-px" style={{ backgroundColor: colors.border }} />

        {/* Pattern Section */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            🔍 {insight.pattern.title}
          </Text>
          <Text className="text-base text-foreground leading-relaxed" style={{ lineHeight: 24 }}>
            {insight.pattern.content}
          </Text>
        </View>

        {/* Divider */}
        <View className="mx-6 mb-6 h-px" style={{ backgroundColor: colors.border }} />

        {/* Archetype Section */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            🎭 {insight.archetype.title}
          </Text>
          <Text className="text-base text-foreground leading-relaxed" style={{ lineHeight: 24 }}>
            {insight.archetype.content}
          </Text>
        </View>

        {/* Divider */}
        <View className="mx-6 mb-6 h-px" style={{ backgroundColor: colors.border }} />

        {/* Shadow Section */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            🌑 {insight.shadow.title}
          </Text>
          <Text className="text-base text-foreground leading-relaxed" style={{ lineHeight: 24 }}>
            {insight.shadow.content}
          </Text>
        </View>

        {/* Divider */}
        <View className="mx-6 mb-6 h-px" style={{ backgroundColor: colors.border }} />

        {/* Collective Section */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            🌍 {insight.collective.title}
          </Text>
          <Text className="text-base text-foreground leading-relaxed" style={{ lineHeight: 24 }}>
            {insight.collective.content}
          </Text>
        </View>

        {/* Divider */}
        <View className="mx-6 mb-6 h-px" style={{ backgroundColor: colors.border }} />

        {/* Individuation Section */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            🌟 {insight.individuation.title}
          </Text>
          <Text className="text-base text-foreground leading-relaxed" style={{ lineHeight: 24 }}>
            {insight.individuation.content}
          </Text>
        </View>

        {/* Divider */}
        <View className="mx-6 mb-6 h-px" style={{ backgroundColor: colors.border }} />

        {/* Exercise Section */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold text-foreground mb-3">
            💡 {insight.exercise.title}
          </Text>
          <Text className="text-base text-foreground leading-relaxed" style={{ lineHeight: 24 }}>
            {insight.exercise.content}
          </Text>
        </View>

        {/* Complete Button */}
        <View className="px-6">
          <TouchableOpacity
            onPress={handleComplete}
            className="py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.tint }}
          >
            <Text className="text-white text-lg font-semibold">
              {isEn ? 'Complete ✓' : '完成 ✓'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
