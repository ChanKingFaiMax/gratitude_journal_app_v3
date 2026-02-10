import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { JournalEntry } from "@/types/journal";

interface WritingTimeChartProps {
  entries: JournalEntry[];
}

export function WritingTimeChart({ entries }: WritingTimeChartProps) {
  const colors = useColors();
  const { t, language } = useLanguage();

  // 统计每个时间段的写作篇数
  const timeSlots = [
    { hour: 6, label: "6am", labelZh: "早上6点" },
    { hour: 9, label: "9am", labelZh: "上午9点" },
    { hour: 12, label: "12pm", labelZh: "中午12点" },
    { hour: 15, label: "3pm", labelZh: "下午3点" },
    { hour: 18, label: "6pm", labelZh: "傍晚6点" },
    { hour: 21, label: "9pm", labelZh: "晚上9点" },
    { hour: 0, label: "12am", labelZh: "凌晨12点" },
  ];

  // 计算每个时间段的日记数量
  const timeCounts = timeSlots.map((slot) => {
    const count = entries.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      const entryHour = entryDate.getHours();
      
      // 判断是否在当前时间段内（3小时一个时段）
      if (slot.hour === 0) {
        // 12am时段：00:00-02:59
        return entryHour >= 0 && entryHour < 3;
      } else if (slot.hour === 21) {
        // 9pm时段：21:00-23:59
        return entryHour >= 21 && entryHour <= 23;
      } else if (slot.hour === 6) {
        // 6am时段：3:00-8:59（包含凌晨3-5点）
        return entryHour >= 3 && entryHour < 9;
      } else {
        // 其他时段：每3小时一段
        return entryHour >= slot.hour && entryHour < slot.hour + 3;
      }
    }).length;
    
    return { ...slot, count };
  });

  // 找到最大值用于归一化
  const maxCount = Math.max(...timeCounts.map((t) => t.count), 1);

  // 计算黄金写作时间
  const goldenTime = timeCounts.reduce((max, current) =>
    current.count > max.count ? current : max
  );

  // 计算最常写作时段占比
  const totalEntries = entries.length;
  const goldenTimePercentage = totalEntries > 0 
    ? Math.round((goldenTime.count / totalEntries) * 100)
    : 0;

  // 计算早晨（6am-12pm）vs 晚上（6pm-12am）的数量
  const morningCount = timeCounts
    .filter((t) => t.hour >= 6 && t.hour < 12)
    .reduce((sum, t) => sum + t.count, 0);
  const eveningCount = timeCounts
    .filter((t) => t.hour >= 18 || t.hour === 0)
    .reduce((sum, t) => sum + t.count, 0);

  // 获取时间段的显示标签
  const getTimeLabel = (slot: typeof timeSlots[0]) => {
    return language === "en" ? slot.label : slot.labelZh;
  };

  return (
    <View
      className="rounded-2xl p-5 border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* 标题 */}
      <View className="flex-row items-center mb-4">
        <Text className="text-xl mr-2">⏰</Text>
        <Text className="text-lg font-semibold text-foreground">
          {language === "en" ? "Writing Time Distribution" : "写作时间分布"}
        </Text>
      </View>

      {/* 柱状图 */}
      <View className="mb-6">
        {/* Y轴标签 */}
        <View className="flex-row items-end mb-2" style={{ height: 120 }}>
          {timeCounts.map((slot, index) => {
            // 确保即使count为0，柱子也有最小高度（如果有数据的话）
            const barHeight = slot.count > 0 
              ? Math.max((slot.count / maxCount) * 100, 8) // 最小8%高度
              : 0;
            
            return (
              <View key={index} className="flex-1 items-center">
                {/* 篇数显示 */}
                {slot.count > 0 && (
                  <Text className="text-xs font-medium mb-1" style={{ color: colors.primary }}>
                    {slot.count}
                  </Text>
                )}
                {/* 柱子 - 从底部向上增长 */}
                <View className="w-full items-center" style={{ height: 100 }}>
                  <View className="flex-1" />
                  {slot.count > 0 && (
                    <View
                      className="w-8 rounded-t-md"
                      style={{
                        height: `${barHeight}%`,
                        backgroundColor:
                          slot.hour === goldenTime.hour
                            ? colors.primary
                            : colors.primary + "40",
                      }}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* X轴标签 */}
        <View className="flex-row">
          {timeCounts.map((slot, index) => (
            <View key={index} className="flex-1 items-center">
              <Text className="text-xs text-muted">{slot.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 洞察文案 */}
      {totalEntries > 0 && (
        <View className="space-y-2">
          {/* 黄金写作时间 */}
          <View className="flex-row items-start">
            <Text className="text-base mr-2">🌟</Text>
            <Text className="text-sm text-foreground flex-1">
              {language === "en"
                ? `Your golden writing time: ${goldenTime.label}`
                : `你的黄金写作时间：${goldenTime.labelZh}`}
            </Text>
          </View>

          {/* 早晚写作习惯对比 - 深度洞察 */}
          {(morningCount > 0 || eveningCount > 0) && (
            <View className="flex-row items-start">
              <Text className="text-base mr-2">💡</Text>
              <Text className="text-sm text-foreground flex-1">
                {morningCount > eveningCount
                  ? language === "en"
                    ? `You tend to reflect in the morning (${morningCount} entries). Morning writing often brings clarity and sets intention for the day.`
                    : `你倾向于在早晨反思（${morningCount}篇）。清晨的写作常带来清晰和意图，为一天定调。`
                  : language === "en"
                  ? `You prefer evening reflection (${eveningCount} entries). Evening writing helps process the day and release what no longer serves you.`
                  : `你更喜欢晚上反思（${eveningCount}篇）。晚间的写作帮助消化一天，释放不再需要的。`}
              </Text>
            </View>
          )}

          {/* 时段占比 */}
          <View className="flex-row items-start">
            <Text className="text-base mr-2">📊</Text>
            <Text className="text-sm text-foreground flex-1">
              {language === "en"
                ? `Most active period: ${goldenTime.label} (${goldenTimePercentage}%)`
                : `最常写作时段：${goldenTime.labelZh}（占${goldenTimePercentage}%）`}
            </Text>
          </View>
        </View>
      )}

      {/* 无数据提示 */}
      {totalEntries === 0 && (
        <Text className="text-sm text-muted text-center">
          {language === "en"
            ? "Start writing to see your patterns"
            : "开始写日记，发现你的写作规律"}
        </Text>
      )}
    </View>
  );
}
