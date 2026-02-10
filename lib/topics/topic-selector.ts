import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyTopic } from '@/types/journal';
import { TOPICS_ZH } from './topics-zh';
import { TOPICS_EN } from './topics-en';

const TOPIC_HISTORY_KEY = 'topic_history';
const TOPIC_HISTORY_MAX_SIZE = 50; // Keep last 50 topics to avoid short-term repetition

interface TopicHistory {
  topicIds: string[];
  lastUpdated: string; // ISO date
}

/**
 * Get current season based on month
 */
function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Check if it's near a major holiday
 * Returns true if within 7 days before or 3 days after a holiday
 */
function isNearHoliday(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Major holidays (month-day)
  const holidays = [
    { month: 1, day: 1 },   // New Year
    { month: 2, day: 14 },  // Valentine's Day
    { month: 5, day: 1 },   // Labor Day
    { month: 6, day: 1 },   // Children's Day
    { month: 9, day: 10 },  // Mid-Autumn (approximate)
    { month: 10, day: 1 },  // National Day
    { month: 12, day: 25 }, // Christmas
  ];

  for (const holiday of holidays) {
    if (month === holiday.month) {
      const dayDiff = day - holiday.day;
      if (dayDiff >= -7 && dayDiff <= 3) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get topic history from storage
 */
async function getTopicHistory(): Promise<TopicHistory> {
  try {
    const json = await AsyncStorage.getItem(TOPIC_HISTORY_KEY);
    if (json) {
      return JSON.parse(json);
    }
  } catch (error) {
    console.error('Failed to load topic history:', error);
  }
  return { topicIds: [], lastUpdated: new Date().toISOString() };
}

/**
 * Save topic history to storage
 */
async function saveTopicHistory(history: TopicHistory): Promise<void> {
  try {
    await AsyncStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save topic history:', error);
  }
}

/**
 * Add topics to history
 */
async function addToHistory(topicIds: string[]): Promise<void> {
  const history = await getTopicHistory();
  history.topicIds = [...topicIds, ...history.topicIds].slice(0, TOPIC_HISTORY_MAX_SIZE);
  history.lastUpdated = new Date().toISOString();
  await saveTopicHistory(history);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select 5 daily topics with smart algorithm
 * - Prioritize seasonal topics if applicable
 * - Prioritize holiday topics if near a holiday
 * - Avoid recently shown topics
 * - Mix gratitude and philosophy topics (4:1 ratio)
 */
export async function selectDailyTopics(language: 'zh' | 'en' = 'zh'): Promise<DailyTopic[]> {
  const allTopics = language === 'zh' ? TOPICS_ZH : TOPICS_EN;
  const history = await getTopicHistory();
  const currentSeason = getCurrentSeason();
  const nearHoliday = isNearHoliday();

  // Separate topics by category
  const gratitudeTopics = allTopics.filter(t => t.category !== 'philosophy');
  const philosophyTopics = allTopics.filter(t => t.category === 'philosophy');

  // Filter out recently shown topics
  const recentIds = new Set(history.topicIds);
  const availableGratitude = gratitudeTopics.filter(t => !recentIds.has(t.id));
  const availablePhilosophy = philosophyTopics.filter(t => !recentIds.has(t.id));

  // If we've shown too many topics, reset history
  if (availableGratitude.length < 20 || availablePhilosophy.length < 5) {
    await saveTopicHistory({ topicIds: [], lastUpdated: new Date().toISOString() });
    return selectDailyTopics(language); // Retry with fresh history
  }

  // Prioritize seasonal and holiday topics
  let seasonalTopics: DailyTopic[] = [];
  if (nearHoliday) {
    seasonalTopics = availableGratitude.filter(t => t.category === 'season');
  } else {
    seasonalTopics = availableGratitude.filter(
      t => t.season === currentSeason || (t.category === 'season' && t.season === 'all')
    );
  }

  // Select topics
  const selected: DailyTopic[] = [];

  // 1. Add 1-2 seasonal/holiday topics if available
  if (seasonalTopics.length > 0) {
    const shuffledSeasonal = shuffleArray(seasonalTopics);
    selected.push(...shuffledSeasonal.slice(0, Math.min(2, seasonalTopics.length)));
  }

  // 2. Add 1 philosophy topic
  const shuffledPhilosophy = shuffleArray(availablePhilosophy);
  selected.push(shuffledPhilosophy[0]);

  // 3. Fill remaining slots with gratitude topics
  const remainingGratitude = availableGratitude.filter(
    t => !selected.find(s => s.id === t.id)
  );
  const shuffledGratitude = shuffleArray(remainingGratitude);
  selected.push(...shuffledGratitude.slice(0, 5 - selected.length));

  // Shuffle final selection
  const finalSelection = shuffleArray(selected).slice(0, 5);

  // Save to history
  await addToHistory(finalSelection.map(t => t.id));

  return finalSelection;
}

/**
 * Get a random topic (for AI generation fallback)
 */
export function getRandomTopic(language: 'zh' | 'en' = 'zh'): DailyTopic {
  const allTopics = language === 'zh' ? TOPICS_ZH : TOPICS_EN;
  const randomIndex = Math.floor(Math.random() * allTopics.length);
  return allTopics[randomIndex];
}

/**
 * Get topics by category
 */
export function getTopicsByCategory(
  category: string,
  language: 'zh' | 'en' = 'zh'
): DailyTopic[] {
  const allTopics = language === 'zh' ? TOPICS_ZH : TOPICS_EN;
  return allTopics.filter(t => t.category === category);
}

/**
 * Search topics by keyword
 */
export function searchTopics(
  keyword: string,
  language: 'zh' | 'en' = 'zh'
): DailyTopic[] {
  const allTopics = language === 'zh' ? TOPICS_ZH : TOPICS_EN;
  const lowerKeyword = keyword.toLowerCase();
  return allTopics.filter(t => t.text.toLowerCase().includes(lowerKeyword));
}
