/**
 * Internationalization (i18n) System
 * Supports Chinese (zh) and English (en)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { zh } from './zh';
import { en } from './en';

export type Language = 'zh' | 'en';
export type TranslationKey = keyof typeof zh;

const translations = { zh, en };

const LANGUAGE_KEY = 'app_language';

/**
 * Detect system language
 */
function detectSystemLanguage(): Language {
  try {
    const locales = getLocales();
    const systemLang = locales[0]?.languageCode;
    // If system language is Chinese, use 'zh', otherwise default to 'en'
    return systemLang === 'zh' ? 'zh' : 'en';
  } catch (e) {
    console.error('Failed to detect system language:', e);
    return 'en'; // Default to English if detection fails
  }
}

let currentLanguage: Language = detectSystemLanguage();
let listeners: Array<(lang: Language) => void> = [];

/**
 * Initialize language from storage
 */
export async function initLanguage(): Promise<Language> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored === 'zh' || stored === 'en') {
      currentLanguage = stored;
    }
  } catch (e) {
    console.error('Failed to load language:', e);
  }
  return currentLanguage;
}

/**
 * Get current language
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Set language and persist
 */
export async function setLanguage(lang: Language): Promise<void> {
  currentLanguage = lang;
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (e) {
    console.error('Failed to save language:', e);
  }
  // Notify all listeners
  listeners.forEach(listener => listener(lang));
}

/**
 * Subscribe to language changes
 */
export function subscribeLanguage(listener: (lang: Language) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

/**
 * Get translation by key
 */
export function t(key: TranslationKey, params?: Record<string, string | number>, lang?: Language): string {
  const targetLang = lang || currentLanguage;
  const value = translations[targetLang][key] || translations['zh'][key] || key;
  
  // If it's an array, return the key (arrays should be accessed via getArray)
  if (Array.isArray(value)) {
    return key;
  }
  
  let text = value as string;
  
  // Replace parameters like {{name}}
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
  }
  
  return text;
}

/**
 * Get array translation by key
 */
export function tArray(key: TranslationKey, lang?: Language): string[] {
  const targetLang = lang || currentLanguage;
  const value = translations[targetLang][key] || translations['zh'][key];
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

/**
 * Get all translations for current language
 */
export function getTranslations() {
  return translations[currentLanguage];
}

export { zh, en };
