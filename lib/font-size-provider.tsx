import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type FontSizeScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface FontSizeContextType {
  scale: FontSizeScale;
  setScale: (scale: FontSizeScale) => Promise<void>;
  getScaledSize: (baseSize: number) => number;
  scaleMultiplier: number;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const FONT_SIZE_KEY = '@font_size_scale';

// 字体缩放比例映射
const SCALE_MULTIPLIERS: Record<FontSizeScale, number> = {
  xs: 0.9,   // 极小 -10%
  sm: 1.0,   // 标准 0%
  md: 1.2,   // 大 +20%
  lg: 1.4,   // 特大 +40%
  xl: 1.6,   // 超大 +60%
};

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<FontSizeScale>('sm');
  const [isLoaded, setIsLoaded] = useState(false);

  // 从AsyncStorage加载保存的字体大小设置
  useEffect(() => {
    loadFontSize();
  }, []);

  const loadFontSize = async () => {
    try {
      const saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
      if (saved && (saved as FontSizeScale) in SCALE_MULTIPLIERS) {
        setScaleState(saved as FontSizeScale);
      }
    } catch (error) {
      console.error('Failed to load font size:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setScale = async (newScale: FontSizeScale) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, newScale);
      setScaleState(newScale);
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  };

  const getScaledSize = (baseSize: number): number => {
    return Math.round(baseSize * SCALE_MULTIPLIERS[scale]);
  };

  const scaleMultiplier = SCALE_MULTIPLIERS[scale];

  // 在Web平台上，通过CSS变量动态调整字体大小
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-scale', scaleMultiplier.toString());
    }
  }, [scaleMultiplier]);

  // 等待加载完成再渲染子组件，避免闪烁
  if (!isLoaded) {
    return null;
  }

  return (
    <FontSizeContext.Provider value={{ scale, setScale, getScaledSize, scaleMultiplier }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
