/**
 * Hook for language management
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Language, 
  getLanguage, 
  setLanguage as setLang, 
  subscribeLanguage,
  initLanguage,
  t,
  tArray,
  TranslationKey
} from '@/lib/i18n';

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(getLanguage());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize language from storage
    initLanguage().then((lang) => {
      setLanguageState(lang);
      setIsInitialized(true);
    });

    // Subscribe to language changes
    const unsubscribe = subscribeLanguage((lang) => {
      setLanguageState(lang);
    });

    return unsubscribe;
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    await setLang(lang);
  }, []);

  const translate = useCallback((key: TranslationKey, params?: Record<string, string | number>) => {
    return t(key, params, language);
  }, [language]); // Re-create when language changes

  const translateArray = useCallback((key: TranslationKey) => {
    return tArray(key, language);
  }, [language]);

  return {
    language,
    setLanguage,
    t: translate,
    tArray: translateArray,
    isInitialized,
    isEnglish: language === 'en',
    isChinese: language === 'zh',
  };
}
