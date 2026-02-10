import { ScrollView, Text, View, TouchableOpacity, Alert, Platform, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { getUserStats } from "@/lib/stats-service";
import { ACHIEVEMENT_DEFINITIONS } from "@/types/stats";
import type { UserStats, Achievement } from "@/types/stats";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNotificationStatusSummary } from "@/lib/notification-service";
import { getLoginUrl } from "@/constants/oauth";

import { trpc } from "@/lib/trpc";
import { 
  getLocalEntriesForSync, 
  getLocalStatsForSync, 
  mergeCloudEntries, 
  mergeCloudStats,
  updateLastSyncTime,
  getLastSyncTime,
  hasPendingSync,
} from "@/lib/sync-service";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  const { logout, user, loading: authLoading, refresh } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastSyncTime, setLastSyncTimeState] = useState<number | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  // tRPC mutations for sync
  const syncEntriesMutation = trpc.journal.sync.useMutation();
  const syncStatsMutation = trpc.stats.sync.useMutation();
  const getCloudEntriesQuery = trpc.journal.list.useQuery(undefined, { enabled: false });
  const getCloudStatsQuery = trpc.stats.get.useQuery(undefined, { enabled: false });

  useEffect(() => {
    loadStats();
    loadNotificationStatus();
    loadSyncStatus();
  }, []);

  // Sync when user logs in
  useEffect(() => {
    if (user && !authLoading) {
      performSync();
    }
  }, [user, authLoading]);

  const loadSyncStatus = async () => {
    const lastSync = await getLastSyncTime();
    setLastSyncTimeState(lastSync);
    const pending = await hasPendingSync();
    setPendingSync(pending);
  };

  const loadNotificationStatus = async () => {
    const status = await getNotificationStatusSummary(language);
    setNotificationStatus(status);
  };

  const loadStats = async () => {
    const userStats = await getUserStats();
    setStats(userStats);

    const achievementsList = Object.values(ACHIEVEMENT_DEFINITIONS).map(def => ({
      ...def,
      unlocked: userStats.achievements.includes(def.id),
    }));
    setAchievements(achievementsList);
  };

  const performSync = async () => {
    if (!user || syncLoading) return;
    
    try {
      setSyncLoading(true);
      console.log('[Settings] Starting sync...');

      // 1. Upload local entries to cloud
      const localEntries = await getLocalEntriesForSync();
      if (localEntries.length > 0) {
        await syncEntriesMutation.mutateAsync({ entries: localEntries });
        console.log(`[Settings] Uploaded ${localEntries.length} entries`);
      }

      // 2. Download cloud entries
      const cloudEntriesResult = await getCloudEntriesQuery.refetch();
      if (cloudEntriesResult.data && cloudEntriesResult.data.length > 0) {
        const newCount = await mergeCloudEntries(cloudEntriesResult.data);
        console.log(`[Settings] Downloaded ${newCount} new entries from cloud`);
      }

      // 3. Upload local stats
      const localStats = await getLocalStatsForSync();
      await syncStatsMutation.mutateAsync(localStats);

      // 4. Download cloud stats
      const cloudStatsResult = await getCloudStatsQuery.refetch();
      if (cloudStatsResult.data) {
        await mergeCloudStats(cloudStatsResult.data);
      }

      // Update sync time
      await updateLastSyncTime();
      await loadSyncStatus();
      await loadStats();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[Settings] Sync completed successfully');
    } catch (error) {
      console.error('[Settings] Sync error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoginLoading(true);

      const loginUrl = getLoginUrl();
      console.log("[Settings] Opening auth URL:", loginUrl);

      if (Platform.OS === "web") {
        window.location.href = loginUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(loginUrl);
        console.log("[Settings] Auth session result:", result);
        
        if (result.type === "success") {
          await refresh();
        }
      }
    } catch (error) {
      console.error("[Settings] Login error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === 'en' ? "Login Failed" : "登录失败", 
        language === 'en' ? "Please try again later" : "请稍后重试"
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!user) {
      Alert.alert(
        language === 'en' ? "Login Required" : "需要登录",
        language === 'en' ? "Please login to sync your data" : "请先登录以同步数据"
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await performSync();
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('clearData'),
      t('clearDataConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('confirm'),
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await loadStats();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/');
            } catch (error) {
              Alert.alert(
                language === 'en' ? "Error" : "错误", 
                language === 'en' ? "Failed to clear data" : "清空数据失败"
              );
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('confirm'),
          style: "destructive",
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const handleLanguageChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
  };

  // Reload notification status when language changes
  useEffect(() => {
    loadNotificationStatus();
  }, [language]);

  // Get localized notification status
  const getLocalizedNotificationStatus = () => {
    return notificationStatus || (language === 'en' ? 'Not enabled' : '未开启');
  };

  // Format last sync time
  const formatLastSyncTime = () => {
    if (!lastSyncTime) return language === 'en' ? 'Never synced' : '从未同步';
    const date = new Date(lastSyncTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'en' ? 'Just now' : '刚刚';
    if (diffMins < 60) return language === 'en' ? `${diffMins} min ago` : `${diffMins}分钟前`;
    if (diffHours < 24) return language === 'en' ? `${diffHours} hour${diffHours > 1 ? 's' : ''} ago` : `${diffHours}小时前`;
    return language === 'en' ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` : `${diffDays}天前`;
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground">{t('settings')}</Text>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">{t('account')}</Text>
          
          {authLoading ? (
            <View className="bg-surface rounded-2xl p-5 border border-border items-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : user ? (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              {/* User Info */}
              <View className="flex-row items-center gap-4 mb-4">
                <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                  <Text className="text-2xl">{user.loginMethod === 'email' ? '✉️' : ''}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">
                    {user.loginMethod === 'email' 
                      ? (language === 'en' ? 'Email User' : '邮箱用户')
                      : (user.name || (language === 'en' ? "Apple User" : "Apple用户"))
                    }
                  </Text>
                  <Text className="text-sm text-muted">
                    {user.email || (language === 'en' ? "Signed in with Apple" : "已通过Apple登录")}
                  </Text>
                </View>
              </View>
              
              {/* Sync Status */}
              <View className="bg-background rounded-xl p-3 mb-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base">☁️</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {language === 'en' ? 'Cloud Sync' : '云端同步'}
                    </Text>
                    <Text className="text-xs text-muted mt-0.5">
                      {formatLastSyncTime()}
                    </Text>
                  </View>
                  {pendingSync && (
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.warning }} />
                  )}
                </View>
              </View>
              
              {/* Logout Button */}
              <TouchableOpacity
                onPress={handleLogout}
                className="rounded-xl p-3 flex-row items-center justify-center gap-2 border"
                style={{ borderColor: colors.border }}
                activeOpacity={0.7}
              >
                <Text className="text-base">🚪</Text>
                <Text className="text-sm font-medium text-foreground">
                  {language === 'en' ? 'Sign Out' : '退出登录'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {/* Apple Login */}
              <TouchableOpacity
                onPress={handleAppleLogin}
                disabled={loginLoading}
                className="rounded-2xl p-5 flex-row items-center justify-center gap-3"
                style={{ backgroundColor: colors.foreground }}
                activeOpacity={0.8}
              >
                {loginLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <>
                    <Text className="text-2xl"></Text>
                    <Text className="text-lg font-semibold" style={{ color: colors.background }}>
                      {t('loginWithApple')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              {/* Email Login */}
              <TouchableOpacity
                onPress={() => router.push('/email-login')}
                className="rounded-2xl p-5 flex-row items-center justify-center gap-3 border"
                style={{ borderColor: colors.border }}
                activeOpacity={0.8}
              >
                <Text className="text-2xl">✉️</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {t('emailLogin')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Cloud Sync Section - Only show when logged in */}
        {user && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              {language === 'en' ? 'Cloud Sync' : '云端同步'}
            </Text>
            <TouchableOpacity
              onPress={handleManualSync}
              disabled={syncLoading}
              className="bg-surface rounded-2xl p-5 border"
              style={{ 
                borderColor: pendingSync ? colors.warning + '50' : colors.border,
                backgroundColor: pendingSync ? colors.warning + '08' : colors.surface,
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <Text className="text-2xl">☁️</Text>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {language === 'en' ? 'Sync Data' : '同步数据'}
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      {syncLoading 
                        ? (language === 'en' ? 'Syncing...' : '同步中...') 
                        : formatLastSyncTime()
                      }
                    </Text>
                  </View>
                </View>
                {syncLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : pendingSync ? (
                  <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors.warning }} />
                ) : null}
              </View>
            </TouchableOpacity>
            <Text className="text-xs text-muted mt-2 px-2">
              {language === 'en' 
                ? 'Your journal entries are automatically synced when you login'
                : '登录后日记会自动同步到云端，支持多设备访问'
              }
            </Text>
          </View>
        )}

        {/* Font Size Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">
            {language === 'zh' ? '字体大小' : 'Font Size'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/font-size-settings');
            }}
            className="bg-surface rounded-2xl p-4 flex-row items-center justify-between border"
            style={{
              borderColor: colors.border,
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <Text style={{ fontSize: 20 }}>🔤</Text>
              <Text className="text-base text-foreground">
                {language === 'zh' ? '调整字体大小' : 'Adjust Font Size'}
              </Text>
            </View>
            <Text className="text-muted" style={{ fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">{t('language')}</Text>
          <TouchableOpacity
            onPress={handleLanguageChange}
            className="bg-surface rounded-2xl p-5 border border-border"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">🌐</Text>
                <Text className="text-base text-foreground">{t('language')}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-base text-muted">
                  {language === 'zh' ? '简体中文' : 'English'}
                </Text>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Daily Reminder Entry */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">{t('dailyReminder')}</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notification-settings');
            }}
            className="bg-surface rounded-2xl p-5 border"
            style={{ 
              borderColor: (notificationStatus.includes('Enabled') || notificationStatus.includes('已开启')) ? colors.primary + '50' : colors.border,
              backgroundColor: (notificationStatus.includes('Enabled') || notificationStatus.includes('已开启')) ? colors.primary + '08' : colors.surface,
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Text className="text-2xl">🔔</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{t('dailyReminder')}</Text>
                  <Text className="text-sm text-muted mt-1">{getLocalizedNotificationStatus()}</Text>
                </View>
              </View>
              {(notificationStatus.includes('Enabled') || notificationStatus.includes('已开启')) && (
                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />
              )}
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Statistics Card */}
        {stats && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">{t('settingsStatistics')}</Text>
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">📊</Text>
                    <Text className="text-base text-foreground">
                      {language === 'en' ? 'Total Days' : '累计完成天数'}
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-foreground">{stats.totalDays}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">🔥</Text>
                    <Text className="text-base text-foreground">
                      {language === 'en' ? 'Current Streak' : '当前连续打卡'}
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-foreground">{stats.currentStreak}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">🏆</Text>
                    <Text className="text-base text-foreground">
                      {language === 'en' ? 'Longest Streak' : '最长连续记录'}
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-foreground">{stats.longestStreak}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">📝</Text>
                    <Text className="text-base text-foreground">
                      {language === 'en' ? 'Total Entries' : '总日记数'}
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-foreground">{stats.totalEntries}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Achievements */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">{t('achievements')}</Text>
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row flex-wrap gap-4">
              {achievements.map((achievement) => (
                <TouchableOpacity
                  key={achievement.id}
                  className="items-center"
                  style={{ width: '22%' }}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center mb-2"
                    style={{
                      backgroundColor: achievement.unlocked ? colors.surface : colors.border,
                      opacity: achievement.unlocked ? 1 : 0.4,
                    }}
                  >
                    <Text className="text-3xl">{achievement.emoji}</Text>
                  </View>
                  <Text
                    className="text-xs text-center"
                    style={{ color: achievement.unlocked ? colors.foreground : colors.muted }}
                    numberOfLines={2}
                  >
                    {language === 'en' ? achievement.nameEn : achievement.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
              <Text className="text-sm text-muted text-center">
                {language === 'en' 
                  ? `Unlocked ${stats?.achievements.length || 0}/${achievements.length} achievements`
                  : `已解锁 ${stats?.achievements.length || 0}/${achievements.length} 个成就`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* About & Legal */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">{t('aboutAndLegal')}</Text>
          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/about');
              }}
              className="p-4 flex-row items-center justify-between border-b"
              style={{ borderBottomColor: colors.border }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">ℹ️</Text>
                <Text className="text-base text-foreground">{t('about')}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/terms');
              }}
              className="p-4 flex-row items-center justify-between border-b"
              style={{ borderBottomColor: colors.border }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">📄</Text>
                <Text className="text-base text-foreground">{t('terms')}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/privacy');
              }}
              className="p-4 flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-xl">🔒</Text>
                <Text className="text-base text-foreground">{t('privacy')}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">{t('dataManagement')}</Text>
          
          <TouchableOpacity
            onPress={handleClearData}
            className="bg-surface rounded-2xl border px-5 py-4 mb-3"
            style={{ borderColor: colors.warning }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center gap-3">
              <Text className="text-2xl">🗑️</Text>
              <Text className="text-base font-semibold" style={{ color: colors.warning }}>
                {t('clearData')}
              </Text>
            </View>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-surface rounded-2xl border px-5 py-4"
              style={{ borderColor: colors.error }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-center gap-3">
                <Text className="text-2xl">🚪</Text>
                <Text className="text-base font-semibold" style={{ color: colors.error }}>
                  {t('logout')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* App Info */}
        <View className="items-center py-8">
          <Text className="text-sm text-muted mb-2">{t('appName')}</Text>
          <Text className="text-xs text-muted">{t('version')} 1.0.0</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
