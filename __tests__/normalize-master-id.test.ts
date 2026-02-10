import { describe, it, expect } from 'vitest';
import { normalizeMasterId, normalizeMasterIds } from '../server/normalize-master-id';

describe('normalizeMasterId', () => {
  it('should pass through standard IDs unchanged', () => {
    expect(normalizeMasterId('jesus')).toBe('jesus');
    expect(normalizeMasterId('plato')).toBe('plato');
    expect(normalizeMasterId('laozi')).toBe('laozi');
    expect(normalizeMasterId('buddha')).toBe('buddha');
  });

  it('should normalize lao_tzu variants (underscore) to laozi', () => {
    expect(normalizeMasterId('lao_tzu')).toBe('laozi');
    expect(normalizeMasterId('laozu')).toBe('laozi');
    expect(normalizeMasterId('lao_zi')).toBe('laozi');
    expect(normalizeMasterId('laotzu')).toBe('laozi');
  });

  it('should normalize lao-tzu variants (hyphen) to laozi', () => {
    expect(normalizeMasterId('lao-tzu')).toBe('laozi');
    expect(normalizeMasterId('lao-zi')).toBe('laozi');
    expect(normalizeMasterId('lao-tze')).toBe('laozi');
  });

  it('should normalize buddha variants (underscore)', () => {
    expect(normalizeMasterId('the_awakened_one')).toBe('buddha');
    expect(normalizeMasterId('awakened_one')).toBe('buddha');
    expect(normalizeMasterId('siddhartha')).toBe('buddha');
    expect(normalizeMasterId('shakyamuni')).toBe('buddha');
    expect(normalizeMasterId('gautama')).toBe('buddha');
  });

  it('should normalize buddha variants (hyphen)', () => {
    expect(normalizeMasterId('the-awakened-one')).toBe('buddha');
    expect(normalizeMasterId('awakened-one')).toBe('buddha');
  });

  it('should normalize jesus variants (underscore)', () => {
    expect(normalizeMasterId('messenger_of_love')).toBe('jesus');
    expect(normalizeMasterId('love_messenger')).toBe('jesus');
    expect(normalizeMasterId('christ')).toBe('jesus');
    expect(normalizeMasterId('jesus_christ')).toBe('jesus');
  });

  it('should normalize jesus variants (hyphen)', () => {
    expect(normalizeMasterId('messenger-of-love')).toBe('jesus');
    expect(normalizeMasterId('love-messenger')).toBe('jesus');
    expect(normalizeMasterId('jesus-christ')).toBe('jesus');
  });

  it('should normalize socrates to plato', () => {
    expect(normalizeMasterId('socrates')).toBe('plato');
  });

  it('should be case-insensitive', () => {
    expect(normalizeMasterId('LAO_TZU')).toBe('laozi');
    expect(normalizeMasterId('LAO-TZU')).toBe('laozi');
    expect(normalizeMasterId('The_Awakened_One')).toBe('buddha');
    expect(normalizeMasterId('The-Awakened-One')).toBe('buddha');
    expect(normalizeMasterId('MESSENGER_OF_LOVE')).toBe('jesus');
    expect(normalizeMasterId('Messenger-Of-Love')).toBe('jesus');
    expect(normalizeMasterId('Buddha')).toBe('buddha');
  });

  it('should trim whitespace', () => {
    expect(normalizeMasterId('  laozi  ')).toBe('laozi');
    expect(normalizeMasterId(' lao_tzu ')).toBe('laozi');
    expect(normalizeMasterId(' lao-tzu ')).toBe('laozi');
  });

  it('should handle spaces as separators', () => {
    expect(normalizeMasterId('lao tzu')).toBe('laozi');
    expect(normalizeMasterId('the awakened one')).toBe('buddha');
    expect(normalizeMasterId('messenger of love')).toBe('jesus');
  });

  it('should return original (cleaned) for unknown IDs', () => {
    expect(normalizeMasterId('unknown_master')).toBe('unknown_master');
    expect(normalizeMasterId('confucius')).toBe('confucius');
    expect(normalizeMasterId('unknown-master')).toBe('unknown_master');
  });
});

describe('normalizeMasterIds', () => {
  it('should normalize underscore-format IDs in an array', () => {
    const input = [
      { id: 'lao_tzu', name: 'Lao Tzu', icon: '☯️', guidance: 'test' },
      { id: 'the_awakened_one', name: 'Buddha', icon: '🪷', guidance: 'test' },
      { id: 'messenger_of_love', name: 'Jesus', icon: '✨', guidance: 'test' },
      { id: 'plato', name: 'Plato', icon: '🏛️', guidance: 'test' },
    ];

    const result = normalizeMasterIds(input);
    expect(result[0].id).toBe('laozi');
    expect(result[1].id).toBe('buddha');
    expect(result[2].id).toBe('jesus');
    expect(result[3].id).toBe('plato');
  });

  it('should normalize hyphen-format IDs in an array', () => {
    const input = [
      { id: 'lao-tzu', name: 'Lao Tzu', icon: '☯️', guidance: 'test' },
      { id: 'the-awakened-one', name: 'The Awakened One', icon: '🪷', guidance: 'test' },
      { id: 'messenger-of-love', name: 'Messenger of Love', icon: '✨', guidance: 'test' },
      { id: 'plato', name: 'Plato', icon: '🏛️', guidance: 'test' },
    ];

    const result = normalizeMasterIds(input);
    expect(result[0].id).toBe('laozi');
    expect(result[1].id).toBe('buddha');
    expect(result[2].id).toBe('jesus');
    expect(result[3].id).toBe('plato');
  });

  it('should preserve all other properties', () => {
    const input = [
      { id: 'lao-tzu', name: 'Lao Tzu', icon: '☯️', guidance: 'some guidance text' },
    ];

    const result = normalizeMasterIds(input);
    expect(result[0]).toEqual({
      id: 'laozi',
      name: 'Lao Tzu',
      icon: '☯️',
      guidance: 'some guidance text',
    });
  });

  it('should handle empty arrays', () => {
    expect(normalizeMasterIds([])).toEqual([]);
  });

  it('should work with summary objects too', () => {
    const input = [
      { id: 'the-awakened-one', name: 'Buddha', icon: '🪷', summary: 'test summary' },
    ];

    const result = normalizeMasterIds(input);
    expect(result[0].id).toBe('buddha');
    expect((result[0] as any).summary).toBe('test summary');
  });
});
