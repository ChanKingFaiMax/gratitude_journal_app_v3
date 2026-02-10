import { View, Text, TouchableOpacity, ScrollView, Switch, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";


import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import {
  getNotificationSettings,
  toggleNotifications,
  updateTimeSlot,
  requestNotificationPermissions,
  type NotificationSettings,
} from "@/lib/notification-service";
import { getRandomQuote } from "@/lib/notification-quotes";

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language, t } = useLanguage();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  const [exampleQuote, setExampleQuote] = useState(getRandomQuote());

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await getNotificationSettings();
    setSettings(loadedSettings);
  };

  // Handle master toggle
  const handleMasterToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value) {
      // Request permission first
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          language === 'en' ? 'Permission Required' : '需要通知权限',
          language === 'en' 
            ? 'Please enable notification permissions in system settings to receive daily reminders.'
            : '请在系统设置中允许通知权限,以便接收每日提醒。',
          [{ text: language === 'en' ? 'OK' : '好的' }]
        );
        return;
      }
    }

    try {
      await toggleNotifications(value);
      await loadSettings();
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      Alert.alert(
        language === 'en' ? 'Operation Failed' : '操作失败', 
        language === 'en' 
          ? 'Unable to update reminder settings, please try again later.'
          : '无法更新提醒设置,请稍后重试。'
      );
    }
  };

  // Handle time slot toggle
  const handleSlotToggle = async (
    slot: 'morning' | 'noon' | 'evening',
    value: boolean
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await updateTimeSlot(slot, value);
      await loadSettings();
    } catch (error) {
      console.error('Failed to update time slot:', error);
    }
  };



  if (!settings) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">
            {language === 'en' ? 'Loading...' : '加载中...'}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const timeSlots = [
    {
      key: 'morning' as const,
      title: language === 'en' ? 'Morning Reminder' : '早晨提醒',
      icon: '🌅',
      description: language === 'en' 
        ? 'Start your day with clarity and intention.'
        : '美好一天的开始,清醒的时刻。',
      time: settings.morning.time,
      enabled: settings.morning.enabled,
    },
    {
      key: 'noon' as const,
      title: language === 'en' ? 'Noon Reminder' : '午间提醒',
      icon: '☀️',
      description: language === 'en'
        ? 'A midday pause to recharge with wisdom.'
        : '午间小憩,补充能量与智慧。',
      time: settings.noon.time,
      enabled: settings.noon.enabled,
    },
    {
      key: 'evening' as const,
      title: language === 'en' ? 'Evening Reminder' : '晚间提醒',
      icon: '🌙',
      description: language === 'en'
        ? 'Reflect on your day and end it peacefully.'
        : '回顾今日,平静地结束一天。',
      time: settings.evening.time,
      enabled: settings.evening.enabled,
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center border-b" style={{ borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">
            {language === 'en' ? 'Daily Reminders' : '每日提醒'}
          </Text>
        </View>

        <View className="px-5 py-6 gap-4">
          {/* Master Toggle */}
          <View className="bg-surface rounded-2xl p-5 shadow-sm border" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">
                {language === 'en' ? 'Enable Daily Reminders' : '启用每日提醒'}
              </Text>
              <Switch
                value={settings.enabled}
                onValueChange={handleMasterToggle}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={settings.enabled ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Time Slots */}
          {timeSlots.map((slot) => (
            <View
              key={slot.key}
              className="bg-surface rounded-2xl p-5 shadow-sm border"
              style={{ borderColor: colors.border, opacity: settings.enabled ? 1 : 0.5 }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">{slot.icon}</Text>
                  <Text className="text-base font-semibold text-foreground">{slot.title}</Text>
                </View>
                <Switch
                  value={slot.enabled}
                  onValueChange={(value) => handleSlotToggle(slot.key, value)}
                  disabled={!settings.enabled}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={slot.enabled ? colors.primary : '#f4f3f4'}
                />
              </View>

              <Text className="text-4xl font-bold text-foreground mb-2">{slot.time}</Text>

              <Text className="text-sm text-muted">{slot.description}</Text>
            </View>
          ))}

          {/* Example Quote Preview */}
          <View
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-lg">🔔</Text>
              <Text className="text-sm font-semibold text-foreground">
                {language === 'en' ? 'Preview' : '显示'}
              </Text>
            </View>
            <Text className="text-base text-foreground leading-relaxed mb-3">
              {exampleQuote.text} {exampleQuote.icon}
            </Text>
            <Text className="text-xs text-muted">
              {language === 'en' 
                ? '—— A random high-vibration quote is selected for each notification'
                : '—— 每次推送随机选择一条高维度话语'}
            </Text>
          </View>
        </View>
      </ScrollView>


    </ScreenContainer>
  );
}
