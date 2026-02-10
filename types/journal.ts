export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  topic: string;
  content: string;
  wordCount: number;
  createdAt: number; // timestamp
  summary?: string;
  sentiment?: number; // 0-100
  source?: 'gratitude' | 'philosophy' | 'free'; // Entry source type
  mastersSummary?: MasterSummary[]; // Four masters' summaries
}

export interface MasterSummary {
  id: string;
  name: string;
  icon: string;
  summary: string;
}

export interface DailyTopic {
  id: string;
  text: string;
  category: string;
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
}

export interface UserSettings {
  reminderTime: string; // HH:mm format
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface WritingPrompt {
  text: string;
  type: 'question' | 'suggestion' | 'example' | 'wisdom';
}

export interface JournalReport {
  wordCount: number;
  duration: number; // seconds
  summary: string;
  sentiment: number;
}
