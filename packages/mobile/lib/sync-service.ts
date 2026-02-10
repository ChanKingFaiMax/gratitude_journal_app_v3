import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJournalEntries, saveJournalEntry } from './storage';
import { getUserStats, saveUserStats } from './stats-service';
import type { JournalEntry } from '@awaken/shared/types/journal';
import type { UserStats } from '@awaken/shared/types/stats';

const SYNC_KEYS = {
  LAST_SYNC: 'last_sync_timestamp',
  SYNC_PENDING: 'sync_pending',
};

/**
 * Check if there are pending changes to sync
 */
export async function hasPendingSync(): Promise<boolean> {
  try {
    const pending = await AsyncStorage.getItem(SYNC_KEYS.SYNC_PENDING);
    return pending === 'true';
  } catch (error) {
    console.error('[Sync] Error checking pending sync:', error);
    return false;
  }
}

/**
 * Mark that there are changes pending sync
 */
export async function markPendingSync(): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_KEYS.SYNC_PENDING, 'true');
  } catch (error) {
    console.error('[Sync] Error marking pending sync:', error);
  }
}

/**
 * Clear pending sync flag
 */
export async function clearPendingSync(): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_KEYS.SYNC_PENDING, 'false');
  } catch (error) {
    console.error('[Sync] Error clearing pending sync:', error);
  }
}

/**
 * Get the last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('[Sync] Error getting last sync time:', error);
    return null;
  }
}

/**
 * Update the last sync timestamp
 */
export async function updateLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_KEYS.LAST_SYNC, Date.now().toString());
    await clearPendingSync();
  } catch (error) {
    console.error('[Sync] Error updating last sync time:', error);
  }
}

/**
 * Transform local entries to sync format
 */
export function transformEntriesToSyncFormat(localEntries: JournalEntry[]) {
  return localEntries.map(entry => ({
    localId: entry.id,
    topic: entry.topic,
    content: entry.content,
    source: entry.source || 'gratitude' as const,
    language: 'zh',
    localCreatedAt: new Date(entry.createdAt).toISOString(),
    localUpdatedAt: new Date(entry.createdAt).toISOString(),
  }));
}

/**
 * Transform cloud entry to local format
 */
export function transformCloudEntryToLocal(cloudEntry: {
  id: number;
  localId: string | null;
  topic: string;
  content: string;
  source: 'gratitude' | 'philosophy' | 'free';
  createdAt: Date;
  localCreatedAt: Date | null;
}): JournalEntry {
  const localId = cloudEntry.localId || `cloud_${cloudEntry.id}`;
  return {
    id: localId,
    date: cloudEntry.createdAt ? new Date(cloudEntry.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    topic: cloudEntry.topic,
    content: cloudEntry.content,
    wordCount: cloudEntry.content.length,
    createdAt: cloudEntry.localCreatedAt ? new Date(cloudEntry.localCreatedAt).getTime() : new Date(cloudEntry.createdAt).getTime(),
    source: cloudEntry.source,
  };
}

/**
 * Merge cloud entries with local entries
 * Returns new entries that need to be added locally
 */
export async function mergeCloudEntries(cloudEntries: Array<{
  id: number;
  localId: string | null;
  topic: string;
  content: string;
  source: 'gratitude' | 'philosophy' | 'free';
  createdAt: Date;
  localCreatedAt: Date | null;
}>): Promise<number> {
  const localEntries = await getJournalEntries();
  const localIds = new Set(localEntries.map(e => e.id));
  
  let newEntriesCount = 0;
  
  for (const cloudEntry of cloudEntries) {
    const localId = cloudEntry.localId || `cloud_${cloudEntry.id}`;
    
    if (!localIds.has(localId)) {
      const newEntry = transformCloudEntryToLocal(cloudEntry);
      await saveJournalEntry(newEntry);
      newEntriesCount++;
    }
  }
  
  return newEntriesCount;
}

/**
 * Transform local stats to sync format
 */
export function transformStatsToSyncFormat(localStats: UserStats) {
  return {
    totalEntries: localStats.totalEntries,
    currentStreak: localStats.currentStreak,
    longestStreak: localStats.longestStreak,
    lastEntryDate: localStats.lastCompletedDate,
    achievements: localStats.achievements,
  };
}

/**
 * Merge cloud stats with local stats
 */
export async function mergeCloudStats(cloudStats: {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
}): Promise<void> {
  const localStats = await getUserStats();
  
  // Merge stats - take the maximum values
  const mergedStats: UserStats = {
    totalDays: localStats.totalDays, // Keep local as it's calculated
    totalEntries: Math.max(localStats.totalEntries, cloudStats.totalEntries),
    longestStreak: Math.max(localStats.longestStreak, cloudStats.longestStreak),
    currentStreak: Math.max(localStats.currentStreak, cloudStats.currentStreak),
    lastCompletedDate: cloudStats.lastEntryDate || localStats.lastCompletedDate,
    todayCount: localStats.todayCount, // Keep local
    achievements: localStats.achievements, // Keep local achievements
    firstEntryDate: localStats.firstEntryDate, // Keep local
  };
  
  await saveUserStats(mergedStats);
}

/**
 * Get all local entries for syncing
 */
export async function getLocalEntriesForSync() {
  const localEntries = await getJournalEntries();
  return transformEntriesToSyncFormat(localEntries);
}

/**
 * Get local stats for syncing
 */
export async function getLocalStatsForSync() {
  const localStats = await getUserStats();
  return transformStatsToSyncFormat(localStats);
}
