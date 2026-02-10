import { describe, it, expect } from 'vitest';

/**
 * Test the dynamic font size calculation logic for WisdomShareCard.
 * Extracted from the component for testability.
 */
function getDynamicFontSize(text: string): { fontSize: number; lineHeight: number } {
  const len = text.length;
  if (len < 100) {
    return { fontSize: 48, lineHeight: 72 };
  } else if (len < 200) {
    return { fontSize: 40, lineHeight: 62 };
  } else if (len < 400) {
    return { fontSize: 34, lineHeight: 52 };
  } else {
    return { fontSize: 28, lineHeight: 44 };
  }
}

describe('WisdomShareCard - Dynamic Font Size', () => {
  it('should use large font (48px) for short text under 100 chars', () => {
    const shortText = 'Be present. Find peace in the now.';
    const result = getDynamicFontSize(shortText);
    expect(result.fontSize).toBe(48);
    expect(result.lineHeight).toBe(72);
  });

  it('should use medium font (40px) for text between 100-200 chars', () => {
    const mediumText = 'You find contentment in the present moment — the cool weather, the comfort of clothing. This is being fully present, embracing life as it is.';
    expect(mediumText.length).toBeGreaterThanOrEqual(100);
    expect(mediumText.length).toBeLessThan(200);
    const result = getDynamicFontSize(mediumText);
    expect(result.fontSize).toBe(40);
    expect(result.lineHeight).toBe(62);
  });

  it('should use small font (34px) for text between 200-400 chars', () => {
    const longText = 'You observe the cool weather and the simple act of wearing different layers, finding contentment in this present moment. This is a clear demonstration of being fully present, embracing the conditions as they are, without resistance. To appreciate the cool air and the comfort of clothing is to acknowledge the direct experience of life.';
    expect(longText.length).toBeGreaterThanOrEqual(200);
    expect(longText.length).toBeLessThan(400);
    const result = getDynamicFontSize(longText);
    expect(result.fontSize).toBe(34);
    expect(result.lineHeight).toBe(52);
  });

  it('should use extra small font (28px) for very long text over 400 chars', () => {
    const veryLongText = 'You observe the cool weather and the simple act of wearing different layers, finding contentment in this present moment. This is a clear demonstration of being fully present, embracing the conditions as they are, without resistance. To appreciate the cool air and the comfort of clothing is to acknowledge the direct experience of life, finding peace in its ordinary unfolding. There is no need for grand events; true joy often resides in the quiet acceptance of what is here now. This gentle observation of your surroundings and your response to them reveals a calm and accepting mind.';
    expect(veryLongText.length).toBeGreaterThanOrEqual(400);
    const result = getDynamicFontSize(veryLongText);
    expect(result.fontSize).toBe(28);
    expect(result.lineHeight).toBe(44);
  });

  it('should handle empty string with large font', () => {
    const result = getDynamicFontSize('');
    expect(result.fontSize).toBe(48);
    expect(result.lineHeight).toBe(72);
  });

  it('should handle text at exact boundary (100 chars)', () => {
    const text = 'a'.repeat(100);
    const result = getDynamicFontSize(text);
    expect(result.fontSize).toBe(40); // 100 chars falls into medium range
  });

  it('should handle text at exact boundary (200 chars)', () => {
    const text = 'a'.repeat(200);
    const result = getDynamicFontSize(text);
    expect(result.fontSize).toBe(34); // 200 chars falls into small range
  });

  it('should handle text at exact boundary (400 chars)', () => {
    const text = 'a'.repeat(400);
    const result = getDynamicFontSize(text);
    expect(result.fontSize).toBe(28); // 400 chars falls into extra small range
  });

  it('should always have lineHeight greater than fontSize', () => {
    const testLengths = [10, 50, 99, 100, 150, 199, 200, 300, 399, 400, 500, 1000];
    for (const len of testLengths) {
      const text = 'a'.repeat(len);
      const result = getDynamicFontSize(text);
      expect(result.lineHeight).toBeGreaterThan(result.fontSize);
    }
  });
});
