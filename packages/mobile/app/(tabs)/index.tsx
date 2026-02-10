import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useState, useEffect, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { SwipeCards } from "@/components/swipe-cards";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from '@/hooks/use-language';

import { getJournalEntries, clearPersonalizedTopicsCache } from "@/lib/storage";
import { DailyTopic } from "@/types/journal";
import { trpc } from "@/lib/trpc";
import { selectDailyTopics } from "@/lib/topics/topic-selector";
import { DailyReportCard } from "@/components/daily-report-card";

// Number of consecutive skips to trigger personalized topics
const SKIP_THRESHOLD = 5;

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, tArray, language, isInitialized } = useLanguage();
  const [topics, setTopics] = useState<DailyTopic[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<'gratitude' | 'philosophy'>('gratitude');
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false);
  
  // Track consecutive skips
  const consecutiveSkipsRef = useRef(0);
  
  // Track if last batch was personalized (for alternating)
  const lastBatchWasPersonalizedRef = useRef(false);
  
  // 标记是否已完成初始加载
  const isInitialLoadDone = useRef(false);

  // tRPC mutation for personalized topics
  const generatePersonalizedTopics = trpc.ai.generatePersonalizedTopics.useMutation();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load today's entries count
  const loadData = useCallback(async () => {
    const allEntries = await getJournalEntries();
    const today = getTodayDate();
    const filtered = allEntries.filter(entry => entry.date === today);
    setTodayCount(filtered.length);
  }, []);

  // 使用新的题目选择逻辑
  const getTopicsForTheme = useCallback(async (currentTheme: 'gratitude' | 'philosophy') => {
    try {
      // Use new smart topic selector
      const selectedTopics = await selectDailyTopics(language as 'zh' | 'en');
      console.log('[getTopicsForTheme] Selected topics:', selectedTopics.length);
      if (selectedTopics.length > 0) {
        console.log('[getTopicsForTheme] First topic:', selectedTopics[0]);
      }
      return selectedTopics;
    } catch (error) {
      console.error('[Topics] Error selecting topics:', error);
      // Fallback: return empty array and let the component show "No topics available"
      // This is better than trying to use non-existent translation keys
      return [];
    }
  }, [language]);

  // Load personalized topics from API (always generate fresh)
  const loadPersonalizedTopics = useCallback(async () => {
    // Always clear cache and generate fresh
    await clearPersonalizedTopicsCache();
    console.log('[Personalized] Cache cleared for fresh generation');

    // Fetch from API
    setIsLoadingPersonalized(true);
    try {
      // Get recent entries for personalization
      const allEntries = await getJournalEntries();
      const recentEntries = allEntries.slice(0, 10).map(e => ({
        topic: e.topic,
        content: e.content,
        date: e.date,
      }));

      console.log('[Personalized] Fetching from API with', recentEntries.length, 'entries');
      
      const result = await generatePersonalizedTopics.mutateAsync({
        recentEntries: recentEntries.length > 0 ? recentEntries : undefined,
        language: language as 'zh' | 'en',
      });

      if (result.topics && result.topics.length > 0) {
        // Format and set topics
        const formattedTopics = result.topics.map((t: any, index: number) => ({
          id: `personalized-${Date.now()}-${index}`,
          text: t.icon ? `${t.icon} ${t.text}` : t.text,
          category: 'personalized',
        }));
        setTopics(formattedTopics);
        lastBatchWasPersonalizedRef.current = true;
        console.log('[Personalized] Loaded', formattedTopics.length, 'topics');
      } else {
        // Fallback to regular topics
        getTopicsForTheme(theme).then(newTopics => {
          setTopics(newTopics);
        });
        lastBatchWasPersonalizedRef.current = false;
      }
    } catch (error) {
      console.error('[Personalized] Error loading topics:', error);
      // Fallback to regular topics
      getTopicsForTheme(theme).then(newTopics => {
        setTopics(newTopics);
      });
      lastBatchWasPersonalizedRef.current = false;
    } finally {
      setIsLoadingPersonalized(false);
    }
  }, [language, theme, getTopicsForTheme, generatePersonalizedTopics]);

  // 初始加载题目 - 等待语言初始化完成
  useEffect(() => {
    if (!isInitialLoadDone.current && isInitialized) {
      console.log('[Home] Loading initial topics, language:', language, 'theme:', theme);
      setIsLoadingTopics(true);
      getTopicsForTheme(theme).then(initialTopics => {
        console.log('[Home] Initial topics loaded:', initialTopics.length, 'topics');
        console.log('[Home] First topic:', initialTopics[0]);
        setTopics(initialTopics);
        setIsLoadingTopics(false);
        isInitialLoadDone.current = true;
        lastBatchWasPersonalizedRef.current = false;
      });
    }
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized]);

  // 语言变化时重新加载题目
  useEffect(() => {
    if (isInitialLoadDone.current) {
      getTopicsForTheme(theme).then(newTopics => {
        setTopics(newTopics);
        // Reset states when language changes
        consecutiveSkipsRef.current = 0;
        lastBatchWasPersonalizedRef.current = false;
      });
    }
  }, [language]);

  // Handle theme change - 切换主题时加载新题目
  const handleThemeChange = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTheme = theme === 'gratitude' ? 'philosophy' : 'gratitude';
    setTheme(newTheme);
    
    // 切换主题时加载新题目
    getTopicsForTheme(newTheme).then(newTopics => {
      setTopics(newTopics);
      // Reset states when theme changes
      consecutiveSkipsRef.current = 0;
      lastBatchWasPersonalizedRef.current = false;
    });
  }, [theme, getTopicsForTheme]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Refresh handler - 下拉刷新时获取新题目
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    // 刷新时获取新的随机题目
    const newTopics = await getTopicsForTheme(theme);
    setTopics(newTopics);
    // Reset states on refresh
    consecutiveSkipsRef.current = 0;
    lastBatchWasPersonalizedRef.current = false;
    setRefreshing(false);
  }, [loadData, theme, getTopicsForTheme]);

  // Handle swipe right - select topic
  const handleSwipeRight = (topic: DailyTopic) => {
    // Reset states when user selects a topic
    consecutiveSkipsRef.current = 0;
    lastBatchWasPersonalizedRef.current = false;
    
    router.push({
      pathname: '/write' as any,
      params: { 
        topic: topic.text, 
        topicId: topic.id,
        currentCount: todayCount.toString(),
        source: theme === 'gratitude' ? 'gratitude' : 'philosophy'
      }
    });
  };

  // Handle swipe left - skip topic
  const handleSwipeLeft = useCallback((_topic: DailyTopic) => {
    // Increment skip counter
    consecutiveSkipsRef.current += 1;
    const currentSkips = consecutiveSkipsRef.current;
    console.log('[Skip] Consecutive skips:', currentSkips);
    
    // Check if threshold reached (every 5 skips)
    if (currentSkips >= SKIP_THRESHOLD && currentSkips % SKIP_THRESHOLD === 0) {
      console.log('[Skip] Threshold reached at', currentSkips, 'skips');
      // Will be handled in handleAllSwiped
    }
  }, []);

  // Handle all cards swiped - 所有卡片滑完后加载新题目
  const handleAllSwiped = useCallback(() => {
    const totalSkips = consecutiveSkipsRef.current;
    console.log('[AllSwiped] Total skips:', totalSkips, 'Last batch was personalized:', lastBatchWasPersonalizedRef.current);
    
    // Logic: 
    // - First 5 skips (from general) → load personalized
    // - After personalized batch swiped → load general
    // - After general batch swiped (if still skipping) → load personalized
    // Pattern: general → (5 skips) → personalized → general → personalized → ...
    
    if (totalSkips >= SKIP_THRESHOLD) {
      if (lastBatchWasPersonalizedRef.current) {
        // Last batch was personalized, now show general
        console.log('[AllSwiped] Showing general topics after personalized');
        getTopicsForTheme(theme).then(newTopics => {
          setTopics(newTopics);
        });
        lastBatchWasPersonalizedRef.current = false;
      } else {
        // Last batch was general, now show personalized
        console.log('[AllSwiped] Loading personalized topics');
        loadPersonalizedTopics();
      }
    } else {
      // Not enough skips yet, load regular topics
      getTopicsForTheme(theme).then(newTopics => {
        setTopics(newTopics);
      });
      lastBatchWasPersonalizedRef.current = false;
    }
  }, [theme, getTopicsForTheme, loadPersonalizedTopics]);

  // Get section title based on theme
  const getSectionTitle = () => {
    return theme === 'gratitude' ? t('todayGratitude') : t('todayPhilosophy');
  };

  // Format date based on language
  const formatDate = () => {
    const date = new Date();
    if (language === 'en') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header with Add Button */}
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">
              {t('appName')}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {formatDate()}
            </Text>
          </View>

          {/* Add Free Note Button */}
          <TouchableOpacity
            onPress={() => router.push('/free-note')}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-2xl font-bold text-white">+</Text>
          </TouchableOpacity>
        </View>

        {/* Today Progress - Show report card if completed, otherwise show progress bar */}
        {todayCount >= 3 ? (
          <DailyReportCard />
        ) : (
          <View className="mb-4 bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold text-foreground">{t('todayProgress')}</Text>
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                {t('todayProgressCount', { current: todayCount, total: 3 })}
              </Text>
            </View>
            <View className="flex-row gap-2">
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className="flex-1 h-2 rounded-full"
                  style={{
                    backgroundColor: i < todayCount ? colors.primary : colors.border,
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Swipe Cards Section - Priority */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-foreground">
              {getSectionTitle()}
            </Text>
            {/* Theme Toggle - moved here */}
            <TouchableOpacity
              onPress={handleThemeChange}
              className="px-3 py-2 rounded-lg"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            >
              <Text className="text-sm font-medium text-foreground">
                {t('switchTheme')}
              </Text>
            </TouchableOpacity>
          </View>

          {(isLoadingTopics && topics.length === 0) || isLoadingPersonalized ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-sm text-muted mt-4">
                {isLoadingPersonalized 
                  ? (language === 'en' ? 'Generating personalized topics...' : '正在生成个性化题目...')
                  : t('loading')
                }
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
        <View className="mt-2 p-3 rounded-xl" style={{ backgroundColor: colors.primary + '10' }}>
          <Text className="text-sm text-muted text-center">
            {t('swipeHint')}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
