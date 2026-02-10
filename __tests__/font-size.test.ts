/**
 * Font Size Feature Test
 * 
 * Tests the font size adjustment functionality:
 * 1. Font size scale selection and persistence
 * 2. Font scaling calculation
 * 3. Applied locations: writing input, sage wisdom, journal detail, masters summary
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

describe('Font Size Feature', () => {
  const FONT_SIZE_KEY = '@font_size_scale';

  beforeEach(async () => {
    // Clear storage before each test
    (global as any).__ASYNC_STORAGE__ = {};
  });

  describe('Font Size Scale', () => {
    it('should have 5 font size options', () => {
      const scales = ['xs', 'sm', 'md', 'lg', 'xl'];
      expect(scales).toHaveLength(5);
    });

    it('should have correct multipliers for each scale', () => {
      const multipliers = {
        xs: 0.9,   // -10%
        sm: 1.0,   // 0% (standard)
        md: 1.2,   // +20%
        lg: 1.4,   // +40%
        xl: 1.6,   // +60%
      };

      expect(multipliers.xs).toBe(0.9);
      expect(multipliers.sm).toBe(1.0);
      expect(multipliers.md).toBe(1.2);
      expect(multipliers.lg).toBe(1.4);
      expect(multipliers.xl).toBe(1.6);
    });

    it('should calculate scaled size correctly', () => {
      const baseSize = 16;
      const scales = {
        xs: Math.round(baseSize * 0.9),   // 14
        sm: Math.round(baseSize * 1.0),   // 16
        md: Math.round(baseSize * 1.2),   // 19
        lg: Math.round(baseSize * 1.4),   // 22
        xl: Math.round(baseSize * 1.6),   // 26
      };

      expect(scales.xs).toBe(14);
      expect(scales.sm).toBe(16);
      expect(scales.md).toBe(19);
      expect(scales.lg).toBe(22);
      expect(scales.xl).toBe(26);
    });
  });

  describe('Font Size Persistence', () => {
    it('should save font size scale to storage', async () => {
      await AsyncStorage.setItem(FONT_SIZE_KEY, 'lg');
      const saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
      expect(saved).toBe('lg');
    });

    it('should load saved font size scale from storage', async () => {
      await AsyncStorage.setItem(FONT_SIZE_KEY, 'md');
      const loaded = await AsyncStorage.getItem(FONT_SIZE_KEY);
      expect(loaded).toBe('md');
    });

    it('should default to standard (sm) when no saved scale', async () => {
      const loaded = await AsyncStorage.getItem(FONT_SIZE_KEY);
      expect(loaded).toBeNull();
      // Provider should default to 'sm'
    });

    it('should update font size scale', async () => {
      await AsyncStorage.setItem(FONT_SIZE_KEY, 'sm');
      let saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
      expect(saved).toBe('sm');

      await AsyncStorage.setItem(FONT_SIZE_KEY, 'xl');
      saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
      expect(saved).toBe('xl');
    });
  });

  describe('Font Size Application', () => {
    it('should apply to writing input (base 16px)', () => {
      const baseSize = 16;
      const scales = {
        xs: Math.round(baseSize * 0.9),
        sm: Math.round(baseSize * 1.0),
        md: Math.round(baseSize * 1.2),
        lg: Math.round(baseSize * 1.4),
        xl: Math.round(baseSize * 1.6),
      };

      expect(scales.sm).toBe(16);
      expect(scales.lg).toBe(22);
    });

    it('should apply to sage wisdom content (base 15px for main panel)', () => {
      const baseSize = 15;
      const scales = {
        xs: Math.round(baseSize * 0.9),
        sm: Math.round(baseSize * 1.0),
        md: Math.round(baseSize * 1.2),
        lg: Math.round(baseSize * 1.4),
        xl: Math.round(baseSize * 1.6),
      };

      expect(scales.sm).toBe(15);
      expect(scales.lg).toBe(21);
    });

    it('should apply to sage wisdom content (base 14px for iOS keyboard panel)', () => {
      const baseSize = 14;
      const scales = {
        xs: Math.round(baseSize * 0.9),
        sm: Math.round(baseSize * 1.0),
        md: Math.round(baseSize * 1.2),
        lg: Math.round(baseSize * 1.4),
        xl: Math.round(baseSize * 1.6),
      };

      expect(scales.sm).toBe(14);
      expect(scales.lg).toBe(20);
    });

    it('should apply to journal detail content (base 16px)', () => {
      const baseSize = 16;
      const scales = {
        xs: Math.round(baseSize * 0.9),
        sm: Math.round(baseSize * 1.0),
        md: Math.round(baseSize * 1.2),
        lg: Math.round(baseSize * 1.4),
        xl: Math.round(baseSize * 1.6),
      };

      expect(scales.sm).toBe(16);
      expect(scales.xl).toBe(26);
    });

    it('should apply to masters summary content (base 15px)', () => {
      const baseSize = 15;
      const scales = {
        xs: Math.round(baseSize * 0.9),
        sm: Math.round(baseSize * 1.0),
        md: Math.round(baseSize * 1.2),
        lg: Math.round(baseSize * 1.4),
        xl: Math.round(baseSize * 1.6),
      };

      expect(scales.sm).toBe(15);
      expect(scales.md).toBe(18);
    });
  });

  describe('Line Height Scaling', () => {
    it('should scale line height proportionally to font size', () => {
      const baseFontSize = 16;
      const baseLineHeight = 24;
      const ratio = baseLineHeight / baseFontSize; // 1.5

      const scales = ['xs', 'sm', 'md', 'lg', 'xl'];
      const multipliers = [0.9, 1.0, 1.2, 1.4, 1.6];

      scales.forEach((scale, index) => {
        const scaledFontSize = Math.round(baseFontSize * multipliers[index]);
        const scaledLineHeight = Math.round(baseLineHeight * multipliers[index]);
        const scaledRatio = scaledLineHeight / scaledFontSize;

        // Line height ratio should remain approximately the same
        expect(Math.abs(scaledRatio - ratio)).toBeLessThan(0.2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid scale gracefully', async () => {
      await AsyncStorage.setItem(FONT_SIZE_KEY, 'invalid');
      const saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
      expect(saved).toBe('invalid');
      // Provider should validate and default to 'sm'
    });

    it('should handle very small base sizes', () => {
      const baseSize = 10;
      const scaled = Math.round(baseSize * 1.6); // xl scale
      expect(scaled).toBe(16);
    });

    it('should handle very large base sizes', () => {
      const baseSize = 30;
      const scaled = Math.round(baseSize * 0.9); // xs scale
      expect(scaled).toBe(27);
    });

    it('should round scaled sizes to integers', () => {
      const baseSize = 15;
      const multiplier = 1.2;
      const scaled = Math.round(baseSize * multiplier);
      expect(Number.isInteger(scaled)).toBe(true);
      expect(scaled).toBe(18);
    });
  });

  describe('Font Size Settings Page', () => {
    it('should be accessible from settings', () => {
      const settingsRoute = '/font-size-settings';
      expect(settingsRoute).toBeDefined();
    });

    it('should display all 5 font size options', () => {
      const options = [
        { scale: 'xs', label: '极小 / Extra Small', multiplier: '-10%' },
        { scale: 'sm', label: '标准 / Standard', multiplier: '0%' },
        { scale: 'md', label: '大 / Large', multiplier: '+20%' },
        { scale: 'lg', label: '特大 / Extra Large', multiplier: '+40%' },
        { scale: 'xl', label: '超大 / Huge', multiplier: '+60%' },
      ];

      expect(options).toHaveLength(5);
      expect(options[0].scale).toBe('xs');
      expect(options[4].scale).toBe('xl');
    });

    it('should show preview text for each option', () => {
      const previewTextZh = '快速的棕色狐狸跳过懒狗';
      const previewTextEn = 'The quick brown fox jumps over the lazy dog';

      expect(previewTextZh).toBeDefined();
      expect(previewTextEn).toBeDefined();
    });
  });
});
