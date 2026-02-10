import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { getJournalEntries } from "@/lib/storage";
import { JournalEntry } from "@/types/journal";


export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    const allEntries = await getJournalEntries();
    setEntries(allEntries);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, [loadEntries]);

  const handleEntryPress = (entry: JournalEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/entry-detail' as any,
      params: { entryId: entry.id }
    });
  };

  const handleReviewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/review-options' as any);
  };

  // Group entries by date for stats
  const groupedEntries: Record<string, JournalEntry[]> = {};
  entries.forEach(entry => {
    if (!groupedEntries[entry.date]) {
      groupedEntries[entry.date] = [];
    }
    groupedEntries[entry.date].push(entry);
  });

  // Count entries per date
  const entryCounts: Record<string, number> = {};
  entries.forEach(entry => {
    entryCounts[entry.date] = (entryCounts[entry.date] || 0) + 1;
  });

  // Calculate stats
  const totalEntries = entries.length;
  const writingDays = Object.keys(groupedEntries).length;
  const completedDays = Object.values(entryCounts).filter(c => c >= 3).length;

  // Format date based on language
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'en') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // Format time based on language
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get source label
  const getSourceLabel = (source?: string) => {
    if (language === 'en') {
      return source === 'free' ? 'Free' : 
             source === 'philosophy' ? 'Philosophy' : 'Gratitude';
    }
    return source === 'free' ? '自由记录' : 
           source === 'philosophy' ? '哲思' : '感恩';
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
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">{t('history')}</Text>
          <Text className="text-sm text-muted mt-1">
            {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* 总回顾大卡片 */}
        {entries.length >= 1 && (
          <TouchableOpacity
            onPress={handleReviewPress}
            className="mb-6 rounded-3xl overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            {/* 渐变背景 */}
            <View 
              className="absolute inset-0"
              style={{
                backgroundColor: colors.primary + '05'
              }}
            />
            
            <View className="p-8 items-center relative">
              {/* 图标 */}
              <View 
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{
                  backgroundColor: colors.primary + '15'
                }}
              >
                <Text className="text-3xl">✨</Text>
              </View>
              
              {/* 标题 */}
              <Text className="text-xl font-bold text-foreground mb-2 text-center">
                {language === 'en' ? 'Deep Review & Insights' : '深度回顾与洞察'}
              </Text>
              
              {/* 描述 */}
              <Text className="text-sm text-muted text-center mb-1">
                {language === 'en' 
                  ? `Based on your ${totalEntries} journal entries`
                  : `基于你的 ${totalEntries} 篇日记`}
              </Text>
              <Text className="text-xs text-muted text-center mb-6">
                {language === 'en'
                  ? 'Discover your growth, relationships, and inner wisdom'
                  : '发现你的成长、关系、内在智慧'}
              </Text>
              
              {/* CTA按钮 */}
              <View 
                className="flex-row items-center px-8 py-3.5 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8
                }}
              >
                <Text className="text-lg font-bold text-white mr-2">
                  {language === 'en' ? 'Start Exploring' : '开始探索'}
                </Text>
                <Text className="text-white text-xl">→</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Saved Wisdom 入口卡片 */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/saved-wisdom' as any);
          }}
          className="mb-6 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border
          }}
        >
          <View className="p-5 flex-row items-center">
            {/* 图标 */}
            <View 
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{
                backgroundColor: colors.primary + '15'
              }}
            >
              <Text className="text-2xl">⭐</Text>
            </View>
            
            {/* 文字 */}
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground mb-1">
                {t('savedWisdom')}
              </Text>
              <Text className="text-sm text-muted">
                {t('savedWisdomDescription')}
              </Text>
            </View>
            
            {/* 箭头 */}
            <Text className="text-xl text-muted ml-2">→</Text>
          </View>
        </TouchableOpacity>

        {/* Latest Entries List */}
        <View>
          <Text className="text-lg font-semibold text-foreground mb-3">
            📅 {language === 'en' ? 'My Journals' : '我的日记'}
          </Text>
          {entries.length === 0 ? (
            <View className="py-12 items-center">
              <Text className="text-base text-muted">
                {t('noEntries')}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {entries.slice(0, 20).map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => handleEntryPress(entry)}
                >
                  <View className="bg-surface rounded-xl p-4 border border-border">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Text className="text-sm font-medium text-foreground flex-1" numberOfLines={1}>
                          {entry.topic}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs px-2 py-0.5 rounded-full" style={{ 
                          backgroundColor: entry.source === 'free' ? colors.primary + '20' : 
                                         entry.source === 'philosophy' ? colors.warning + '20' : 
                                         colors.success + '20',
                          color: entry.source === 'free' ? colors.primary : 
                                 entry.source === 'philosophy' ? colors.warning : 
                                 colors.success
                        }}>
                          {getSourceLabel(entry.source)}
                        </Text>
                        <Text className="text-xs text-muted">
                          {formatDate(entry.date)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-muted leading-relaxed" numberOfLines={2}>
                      {entry.content}
                    </Text>
                    <View className="flex-row items-center gap-3 mt-2">
                      <Text className="text-xs text-muted">{entry.wordCount} {language === 'en' ? 'chars' : '字'}</Text>
                      <Text className="text-xs text-muted">
                        {formatTime(entry.createdAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
