import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { getJournalEntries } from "@/lib/storage";
import { trpc } from "@/lib/trpc";
import { JournalEntry } from "@/types/journal";

export default function WeeklyReviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useLanguage();
  const [weekEntries, setWeekEntries] = useState<JournalEntry[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);

  const generateKeywordsMutation = trpc.ai.generateKeywords.useMutation();

  useEffect(() => {
    loadWeekData();
  }, []);

  const loadWeekData = async () => {
    // Get this week's entries (Sunday to Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const allEntries = await getJournalEntries();
    const filtered = allEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    setWeekEntries(filtered);

    // Generate keywords
    if (filtered.length > 0) {
      generateWeekKeywords(filtered);
    }
  };

  const generateWeekKeywords = async (entries: JournalEntry[]) => {
    setIsLoadingKeywords(true);
    try {
      const allContent = entries.map(e => e.content).join('\n\n');
      const result = await generateKeywordsMutation.mutateAsync({ content: allContent, language: language as 'zh' | 'en' });
      setKeywords(result.keywords);
    } catch (error) {
      console.error('Failed to generate keywords:', error);
      // Fallback keywords
      setKeywords(language === 'en' 
        ? ['Gratitude', 'Growth', 'Joy', 'Warmth', 'Persistence']
        : ['感恩', '成长', '快乐', '温暖', '坚持']);
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Calculate stats
  const daysWritten = new Set(weekEntries.map(e => e.date)).size;
  const totalWords = weekEntries.reduce((sum, e) => sum + e.wordCount, 0);
  const longestEntry = weekEntries.reduce((longest, e) => 
    e.wordCount > longest.wordCount ? e : longest
  , weekEntries[0] || { wordCount: 0, topic: '', content: '' });

  // Group by date
  const entriesByDate: Record<string, number> = {};
  weekEntries.forEach(entry => {
    entriesByDate[entry.date] = (entriesByDate[entry.date] || 0) + 1;
  });
  const completedDays = Object.values(entriesByDate).filter(count => count >= 3).length;

  const getEncouragementMessage = () => {
    if (language === 'en') {
      if (completedDays >= 7) return '🎉 Amazing! You completed 3 journals every day this week. Your persistence is admirable!';
      if (completedDays >= 5) return '💪 Great week! Keep it up, aim for full completion next week!';
      if (completedDays >= 3) return '👍 Good progress this week, keep going!';
      if (daysWritten >= 3) return '🌱 Seeds of gratitude have been planted, keep nurturing them!';
      return '💫 Every record is precious, keep moving forward!';
    }
    if (completedDays >= 7) return '🎉 太棒了!本周每天都完成了3篇日记,你的坚持令人敬佩!';
    if (completedDays >= 5) return '💪 本周表现很棒!继续保持,下周争取全部完成!';
    if (completedDays >= 3) return '👍 本周有不错的进步,继续加油!';
    if (daysWritten >= 3) return '🌱 感恩的种子已经种下,继续浇灌它吧!';
    return '💫 每一次记录都是珍贵的,继续前进!';
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 40 }}>
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-4xl mb-4">🌟</Text>
          <Text className="text-2xl font-bold text-foreground mb-2">
            {language === 'en' ? 'Weekly Review' : '本周回顾'}
          </Text>
          <Text className="text-sm text-muted">
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', { month: 'long', day: 'numeric' })} {language === 'en' ? 'Week' : '周'}
          </Text>
        </View>

        {weekEntries.length === 0 ? (
          <View className="py-12 items-center">
            <Text className="text-6xl mb-4">📝</Text>
            <Text className="text-lg text-muted">
              {language === 'en' ? 'No journals this week yet' : '本周还没有日记'}
            </Text>
            <Text className="text-sm text-muted mt-2">
              {language === 'en' ? 'Keep going!' : '继续加油!'}
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View className="gap-4 mb-8">
              <View className="flex-row gap-4">
                <View className="flex-1 bg-surface rounded-2xl p-5 border border-border">
                  <Text className="text-3xl mb-2">📅</Text>
                  <Text className="text-2xl font-bold text-foreground">{daysWritten}</Text>
                  <Text className="text-sm text-muted mt-1">
                    {language === 'en' ? 'Days Written' : '写作天数'}
                  </Text>
                </View>
                <View className="flex-1 bg-surface rounded-2xl p-5 border border-border">
                  <Text className="text-3xl mb-2">⭐</Text>
                  <Text className="text-2xl font-bold text-foreground">{completedDays}</Text>
                  <Text className="text-sm text-muted mt-1">
                    {language === 'en' ? 'Days Completed' : '完成天数'}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1 bg-surface rounded-2xl p-5 border border-border">
                  <Text className="text-3xl mb-2">📝</Text>
                  <Text className="text-2xl font-bold text-foreground">{weekEntries.length}</Text>
                  <Text className="text-sm text-muted mt-1">
                    {language === 'en' ? 'Total Entries' : '总篇数'}
                  </Text>
                </View>
                <View className="flex-1 bg-surface rounded-2xl p-5 border border-border">
                  <Text className="text-3xl mb-2">✍️</Text>
                  <Text className="text-2xl font-bold text-foreground">{totalWords}</Text>
                  <Text className="text-sm text-muted mt-1">
                    {language === 'en' ? 'Total Characters' : '总字数'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Keywords */}
            <View className="mb-8">
              <Text className="text-xl font-semibold text-foreground mb-4">
                {language === 'en' ? 'Weekly Keywords' : '本周关键词'}
              </Text>
              <View className="bg-surface rounded-2xl p-5 border border-border">
                {isLoadingKeywords ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text className="text-sm text-muted mt-2">
                      {language === 'en' ? 'Analyzing...' : '正在分析...'}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <View
                        key={index}
                        className="px-4 py-2 rounded-full"
                        style={{ backgroundColor: colors.primary + '20' }}
                      >
                        <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                          {keyword}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Longest Entry */}
            {longestEntry && longestEntry.wordCount > 0 && (
              <View className="mb-8">
                <Text className="text-xl font-semibold text-foreground mb-4">
                  {language === 'en' ? 'Longest Entry This Week' : '本周最长的一篇'}
                </Text>
                <View className="bg-surface rounded-2xl p-5 border border-border">
                  <Text className="text-base font-medium text-foreground mb-2">
                    {longestEntry.topic}
                  </Text>
                  <Text className="text-sm text-muted leading-relaxed mb-3" numberOfLines={4}>
                    {longestEntry.content}
                  </Text>
                  <Text className="text-xs text-muted">
                    {longestEntry.wordCount} {language === 'en' ? 'chars' : '字'}
                  </Text>
                </View>
              </View>
            )}

            {/* Encouragement */}
            <View className="bg-surface rounded-2xl p-6 border border-border mb-8">
              <Text className="text-base text-foreground leading-relaxed text-center">
                {getEncouragementMessage()}
              </Text>
            </View>
          </>
        )}

        {/* Close Button */}
        <TouchableOpacity
          onPress={handleClose}
          className="rounded-full py-4"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-base font-semibold text-center" style={{ color: '#FFFFFF' }}>
            {language === 'en' ? 'Keep Going' : '继续前进'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
