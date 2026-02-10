import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";

type Entry = {
  id: string;
  timestamp: number;
  consciousnessLevel?: number;
  levelName?: string;
};

type ConsciousnessStepChartProps = {
  entries: Entry[];
};

// Hawkins Consciousness Scale mapping
const CONSCIOUSNESS_LEVELS = {
  zh: {
    700: "开悟",
    600: "平和",
    540: "喜悦",
    500: "爱",
    400: "理性",
    350: "接纳",
    310: "主动",
    250: "中立",
    200: "勇气",
    175: "骄傲",
    150: "愤怒",
    125: "欲望",
    100: "恐惧",
    75: "悲伤",
    50: "冷漠",
    30: "内疚",
    20: "羞愧",
  },
  en: {
    700: "Enlightenment",
    600: "Peace",
    540: "Joy",
    500: "Love",
    400: "Reason",
    350: "Acceptance",
    310: "Willingness",
    250: "Neutrality",
    200: "Courage",
    175: "Pride",
    150: "Anger",
    125: "Desire",
    100: "Fear",
    75: "Grief",
    50: "Apathy",
    30: "Guilt",
    20: "Shame",
  },
};

function getLevelName(score: number, language: string): string {
  const levels = CONSCIOUSNESS_LEVELS[language as 'zh' | 'en'];
  const levelKeys = Object.keys(levels).map(Number).sort((a, b) => b - a);
  
  for (const key of levelKeys) {
    if (score >= key) {
      return levels[key as keyof typeof levels];
    }
  }
  
  return levels[20];
}

function getLevelColor(score: number): string {
  if (score >= 500) return "#FFD700"; // Gold - High dimension
  if (score >= 200) return "#4A90D9"; // Blue - Mid dimension
  return "#FF6B6B"; // Red - Low dimension
}

export function ConsciousnessStepChart({ entries }: ConsciousnessStepChartProps) {
  const colors = useColors();
  const { language } = useLanguage();
  
  // Sort entries by timestamp
  const sortedEntries = [...entries]
    .filter(e => e.consciousnessLevel && e.consciousnessLevel > 0)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-10); // Last 10 entries max
  
  if (sortedEntries.length === 0) {
    return (
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-sm text-muted text-center">
          {language === 'en' ? 'No consciousness data available' : '暂无意识层级数据'}
        </Text>
      </View>
    );
  }
  
  // Calculate stats
  const firstLevel = sortedEntries[0].consciousnessLevel!;
  const lastLevel = sortedEntries[sortedEntries.length - 1].consciousnessLevel!;
  const growth = lastLevel - firstLevel;
  const firstLevelName = getLevelName(firstLevel, language);
  const lastLevelName = getLevelName(lastLevel, language);
  
  // Calculate chart dimensions
  const maxLevel = Math.max(...sortedEntries.map(e => e.consciousnessLevel!));
  const minLevel = Math.min(...sortedEntries.map(e => e.consciousnessLevel!));
  const levelRange = maxLevel - minLevel;
  const chartHeight = 200;
  const stepWidth = 280 / sortedEntries.length;
  
  return (
    <View className="gap-4">
      {/* Chart Title */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-lg font-bold text-foreground mb-1">
          {language === 'en' ? '📊 Today\'s Consciousness Evolution' : '📊 今日意识层级变化'}
        </Text>
        <Text className="text-xs text-muted">
          {language === 'en' 
            ? 'Your consciousness transformation through journaling today'
            : '今日通过写作实现的意识转化过程'}
        </Text>
      </View>
      
      {/* Step Chart */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <View style={{ height: chartHeight, position: 'relative' }}>
          {/* Y-axis labels */}
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40 }}>
            <Text className="text-xs text-muted" style={{ position: 'absolute', top: 0 }}>
              {Math.ceil(maxLevel / 100) * 100}
            </Text>
            <Text className="text-xs text-muted" style={{ position: 'absolute', top: '50%', marginTop: -6 }}>
              {Math.ceil((maxLevel + minLevel) / 200) * 100}
            </Text>
            <Text className="text-xs text-muted" style={{ position: 'absolute', bottom: 0 }}>
              {Math.floor(minLevel / 100) * 100}
            </Text>
          </View>
          
          {/* Chart area */}
          <View style={{ position: 'absolute', left: 50, right: 0, top: 0, bottom: 20 }}>
            {sortedEntries.map((entry, index) => {
              const level = entry.consciousnessLevel!;
              const levelName = entry.levelName || getLevelName(level, language);
              const color = getLevelColor(level);
              
              // Calculate position
              const heightPercent = levelRange > 0 
                ? ((level - minLevel) / levelRange) * 0.8 + 0.1
                : 0.5;
              const bottomPosition = heightPercent * (chartHeight - 20);
              const leftPosition = index * stepWidth;
              
              return (
                <View key={entry.id}>
                  {/* Step bar */}
                  <View
                    style={{
                      position: 'absolute',
                      left: leftPosition,
                      bottom: 0,
                      width: stepWidth - 8,
                      height: bottomPosition,
                      backgroundColor: color + '20',
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      borderWidth: 2,
                      borderColor: color,
                      borderBottomWidth: 0,
                    }}
                  />
                  
                  {/* Level dot and label */}
                  <View
                    style={{
                      position: 'absolute',
                      left: leftPosition + (stepWidth - 8) / 2 - 4,
                      bottom: bottomPosition - 4,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: color,
                      }}
                    />
                  </View>
                  
                  {/* Score label on top */}
                  <View
                    style={{
                      position: 'absolute',
                      left: leftPosition,
                      bottom: bottomPosition + 5,
                      width: stepWidth - 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color }}>
                      {level}
                    </Text>
                    <Text className="text-xs text-muted" numberOfLines={1}>
                      {levelName}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* X-axis labels */}
        <View style={{ flexDirection: 'row', marginTop: 8, marginLeft: 50 }}>
          {sortedEntries.map((_, index) => (
            <View key={index} style={{ width: stepWidth - 8, alignItems: 'center' }}>
              <Text className="text-xs text-muted">
                {language === 'en' ? `#${index + 1}` : `第${index + 1}篇`}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Growth Stats */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-base font-semibold text-foreground mb-3">
          {language === 'en' ? '📊 Today\'s Growth Data' : '📊 今日成长数据'}
        </Text>
        
        <View className="gap-2">
          <View className="flex-row items-center">
            <Text className="text-sm text-muted flex-1">
              {language === 'en' ? 'Starting Point:' : '起点：'}
            </Text>
            <Text className="text-sm font-medium text-foreground">
              {firstLevelName} ({firstLevel})
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Text className="text-sm text-muted flex-1">
              {language === 'en' ? 'Current Level:' : '现在：'}
            </Text>
            <Text className="text-sm font-medium text-foreground">
              {lastLevelName} ({lastLevel})
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Text className="text-sm text-muted flex-1">
              {language === 'en' ? 'Growth:' : '提升：'}
            </Text>
            <Text 
              className="text-sm font-bold" 
              style={{ color: growth >= 0 ? '#4ECDC4' : '#FF6B6B' }}
            >
              {growth >= 0 ? '+' : ''}{growth} {language === 'en' ? 'points' : '分'} {growth >= 0 ? '↗️' : '↘️'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Insight */}
      <View className="bg-surface rounded-2xl p-5 border border-border" style={{ borderColor: '#4ECDC440' }}>
        <Text className="text-sm font-medium mb-2" style={{ color: '#4ECDC4' }}>
          {language === 'en' ? '💡 Insight' : '💡 洞察'}
        </Text>
        <Text className="text-base text-foreground leading-6">
          {growth >= 0 ? (
            language === 'en'
              ? `In a single day, you've transformed from ${firstLevelName} to ${lastLevelName} through journaling. Writing itself is a healing and elevating process! Keep going—as your journal accumulates, you'll see longer-term growth trends.`
              : `在同一天内，你通过写作实现了从${firstLevelName}到${lastLevelName}的转化。写作本身就是一种疗愈和提升的过程！继续保持，随着日记积累，你会看到更长期的成长趋势。`
          ) : (
            language === 'en'
              ? `Today's journey shows some fluctuation, which is completely natural. Consciousness growth is not always linear—sometimes we need to revisit lower levels to integrate deeper lessons. This is part of the healing process. Keep writing with honesty and compassion.`
              : `今天的旅程显示出一些波动，这是完全自然的。意识成长并非总是线性的——有时我们需要重访较低层级来整合更深的功课。这是疗愈过程的一部分。继续带着真诚和慈悲写作吧。`
          )}
        </Text>
      </View>
    </View>
  );
}
