import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReviewType = 'consciousness' | 'growth' | 'relationships' | 'attention';

interface ReviewCache {
  type: ReviewType;
  content: any;
  generatedAt: number;
  expiresAt: number;
  entriesHash: string; // 日记内容的哈希值，用于判断内容是否变化
}

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2小时（毫秒）

/**
 * 获取缓存的key
 */
function getCacheKey(type: ReviewType): string {
  return `review_cache_${type}`;
}

/**
 * 生成日记内容的简单哈希值
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * 保存回顾结果到缓存
 */
export async function saveReviewCache(type: ReviewType, content: any, entriesText?: string): Promise<void> {
  const now = Date.now();
  const entriesHash = entriesText ? simpleHash(entriesText) : '';
  const cache: ReviewCache = {
    type,
    content,
    generatedAt: now,
    expiresAt: now + CACHE_DURATION,
    entriesHash,
  };
  
  try {
    await AsyncStorage.setItem(getCacheKey(type), JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save review cache:', error);
  }
}

/**
 * 获取缓存的回顾结果
 * @param type 回顾类型
 * @param currentEntriesText 当前的日记内容（用于检查是否有新内容）
 * @returns 如果缓存有效且内容未变化则返回内容，否则返回null
 */
export async function getReviewCache(type: ReviewType, currentEntriesText?: string): Promise<any | null> {
  try {
    const cacheStr = await AsyncStorage.getItem(getCacheKey(type));
    if (!cacheStr) {
      return null;
    }
    
    const cache: ReviewCache = JSON.parse(cacheStr);
    const now = Date.now();
    
    // 检查是否过期
    if (now >= cache.expiresAt) {
      // 过期了，删除缓存
      await AsyncStorage.removeItem(getCacheKey(type));
      return null;
    }
    
    // 如果提供了当前日记内容，检查内容是否变化
    if (currentEntriesText && cache.entriesHash) {
      const currentHash = simpleHash(currentEntriesText);
      if (currentHash !== cache.entriesHash) {
        // 内容已变化，缓存失效
        return null;
      }
    }
    
    return cache.content;
  } catch (error) {
    console.error('Failed to get review cache:', error);
    return null;
  }
}

/**
 * 检查缓存是否存在且未过期
 * @returns { exists: boolean, remainingMs: number }
 */
export async function checkCacheCooldown(type: ReviewType): Promise<{
  exists: boolean;
  remainingMs: number;
}> {
  try {
    const cacheStr = await AsyncStorage.getItem(getCacheKey(type));
    if (!cacheStr) {
      return { exists: false, remainingMs: 0 };
    }
    
    const cache: ReviewCache = JSON.parse(cacheStr);
    const now = Date.now();
    const remainingMs = cache.expiresAt - now;
    
    if (remainingMs <= 0) {
      // 已过期
      await AsyncStorage.removeItem(getCacheKey(type));
      return { exists: false, remainingMs: 0 };
    }
    
    return { exists: true, remainingMs };
  } catch (error) {
    console.error('Failed to check cache cooldown:', error);
    return { exists: false, remainingMs: 0 };
  }
}

/**
 * 格式化剩余时间为可读字符串
 */
export function formatRemainingTime(ms: number, language: 'zh' | 'en' = 'zh'): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.ceil((ms % (60 * 60 * 1000)) / (60 * 1000));
  
  if (language === 'en') {
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

/**
 * 清除指定类型的缓存
 */
export async function clearReviewCache(type: ReviewType): Promise<void> {
  try {
    await AsyncStorage.removeItem(getCacheKey(type));
  } catch (error) {
    console.error('Failed to clear review cache:', error);
  }
}

/**
 * 清除所有回顾缓存
 */
export async function clearAllReviewCaches(): Promise<void> {
  const types: ReviewType[] = ['consciousness', 'growth', 'relationships', 'attention'];
  await Promise.all(types.map(type => clearReviewCache(type)));
}
