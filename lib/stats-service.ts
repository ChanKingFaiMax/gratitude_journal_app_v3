import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStats, ACHIEVEMENT_DEFINITIONS } from '@/types/stats';
import { getJournalEntries } from './storage';

const STATS_KEY = 'user_stats';

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Default stats
    return {
      totalDays: 0,
      totalEntries: 0,
      longestStreak: 0,
      currentStreak: 0,
      lastCompletedDate: '',
      todayCount: 0,
      achievements: [],
      firstEntryDate: '',
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalDays: 0,
      totalEntries: 0,
      longestStreak: 0,
      currentStreak: 0,
      lastCompletedDate: '',
      todayCount: 0,
      achievements: [],
      firstEntryDate: '',
    };
  }
}

/**
 * Save user statistics
 */
export async function saveUserStats(stats: UserStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
}

/**
 * Update statistics after saving a journal entry
 */
export async function updateStatsAfterEntry(date: string): Promise<{
  stats: UserStats;
  newAchievements: string[];
  completedToday: boolean;
}> {
  const stats = await getUserStats();
  const entries = await getJournalEntries();
  const today = new Date().toISOString().split('T')[0];
  
  // Update total entries
  stats.totalEntries = entries.length;
  
  // Set first entry date
  if (!stats.firstEntryDate && entries.length > 0) {
    stats.firstEntryDate = date;
  }
  
  // Count today's entries
  const todayEntries = entries.filter(e => e.date === today);
  stats.todayCount = todayEntries.length;
  
  // Check if today is completed (3 entries)
  const completedToday = stats.todayCount >= 3;
  
  // Calculate completed days
  const completedDates = new Set<string>();
  const dateEntryCounts: Record<string, number> = {};
  
  entries.forEach(entry => {
    dateEntryCounts[entry.date] = (dateEntryCounts[entry.date] || 0) + 1;
  });
  
  Object.entries(dateEntryCounts).forEach(([date, count]) => {
    if (count >= 3) {
      completedDates.add(date);
    }
  });
  
  stats.totalDays = completedDates.size;
  
  // Calculate streak
  if (completedToday && !completedDates.has(stats.lastCompletedDate)) {
    // Just completed today for the first time
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (completedDates.has(yesterdayStr)) {
      // Continue streak
      stats.currentStreak += 1;
    } else if (stats.lastCompletedDate === '') {
      // First completion ever
      stats.currentStreak = 1;
    } else {
      // Streak broken, restart
      stats.currentStreak = 1;
    }
    
    stats.lastCompletedDate = today;
    
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
  }
  
  // Check for new achievements
  const oldAchievements = new Set(stats.achievements);
  const newAchievements: string[] = [];
  
  // First entry
  if (stats.totalEntries >= 1 && !oldAchievements.has('first_entry')) {
    stats.achievements.push('first_entry');
    newAchievements.push('first_entry');
  }
  
  // Daily star
  if (completedToday && !oldAchievements.has('daily_star')) {
    stats.achievements.push('daily_star');
    newAchievements.push('daily_star');
  }
  
  // Week warrior
  if (stats.currentStreak >= 7 && !oldAchievements.has('week_warrior')) {
    stats.achievements.push('week_warrior');
    newAchievements.push('week_warrior');
  }
  
  // Month hero
  if (stats.currentStreak >= 30 && !oldAchievements.has('month_hero')) {
    stats.achievements.push('month_hero');
    newAchievements.push('month_hero');
  }
  
  // Hundred legend
  if (stats.currentStreak >= 100 && !oldAchievements.has('hundred_legend')) {
    stats.achievements.push('hundred_legend');
    newAchievements.push('hundred_legend');
  }
  
  // Prolific writer
  if (stats.totalEntries >= 100 && !oldAchievements.has('prolific_writer')) {
    stats.achievements.push('prolific_writer');
    newAchievements.push('prolific_writer');
  }
  
  // Perfectionist (30 days streak with 3 entries each)
  if (stats.currentStreak >= 30 && stats.totalDays >= 30 && !oldAchievements.has('perfectionist')) {
    stats.achievements.push('perfectionist');
    newAchievements.push('perfectionist');
  }
  
  // Gratitude master
  if (stats.totalEntries >= 365 && !oldAchievements.has('gratitude_master')) {
    stats.achievements.push('gratitude_master');
    newAchievements.push('gratitude_master');
  }
  
  await saveUserStats(stats);
  
  return {
    stats,
    newAchievements,
    completedToday,
  };
}

/**
 * Get streak level info
 */
export function getStreakLevel(streak: number, language?: string): {
  level: string;
  emoji: string;
  color: string;
} {
  const isEn = language === 'en';
  if (streak >= 100) {
    return { level: isEn ? 'Legendary Master' : '传奇大师', emoji: '💎', color: '#A78BFA' };
  } else if (streak >= 30) {
    return { level: isEn ? 'Diamond Streak' : '钻石坚持', emoji: '🔥🔥🔥', color: '#3B82F6' };
  } else if (streak >= 7) {
    return { level: isEn ? 'Burning Heart' : '燃烧之心', emoji: '🔥🔥', color: '#EF4444' };
  } else if (streak >= 1) {
    return { level: isEn ? 'New Flame' : '新手火焰', emoji: '🔥', color: '#FF8C42' };
  }
  return { level: isEn ? 'Not Started' : '未开始', emoji: '⚪', color: '#9CA3AF' };
}
