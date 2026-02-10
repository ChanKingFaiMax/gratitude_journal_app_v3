import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, UserSettings } from '@/types/journal';

const KEYS = {
  ENTRIES: 'journal_entries',
  SETTINGS: 'user_settings',
  LAST_TOPICS: 'last_topics',
};

// Journal Entries
export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  try {
    const entries = await getJournalEntries();
    const existingIndex = entries.findIndex(e => e.id === entry.id);
    
    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }
    
    // Sort by date descending
    entries.sort((a, b) => b.createdAt - a.createdAt);
    
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving journal entry:', error);
    throw error;
  }
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return [];
  }
}

export async function getJournalEntryById(id: string): Promise<JournalEntry | null> {
  try {
    const entries = await getJournalEntries();
    return entries.find(e => e.id === id) || null;
  } catch (error) {
    console.error('Error getting journal entry by id:', error);
    return null;
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  try {
    const entries = await getJournalEntries();
    const filtered = entries.filter(e => e.id !== id);
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
}

export async function getEntriesByDateRange(startDate: string, endDate: string): Promise<JournalEntry[]> {
  try {
    const entries = await getJournalEntries();
    return entries.filter(e => e.date >= startDate && e.date <= endDate);
  } catch (error) {
    console.error('Error getting entries by date range:', error);
    return [];
  }
}

// User Settings
export async function saveUserSettings(settings: UserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
}

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
    // Default settings
    return {
      reminderTime: '20:00',
      notificationsEnabled: true,
      theme: 'auto',
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    return {
      reminderTime: '20:00',
      notificationsEnabled: true,
      theme: 'auto',
    };
  }
}

// Personalized Topics Cache
const PERSONALIZED_TOPICS_KEY = 'personalized_topics';

export async function cachePersonalizedTopics(topics: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PERSONALIZED_TOPICS_KEY, JSON.stringify({
      topics,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error caching personalized topics:', error);
  }
}

export async function getCachedPersonalizedTopics(): Promise<any[] | null> {
  try {
    const data = await AsyncStorage.getItem(PERSONALIZED_TOPICS_KEY);
    if (!data) return null;
    
    const { topics, timestamp } = JSON.parse(data);
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000; // Cache for 4 hours
    
    // Return cached topics if less than 4 hours old
    if (now - timestamp < fourHours) {
      return topics;
    }
    return null;
  } catch (error) {
    console.error('Error getting cached personalized topics:', error);
    return null;
  }
}

export async function clearPersonalizedTopicsCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PERSONALIZED_TOPICS_KEY);
  } catch (error) {
    console.error('Error clearing personalized topics cache:', error);
  }
}

// Daily Topics Cache
export async function cacheTopics(topics: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_TOPICS, JSON.stringify({
      topics,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error caching topics:', error);
  }
}

export async function getCachedTopics(): Promise<any[] | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.LAST_TOPICS);
    if (!data) return null;
    
    const { topics, timestamp } = JSON.parse(data);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Return cached topics if less than 1 day old
    if (now - timestamp < oneDay) {
      return topics;
    }
    return null;
  } catch (error) {
    console.error('Error getting cached topics:', error);
    return null;
  }
}
