import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { HexagonChart, HexagonData } from "@/components/hexagon-chart";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { trpc } from "@/lib/trpc";
import { getJournalEntries } from "@/lib/storage";

interface GratitudePattern {
  others: number;
  dailyLife: number;
  self: number;
}

interface WisdomBlessing {
  master: string;
  emoji: string;
  message: string;
}

interface InsightReport {
  id: string;
  date: string;
  hexagonData: HexagonData;
  gratitudePattern: GratitudePattern;
  practiceAdvice: string[];
  wisdomBlessing: WisdomBlessing;
  entriesAnalyzed: number;
}

const STORAGE_KEY = "insight_reports";

export default function ReviewResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<InsightReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReviewMutation = trpc.ai.generateReview.useMutation();

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allEntries = await getJournalEntries();
      const recentEntries = allEntries.slice(0, 10);

      if (recentEntries.length === 0) {
        setError(language === 'en' ? "No journal entries found" : "没有找到日记记录");
        setIsLoading(false);
        return;
      }

      const entriesText = recentEntries.map(e => ({
        topic: e.topic,
        content: e.content,
        date: e.date,
      }));

      const result = await generateReviewMutation.mutateAsync({
        entries: entriesText,
        language: language as 'zh' | 'en',
      });

      const apiResult = result as any;
      const newReport: InsightReport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        hexagonData: apiResult.hexagonData || getDefaultHexagonData(),
        gratitudePattern: apiResult.gratitudePattern || { others: 60, dailyLife: 30, self: 10 },
        practiceAdvice: apiResult.practiceAdvice || getDefaultAdvice(),
        wisdomBlessing: apiResult.wisdomBlessing || getRandomBlessing(),
        entriesAnalyzed: recentEntries.length,
      };

      setReport(newReport);
      await saveReport(newReport);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Error generating report:", err);
      const fallbackReport: InsightReport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        hexagonData: getDefaultHexagonData(),
        gratitudePattern: { others: 60, dailyLife: 30, self: 10 },
        practiceAdvice: getDefaultAdvice(),
        wisdomBlessing: getRandomBlessing(),
        entriesAnalyzed: 0,
      };
      setReport(fallbackReport);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = async (newReport: InsightReport) => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      const reports: InsightReport[] = existing ? JSON.parse(existing) : [];
      reports.unshift(newReport);
      const trimmed = reports.slice(0, 10);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.error("Error saving report:", err);
    }
  };

  const getDefaultHexagonData = (): HexagonData => ({
    love: 75,
    gratitude: 85,
    joy: 65,
    acceptance: 70,
    peace: 55,
    courage: 80,
  });

  const getDefaultAdvice = (): string[] => language === 'en' ? [
    'Write one "self-gratitude" each day: Today I thank myself for ______',
    'Mirror practice: Say to yourself "I am worthy of love, I am complete as I am"',
    'Awareness practice: When you want to say "sorry", pause and ask "Did I really do something wrong?"',
  ] : [
    '每天写一条「自我感恩」:今天我感谢自己______',
    '镜子练习:每天对镜子说「我值得被爱,我本身就是完整的」',
    '觉察练习:当你想说「不好意思」时,停下来问自己「我真的做错了什么吗?」',
  ];

  const getRandomBlessing = (): WisdomBlessing => {
    const blessings: WisdomBlessing[] = language === 'en' ? [
      {
        master: "Messenger of Love",
        emoji: "✨",
        message: "You are a beloved child. Not because of what you've done, but because you yourself are the embodiment of love. Let go of your burdens and accept this unconditional love.",
      },
      {
        master: "Plato",
        emoji: "🏛️",
        message: "True wisdom lies in knowing yourself. Every moment of gratitude touches the eternal good and beautiful. Continue seeking the light within.",
      },
      {
        master: "Laozi",
        emoji: "☯️",
        message: "The highest good is like water. Your grateful heart is soft yet powerful like water. Follow nature, act without forcing, you are already in the Tao.",
      },
      {
        master: "The Awakened One",
        emoji: "🪷",
        message: "All conditioned phenomena are like dreams, illusions, bubbles, shadows. But your compassion and gratitude are real. May you see the completeness of life in every moment.",
      },
    ] : [
      {
        master: "爱之使者",
        emoji: "✨",
        message: "你是被爱的孩子。不是因为你做了什么,而是因为你本身就是爱的化身。放下重担,接受这份无条件的爱。",
      },
      {
        master: "柏拉图",
        emoji: "🏛️",
        message: "真正的智慧在于认识自己。你的每一次感恩,都是在触碰那永恒的善与美。继续追寻内心的光明。",
      },
      {
        master: "老子",
        emoji: "☯️",
        message: "上善若水。你的感恩之心如水般柔软却有力量。顺应自然,无为而无不为,你已在道中。",
      },
      {
        master: "觉者",
        emoji: "🪷",
        message: "一切有为法,如梦幻泡影。但你的慈悲与感恩是真实的。愿你在每一个当下,都能看见生命的圆满。",
      },
    ];
    return blessings[Math.floor(Math.random() * blessings.length)];
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4 text-center">
            {language === 'en' ? 'Analyzing your journal...' : '正在分析你的日记...'}{"\n"}
            {language === 'en' ? 'Please wait' : '请稍候'}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-4xl mb-4">😔</Text>
          <Text className="text-lg text-foreground text-center mb-2">{error}</Text>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="mt-4 bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-background font-semibold">{t('back')}</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!report) return null;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="p-2"
          >
            <Text className="text-primary text-lg">← {t('back')}</Text>
          </Pressable>
          <Text className="text-foreground font-semibold">{t('reviewTitle')}</Text>
          <View className="w-12" />
        </View>

        {/* Hexagon Chart - 放在最上面 */}
        <View className="px-4 py-6 items-center">
          <Text className="text-xl font-bold text-foreground mb-2">{language === 'en' ? 'Consciousness Energy Map' : '意识能量图谱'}</Text>
          <Text className="text-sm text-muted mb-4">{language === 'en' ? 'Based on David Hawkins consciousness levels' : '基于David Hawkins意识层级理论'}</Text>
          <HexagonChart data={report.hexagonData} size={300} />
        </View>

        {/* Gratitude Pattern */}
        <View className="mx-4 p-4 bg-surface rounded-2xl mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">🔮 {language === 'en' ? 'Gratitude Pattern' : '感恩模式'}</Text>
          <Text className="text-sm text-muted mb-3">
            {language === 'en' 
              ? `In your recent ${report.entriesAnalyzed} entries, your gratitude focuses on:`
              : `在你最近${report.entriesAnalyzed}篇日记中,你感恩的对象:`}
          </Text>
          
          <View className="gap-2">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-primary mr-2" />
              <Text className="text-foreground flex-1">{language === 'en' ? "Others' kindness" : '他人付出'}</Text>
              <Text className="text-primary font-bold">{report.gratitudePattern.others}%</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full bg-primary rounded-full"
                style={{ width: `${report.gratitudePattern.others}%` }}
              />
            </View>

            <View className="flex-row items-center mt-2">
              <View className="w-3 h-3 rounded-full bg-success mr-2" />
              <Text className="text-foreground flex-1">{language === 'en' ? 'Daily moments' : '生活小事'}</Text>
              <Text className="text-success font-bold">{report.gratitudePattern.dailyLife}%</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full bg-success rounded-full"
                style={{ width: `${report.gratitudePattern.dailyLife}%` }}
              />
            </View>

            <View className="flex-row items-center mt-2">
              <View className="w-3 h-3 rounded-full bg-warning mr-2" />
              <Text className="text-foreground flex-1">{language === 'en' ? 'Self' : '自己'}</Text>
              <Text className="text-warning font-bold">{report.gratitudePattern.self}%</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View 
                className="h-full bg-warning rounded-full"
                style={{ width: `${report.gratitudePattern.self}%` }}
              />
            </View>
          </View>
        </View>

        {/* Practice Advice */}
        <View className="mx-4 p-4 bg-surface rounded-2xl mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">🛤️ {language === 'en' ? 'Practice Suggestions' : '修行建议'}</Text>
          <View className="gap-3">
            {report.practiceAdvice.map((advice, index) => (
              <View key={index} className="flex-row">
                <Text className="text-primary font-bold mr-2">{index + 1}.</Text>
                <Text className="text-foreground flex-1 leading-6">{advice}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Wisdom Blessing - 随机一位智者 */}
        <View className="mx-4 p-4 bg-surface rounded-2xl mb-4 border border-primary/30">
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">{report.wisdomBlessing.emoji}</Text>
            <Text className="text-lg font-bold text-foreground">
              {language === 'en' ? `${report.wisdomBlessing.master}'s Blessing` : `${report.wisdomBlessing.master}的祝福`}
            </Text>
          </View>
          <Text className="text-foreground leading-7 italic">
            "{report.wisdomBlessing.message}"
          </Text>
        </View>

        {/* Footer */}
        <View className="items-center mt-4 mb-8">
          <Text className="text-xs text-muted">
            {language === 'en' ? 'Generated on' : '生成于'} {new Date(report.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN')}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
