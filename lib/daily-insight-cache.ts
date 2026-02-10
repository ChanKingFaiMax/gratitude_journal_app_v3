import AsyncStorage from '@react-native-async-storage/async-storage';

const INSIGHT_CACHE_KEY = 'daily_insight_cache';

interface CachedInsight {
  date: string; // YYYY-MM-DD format
  insight: any;
  timestamp: number;
}

/**
 * Get cached insight for today
 * Returns null if no cache or cache is from a different day
 */
export async function getCachedInsight(): Promise<any | null> {
  try {
    const cached = await AsyncStorage.getItem(INSIGHT_CACHE_KEY);
    if (!cached) return null;

    const data: CachedInsight = JSON.parse(cached);
    const today = new Date().toISOString().split('T')[0];

    // Check if cache is from today
    if (data.date === today) {
      return data.insight;
    }

    // Cache is from a different day, clear it
    await clearInsightCache();
    return null;
  } catch (error) {
    console.error('Failed to get cached insight:', error);
    return null;
  }
}

/**
 * Save insight to cache for today
 */
export async function cacheInsight(insight: any): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data: CachedInsight = {
      date: today,
      insight,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(INSIGHT_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to cache insight:', error);
  }
}

/**
 * Clear insight cache
 */
export async function clearInsightCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(INSIGHT_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear insight cache:', error);
  }
}

/**
 * Check if insight has been generated today
 */
export async function hasInsightToday(): Promise<boolean> {
  const cached = await getCachedInsight();
  return cached !== null;
}
