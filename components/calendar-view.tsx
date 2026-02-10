import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { IconSymbol } from "./ui/icon-symbol";

interface CalendarViewProps {
  entryCounts: Record<string, number>; // { "2025-12-30": 3, ... }
  onDatePress: (date: string) => void;
}

export function CalendarView({ entryCounts, onDatePress }: CalendarViewProps) {
  const colors = useColors();
  const { language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month (0 = Sunday, 1 = Monday, ...)
  const firstDay = new Date(year, month, 1).getDay();
  
  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Build calendar grid
  const calendarDays: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ date: dateStr, day, isCurrentMonth: false });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ date: dateStr, day, isCurrentMonth: true });
  }
  
  // Next month days to fill grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ date: dateStr, day, isCurrentMonth: false });
  }

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDatePress = (date: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDatePress(date);
  };

  const getDateColor = (date: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return colors.border;
    
    const count = entryCounts[date] || 0;
    if (count === 0) return colors.border;
    if (count >= 3) return '#FFD700'; // Gold
    return colors.primary; // Orange
  };

  const monthNames = language === 'en' 
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  const weekDays = language === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['日', '一', '二', '三', '四', '五', '六'];

  const today = new Date().toISOString().split('T')[0];

  return (
    <View>
      {/* Month Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={handlePrevMonth} className="p-2">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-foreground">
          {language === 'en' ? `${monthNames[month]} ${year}` : `${year}年 ${monthNames[month]}`}
        </Text>
        
        <TouchableOpacity onPress={handleNextMonth} className="p-2">
          <IconSymbol name="chevron.right" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Week Day Headers */}
      <View className="flex-row mb-2">
        {weekDays.map((day, index) => (
          <View key={index} className="flex-1 items-center">
            <Text className="text-sm text-muted font-medium">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="gap-1">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-1">
            {calendarDays.slice(rowIndex * 7, (rowIndex + 1) * 7).map((item, colIndex) => {
              const count = entryCounts[item.date] || 0;
              const isToday = item.date === today;
              const bgColor = getDateColor(item.date, item.isCurrentMonth);
              
              return (
                <TouchableOpacity
                  key={colIndex}
                  onPress={() => handleDatePress(item.date, item.isCurrentMonth)}
                  disabled={!item.isCurrentMonth}
                  className="flex-1 aspect-square items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: bgColor,
                    opacity: item.isCurrentMonth ? 1 : 0.3,
                    borderWidth: isToday ? 2 : 0,
                    borderColor: isToday ? colors.primary : 'transparent',
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: count >= 3 ? '#000000' : count > 0 ? '#FFFFFF' : colors.muted,
                    }}
                  >
                    {item.day}
                  </Text>
                  {count > 0 && count < 3 && (
                    <Text className="text-xs" style={{ color: '#FFFFFF' }}>
                      {count}
                    </Text>
                  )}
                  {count >= 3 && (
                    <Text className="text-xs">⭐</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View className="flex-row items-center justify-center gap-4 mt-4">
        <View className="flex-row items-center gap-2">
          <View className="w-4 h-4 rounded" style={{ backgroundColor: colors.border }} />
          <Text className="text-xs text-muted">
            {language === 'en' ? 'None' : '未写'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-4 h-4 rounded" style={{ backgroundColor: colors.primary }} />
          <Text className="text-xs text-muted">
            {language === 'en' ? '1-2' : '1-2篇'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-4 h-4 rounded" style={{ backgroundColor: '#FFD700' }} />
          <Text className="text-xs text-muted">
            {language === 'en' ? '3 Done' : '完成3篇'}
          </Text>
        </View>
      </View>
    </View>
  );
}
