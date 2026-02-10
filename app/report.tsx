import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { RadarChart, type RadarDimension } from "@/components/radar-chart";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CelebrationModal } from "@/components/celebration-modal";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { trpc } from "@/lib/trpc";
import { getJournalEntries } from "@/lib/storage";
import { getUserStats } from "@/lib/stats-service";

export default function ReportScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language, t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showData, setShowData] = useState(false);
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analysis, setAnalysis] = useState<{
    dimensions: {
      recognition: number;
      depth: number;
      specificity: number;
      connection: number;
      meaning: number;
      growth: number;
    };
    analysis: string;
  } | null>(null);

  const analyzeMutation = trpc.ai.analyzeGratitudeDimensions.useMutation();

  useEffect(() => {
    loadAndAnalyze();
  }, []);

  const loadAndAnalyze = async () => {
    try {
      // Get today's entries
      const allEntries = await getJournalEntries();
      const today = new Date().toISOString().split('T')[0];
      const filtered = allEntries.filter(entry => entry.date === today);
      setTodayEntries(filtered);

      if (filtered.length === 0) {
        router.replace('/');
        return;
      }

      // Get stats
      const userStats = await getUserStats();
      setStats(userStats);

      // Analyze dimensions
      const result = await analyzeMutation.mutateAsync({
        entries: filtered.map(e => ({
          prompt: e.topic,
          content: e.content,
        })),
        language: language as 'zh' | 'en',
      });

      setAnalysis(result);

      // Show celebration if completed 3 entries
      if (filtered.length >= 3) {
        setTimeout(() => {
          setShowCelebration(true);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to analyze entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const radarDimensions: RadarDimension[] = analysis
    ? [
        { label: language === 'en' ? "Recognition" : "感恩识别力", value: analysis.dimensions.recognition },
        { label: language === 'en' ? "Depth" : "情感深度", value: analysis.dimensions.depth },
        { label: language === 'en' ? "Specificity" : "具体表达", value: analysis.dimensions.specificity },
        { label: language === 'en' ? "Connection" : "关系连接", value: analysis.dimensions.connection },
        { label: language === 'en' ? "Meaning" : "意义感", value: analysis.dimensions.meaning },
        { label: language === 'en' ? "Growth" : "成长反思", value: analysis.dimensions.growth },
      ]
    : [];

  const totalWords = todayEntries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
  const totalDuration = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

  const handleBackHome = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/');
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-base text-muted mt-4">
            {language === 'en' ? 'AI is analyzing...' : 'AI正在深度分析中...'}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!analysis) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-lg text-foreground mb-4">
            {language === 'en' ? 'Unable to generate analysis report' : '无法生成分析报告'}
          </Text>
          <TouchableOpacity
            onPress={handleBackHome}
            className="px-6 py-3 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
              {language === 'en' ? 'Back to Home' : '返回首页'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 40 }}>
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.primary + '20' }}>
            <Text className="text-5xl">🎉</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground mb-2">
            {language === 'en' ? 'Completed Today!' : '今日完成!'}
          </Text>
          <Text className="text-base text-muted">
            {language === 'en' 
              ? `Completed ${todayEntries.length} journal entries` 
              : `共完成 ${todayEntries.length} 篇日记`}
          </Text>
        </View>

        {/* 六维度雷达图 */}
        <View className="mb-6 bg-surface rounded-3xl p-6 border border-border items-center">
          <Text className="text-lg font-semibold text-foreground mb-4">
            {language === 'en' ? 'Gratitude Six Dimensions' : '感恩六维度分析'}
          </Text>
          <RadarChart dimensions={radarDimensions} size={280} />
          <Text className="text-xs text-muted mt-4 text-center">
            {language === 'en' 
              ? 'Based on GQ-6 and PERMA positive psychology models' 
              : '基于GQ-6和PERMA积极心理学模型'}
          </Text>
        </View>

        {/* AI深度分析 */}
        <View 
          className="mb-6 rounded-3xl p-6 border border-border"
          style={{ 
            backgroundColor: colors.surface,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          }}
        >
          <View className="flex-row items-center gap-2 mb-4">
            <View 
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <IconSymbol name="sparkles" size={18} color={colors.primary} />
            </View>
            <Text className="text-lg font-bold text-foreground">
              {language === 'en' ? 'Positive Psychology Analysis' : '幸福心理学分析'}
            </Text>
          </View>
          
          {/* 分析内容 - 按段落分割 */}
          <View className="gap-4">
            {analysis.analysis.split('\n\n').map((paragraph, index) => (
              <View key={index}>
                {index === 0 ? (
                  <View 
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: colors.primary + '08' }}
                  >
                    <Text 
                      className="text-base text-foreground leading-relaxed" 
                      style={{ lineHeight: 24 }}
                    >
                      {paragraph}
                    </Text>
                  </View>
                ) : (
                  <View 
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text 
                      className="text-base text-foreground leading-relaxed" 
                      style={{ lineHeight: 26 }}
                    >
                      {paragraph}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 今日日记列表 */}
        <View className="mb-6 bg-surface rounded-3xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            {language === 'en' 
              ? `Today's Journals (${todayEntries.length})` 
              : `今日日记 (${todayEntries.length}篇)`}
          </Text>
          <View className="gap-3">
            {todayEntries.map((entry, index) => (
              <View key={entry.id} className="pb-3 border-b border-border last:border-b-0 last:pb-0">
                <View className="flex-row items-center gap-2 mb-2">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-xs font-bold" style={{ color: '#FFFFFF' }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
                    {entry.topic}
                  </Text>
                </View>
                <Text className="text-xs text-muted">
                  {entry.wordCount} {language === 'en' ? 'chars' : '字'} ·{' '}
                  {new Date(entry.createdAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 今日数据(可折叠) */}
        <TouchableOpacity
          onPress={() => {
            setShowData(!showData);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          className="mb-6 bg-surface rounded-3xl p-6 border border-border"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <IconSymbol name="chart.bar.fill" size={20} color={colors.primary} />
              <Text className="text-lg font-semibold text-foreground">
                {language === 'en' ? "Today's Data" : '今日数据'}
              </Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.muted}
              style={{
                transform: [{ rotate: showData ? '90deg' : '0deg' }],
              }}
            />
          </View>

          {showData && (
            <View className="mt-4 pt-4 border-t border-border gap-2">
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">
                  {language === 'en' ? 'Total Entries' : '总篇数'}
                </Text>
                <Text className="text-base font-semibold text-foreground">
                  {todayEntries.length}{language === 'en' ? '' : '篇'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">
                  {language === 'en' ? 'Total Characters' : '总字数'}
                </Text>
                <Text className="text-base font-semibold text-foreground">
                  {totalWords}{language === 'en' ? '' : '字'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">
                  {language === 'en' ? 'Total Time' : '总用时'}
                </Text>
                <Text className="text-base font-semibold text-foreground">
                  {Math.round(totalDuration / 60)} {language === 'en' ? 'min' : '分钟'}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* 返回首页按钮 */}
        <TouchableOpacity
          onPress={handleBackHome}
          className="rounded-full py-4"
          style={{ backgroundColor: colors.primary }}
          activeOpacity={0.8}
        >
          <Text className="text-base font-semibold text-center" style={{ color: '#FFFFFF' }}>
            {language === 'en' ? 'Back to Home' : '返回首页'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 庆祝模态框 */}
      {showCelebration && todayEntries.length >= 3 && stats && (
        <CelebrationModal
          visible={showCelebration}
          onClose={() => setShowCelebration(false)}
          streak={stats.currentStreak}
          newAchievements={[]}
        />
      )}
    </ScreenContainer>
  );
}
