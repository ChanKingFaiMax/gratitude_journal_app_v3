import AsyncStorage from '@react-native-async-storage/async-storage';

const COOLDOWN_KEY = 'review_analysis_cooldown';
const COOLDOWN_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export interface CooldownStatus {
  canRefresh: boolean;
  remainingTime: number; // in milliseconds
  lastRefreshTime: number | null;
}

/**
 * Get the current cooldown status
 */
export async function getCooldownStatus(): Promise<CooldownStatus> {
  try {
    const lastRefreshStr = await AsyncStorage.getItem(COOLDOWN_KEY);
    
    if (!lastRefreshStr) {
      return {
        canRefresh: true,
        remainingTime: 0,
        lastRefreshTime: null,
      };
    }
    
    const lastRefreshTime = parseInt(lastRefreshStr, 10);
    const now = Date.now();
    const elapsed = now - lastRefreshTime;
    const remaining = COOLDOWN_DURATION - elapsed;
    
    if (remaining <= 0) {
      return {
        canRefresh: true,
        remainingTime: 0,
        lastRefreshTime,
      };
    }
    
    return {
      canRefresh: false,
      remainingTime: remaining,
      lastRefreshTime,
    };
  } catch (error) {
    console.error('Error getting cooldown status:', error);
    return {
      canRefresh: true,
      remainingTime: 0,
      lastRefreshTime: null,
    };
  }
}

/**
 * Record a new refresh time
 */
export async function recordRefresh(): Promise<void> {
  try {
    const now = Date.now();
    await AsyncStorage.setItem(COOLDOWN_KEY, now.toString());
  } catch (error) {
    console.error('Error recording refresh:', error);
  }
}

/**
 * Format remaining time to human-readable string
 */
export function formatRemainingTime(ms: number, language: 'zh' | 'en'): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  
  if (language === 'en') {
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  } else {
    if (hours > 0 && minutes > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时`;
    } else {
      return `${minutes}分钟`;
    }
  }
}
