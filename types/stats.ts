export interface UserStats {
  // 基础统计
  totalDays: number;           // 累计完成天数(完成3篇的天数)
  totalEntries: number;        // 总日记数
  longestStreak: number;       // 历史最长连续天数
  
  // 当前状态
  currentStreak: number;       // 当前连续天数
  lastCompletedDate: string;   // 最后完成日期(YYYY-MM-DD)
  todayCount: number;          // 今天已写日记数
  
  // 成就
  achievements: string[];      // 已解锁成就ID列表
  
  // 首次使用
  firstEntryDate: string;      // 第一篇日记的日期
}

export interface Achievement {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: number;         // 解锁时间戳
}

export const ACHIEVEMENT_DEFINITIONS: Record<string, Omit<Achievement, 'unlocked' | 'unlockedAt'>> = {
  first_entry: {
    id: 'first_entry',
    name: '初心者',
    nameEn: 'First Step',
    description: '完成第1篇日记',
    descriptionEn: 'Complete 1st entry',
    emoji: '🌱',
  },
  daily_star: {
    id: 'daily_star',
    name: '每日之星',
    nameEn: 'Daily Star',
    description: '单日完成3篇',
    descriptionEn: 'Complete 3 entries in one day',
    emoji: '⭐',
  },
  week_warrior: {
    id: 'week_warrior',
    name: '一周战士',
    nameEn: 'Week Warrior',
    description: '连续7天',
    descriptionEn: '7-day streak',
    emoji: '🔥',
  },
  month_hero: {
    id: 'month_hero',
    name: '月度勇者',
    nameEn: 'Month Hero',
    description: '连续30天',
    descriptionEn: '30-day streak',
    emoji: '💪',
  },
  hundred_legend: {
    id: 'hundred_legend',
    name: '百日传奇',
    nameEn: 'Hundred Legend',
    description: '连续100天',
    descriptionEn: '100-day streak',
    emoji: '💎',
  },
  prolific_writer: {
    id: 'prolific_writer',
    name: '多产作家',
    nameEn: 'Prolific Writer',
    description: '累计100篇',
    descriptionEn: '100 total entries',
    emoji: '📚',
  },
  perfectionist: {
    id: 'perfectionist',
    name: '完美主义',
    nameEn: 'Perfectionist',
    description: '连续30天每天3篇',
    descriptionEn: '30 days, 3 entries each',
    emoji: '🎯',
  },
  gratitude_master: {
    id: 'gratitude_master',
    name: '感恩大师',
    nameEn: 'Gratitude Master',
    description: '累计365篇',
    descriptionEn: '365 total entries',
    emoji: '🌈',
  },
};
