import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";

type ReviewOption = {
  id: string;
  icon: string;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  descZh: string;
  descEn: string;
  color: string;
};

const REVIEW_OPTIONS: ReviewOption[] = [
  {
    id: "relationships",
    icon: "🧑‍🤝‍🧑",
    titleZh: "我的人物关系",
    titleEn: "My Relationships",
    subtitleZh: "基于社会网络分析",
    subtitleEn: "Based on Social Network Analysis",
    descZh: "梳理你日记中提及最多的人，以及你感恩他们的点",
    descEn: "Discover the people you mention most and what you appreciate about them",
    color: "#FF6B6B",
  },
  {
    id: "consciousness",
    icon: "🎯",
    titleZh: "我的意识层级",
    titleEn: "My Consciousness Level",
    subtitleZh: "基于 David Hawkins 意识地图",
    subtitleEn: "Based on David Hawkins Consciousness Map",
    descZh: "分析你日记中的言语层级，追踪意识升级进步",
    descEn: "Analyze the consciousness level of your words and track your evolution",
    color: "#FFD700",
  },
  {
    id: "growth",
    icon: "🌱",
    titleZh: "我的成长",
    titleEn: "My Growth",
    subtitleZh: "基于David Hawkins意识层级",
    subtitleEn: "Based on David Hawkins Consciousness Scale",
    descZh: "回顾你的灵性成长轨迹，看见内在的蜕变",
    descEn: "Review your spiritual growth journey and inner transformation",
    color: "#4ECDC4",
  },
  {
    id: "attention",
    icon: "💡",
    titleZh: "我近期可以注意的",
    titleEn: "What I Can Focus On",
    subtitleZh: "基于正念觉察理论",
    subtitleEn: "Based on Mindfulness Theory",
    descZh: "从爱和高维的视角，给你近期生活的温柔提醒",
    descEn: "Gentle reminders for your life from a loving, higher perspective",
    color: "#FFE66D",
  },
  {
    id: "conflicts",
    icon: "🔄",
    titleZh: "如何梳理我的内在矛盾",
    titleEn: "Resolving Inner Conflicts",
    subtitleZh: "基于荣格心理学",
    subtitleEn: "Based on Jungian Psychology",
    descZh: "帮助你认知并梳理内在的矛盾与冲突",
    descEn: "Help you recognize and work through inner conflicts",
    color: "#95E1D3",
  },
];

export default function ReviewOptionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useLanguage();

  const handleOptionPress = (option: ReviewOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/review-analysis' as any,
      params: { type: option.id }
    });
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">
              {language === 'en' ? 'Review & Reflect' : '回顾与洞察'}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {language === 'en' 
                ? 'Choose how you want to explore your journal' 
                : '选择你想要探索日记的方式'}
            </Text>
          </View>
        </View>

        {/* Options Grid */}
        <View className="gap-4">
          {REVIEW_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleOptionPress(option)}
              className="rounded-2xl p-5 border"
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start">
                {/* Icon Circle */}
                <View 
                  className="w-14 h-14 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: option.color + '20' }}
                >
                  <Text className="text-2xl">{option.icon}</Text>
                </View>
                
                {/* Content */}
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">
                    {language === 'en' ? option.titleEn : option.titleZh}
                  </Text>
                  <Text className="text-xs mb-2" style={{ color: option.color }}>
                    {language === 'en' ? option.subtitleEn : option.subtitleZh}
                  </Text>
                  <Text className="text-sm text-muted leading-5">
                    {language === 'en' ? option.descEn : option.descZh}
                  </Text>
                </View>

                {/* Arrow */}
                <View className="justify-center">
                  <Text className="text-lg text-muted">→</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Hint */}
        <View className="mt-8 items-center">
          <Text className="text-sm text-muted text-center">
            {language === 'en' 
              ? '✨ Each analysis is based on your journal entries' 
              : '✨ 每项分析都基于你的日记内容'}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
