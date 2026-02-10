/**
 * Wisdom Bookmark Feature QA Test
 * 
 * Tests the complete bookmark/save functionality for wisdom cards:
 * 1. Saving wisdom from writing inspiration panel
 * 2. Saving wisdom from masters summary page
 * 3. Viewing saved wisdom collection
 * 4. Unsaving wisdom
 * 5. Navigation to source entry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => {
      const store = (global as any).__ASYNC_STORAGE__ || {};
      return store[key] || null;
    }),
    setItem: vi.fn(async (key: string, value: string) => {
      const store = (global as any).__ASYNC_STORAGE__ || {};
      store[key] = value;
      (global as any).__ASYNC_STORAGE__ = store;
    }),
    removeItem: vi.fn(async (key: string) => {
      const store = (global as any).__ASYNC_STORAGE__ || {};
      delete store[key];
      (global as any).__ASYNC_STORAGE__ = store;
    }),
    clear: vi.fn(async () => {
      (global as any).__ASYNC_STORAGE__ = {};
    }),
  },
}));
import {
  getSavedWisdoms,
  saveWisdom,
  unsaveWisdom,
  isWisdomSaved,
  toggleWisdomSaved,
} from '@/lib/saved-wisdom-storage';
import { SavedWisdom } from '@/types/saved-wisdom';

describe('Wisdom Bookmark Feature', () => {
  beforeEach(async () => {
    // Clear storage before each test
    (global as any).__ASYNC_STORAGE__ = {};
  });

  describe('Storage Operations', () => {
    it('should save wisdom successfully', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'laozi',
        masterName: 'Lao Tzu',
        masterIcon: '☯️',
        content: 'The Tao that can be told is not the eternal Tao.',
        entryId: 'entry-123',
        entryTitle: 'Morning Reflection',
        entryDate: '2024-01-15',
        type: 'guidance',
      };

      await saveWisdom(wisdom);
      const saved = await getSavedWisdoms();

      expect(saved).toHaveLength(1);
      expect(saved[0].masterId).toBe('laozi');
      expect(saved[0].content).toBe(wisdom.content);
      expect(saved[0].id).toBeDefined();
      expect(saved[0].savedAt).toBeDefined();
    });

    it('should retrieve all saved wisdoms', async () => {
      const wisdom1: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'plato',
        masterName: 'Plato',
        masterIcon: '🏛️',
        content: 'Know thyself.',
        entryId: 'entry-123',
        entryTitle: 'Morning Reflection',
        entryDate: '2024-01-15',
        type: 'guidance',
      };

      const wisdom2: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'buddha',
        masterName: 'The Awakened',
        masterIcon: '🪷',
        content: 'Be a light unto yourself.',
        entryId: 'entry-124',
        entryTitle: 'Evening Thoughts',
        entryDate: '2024-01-15',
        type: 'summary',
      };

      await saveWisdom(wisdom1);
      await saveWisdom(wisdom2);

      const saved = await getSavedWisdoms();
      expect(saved).toHaveLength(2);
      // Most recent should be first
      expect(saved[0].masterId).toBe('buddha');
      expect(saved[1].masterId).toBe('plato');
    });

    it('should unsave wisdom successfully', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'jesus',
        masterName: 'Messenger of Love',
        masterIcon: '✨',
        content: 'Love one another.',
        entryId: 'entry-123',
        entryTitle: 'Morning Reflection',
        entryDate: '2024-01-15',
        type: 'guidance',
      };

      await saveWisdom(wisdom);
      let saved = await getSavedWisdoms();
      expect(saved).toHaveLength(1);

      await unsaveWisdom(saved[0].id);
      saved = await getSavedWisdoms();
      expect(saved).toHaveLength(0);
    });

    it('should check if wisdom is saved', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'laozi',
        masterName: 'Lao Tzu',
        masterIcon: '☯️',
        content: 'The journey of a thousand miles begins with a single step.',
        entryId: 'entry-123',
        entryTitle: 'Morning Reflection',
        entryDate: '2024-01-15',
        type: 'guidance',
      };

      let savedId = await isWisdomSaved('laozi', wisdom.content, 'entry-123');
      expect(savedId).toBeNull();

      await saveWisdom(wisdom);

      savedId = await isWisdomSaved('laozi', wisdom.content, 'entry-123');
      expect(savedId).not.toBeNull();
    });

    it('should toggle wisdom saved status', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'plato',
        masterName: 'Plato',
        masterIcon: '🏛️',
        content: 'The beginning is the most important part of the work.',
        entryId: 'entry-123',
        entryTitle: 'Morning Reflection',
        entryDate: '2024-01-15',
        type: 'summary',
      };

      // First toggle: save
      let isSaved = await toggleWisdomSaved(wisdom);
      expect(isSaved).toBe(true);
      let saved = await getSavedWisdoms();
      expect(saved).toHaveLength(1);

      // Second toggle: unsave
      isSaved = await toggleWisdomSaved(wisdom);
      expect(isSaved).toBe(false);
      saved = await getSavedWisdoms();
      expect(saved).toHaveLength(0);
    });
  });

  describe('Wisdom Types', () => {
    it('should save inspiration type wisdom', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'laozi',
        masterName: 'Lao Tzu',
        masterIcon: '☯️',
        content: 'Nature does not hurry, yet everything is accomplished.',
        entryId: 'entry-123',
        entryTitle: 'Morning Reflection',
        entryDate: '2024-01-15',
        type: 'guidance',
      };

      await saveWisdom(wisdom);
      const saved = await getSavedWisdoms();
      expect(saved[0].type).toBe('guidance');
    });

    it('should save summary type wisdom', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'buddha',
        masterName: 'The Awakened',
        masterIcon: '🪷',
        content: 'The mind is everything. What you think you become.',
        entryId: 'entry-123',
        entryTitle: 'Morning Reflection',
        entryDate: '2024-01-15',
        type: 'summary',
      };

      await saveWisdom(wisdom);
      const saved = await getSavedWisdoms();
      expect(saved[0].type).toBe('summary');
    });
  });

  describe('Multiple Masters', () => {
    it('should save wisdom from all four masters', async () => {
      const masters = [
        {
          masterId: 'laozi' as const,
          masterName: 'Lao Tzu',
          masterIcon: '☯️',
          content: 'Wisdom from Lao Tzu',
        },
        {
          masterId: 'plato' as const,
          masterName: 'Plato',
          masterIcon: '🏛️',
          content: 'Wisdom from Plato',
        },
        {
          masterId: 'buddha' as const,
          masterName: 'The Awakened',
          masterIcon: '🪷',
          content: 'Wisdom from Buddha',
        },
        {
          masterId: 'jesus' as const,
          masterName: 'Messenger of Love',
          masterIcon: '✨',
          content: 'Wisdom from Jesus',
        },
      ];

      for (const master of masters) {
        await saveWisdom({
          ...master,
          entryId: 'entry-123',
          entryTitle: 'Test Entry',
          entryDate: '2024-01-15',
          type: 'guidance',
        });
      }

      const saved = await getSavedWisdoms();
      expect(saved).toHaveLength(4);
      expect(saved.map(w => w.masterId)).toContain('laozi');
      expect(saved.map(w => w.masterId)).toContain('plato');
      expect(saved.map(w => w.masterId)).toContain('buddha');
      expect(saved.map(w => w.masterId)).toContain('jesus');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty storage', async () => {
      const saved = await getSavedWisdoms();
      expect(saved).toEqual([]);
    });

    it('should handle duplicate save attempts', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'laozi',
        masterName: 'Lao Tzu',
        masterIcon: '☯️',
        content: 'Same content',
        entryId: 'entry-123',
        entryTitle: 'Test',
        entryDate: '2024-01-15',
        type: 'guidance',
      };

      await saveWisdom(wisdom);
      await saveWisdom(wisdom);

      const saved = await getSavedWisdoms();
      // Should have 2 entries (no deduplication by default)
      expect(saved).toHaveLength(2);
    });

    it('should handle invalid wisdom ID when unsaving', async () => {
      await expect(unsaveWisdom('invalid-id')).resolves.not.toThrow();
      const saved = await getSavedWisdoms();
      expect(saved).toEqual([]);
    });

    it('should handle long content', async () => {
      const longContent = 'A'.repeat(1000);
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'plato',
        masterName: 'Plato',
        masterIcon: '🏛️',
        content: longContent,
        entryId: 'entry-123',
        entryTitle: 'Test',
        entryDate: '2024-01-15',
        type: 'summary',
      };

      await saveWisdom(wisdom);
      const saved = await getSavedWisdoms();
      expect(saved[0].content).toBe(longContent);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all wisdom properties', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'buddha',
        masterName: 'The Awakened',
        masterIcon: '🪷',
        content: 'Peace comes from within. Do not seek it without.',
        entryId: 'entry-456',
        entryTitle: 'Afternoon Meditation',
        entryDate: '2024-01-16',
        type: 'guidance',
      };

      await saveWisdom(wisdom);
      const saved = await getSavedWisdoms();

      expect(saved[0].masterId).toBe(wisdom.masterId);
      expect(saved[0].masterName).toBe(wisdom.masterName);
      expect(saved[0].masterIcon).toBe(wisdom.masterIcon);
      expect(saved[0].content).toBe(wisdom.content);
      expect(saved[0].entryId).toBe(wisdom.entryId);
      expect(saved[0].entryTitle).toBe(wisdom.entryTitle);
      expect(saved[0].entryDate).toBe(wisdom.entryDate);
      expect(saved[0].type).toBe(wisdom.type);
    });

    it('should generate unique IDs', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'laozi',
        masterName: 'Lao Tzu',
        masterIcon: '☯️',
        content: 'Test content',
        entryId: 'entry-123',
        entryTitle: 'Test',
        entryDate: '2024-01-15',
        type: 'guidance',
      };

      await saveWisdom(wisdom);
      await saveWisdom(wisdom);

      const saved = await getSavedWisdoms();
      expect(saved[0].id).not.toBe(saved[1].id);
    });

    it('should generate timestamps', async () => {
      const wisdom: Omit<SavedWisdom, 'id' | 'savedAt'> = {
        masterId: 'plato',
        masterName: 'Plato',
        masterIcon: '🏛️',
        content: 'Test content',
        entryId: 'entry-123',
        entryTitle: 'Test',
        entryDate: '2024-01-15',
        type: 'summary',
      };

      const beforeSave = Date.now();
      await saveWisdom(wisdom);
      const afterSave = Date.now();

      const saved = await getSavedWisdoms();
      expect(saved[0].savedAt).toBeGreaterThanOrEqual(beforeSave);
      expect(saved[0].savedAt).toBeLessThanOrEqual(afterSave);
    });
  });
});
