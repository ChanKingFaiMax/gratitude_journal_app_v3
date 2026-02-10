import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    default: {
      setItem: vi.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      getItem: vi.fn(async (key: string) => {
        return store[key] || null;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete store[key];
      }),
      multiRemove: vi.fn(async (keys: string[]) => {
        keys.forEach(key => delete store[key]);
      }),
      clear: vi.fn(async () => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    },
  };
});
import {
  saveUserProfile,
  getUserProfile,
  saveProfileSummary,
  getProfileSummary,
  shouldUpdateProfile,
  clearUserProfile,
} from '../lib/user-profile-storage';
import type { UserProfile, UserProfileSummary } from '../types/user-profile';

describe('User Profile Storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Profile Management', () => {
    it('should save and retrieve user profile', async () => {
      const mockProfile: UserProfile = {
        demographics: {
          ageStage: '20-30岁青年',
          lifeStage: '职场新人',
        },
        lifeContext: {
          career: '互联网行业产品经理',
          relationships: ['单身'],
          livingStatus: '独居',
          majorChallenges: ['工作压力大'],
        },
        psychology: {
          emotionPattern: '容易焦虑，但善于自我调节',
          strengthsWeaknesses: {
            strengths: ['善于思考'],
            weaknesses: ['完美主义'],
          },
          copingStyle: '通过写作处理情绪',
        },
        valuesGoals: {
          coreValues: ['成长', '真诚'],
          lifeGoals: ['职业晋升'],
          currentFocus: ['提升专业能力'],
        },
        patterns: {
          journalFrequency: '每周3-4次',
          commonTopics: [{ topic: '工作压力', frequency: 15 }],
          emotionalTrends: '情绪波动较大',
        },
        meta: {
          totalEntries: 20,
          analyzedEntries: 20,
          lastUpdated: Date.now(),
          confidence: 0.85,
        },
      };

      await saveUserProfile(mockProfile);
      const retrieved = await getUserProfile();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.demographics.ageStage).toBe('20-30岁青年');
      expect(retrieved?.lifeContext.career).toBe('互联网行业产品经理');
      expect(retrieved?.meta.totalEntries).toBe(20);
    });

    it('should return null when no profile exists', async () => {
      const profile = await getUserProfile();
      expect(profile).toBeNull();
    });

    it('should update existing profile', async () => {
      const profile1: UserProfile = {
        demographics: { ageStage: '20-30岁', lifeStage: '学生' },
        lifeContext: {
          career: '学生',
          relationships: [],
          livingStatus: '宿舍',
          majorChallenges: [],
        },
        psychology: {
          emotionPattern: '稳定',
          strengthsWeaknesses: { strengths: [], weaknesses: [] },
          copingStyle: '运动',
        },
        valuesGoals: {
          coreValues: [],
          lifeGoals: [],
          currentFocus: [],
        },
        patterns: {
          journalFrequency: '每天',
          commonTopics: [],
          emotionalTrends: '稳定',
        },
        meta: {
          totalEntries: 10,
          analyzedEntries: 10,
          lastUpdated: Date.now(),
          confidence: 0.7,
        },
      };

      await saveUserProfile(profile1);

      const profile2: UserProfile = {
        ...profile1,
        lifeContext: {
          ...profile1.lifeContext,
          career: '职场新人',
        },
        meta: {
          ...profile1.meta,
          totalEntries: 30,
        },
      };

      await saveUserProfile(profile2);
      const retrieved = await getUserProfile();

      expect(retrieved?.lifeContext.career).toBe('职场新人');
      expect(retrieved?.meta.totalEntries).toBe(30);
    });
  });

  describe('Profile Summary', () => {
    it('should save and retrieve profile summary', async () => {
      const mockSummary: UserProfileSummary = {
        summary: 'User is a young professional working in tech industry, dealing with work stress but showing good self-regulation through journaling.',
        language: 'zh',
      };

      await saveProfileSummary(mockSummary);
      const retrieved = await getProfileSummary();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.summary).toBe(mockSummary.summary);
      expect(retrieved?.language).toBe('zh');
    });

    it('should return null when no summary exists', async () => {
      const summary = await getProfileSummary();
      expect(summary).toBeNull();
    });

    it('should support English summaries', async () => {
      const mockSummary: UserProfileSummary = {
        summary: 'User is a young professional working in tech industry.',
        language: 'en',
      };

      await saveProfileSummary(mockSummary);
      const retrieved = await getProfileSummary();

      expect(retrieved?.language).toBe('en');
    });
  });

  describe('Profile Update Logic', () => {
    it('should require update when no profile exists', async () => {
      const needsUpdate = await shouldUpdateProfile(0);
      expect(needsUpdate).toBe(true);
    });

    it('should require update when 30+ new entries', async () => {
      const mockProfile: UserProfile = {
        demographics: { ageStage: '20-30岁', lifeStage: '职场新人' },
        lifeContext: {
          career: '产品经理',
          relationships: [],
          livingStatus: '独居',
          majorChallenges: [],
        },
        psychology: {
          emotionPattern: '稳定',
          strengthsWeaknesses: { strengths: [], weaknesses: [] },
          copingStyle: '写作',
        },
        valuesGoals: {
          coreValues: [],
          lifeGoals: [],
          currentFocus: [],
        },
        patterns: {
          journalFrequency: '每周3次',
          commonTopics: [],
          emotionalTrends: '稳定',
        },
        meta: {
          totalEntries: 20,
          analyzedEntries: 20,
          lastUpdated: Date.now(),
          confidence: 0.85,
        },
      };

      await saveUserProfile(mockProfile);
      const needsUpdate = await shouldUpdateProfile(30);
      expect(needsUpdate).toBe(true);
    });

    it('should require update when 7+ days old', async () => {
      const sevenDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const mockProfile: UserProfile = {
        demographics: { ageStage: '20-30岁', lifeStage: '职场新人' },
        lifeContext: {
          career: '产品经理',
          relationships: [],
          livingStatus: '独居',
          majorChallenges: [],
        },
        psychology: {
          emotionPattern: '稳定',
          strengthsWeaknesses: { strengths: [], weaknesses: [] },
          copingStyle: '写作',
        },
        valuesGoals: {
          coreValues: [],
          lifeGoals: [],
          currentFocus: [],
        },
        patterns: {
          journalFrequency: '每周3次',
          commonTopics: [],
          emotionalTrends: '稳定',
        },
        meta: {
          totalEntries: 20,
          analyzedEntries: 20,
          lastUpdated: sevenDaysAgo,
          confidence: 0.85,
        },
      };

      await saveUserProfile(mockProfile);
      const needsUpdate = await shouldUpdateProfile(5);
      expect(needsUpdate).toBe(true);
    });

    it('should not require update when recent and few new entries', async () => {
      const mockProfile: UserProfile = {
        demographics: { ageStage: '20-30岁', lifeStage: '职场新人' },
        lifeContext: {
          career: '产品经理',
          relationships: [],
          livingStatus: '独居',
          majorChallenges: [],
        },
        psychology: {
          emotionPattern: '稳定',
          strengthsWeaknesses: { strengths: [], weaknesses: [] },
          copingStyle: '写作',
        },
        valuesGoals: {
          coreValues: [],
          lifeGoals: [],
          currentFocus: [],
        },
        patterns: {
          journalFrequency: '每周3次',
          commonTopics: [],
          emotionalTrends: '稳定',
        },
        meta: {
          totalEntries: 20,
          analyzedEntries: 20,
          lastUpdated: Date.now(),
          confidence: 0.85,
        },
      };

      await saveUserProfile(mockProfile);
      const needsUpdate = await shouldUpdateProfile(5);
      expect(needsUpdate).toBe(false);
    });
  });

  describe('Clear Profile', () => {
    it('should clear both profile and summary', async () => {
      const mockProfile: UserProfile = {
        demographics: { ageStage: '20-30岁', lifeStage: '职场新人' },
        lifeContext: {
          career: '产品经理',
          relationships: [],
          livingStatus: '独居',
          majorChallenges: [],
        },
        psychology: {
          emotionPattern: '稳定',
          strengthsWeaknesses: { strengths: [], weaknesses: [] },
          copingStyle: '写作',
        },
        valuesGoals: {
          coreValues: [],
          lifeGoals: [],
          currentFocus: [],
        },
        patterns: {
          journalFrequency: '每周3次',
          commonTopics: [],
          emotionalTrends: '稳定',
        },
        meta: {
          totalEntries: 20,
          analyzedEntries: 20,
          lastUpdated: Date.now(),
          confidence: 0.85,
        },
      };

      const mockSummary: UserProfileSummary = {
        summary: 'Test summary',
        language: 'zh',
      };

      await saveUserProfile(mockProfile);
      await saveProfileSummary(mockSummary);

      await clearUserProfile();

      const profile = await getUserProfile();
      const summary = await getProfileSummary();

      expect(profile).toBeNull();
      expect(summary).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all profile fields', async () => {
      const mockProfile: UserProfile = {
        demographics: {
          ageStage: '20-30岁青年',
          gender: '女性',
          lifeStage: '职场新人',
          location: '城市',
        },
        lifeContext: {
          career: '互联网行业产品经理',
          relationships: ['单身', '与父母关系紧张'],
          livingStatus: '独居',
          majorChallenges: ['工作压力大', '缺乏运动', '睡眠问题'],
        },
        psychology: {
          emotionPattern: '容易焦虑，但善于自我调节',
          strengthsWeaknesses: {
            strengths: ['善于思考', '有责任心', '自我觉察强'],
            weaknesses: ['完美主义', '容易自我怀疑', '过度思考'],
          },
          copingStyle: '倾向于通过写作和独处来处理情绪',
        },
        valuesGoals: {
          coreValues: ['成长', '真诚', '自由'],
          lifeGoals: ['职业晋升', '建立深度关系', '实现工作生活平衡'],
          currentFocus: ['提升专业能力', '改善睡眠', '增加运动'],
        },
        patterns: {
          journalFrequency: '每周3-4次',
          commonTopics: [
            { topic: '工作压力', frequency: 15 },
            { topic: '自我反思', frequency: 12 },
            { topic: '感恩小事', frequency: 10 },
          ],
          emotionalTrends: '最近一个月情绪波动较大，但呈现改善趋势',
        },
        meta: {
          totalEntries: 50,
          analyzedEntries: 20,
          lastUpdated: Date.now(),
          confidence: 0.92,
        },
      };

      await saveUserProfile(mockProfile);
      const retrieved = await getUserProfile();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.demographics.gender).toBe('女性');
      expect(retrieved?.lifeContext.relationships).toHaveLength(2);
      expect(retrieved?.psychology.strengthsWeaknesses.strengths).toHaveLength(3);
      expect(retrieved?.valuesGoals.coreValues).toHaveLength(3);
      expect(retrieved?.patterns.commonTopics).toHaveLength(3);
      expect(retrieved?.meta.confidence).toBe(0.92);
    });

    it('should handle missing optional fields', async () => {
      const minimalProfile: UserProfile = {
        demographics: {
          ageStage: '20-30岁',
          lifeStage: '职场新人',
        },
        lifeContext: {
          career: '产品经理',
          relationships: [],
          livingStatus: '独居',
          majorChallenges: [],
        },
        psychology: {
          emotionPattern: '稳定',
          strengthsWeaknesses: {
            strengths: [],
            weaknesses: [],
          },
          copingStyle: '写作',
        },
        valuesGoals: {
          coreValues: [],
          lifeGoals: [],
          currentFocus: [],
        },
        patterns: {
          journalFrequency: '每周3次',
          commonTopics: [],
          emotionalTrends: '稳定',
        },
        meta: {
          totalEntries: 10,
          analyzedEntries: 10,
          lastUpdated: Date.now(),
          confidence: 0.7,
        },
      };

      await saveUserProfile(minimalProfile);
      const retrieved = await getUserProfile();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.demographics.gender).toBeUndefined();
      expect(retrieved?.demographics.location).toBeUndefined();
    });
  });
});
