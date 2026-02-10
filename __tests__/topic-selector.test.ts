import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { selectDailyTopics, getRandomTopic, getTopicsByCategory, searchTopics } from '@/lib/topics/topic-selector';
import { TOPICS_ZH } from '@/lib/topics/topics-zh';
import { TOPICS_EN } from '@/lib/topics/topics-en';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe('Topic Selector', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Reset AsyncStorage mock
    (AsyncStorage.getItem as any).mockResolvedValue(null);
    (AsyncStorage.setItem as any).mockResolvedValue(undefined);
  });

  describe('selectDailyTopics', () => {
    it('should return 5 topics', async () => {
      const topics = await selectDailyTopics('zh');
      expect(topics).toHaveLength(5);
    });

    it('should return topics with valid structure', async () => {
      const topics = await selectDailyTopics('zh');
      topics.forEach(topic => {
        expect(topic).toHaveProperty('id');
        expect(topic).toHaveProperty('text');
        expect(topic).toHaveProperty('category');
        expect(topic).toHaveProperty('season');
        expect(typeof topic.id).toBe('string');
        expect(typeof topic.text).toBe('string');
        expect(typeof topic.category).toBe('string');
      });
    });

    it('should return English topics when language is en', async () => {
      const topics = await selectDailyTopics('en');
      expect(topics).toHaveLength(5);
      // Check if topics are from English database
      const allEnglishIds = TOPICS_EN.map(t => t.id);
      topics.forEach(topic => {
        expect(allEnglishIds).toContain(topic.id);
      });
    });

    it('should return Chinese topics when language is zh', async () => {
      const topics = await selectDailyTopics('zh');
      expect(topics).toHaveLength(5);
      // Check if topics are from Chinese database
      const allChineseIds = TOPICS_ZH.map(t => t.id);
      topics.forEach(topic => {
        expect(allChineseIds).toContain(topic.id);
      });
    });

    it('should avoid recently shown topics', async () => {
      // Mock history with some topic IDs
      const recentIds = ['1', '2', '3', '4', '5'];
      (AsyncStorage.getItem as any).mockResolvedValue(
        JSON.stringify({ topicIds: recentIds, lastUpdated: new Date().toISOString() })
      );

      const topics = await selectDailyTopics('zh');
      
      // Verify no recently shown topics are returned
      topics.forEach(topic => {
        expect(recentIds).not.toContain(topic.id);
      });
    });

    it('should include at least 1 philosophy topic', async () => {
      const topics = await selectDailyTopics('zh');
      const philosophyCount = topics.filter(t => t.category === 'philosophy').length;
      expect(philosophyCount).toBeGreaterThanOrEqual(1);
    });

    it('should save selected topics to history', async () => {
      await selectDailyTopics('zh');
      
      // Verify setItem was called
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      // Verify the saved data structure
      const savedData = (AsyncStorage.setItem as any).mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed).toHaveProperty('topicIds');
      expect(parsed).toHaveProperty('lastUpdated');
      expect(Array.isArray(parsed.topicIds)).toBe(true);
      expect(parsed.topicIds).toHaveLength(5);
    });
  });

  describe('getRandomTopic', () => {
    it('should return a single topic', () => {
      const topic = getRandomTopic('zh');
      expect(topic).toBeDefined();
      expect(topic).toHaveProperty('id');
      expect(topic).toHaveProperty('text');
      expect(topic).toHaveProperty('category');
    });

    it('should return topics from correct language', () => {
      const zhTopic = getRandomTopic('zh');
      const enTopic = getRandomTopic('en');
      
      const allChineseIds = TOPICS_ZH.map(t => t.id);
      const allEnglishIds = TOPICS_EN.map(t => t.id);
      
      expect(allChineseIds).toContain(zhTopic.id);
      expect(allEnglishIds).toContain(enTopic.id);
    });
  });

  describe('getTopicsByCategory', () => {
    it('should return topics from specified category', () => {
      const philosophyTopics = getTopicsByCategory('philosophy', 'zh');
      expect(philosophyTopics.length).toBeGreaterThan(0);
      philosophyTopics.forEach(topic => {
        expect(topic.category).toBe('philosophy');
      });
    });

    it('should return empty array for non-existent category', () => {
      const topics = getTopicsByCategory('nonexistent', 'zh');
      expect(topics).toEqual([]);
    });

    it('should work for both languages', () => {
      const zhTopics = getTopicsByCategory('people', 'zh');
      const enTopics = getTopicsByCategory('people', 'en');
      
      expect(zhTopics.length).toBeGreaterThan(0);
      expect(enTopics.length).toBeGreaterThan(0);
    });
  });

  describe('searchTopics', () => {
    it('should find topics containing keyword', () => {
      const results = searchTopics('感恩', 'zh');
      expect(results.length).toBeGreaterThan(0);
      results.forEach(topic => {
        expect(topic.text.toLowerCase()).toContain('感恩');
      });
    });

    it('should be case-insensitive', () => {
      const lowerResults = searchTopics('grateful', 'en');
      const upperResults = searchTopics('GRATEFUL', 'en');
      
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should return empty array when no matches', () => {
      const results = searchTopics('xyzabc123', 'zh');
      expect(results).toEqual([]);
    });
  });

  describe('Topic Database Integrity', () => {
    it('should have 201 Chinese topics', () => {
      expect(TOPICS_ZH).toHaveLength(201);
    });

    it('should have 201 English topics', () => {
      expect(TOPICS_EN).toHaveLength(201);
    });

    it('should have unique IDs in Chinese database', () => {
      const ids = TOPICS_ZH.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique IDs in English database', () => {
      const ids = TOPICS_EN.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have at least 50 philosophy topics in Chinese', () => {
      const philosophyTopics = TOPICS_ZH.filter(t => t.category === 'philosophy');
      expect(philosophyTopics.length).toBeGreaterThanOrEqual(50);
    });

    it('should have at least 50 philosophy topics in English', () => {
      const philosophyTopics = TOPICS_EN.filter(t => t.category === 'philosophy');
      expect(philosophyTopics.length).toBeGreaterThanOrEqual(50);
    });

    it('should have seasonal topics', () => {
      const seasonalZh = TOPICS_ZH.filter(t => t.category === 'season');
      const seasonalEn = TOPICS_EN.filter(t => t.category === 'season');
      
      expect(seasonalZh.length).toBeGreaterThan(0);
      expect(seasonalEn.length).toBeGreaterThan(0);
    });
  });
});
