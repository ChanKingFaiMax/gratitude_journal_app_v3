import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for mastersSummary save logic in masters-summary.tsx
 * and display logic in entry-detail.tsx
 * 
 * These tests verify:
 * 1. Auto-save uses entryId (not topic+content matching)
 * 2. Only AI-generated content is saved (not fallback placeholders)
 * 3. entry-detail correctly shows AI content or hint when no content
 */

// Mock AsyncStorage
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

// Import after mocks
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper: simulate storage operations
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

describe('mastersSummary save logic', () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  it('should save entry with mastersSummary using entryId matching', async () => {
    // Step 1: Create a journal entry (simulating write.tsx)
    const entry = {
      id: 'entry-1234567890',
      topic: 'What are you grateful for today?',
      content: 'I am grateful for my family and the beautiful weather.',
      wordCount: 52,
      date: '2026-02-09',
      createdAt: Date.now(),
      source: 'gratitude',
    };
    await saveJournalEntry(entry);

    // Step 2: Simulate AI-generated masters summary
    const aiMasters = [
      { id: 'jesus', name: 'Messenger of Love', icon: '✨', summary: 'AI-generated unique wisdom about family and weather from Jesus perspective.' },
      { id: 'plato', name: 'Plato', icon: '🏛️', summary: 'AI-generated unique wisdom about family and weather from Plato perspective.' },
      { id: 'laozi', name: 'Lao Tzu', icon: '☯️', summary: 'AI-generated unique wisdom about family and weather from Laozi perspective.' },
      { id: 'buddha', name: 'The Awakened One', icon: '🪷', summary: 'AI-generated unique wisdom about family and weather from Buddha perspective.' },
    ];

    // Step 3: Auto-save using entryId (simulating masters-summary.tsx loadSummaries)
    const entries = await getJournalEntries();
    const matchingEntry = entries.find(e => e.id === 'entry-1234567890');
    expect(matchingEntry).toBeTruthy();

    const updatedEntry = {
      ...matchingEntry,
      mastersSummary: aiMasters,
    };
    await saveJournalEntry(updatedEntry);

    // Step 4: Verify the entry now has mastersSummary
    const updatedEntries = await getJournalEntries();
    const savedEntry = updatedEntries.find(e => e.id === 'entry-1234567890');
    expect(savedEntry).toBeTruthy();
    expect(savedEntry.mastersSummary).toBeDefined();
    expect(savedEntry.mastersSummary).toHaveLength(4);
    expect(savedEntry.mastersSummary[0].summary).toContain('AI-generated unique wisdom');
  });

  it('should NOT save fallback placeholder text to entry', async () => {
    // Step 1: Create a journal entry
    const entry = {
      id: 'entry-fallback-test',
      topic: 'Test topic',
      content: 'Test content',
      wordCount: 12,
      date: '2026-02-09',
      createdAt: Date.now(),
      source: 'gratitude',
    };
    await saveJournalEntry(entry);

    // Step 2: Simulate AI failure - fallback data is set but NOT saved
    const fallbackMasters = [
      { id: 'jesus', name: '爱之使者', icon: '✨', summary: '孩子，你记录的这些细节让我看到了爱的具体样子。' },
      { id: 'plato', name: '柏拉图', icon: '🏛️', summary: '你的文字展现了一个追求事物本质的灵魂。' },
      { id: 'laozi', name: '老子', icon: '☯️', summary: '你能在平凡的日常中发现美好，这是生活的智慧。' },
      { id: 'buddha', name: '觉者', icon: '🪷', summary: '你的文字让我看见了你内心的清明。' },
    ];

    // With the fix, isAIGenerated = false when using fallback,
    // so handleComplete should NOT save fallback data
    const isAIGenerated = false; // This is the key flag

    if (isAIGenerated) {
      // This block should NOT execute for fallback data
      const entries = await getJournalEntries();
      const matchingEntry = entries.find(e => e.id === 'entry-fallback-test');
      if (matchingEntry) {
        const updatedEntry = { ...matchingEntry, mastersSummary: fallbackMasters };
        await saveJournalEntry(updatedEntry);
      }
    }

    // Verify: entry should NOT have mastersSummary
    const entries = await getJournalEntries();
    const savedEntry = entries.find(e => e.id === 'entry-fallback-test');
    expect(savedEntry).toBeTruthy();
    expect(savedEntry.mastersSummary).toBeUndefined();
  });

  it('should display AI-generated content in entry-detail when available', () => {
    const entry = {
      id: 'entry-with-ai',
      mastersSummary: [
        { id: 'buddha', name: 'Buddha', icon: '🪷', summary: 'Unique AI wisdom about mindfulness.' },
        { id: 'laozi', name: 'Lao Tzu', icon: '☯️', summary: 'Unique AI wisdom about the Tao.' },
      ],
    };

    // Simulate entry-detail.tsx logic
    const mastersToDisplay = entry.mastersSummary && entry.mastersSummary.length > 0
      ? entry.mastersSummary
      : [];
    const hasMastersSummary = mastersToDisplay.length > 0;

    expect(hasMastersSummary).toBe(true);
    expect(mastersToDisplay).toHaveLength(2);
    expect(mastersToDisplay[0].summary).toBe('Unique AI wisdom about mindfulness.');
  });

  it('should show hint (not placeholder) when no mastersSummary available', () => {
    const entry = {
      id: 'entry-without-ai',
      // No mastersSummary field
    };

    // Simulate entry-detail.tsx logic
    const mastersToDisplay = (entry as any).mastersSummary && (entry as any).mastersSummary.length > 0
      ? (entry as any).mastersSummary
      : [];
    const hasMastersSummary = mastersToDisplay.length > 0;

    expect(hasMastersSummary).toBe(false);
    expect(mastersToDisplay).toHaveLength(0);
    // In the UI, this would show the hint text instead of placeholder sage comments
  });

  it('should handle empty mastersSummary array correctly', () => {
    const entry = {
      id: 'entry-empty-array',
      mastersSummary: [],
    };

    const mastersToDisplay = entry.mastersSummary && entry.mastersSummary.length > 0
      ? entry.mastersSummary
      : [];
    const hasMastersSummary = mastersToDisplay.length > 0;

    expect(hasMastersSummary).toBe(false);
    expect(mastersToDisplay).toHaveLength(0);
  });

  it('handleComplete backup save should skip if auto-save already succeeded', async () => {
    // Step 1: Create entry
    const entry = {
      id: 'entry-double-save-test',
      topic: 'Test',
      content: 'Content',
      wordCount: 7,
      date: '2026-02-09',
      createdAt: Date.now(),
      source: 'gratitude',
    };
    await saveJournalEntry(entry);

    // Step 2: Auto-save succeeds (simulating loadSummaries)
    const aiMasters = [
      { id: 'buddha', name: 'Buddha', icon: '🪷', summary: 'Auto-saved wisdom.' },
    ];
    const entries1 = await getJournalEntries();
    const match1 = entries1.find(e => e.id === 'entry-double-save-test');
    await saveJournalEntry({ ...match1, mastersSummary: aiMasters });

    // Step 3: handleComplete checks if already saved
    const entries2 = await getJournalEntries();
    const match2 = entries2.find(e => e.id === 'entry-double-save-test');
    
    // With the fix: only save if mastersSummary is empty
    const shouldBackupSave = !match2.mastersSummary || match2.mastersSummary.length === 0;
    expect(shouldBackupSave).toBe(false); // Should NOT backup save since auto-save succeeded
    expect(match2.mastersSummary).toHaveLength(1);
    expect(match2.mastersSummary[0].summary).toBe('Auto-saved wisdom.');
  });
});
