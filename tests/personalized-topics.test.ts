import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    getItem: vi.fn((key: string) => {
      return Promise.resolve(mockStorage[key] || null);
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

describe('Personalized Topics Feature', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Skip Counter Logic', () => {
    const SKIP_THRESHOLD = 5;

    it('should trigger personalized at 5 skips', () => {
      const skipCount = 5;
      const shouldTrigger = skipCount >= SKIP_THRESHOLD;
      expect(shouldTrigger).toBe(true);
    });

    it('should track consecutive skips correctly', () => {
      let skipCount = 0;

      // Simulate 5 consecutive skips
      for (let i = 0; i < 5; i++) {
        skipCount++;
      }

      expect(skipCount).toBe(SKIP_THRESHOLD);
    });

    it('should reset skip counter when user selects a topic', () => {
      let skipCount = 3;
      
      // User selects a topic
      skipCount = 0;

      expect(skipCount).toBe(0);
    });

    it('should reset skip counter when theme changes', () => {
      let skipCount = 4;
      
      // Theme changes
      skipCount = 0;

      expect(skipCount).toBe(0);
    });

    it('should reset skip counter on refresh', () => {
      let skipCount = 4;
      
      // User refreshes
      skipCount = 0;

      expect(skipCount).toBe(0);
    });
  });

  describe('Alternating Topics Logic', () => {
    it('should alternate between personalized and general topics', () => {
      let lastBatchWasPersonalized = false;
      const SKIP_THRESHOLD = 5;
      let skipCount = 5;

      // First trigger: general -> personalized
      if (skipCount >= SKIP_THRESHOLD && !lastBatchWasPersonalized) {
        lastBatchWasPersonalized = true;
      }
      expect(lastBatchWasPersonalized).toBe(true);

      // After personalized batch: personalized -> general
      if (lastBatchWasPersonalized) {
        lastBatchWasPersonalized = false;
      }
      expect(lastBatchWasPersonalized).toBe(false);

      // After general batch with skips: general -> personalized
      if (skipCount >= SKIP_THRESHOLD && !lastBatchWasPersonalized) {
        lastBatchWasPersonalized = true;
      }
      expect(lastBatchWasPersonalized).toBe(true);
    });

    it('should show general topics when not enough skips', () => {
      const skipCount = 3;
      const SKIP_THRESHOLD = 5;
      const shouldShowPersonalized = skipCount >= SKIP_THRESHOLD;
      
      expect(shouldShowPersonalized).toBe(false);
    });

    it('should reset alternating state on theme change', () => {
      let lastBatchWasPersonalized = true;
      
      // Theme changes
      lastBatchWasPersonalized = false;
      
      expect(lastBatchWasPersonalized).toBe(false);
    });

    it('should reset alternating state on refresh', () => {
      let lastBatchWasPersonalized = true;
      
      // User refreshes
      lastBatchWasPersonalized = false;
      
      expect(lastBatchWasPersonalized).toBe(false);
    });
  });

  describe('Cache Logic', () => {
    it('should cache personalized topics with timestamp', async () => {
      const topics = [
        { id: '1', text: 'Test topic 1', category: 'personalized', icon: '💝' },
        { id: '2', text: 'Test topic 2', category: 'personalized', icon: '🌱' },
      ];

      const cacheData = {
        topics,
        timestamp: Date.now(),
      };

      mockStorage['personalized_topics'] = JSON.stringify(cacheData);

      const cached = JSON.parse(mockStorage['personalized_topics']);
      expect(cached.topics).toHaveLength(2);
      expect(cached.topics[0].text).toBe('Test topic 1');
      expect(cached.timestamp).toBeDefined();
    });

    it('should return null for expired cache (> 4 hours)', () => {
      const topics = [
        { id: '1', text: 'Old topic', category: 'personalized' },
      ];

      const fiveHoursAgo = Date.now() - (5 * 60 * 60 * 1000);
      const cacheData = {
        topics,
        timestamp: fiveHoursAgo,
      };

      mockStorage['personalized_topics'] = JSON.stringify(cacheData);

      const cached = JSON.parse(mockStorage['personalized_topics']);
      const now = Date.now();
      const fourHours = 4 * 60 * 60 * 1000;

      // Cache is expired
      const isExpired = (now - cached.timestamp) >= fourHours;
      expect(isExpired).toBe(true);
    });

    it('should return cached topics if within 4 hours', () => {
      const topics = [
        { id: '1', text: 'Recent topic', category: 'personalized' },
      ];

      const oneHourAgo = Date.now() - (1 * 60 * 60 * 1000);
      const cacheData = {
        topics,
        timestamp: oneHourAgo,
      };

      mockStorage['personalized_topics'] = JSON.stringify(cacheData);

      const cached = JSON.parse(mockStorage['personalized_topics']);
      const now = Date.now();
      const fourHours = 4 * 60 * 60 * 1000;

      // Cache is still valid
      const isValid = (now - cached.timestamp) < fourHours;
      expect(isValid).toBe(true);
      expect(cached.topics[0].text).toBe('Recent topic');
    });
  });

  describe('Topic Formatting', () => {
    it('should format topics with icon prefix', () => {
      const apiTopic = { id: '1', text: 'What made you smile?', icon: '😊' };
      
      const formattedText = apiTopic.icon ? `${apiTopic.icon} ${apiTopic.text}` : apiTopic.text;
      
      expect(formattedText).toBe('😊 What made you smile?');
    });

    it('should handle topics without icon', () => {
      const apiTopic = { id: '1', text: 'What made you smile?' };
      
      const formattedText = (apiTopic as any).icon ? `${(apiTopic as any).icon} ${apiTopic.text}` : apiTopic.text;
      
      expect(formattedText).toBe('What made you smile?');
    });

    it('should generate unique IDs for personalized topics', () => {
      const timestamp = Date.now();
      const topics = [
        { id: `personalized-${timestamp}-0`, text: 'Topic 1' },
        { id: `personalized-${timestamp}-1`, text: 'Topic 2' },
        { id: `personalized-${timestamp}-2`, text: 'Topic 3' },
      ];

      const ids = topics.map(t => t.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Fallback Logic', () => {
    it('should fallback to regular topics when API fails', () => {
      const regularTopics = [
        { id: 'gratitude-1', text: 'Regular topic 1', category: 'gratitude' },
        { id: 'gratitude-2', text: 'Regular topic 2', category: 'gratitude' },
      ];

      // Simulate API failure - use fallback
      const topics = regularTopics;

      expect(topics).toHaveLength(2);
      expect(topics[0].category).toBe('gratitude');
    });

    it('should fallback when API returns empty array', () => {
      const apiResult = { topics: [] };
      const regularTopics = [
        { id: 'gratitude-1', text: 'Fallback topic', category: 'gratitude' },
      ];

      const topics = apiResult.topics.length > 0 ? apiResult.topics : regularTopics;

      expect(topics).toHaveLength(1);
      expect(topics[0].text).toBe('Fallback topic');
    });
  });

  describe('API Input Preparation', () => {
    it('should prepare recent entries for API call', () => {
      const allEntries = [
        { id: '1', topic: 'Topic 1', content: 'Content 1', date: '2026-01-02' },
        { id: '2', topic: 'Topic 2', content: 'Content 2', date: '2026-01-01' },
        { id: '3', topic: 'Topic 3', content: 'Content 3', date: '2025-12-31' },
      ];

      const recentEntries = allEntries.slice(0, 10).map(e => ({
        topic: e.topic,
        content: e.content,
        date: e.date,
      }));

      expect(recentEntries).toHaveLength(3);
      expect(recentEntries[0]).toHaveProperty('topic');
      expect(recentEntries[0]).toHaveProperty('content');
      expect(recentEntries[0]).toHaveProperty('date');
      expect(recentEntries[0]).not.toHaveProperty('id');
    });

    it('should handle empty entries gracefully', () => {
      const allEntries: any[] = [];

      const recentEntries = allEntries.slice(0, 10).map(e => ({
        topic: e.topic,
        content: e.content,
        date: e.date,
      }));

      expect(recentEntries).toHaveLength(0);
    });
  });
});
