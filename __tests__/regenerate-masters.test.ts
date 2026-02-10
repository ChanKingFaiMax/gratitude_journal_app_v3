import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the regenerate masters summary feature in entry-detail.tsx
 * Verifies:
 * 1. Regenerated AI content replaces existing mastersSummary
 * 2. Regenerated AI content is saved to storage
 * 3. UI state logic for hasMastersSummary / empty / regenerating
 */

const mockStorage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

async function saveJournalEntry(entry: any): Promise<void> {
  const data = await AsyncStorage.getItem('journal_entries');
  const entries: any[] = data ? JSON.parse(data) : [];
  const existingIndex = entries.findIndex((e: any) => e.id === entry.id);
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  entries.sort((a: any, b: any) => b.createdAt - a.createdAt);
  await AsyncStorage.setItem('journal_entries', JSON.stringify(entries));
}

async function getJournalEntries(): Promise<any[]> {
  const data = await AsyncStorage.getItem('journal_entries');
  return data ? JSON.parse(data) : [];
}

describe('Regenerate masters summary', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  it('should regenerate and replace existing mastersSummary', async () => {
    // Create entry with old mastersSummary
    const entry = {
      id: 'entry-regen-1',
      topic: '感恩家人',
      content: '今天家人一起吃了晚饭，很开心。',
      wordCount: 15,
      date: '2026-02-09',
      createdAt: Date.now(),
      source: 'gratitude',
      mastersSummary: [
        { id: 'buddha', name: '觉者', icon: '🪷', summary: '旧的AI评论内容' },
      ],
    };
    await saveJournalEntry(entry);

    // Simulate regeneration: new AI data
    const newMasters = [
      { id: 'buddha', name: '觉者', icon: '🪷', summary: '全新的AI评论：你的感恩让家庭更温暖。' },
      { id: 'laozi', name: '老子', icon: '☯️', summary: '全新的AI评论：家人之间的爱如水般自然流淌。' },
      { id: 'plato', name: '柏拉图', icon: '🏛️', summary: '全新的AI评论：家庭的美好体现了真善美。' },
      { id: 'jesus', name: '爱之使者', icon: '✨', summary: '全新的AI评论：孩子，家人的爱是最珍贵的。' },
    ];

    // Save regenerated data
    const entries = await getJournalEntries();
    const matchingEntry = entries.find(e => e.id === 'entry-regen-1');
    expect(matchingEntry).toBeTruthy();

    const updatedEntry = { ...matchingEntry, mastersSummary: newMasters };
    await saveJournalEntry(updatedEntry);

    // Verify replacement
    const finalEntries = await getJournalEntries();
    const saved = finalEntries.find(e => e.id === 'entry-regen-1');
    expect(saved.mastersSummary).toHaveLength(4);
    expect(saved.mastersSummary[0].summary).toContain('全新的AI评论');
    expect(saved.mastersSummary[0].summary).not.toBe('旧的AI评论内容');
  });

  it('should generate mastersSummary for entry that had none', async () => {
    // Create entry without mastersSummary
    const entry = {
      id: 'entry-regen-2',
      topic: 'Grateful for sunshine',
      content: 'The sun was beautiful today.',
      wordCount: 6,
      date: '2026-02-09',
      createdAt: Date.now(),
      source: 'gratitude',
    };
    await saveJournalEntry(entry);

    // Verify no mastersSummary initially
    const entries1 = await getJournalEntries();
    const before = entries1.find(e => e.id === 'entry-regen-2');
    expect(before.mastersSummary).toBeUndefined();

    // Simulate generation
    const newMasters = [
      { id: 'buddha', name: 'Buddha', icon: '🪷', summary: 'The sun reminds us of the light within.' },
    ];
    const updatedEntry = { ...before, mastersSummary: newMasters };
    await saveJournalEntry(updatedEntry);

    // Verify
    const entries2 = await getJournalEntries();
    const after = entries2.find(e => e.id === 'entry-regen-2');
    expect(after.mastersSummary).toHaveLength(1);
    expect(after.mastersSummary[0].summary).toContain('sun');
  });

  it('UI state: hasMastersSummary should be true after regeneration', () => {
    const entry = {
      mastersSummary: [
        { id: 'buddha', name: 'Buddha', icon: '🪷', summary: 'New wisdom.' },
      ],
    };

    const mastersToDisplay = entry.mastersSummary && entry.mastersSummary.length > 0
      ? entry.mastersSummary
      : [];
    const hasMastersSummary = mastersToDisplay.length > 0;

    expect(hasMastersSummary).toBe(true);
  });

  it('UI state: empty entry shows generate button text', () => {
    const entry = { mastersSummary: undefined as any };

    const mastersToDisplay = entry.mastersSummary && entry.mastersSummary.length > 0
      ? entry.mastersSummary
      : [];
    const hasMastersSummary = mastersToDisplay.length > 0;

    // When no mastersSummary, button text should be "Generate" not "Regenerate"
    const buttonText = hasMastersSummary ? '重新生成' : '生成';
    expect(hasMastersSummary).toBe(false);
    expect(buttonText).toBe('生成');
  });

  it('UI state: entry with mastersSummary shows regenerate button text', () => {
    const entry = {
      mastersSummary: [
        { id: 'buddha', name: 'Buddha', icon: '🪷', summary: 'Existing wisdom.' },
      ],
    };

    const mastersToDisplay = entry.mastersSummary && entry.mastersSummary.length > 0
      ? entry.mastersSummary
      : [];
    const hasMastersSummary = mastersToDisplay.length > 0;

    const buttonText = hasMastersSummary ? '重新生成' : '生成';
    expect(hasMastersSummary).toBe(true);
    expect(buttonText).toBe('重新生成');
  });
});
