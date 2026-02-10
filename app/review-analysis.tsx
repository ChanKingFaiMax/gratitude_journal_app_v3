import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { getJournalEntries } from "@/lib/storage";
import { trpc } from "@/lib/trpc";
import { getReviewCache, saveReviewCache, type ReviewType } from "@/lib/review-cache";
import { ConsciousnessStepChart } from "@/components/consciousness-step-chart";
import { ExpertCard } from "@/components/expert-card";

type AnalysisType = "relationships" | "consciousness" | "growth" | "attention" | "conflicts";

type AnalysisConfig = {
  icon: string;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  color: string;
  expert: {
    nameZh: string;
    nameEn: string;
    years: string;
    bioZh: string;
    bioEn: string;
    emoji: string;
  };
};

const ANALYSIS_CONFIG: Record<AnalysisType, AnalysisConfig> = {
  relationships: {
    icon: "🧑‍🤝‍🧑",
    titleZh: "我的人物关系",
    titleEn: "My Relationships",
    subtitleZh: "基于社会网络分析",
    subtitleEn: "Based on Social Network Analysis",
    color: "#FF6B6B",
    expert: {
      nameZh: "格奥尔格·齐美尔",
      nameEn: "Georg Simmel",
      years: "1858-1918",
      bioZh: "德国社会学家，研究社会关系和互动的先驱",
      bioEn: "German sociologist, pioneer in studying social relationships and interactions",
      emoji: "👔",
    },
  },
  consciousness: {
    icon: "🎯",
    titleZh: "我的意识层级",
    titleEn: "My Consciousness Level",
    subtitleZh: "基于 David Hawkins 意识地图",
    subtitleEn: "Based on David Hawkins Consciousness Map",
    color: "#FFD700",
    expert: {
      nameZh: "大卫·霍金斯",
      nameEn: "David R. Hawkins",
      years: "1927-2012",
      bioZh: "精神导师，意识层级地图创始人",
      bioEn: "Spiritual teacher, creator of the Map of Consciousness",
      emoji: "🌟",
    },
  },
  growth: {
    icon: "🌱",
    titleZh: "我的成长",
    titleEn: "My Growth",
    subtitleZh: "基于David Hawkins意识层级",
    subtitleEn: "Based on David Hawkins Consciousness Scale",
    color: "#4ECDC4",
    expert: {
      nameZh: "大卫·霍金斯",
      nameEn: "David R. Hawkins",
      years: "1927-2012",
      bioZh: "精神导师，意识层级地图创始人",
      bioEn: "Spiritual teacher, creator of the Map of Consciousness",
      emoji: "🌟",
    },
  },
  attention: {
    icon: "💡",
    titleZh: "我近期可以注意的",
    titleEn: "What I Can Focus On",
    subtitleZh: "基于正念觉察理论",
    subtitleEn: "Based on Mindfulness Theory",
    color: "#FFE66D",
    expert: {
      nameZh: "一行禅师",
      nameEn: "Thích Nhất Hạnh",
      years: "1926-2022",
      bioZh: "越南禅宗僧人，将正念带入西方的大师",
      bioEn: "Vietnamese Zen master who brought mindfulness to the West",
      emoji: "🙏",
    },
  },
  conflicts: {
    icon: "🔄",
    titleZh: "如何梳理我的内在矛盾",
    titleEn: "Resolving Inner Conflicts",
    subtitleZh: "基于荣格心理学",
    subtitleEn: "Based on Jungian Psychology",
    color: "#95E1D3",
    expert: {
      nameZh: "卡尔·荣格",
      nameEn: "Carl Jung",
      years: "1875-1961",
      bioZh: "瑞士心理学家，分析心理学创始人",
      bioEn: "Swiss psychiatrist, founder of analytical psychology",
      emoji: "🧠",
    },
  },
};

// Mock result components for each type
function RelationshipsResult({ data, colors, language }: { data: any; colors: any; language: string }) {
  const people = data?.people || [];
  
  return (
    <View className="gap-4">
      {/* Summary */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base text-foreground leading-6" style={{ fontStyle: 'italic' }}>
          {data?.summary || (language === 'en' 
            ? 'Based on your journal entries, here are the people who matter most in your life...'
            : '根据你的日记内容，以下是在你生命中最重要的人...')}
        </Text>
      </View>

      {/* People List */}
      {people.map((person: any, index: number) => (
        <View key={index} className="bg-surface rounded-2xl p-5 border border-border">
          <View className="flex-row items-center mb-3">
            <View 
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: '#FF6B6B20' }}
            >
              <Text className="text-lg">{person.emoji || '❤️'}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">{person.name}</Text>
              <Text className="text-xs text-muted">
                {language === 'en' ? `Mentioned ${person.count} times` : `提及 ${person.count} 次`}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-muted leading-5" style={{ letterSpacing: 0.3 }}>{person.gratitude}</Text>
        </View>
      ))}

      {/* Insight */}
      {data?.insight && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: '#FF6B6B40' }}>
          <Text className="text-sm font-medium mb-2" style={{ color: '#FF6B6B' }}>
            {language === 'en' ? '💝 Loving Insight' : '💝 爱的洞察'}
          </Text>
          <Text className="text-base text-foreground leading-6">{data.insight}</Text>
        </View>
      )}
    </View>
  );
}

function GrowthResult({ data, colors, language, entries }: { data: any; colors: any; language: string; entries: any[] }) {
  const levels = data?.levels || [];
  
  // Calculate time span in days
  const calculateDaySpan = (entries: any[]) => {
    if (entries.length < 2) return 0;
    const timestamps = entries.map(e => e.timestamp).sort((a, b) => a - b);
    const firstDay = new Date(timestamps[0]).setHours(0, 0, 0, 0);
    const lastDay = new Date(timestamps[timestamps.length - 1]).setHours(0, 0, 0, 0);
    return Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24));
  };
  
  // Check if we have valid entries with consciousness level data
  const validEntries = entries.filter(e => e.consciousnessLevel && e.consciousnessLevel > 0);
  const daySpan = calculateDaySpan(entries);
  const useCurveChart = daySpan >= 2;
  
  // If same day (0 or 1 day span) and has valid entries, use step chart
  if (!useCurveChart && validEntries.length > 0) {
    return (
      <ConsciousnessStepChart entries={entries} />
    );
  }
  
  // Otherwise, use original growth result display
  return (
    <View className="gap-4">
      {/* Current Level */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-sm text-muted mb-2">
          {language === 'en' ? 'Your Current Consciousness Level' : '你当前的意识层级'}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-4xl font-bold mr-3" style={{ color: '#4ECDC4' }}>
            {data?.currentLevel || 350}
          </Text>
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {data?.levelName || (language === 'en' ? 'Acceptance' : '接纳')}
            </Text>
            <Text className="text-xs text-muted">
              {language === 'en' ? 'Hawkins Scale' : 'Hawkins量表'}
            </Text>
          </View>
        </View>
      </View>

      {/* Growth Journey */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base font-semibold text-foreground mb-4">
          {language === 'en' ? '🌱 Your Growth Journey' : '🌱 你的成长轨迹'}
        </Text>
        <Text className="text-sm text-muted leading-6" style={{ letterSpacing: 0.3 }}>
          {data?.journey || (language === 'en'
            ? 'Your journal entries show a beautiful progression from awareness to acceptance. You are learning to embrace life with more love and less resistance.'
            : '你的日记显示出从觉察到接纳的美丽进程。你正在学习用更多的爱和更少的抗拒来拥抱生活。')}
        </Text>
      </View>

      {/* Key Shifts */}
      {data?.shifts && data.shifts.length > 0 && (
        <View className="bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">
            {language === 'en' ? '✨ Key Shifts' : '✨ 关键转变'}
          </Text>
          {data.shifts.map((shift: string, index: number) => (
            <View key={index} className="flex-row items-start mb-2">
              <Text className="text-sm mr-2" style={{ color: '#4ECDC4' }}>•</Text>
              <Text className="text-sm text-muted flex-1 leading-5" style={{ letterSpacing: 0.3 }}>{shift}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Encouragement */}
      {data?.encouragement && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: '#4ECDC440' }}>
          <Text className="text-sm font-medium mb-2" style={{ color: '#4ECDC4' }}>
            {language === 'en' ? '🌟 From a Higher Perspective' : '🌟 来自高维的视角'}
          </Text>
          <Text className="text-base text-foreground leading-6" style={{ fontStyle: 'italic' }}>{data.encouragement}</Text>
        </View>
      )}
    </View>
  );
}

// Consciousness Level Result Component
function ConsciousnessResult({ data, colors, language }: { data: any; colors: any; language: string }) {
  const distribution = data?.distribution || { low: 10, mid: 50, high: 40 };
  const levelBreakdown = data?.levelBreakdown || { low: [], mid: [], high: [] };
  
  // Colors for each dimension
  const COLORS = {
    low: '#FF6B6B',    // Red for low dimension
    mid: '#4A90D9',    // Blue for mid dimension
    high: '#FFD700',   // Gold for high dimension
  };
  
  return (
    <View className="gap-4">
      {/* Overall Level */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-sm text-muted mb-2">
          {language === 'en' ? 'Your Overall Consciousness Level' : '你的整体意识层级'}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-4xl font-bold mr-3" style={{ color: '#FFD700' }}>
            {data?.overallLevel || 350}
          </Text>
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {data?.levelName || (language === 'en' ? 'Acceptance' : '接纳')}
            </Text>
            <Text className="text-xs text-muted">
              {language === 'en' ? 'Hawkins Scale' : 'Hawkins量表'}
            </Text>
          </View>
        </View>
      </View>

      {/* Distribution Bar */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base font-semibold text-foreground mb-4">
          {language === 'en' ? '📊 Consciousness Distribution' : '📊 意识层级分布'}
        </Text>
        
        {/* Progress Bar */}
        <View className="h-6 rounded-full overflow-hidden flex-row mb-4" style={{ backgroundColor: colors.border }}>
          {distribution.high > 0 && (
            <View style={{ width: `${distribution.high}%`, backgroundColor: COLORS.high, height: '100%' }} />
          )}
          {distribution.mid > 0 && (
            <View style={{ width: `${distribution.mid}%`, backgroundColor: COLORS.mid, height: '100%' }} />
          )}
          {distribution.low > 0 && (
            <View style={{ width: `${distribution.low}%`, backgroundColor: COLORS.low, height: '100%' }} />
          )}
        </View>
        
        {/* Legend */}
        <View className="flex-row justify-around">
          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.high }} />
              <Text className="text-xs text-muted">{language === 'en' ? 'High' : '高维'}</Text>
            </View>
            <Text className="text-lg font-bold" style={{ color: COLORS.high }}>{distribution.high}%</Text>
          </View>
          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.mid }} />
              <Text className="text-xs text-muted">{language === 'en' ? 'Mid' : '中维'}</Text>
            </View>
            <Text className="text-lg font-bold" style={{ color: COLORS.mid }}>{distribution.mid}%</Text>
          </View>
          <View className="items-center">
            <View className="flex-row items-center mb-1">
              <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS.low }} />
              <Text className="text-xs text-muted">{language === 'en' ? 'Low' : '低维'}</Text>
            </View>
            <Text className="text-lg font-bold" style={{ color: COLORS.low }}>{distribution.low}%</Text>
          </View>
        </View>
      </View>

      {/* High Dimension Phrases */}
      {levelBreakdown.high && levelBreakdown.high.length > 0 && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: COLORS.high + '40' }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-lg mr-2">✨</Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.high }}>
              {language === 'en' ? 'High Dimension (Love·Joy·Peace)' : '高维度 (爱·喜悦·平和)'}
            </Text>
          </View>
          {levelBreakdown.high.map((item: any, index: number) => (
            <View key={index} className="mb-3 p-3 rounded-xl" style={{ backgroundColor: COLORS.high + '15' }}>
              <Text className="text-sm text-foreground leading-5">"{item.phrase}"</Text>
              <Text className="text-xs mt-1" style={{ color: COLORS.high }}>
                —— {item.levelName} ({item.level})
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Mid Dimension Phrases */}
      {levelBreakdown.mid && levelBreakdown.mid.length > 0 && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: COLORS.mid + '40' }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-lg mr-2">🔵</Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.mid }}>
              {language === 'en' ? 'Mid Dimension (Courage·Acceptance·Reason)' : '中维度 (勇气·接纳·理性)'}
            </Text>
          </View>
          {levelBreakdown.mid.map((item: any, index: number) => (
            <View key={index} className="mb-3 p-3 rounded-xl" style={{ backgroundColor: COLORS.mid + '15' }}>
              <Text className="text-sm text-foreground leading-5">"{item.phrase}"</Text>
              <Text className="text-xs mt-1" style={{ color: COLORS.mid }}>
                —— {item.levelName} ({item.level})
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Low Dimension Phrases */}
      {levelBreakdown.low && levelBreakdown.low.length > 0 && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: COLORS.low + '40' }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-lg mr-2">🔴</Text>
            <Text className="text-base font-semibold" style={{ color: COLORS.low }}>
              {language === 'en' ? 'Low Dimension (Fear·Anger·Grief)' : '低维度 (恐惧·愤怒·悲伤)'}
            </Text>
          </View>
          {levelBreakdown.low.map((item: any, index: number) => (
            <View key={index} className="mb-3 p-3 rounded-xl" style={{ backgroundColor: COLORS.low + '15' }}>
              <Text className="text-sm text-foreground leading-5">"{item.phrase}"</Text>
              <Text className="text-xs mt-1" style={{ color: COLORS.low }}>
                —— {item.levelName} ({item.level})
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Progress Summary */}
      {data?.progressSummary && (
        <View className="bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">
            {language === 'en' ? '📈 Your Evolution Progress' : '📈 你的进化进步'}
          </Text>
          <Text className="text-sm text-muted leading-6" style={{ letterSpacing: 0.3 }}>{data.progressSummary}</Text>
        </View>
      )}

      {/* Encouragement */}
      {data?.encouragement && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: '#FFD70040' }}>
          <Text className="text-sm font-medium mb-2" style={{ color: '#FFD700' }}>
            {language === 'en' ? '🌟 From a Higher Perspective' : '🌟 来自高维的视角'}
          </Text>
          <Text className="text-base text-foreground leading-6" style={{ fontStyle: 'italic' }}>{data.encouragement}</Text>
        </View>
      )}
    </View>
  );
}

function AttentionResult({ data, colors, language }: { data: any; colors: any; language: string }) {
  const reminders = data?.reminders || [];
  
  return (
    <View className="gap-4">
      {/* Opening */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base leading-6" style={{ color: colors.foreground, opacity: 0.95, fontStyle: 'italic' }}>
          {data?.opening || (language === 'en'
            ? 'Based on your recent reflections, here are some gentle reminders from a place of love...'
            : '根据你近期的反思，以下是一些来自爱的温柔提醒...')}
        </Text>
      </View>

      {/* Reminders */}
      {reminders.map((reminder: any, index: number) => (
        <View key={index} className="bg-surface rounded-2xl p-5 border border-border">
          {/* Title with emoji */}
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-3">{reminder.emoji || '💡'}</Text>
            <Text className="text-base font-semibold flex-1" style={{ color: colors.foreground }}>
              {reminder.title}
            </Text>
          </View>
          
          {/* Core Insight - Yellow highlight */}
          {reminder.coreInsight && (
            <View className="mb-3 flex-row items-center">
              <Text className="text-base mr-2">⚡</Text>
              <Text className="text-base font-bold flex-1" style={{ color: '#FFD700', lineHeight: 24 }}>
                {reminder.coreInsight}
              </Text>
            </View>
          )}
          
          {/* Detailed content - Enhanced contrast */}
          <Text className="text-sm leading-6" style={{ color: colors.foreground, opacity: 0.85, letterSpacing: 0.3 }}>
            {reminder.content}
          </Text>
        </View>
      ))}

      {/* Blessing */}
      {data?.blessing && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: '#FFE66D40' }}>
          <Text className="text-sm font-medium mb-2" style={{ color: '#D4A000' }}>
            {language === 'en' ? '🙏 A Loving Blessing' : '🙏 爱的祝福'}
          </Text>
          <Text className="text-base leading-6" style={{ color: colors.foreground, opacity: 0.95, fontStyle: 'italic' }}>{data.blessing}</Text>
        </View>
      )}
    </View>
  );
}

function ConflictsResult({ data, colors, language }: { data: any; colors: any; language: string }) {
  const conflicts = data?.conflicts || [];
  
  return (
    <View className="gap-4">
      {/* Introduction */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base text-foreground leading-6" style={{ fontStyle: 'italic' }}>
          {data?.introduction || (language === 'en'
            ? 'Inner conflicts are not enemies to defeat, but parts of yourself seeking integration. Let\'s explore them with compassion...'
            : '内在矛盾不是需要击败的敌人，而是寻求整合的自我部分。让我们带着慈悲去探索它们...')}
        </Text>
      </View>

      {/* Conflicts */}
      {conflicts.map((conflict: any, index: number) => (
        <View key={index} className="bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">
            {conflict.title}
          </Text>
          
          {/* The Conflict */}
          <View className="mb-3 p-3 rounded-xl" style={{ backgroundColor: '#95E1D310' }}>
            <Text className="text-xs text-muted mb-1">
              {language === 'en' ? 'The Tension' : '矛盾点'}
            </Text>
            <Text className="text-sm text-foreground" style={{ letterSpacing: 0.3 }}>{conflict.tension}</Text>
          </View>
          
          {/* The Integration */}
          <View className="p-3 rounded-xl" style={{ backgroundColor: '#95E1D320' }}>
            <Text className="text-xs mb-1" style={{ color: '#4A9E8F' }}>
              {language === 'en' ? 'Path to Integration' : '整合之路'}
            </Text>
            <Text className="text-sm text-foreground" style={{ letterSpacing: 0.3 }}>{conflict.integration}</Text>
          </View>
        </View>
      ))}

      {/* Wisdom */}
      {data?.wisdom && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: '#95E1D340' }}>
          <Text className="text-sm font-medium mb-2" style={{ color: '#4A9E8F' }}>
            {language === 'en' ? '🕊️ Wisdom for Wholeness' : '🕊️ 走向完整的智慧'}
          </Text>
          <Text className="text-base text-foreground leading-6">{data.wisdom}</Text>
        </View>
      )}

      {/* Carl Jung's Awakened Wisdom */}
      {data?.jungWisdom && (
        <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: '#FFD70040' }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-2xl mr-2">🌟</Text>
            <Text className="text-base font-semibold" style={{ color: '#B8860B' }}>
              {language === 'en' ? 'Carl Jung' : 'Carl Jung'}
            </Text>
          </View>
          <Text className="text-base text-foreground leading-6 italic">
            {data.jungWisdom}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ReviewAnalysisScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useLanguage();
  const params = useLocalSearchParams<{ type: string }>();
  const analysisType = (params.type || "relationships") as AnalysisType;
  
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinkingProcess, setThinkingProcess] = useState<string>('');

  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  // Cooldown removed - users can refresh anytime

  const config = ANALYSIS_CONFIG[analysisType];

  // API mutation for analysis
  const analysisMutation = trpc.ai.generateReviewAnalysis.useMutation({
    onSuccess: (data: any) => {
      // Extract thinking process if available
      if (data.thinkingProcess) {
        setThinkingProcess(data.thinkingProcess);
      }
      setAnalysisData(data);
      setIsLoading(false);
    },
    onError: (err: any) => {
      console.error('Analysis error:', err);
      setError(language === 'en' ? 'Failed to generate analysis' : '生成分析失败');
      setIsLoading(false);
      // Use mock data as fallback
      setAnalysisData(getMockData(analysisType, language));
    },
  });

  useEffect(() => {
    loadAnalysisWithCache();
  }, [analysisType]);

  // Cooldown check removed - users can refresh anytime

  const loadAnalysisWithCache = async () => {
    setIsLoading(true);
    setError(null);
    setThinkingProcess('');
    
    try {
      const reviewType = analysisType === 'consciousness' ? 'consciousness' :
                         analysisType === 'growth' ? 'growth' :
                         analysisType === 'relationships' ? 'relationships' :
                         analysisType === 'attention' ? 'attention' : 'consciousness';
      
      // 获取当前日记内容
      const entries = await getJournalEntries();
      setJournalEntries(entries);
      const recentEntries = entries.slice(0, 20);
      const entriesText = recentEntries.map(e => `${e.topic}: ${e.content}`).join('\n\n');
      
      // 检查缓存（传入当前内容用于比较）
      const cachedData = await getReviewCache(reviewType as ReviewType, entriesText);
      if (cachedData) {
        console.log('使用缓存数据（内容未变化）');
        setAnalysisData(cachedData);
        setIsLoading(false);
        return;
      }
      
      // 没有缓存或内容已变化，生成新数据
      console.log('生成新数据（无缓存或内容已变化）');
      await generateAnalysis();
    } catch (err) {
      console.error('Load analysis error:', err);
      setAnalysisData(getMockData(analysisType, language));
      setIsLoading(false);
    }
  };
  
  const generateAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    
    // 显示思考过程
    const thinkingSteps = language === 'en' ? [
      'Analyzing your journal entries...',
      'Identifying core themes and patterns...',
      'Building consciousness structure...',
      'Generating personalized insights...',
    ] : [
      '正在分析你的日记内容...',
      '识别核心主题与模式...',
      '构建意识层级结构...',
      '生成个性化洞察...',
    ];
    
    let currentStep = 0;
    const thinkingInterval = setInterval(() => {
      if (currentStep < thinkingSteps.length) {
        setThinkingProcess(thinkingSteps[currentStep]);
        currentStep++;
      }
    }, 1500);
    
    try {
      const entries = await getJournalEntries();
      const recentEntries = entries.slice(0, 20);
      
      if (recentEntries.length === 0) {
        clearInterval(thinkingInterval);
        setAnalysisData(getMockData(analysisType, language));
        setIsLoading(false);
        return;
      }

      const entriesText = recentEntries.map(e => `${e.topic}: ${e.content}`).join('\n\n');
      
      analysisMutation.mutate({
        type: analysisType,
        entries: entriesText,
        language: language as 'zh' | 'en',
      }, {
        onSuccess: async (data) => {
          clearInterval(thinkingInterval);
          setAnalysisData(data);
          setIsLoading(false);
          
          // 保存到缓存（带上日记内容哈希）
          const reviewType = analysisType === 'consciousness' ? 'consciousness' :
                             analysisType === 'growth' ? 'growth' :
                             analysisType === 'relationships' ? 'relationships' :
                             analysisType === 'attention' ? 'attention' : 'consciousness';
          await saveReviewCache(reviewType as ReviewType, data, entriesText);
        },
        onError: (err) => {
          clearInterval(thinkingInterval);
          console.error('Analysis error:', err);
          setError(language === 'en' ? 'Failed to generate analysis' : '生成分析失败');
          setIsLoading(false);
          setAnalysisData(getMockData(analysisType, language));
        },
      });
    } catch (err) {
      clearInterval(thinkingInterval);
      console.error('Generate analysis error:', err);
      setAnalysisData(getMockData(analysisType, language));
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await generateAnalysis();
  };

  const renderResult = () => {
    const expert = config.expert;
    switch (analysisType) {
      case "relationships":
        return (
          <View className="gap-6">
            <ExpertCard {...expert} language={language} />
            <RelationshipsResult data={analysisData} colors={colors} language={language} />
          </View>
        );
      case "consciousness":
        return (
          <View className="gap-6">
            <ExpertCard {...expert} language={language} />
            <ConsciousnessResult data={analysisData} colors={colors} language={language} />
          </View>
        );
      case "growth":
        return (
          <View className="gap-6">
            <ExpertCard {...expert} language={language} />
            <GrowthResult data={analysisData} colors={colors} language={language} entries={journalEntries} />
          </View>
        );
      case "attention":
        return (
          <View className="gap-6">
            <ExpertCard {...expert} language={language} />
            <AttentionResult data={analysisData} colors={colors} language={language} />
          </View>
        );
      case "conflicts":
        return (
          <View className="gap-6">
            <ExpertCard {...expert} language={language} />
            <ConflictsResult data={analysisData} colors={colors} language={language} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-2">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">{config.icon}</Text>
              <Text className="text-xl font-bold text-foreground">
                {language === 'en' ? config.titleEn : config.titleZh}
              </Text>
            </View>
            <Text className="text-xs mt-1" style={{ color: config.color }}>
              {language === 'en' ? config.subtitleEn : config.subtitleZh}
            </Text>
          </View>
          {!isLoading && (
            <TouchableOpacity
              onPress={handleRefresh}
              className="w-10 h-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-lg">🔄</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cooldown removed - users can refresh anytime */}

        {/* Content */}
        <View className="mt-4">
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color={config.color} />
              <Text className="text-base text-muted mt-4">
                {language === 'en' ? '🧠 Deep thinking in progress...' : '🧠 正在进行深度思考...'}
              </Text>
              {thinkingProcess && (
                <Text className="text-sm text-muted mt-2">
                  {thinkingProcess}
                </Text>
              )}
            </View>
          ) : (
            <View className="gap-4">
              {renderResult()}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// Mock data for fallback
function getMockData(type: AnalysisType, language: string): any {
  const isEn = language === 'en';
  
  switch (type) {
    case "relationships":
      return {
        summary: isEn 
          ? "Your journal reveals deep connections with the people around you. Here are those who appear most frequently in your gratitude..."
          : "你的日记揭示了你与周围人的深厚联系。以下是在你的感恩中出现最频繁的人...",
        people: [
          {
            name: isEn ? "Mom" : "妈妈",
            emoji: "👩",
            count: 12,
            gratitude: isEn 
              ? "You often express gratitude for her unconditional support, warm meals, and the way she always knows when you need encouragement."
              : "你经常感恩她无条件的支持、温暖的饭菜，以及她总是知道你何时需要鼓励。"
          },
          {
            name: isEn ? "Best Friend" : "好朋友",
            emoji: "🤝",
            count: 8,
            gratitude: isEn
              ? "Your gratitude for them centers around shared laughter, deep conversations, and their ability to accept you as you are."
              : "你对他们的感恩集中在共同的欢笑、深入的对话，以及他们接纳真实的你的能力。"
          },
        ],
        insight: isEn
          ? "The love you give and receive creates ripples that extend far beyond what you can see. Each moment of gratitude strengthens these sacred bonds."
          : "你给予和接收的爱创造的涟漪远超你所能看到的。每一刻的感恩都在加强这些神圣的纽带。"
      };

    case "consciousness":
      return {
        overallLevel: 380,
        levelName: isEn ? "Acceptance" : "接纳",
        distribution: {
          low: 15,
          mid: 45,
          high: 40
        },
        levelBreakdown: {
          low: [
            {
              phrase: isEn ? "I'm worried about what others think" : "我担心别人怎么看我",
              level: 100,
              levelName: isEn ? "Fear" : "恐惧"
            }
          ],
          mid: [
            {
              phrase: isEn ? "I decided to face this challenge" : "我决定面对这个挑战",
              level: 200,
              levelName: isEn ? "Courage" : "勇气"
            },
            {
              phrase: isEn ? "I accept things as they are" : "我接受事物本来的样子",
              level: 350,
              levelName: isEn ? "Acceptance" : "接纳"
            }
          ],
          high: [
            {
              phrase: isEn ? "I feel deep gratitude and love" : "我感受到深深的感恩和爱",
              level: 500,
              levelName: isEn ? "Love" : "爱"
            },
            {
              phrase: isEn ? "Everything is perfect as it is" : "一切都是完美的",
              level: 540,
              levelName: isEn ? "Joy" : "喜悦"
            }
          ]
        },
        progressSummary: isEn
          ? "Your journal shows a beautiful shift from fear-based thinking to love-based awareness. You're increasingly expressing from higher consciousness levels."
          : "你的日记显示出从基于恐惧的思维到基于爱的觉知的美丽转变。你越来越多地从更高的意识层级表达。",
        encouragement: isEn
          ? "Every moment of awareness is a step toward enlightenment. Your willingness to observe your own consciousness is itself a sign of spiritual evolution."
          : "每一个觉知的时刻都是走向开悟的一步。你愿意观察自己的意识，这本身就是灵性进化的标志。"
      };
      
    case "growth":
      return {
        currentLevel: 350,
        levelName: isEn ? "Acceptance" : "接纳",
        journey: isEn
          ? "Your entries show a beautiful evolution from seeking external validation to finding peace within. You're learning to embrace both light and shadow with equal grace."
          : "你的日记显示出从寻求外在认可到内在平静的美丽演变。你正在学习以同样的优雅拥抱光明与阴影。",
        shifts: isEn ? [
          "From judgment to curiosity",
          "From resistance to acceptance",
          "From fear to trust in the process"
        ] : [
          "从评判到好奇",
          "从抗拒到接纳",
          "从恐惧到信任过程"
        ],
        encouragement: isEn
          ? "You are exactly where you need to be. Every step of your journey, even the difficult ones, has been preparing you for this moment of awakening."
          : "你正处于你需要在的地方。你旅程的每一步，即使是困难的那些，都在为这个觉醒的时刻做准备。"
      };
      
    case "attention":
      return {
        opening: isEn
          ? "From a place of deep love and higher awareness, here are some gentle invitations for your coming days..."
          : "从深深的爱和更高的觉知出发，以下是对你未来日子的一些温柔邀请...",
        reminders: [
          {
            emoji: "🌸",
            title: isEn ? "Slow Down" : "慢下来",
            content: isEn
              ? "Your journal shows a pattern of rushing. What if you gave yourself permission to move at the pace of grace?"
              : "你的日记显示出匆忙的模式。如果你允许自己以优雅的节奏前进会怎样？"
          },
          {
            emoji: "💝",
            title: isEn ? "Self-Compassion" : "自我慈悲",
            content: isEn
              ? "You extend so much kindness to others. Remember that you deserve the same tenderness from yourself."
              : "你对他人如此善良。记住你也值得从自己那里得到同样的温柔。"
          },
        ],
        blessing: isEn
          ? "May you walk through each day knowing you are held by love, guided by wisdom, and supported by the universe itself."
          : "愿你在每一天都知道自己被爱包围，被智慧引导，被宇宙本身支持。"
      };
      
    case "conflicts":
      return {
        introduction: isEn
          ? "Inner conflicts are messengers, not enemies. They point to parts of yourself seeking to be seen and integrated. Let's explore with compassion..."
          : "内在矛盾是信使，不是敌人。它们指向渴望被看见和整合的自我部分。让我们带着慈悲去探索...",
        conflicts: [
          {
            title: isEn ? "Achievement vs. Rest" : "成就 vs. 休息",
            tension: isEn
              ? "Part of you pushes for constant productivity, while another part yearns for stillness and peace."
              : "你的一部分追求持续的生产力，而另一部分渴望静止与平和。",
            integration: isEn
              ? "Both voices serve you. Achievement brings growth; rest brings renewal. The wisdom is in honoring both rhythms."
              : "两种声音都在服务你。成就带来成长；休息带来更新。智慧在于尊重两种节奏。"
          },
        ],
        wisdom: isEn
          ? "Wholeness doesn't mean the absence of contradictions. It means holding all parts of yourself with love, allowing them to dance together rather than fight."
          : "完整并不意味着没有矛盾。它意味着用爱拥抱自己的所有部分，让它们一起舞蹈而不是战斗。",
        jungWisdom: isEn
          ? "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed. Your inner conflicts are not problems to solve, but invitations to transcend. In accepting the shadow, you become whole. In embracing paradox, you touch the infinite. This is individuation—the sacred journey of becoming who you truly are."
          : "两个人格的相遇就像两种化学物质的接触：如果有任何反应，两者都会被转化。你的内在矛盾不是需要解决的问题，而是超越的邀请。在接纳阴影中，你变得完整。在拥抱惖论中，你触及无限。这就是个体化——成为真实自我的神圣之旅。"
      };
      
    default:
      return {};
  }
}
