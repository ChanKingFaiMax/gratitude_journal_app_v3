import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, UserProfileSummary } from '../types/user-profile';

const USER_PROFILE_KEY = '@user_profile';
const PROFILE_SUMMARY_KEY = '@profile_summary';

/**
 * Save user profile to local storage
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save user profile:', error);
    throw error;
  }
}

/**
 * Get user profile from local storage
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!data) return null;
    return JSON.parse(data) as UserProfile;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

/**
 * Save profile summary for chat context
 */
export async function saveProfileSummary(summary: UserProfileSummary): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_SUMMARY_KEY, JSON.stringify(summary));
  } catch (error) {
    console.error('Failed to save profile summary:', error);
    throw error;
  }
}

/**
 * Get profile summary for chat context
 */
export async function getProfileSummary(): Promise<UserProfileSummary | null> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_SUMMARY_KEY);
    if (!data) return null;
    return JSON.parse(data) as UserProfileSummary;
  } catch (error) {
    console.error('Failed to get profile summary:', error);
    return null;
  }
}

/**
 * Check if profile needs update (30 new entries or 7 days old)
 */
export async function shouldUpdateProfile(newEntriesCount: number): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return true; // No profile yet
  
  const daysSinceUpdate = (Date.now() - profile.meta.lastUpdated) / (1000 * 60 * 60 * 24);
  
  // Update if 30+ new entries or 7+ days old
  return newEntriesCount >= 30 || daysSinceUpdate >= 7;
}

/**
 * Clear user profile (for testing or reset)
 */
export async function clearUserProfile(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([USER_PROFILE_KEY, PROFILE_SUMMARY_KEY]);
  } catch (error) {
    console.error('Failed to clear user profile:', error);
    throw error;
  }
}
