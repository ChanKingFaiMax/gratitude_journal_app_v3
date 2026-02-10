import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomQuote } from './notification-quotes';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const LANGUAGE_KEY = 'app_language';

export interface NotificationSettings {
  enabled: boolean;
  morning: {
    enabled: boolean;
    time: string; // HH:MM format
  };
  noon: {
    enabled: boolean;
    time: string;
  };
  evening: {
    enabled: boolean;
    time: string;
  };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  morning: {
    enabled: true,
    time: '08:00',
  },
  noon: {
    enabled: true,
    time: '12:00',
  },
  evening: {
    enabled: true,
    time: '20:00',
  },
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Get current language setting
 */
async function getCurrentLanguage(): Promise<'zh' | 'en'> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    return (lang as 'zh' | 'en') || 'zh';
  } catch {
    return 'zh';
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Get notification settings from storage
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
  } catch (error) {
    console.error('Failed to load notification settings:', error);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

/**
 * Save notification settings to storage
 */
export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
    throw error;
  }
}

/**
 * Schedule a notification at a specific time
 */
async function scheduleNotificationAtTime(
  identifier: string,
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule daily notifications based on settings
 */
export async function scheduleDailyNotifications(settings: NotificationSettings): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }

  // Cancel all existing notifications first
  await cancelAllNotifications();

  if (!settings.enabled) {
    return;
  }

  const language = await getCurrentLanguage();

  // Schedule morning notification
  if (settings.morning.enabled) {
    const [hour, minute] = settings.morning.time.split(':').map(Number);
    const quote = getRandomQuote(language);
    const title = language === 'en' ? 'Morning Reminder 🌅' : '早晨提醒 🌅';
    await scheduleNotificationAtTime(
      'morning-reminder',
      hour,
      minute,
      title,
      `${quote.text} ${quote.icon}`
    );
  }

  // Schedule noon notification
  if (settings.noon.enabled) {
    const [hour, minute] = settings.noon.time.split(':').map(Number);
    const quote = getRandomQuote(language);
    const title = language === 'en' ? 'Noon Reminder ☀️' : '午间提醒 ☀️';
    await scheduleNotificationAtTime(
      'noon-reminder',
      hour,
      minute,
      title,
      `${quote.text} ${quote.icon}`
    );
  }

  // Schedule evening notification
  if (settings.evening.enabled) {
    const [hour, minute] = settings.evening.time.split(':').map(Number);
    const quote = getRandomQuote(language);
    const title = language === 'en' ? 'Evening Reminder 🌙' : '晚间提醒 🌙';
    await scheduleNotificationAtTime(
      'evening-reminder',
      hour,
      minute,
      title,
      `${quote.text} ${quote.icon}`
    );
  }
}

/**
 * Toggle notification settings on/off
 */
export async function toggleNotifications(enabled: boolean): Promise<void> {
  const settings = await getNotificationSettings();
  settings.enabled = enabled;
  await saveNotificationSettings(settings);

  if (enabled) {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await scheduleDailyNotifications(settings);
    } else {
      throw new Error('Notification permission denied');
    }
  } else {
    await cancelAllNotifications();
  }
}

/**
 * Update time slot settings
 */
export async function updateTimeSlot(
  slot: 'morning' | 'noon' | 'evening',
  enabled: boolean,
  time?: string
): Promise<void> {
  const settings = await getNotificationSettings();
  settings[slot].enabled = enabled;
  if (time) {
    settings[slot].time = time;
  }
  await saveNotificationSettings(settings);

  if (settings.enabled) {
    await scheduleDailyNotifications(settings);
  }
}

/**
 * Get notification status summary
 */
export async function getNotificationStatusSummary(language?: 'zh' | 'en'): Promise<string> {
  const settings = await getNotificationSettings();
  const lang = language || await getCurrentLanguage();
  
  if (!settings.enabled) {
    return lang === 'en' ? 'Not enabled' : '未开启';
  }

  const enabledSlots = [];
  if (settings.morning.enabled) enabledSlots.push(lang === 'en' ? 'Morning' : '早晨');
  if (settings.noon.enabled) enabledSlots.push(lang === 'en' ? 'Noon' : '午间');
  if (settings.evening.enabled) enabledSlots.push(lang === 'en' ? 'Evening' : '晚间');

  if (enabledSlots.length === 0) {
    return lang === 'en' ? 'Enabled · No time set' : '已开启 · 未设置时间';
  }

  if (enabledSlots.length === 3) {
    return lang === 'en' ? '3 daily reminders · Enabled' : '早中晚三次提醒 · 已开启';
  }

  if (lang === 'en') {
    return `${enabledSlots.join(', ')} reminder · Enabled`;
  }
  return `${enabledSlots.join('、')}提醒 · 已开启`;
}
