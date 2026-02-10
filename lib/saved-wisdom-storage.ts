import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedWisdom } from '@/types/saved-wisdom';

const STORAGE_KEY = '@saved_wisdom';

/**
 * 获取所有收藏的智慧
 */
export async function getSavedWisdoms(): Promise<SavedWisdom[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load saved wisdoms:', error);
    return [];
  }
}

/**
 * 保存智慧到收藏
 */
export async function saveWisdom(wisdom: Omit<SavedWisdom, 'id' | 'savedAt'>): Promise<void> {
  try {
    const wisdoms = await getSavedWisdoms();
    const newWisdom: SavedWisdom = {
      ...wisdom,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      savedAt: Date.now(),
    };
    wisdoms.unshift(newWisdom); // 新收藏放在最前面
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(wisdoms));
  } catch (error) {
    console.error('Failed to save wisdom:', error);
    throw error;
  }
}

/**
 * 取消收藏
 */
export async function unsaveWisdom(wisdomId: string): Promise<void> {
  try {
    const wisdoms = await getSavedWisdoms();
    const filtered = wisdoms.filter(w => w.id !== wisdomId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to unsave wisdom:', error);
    throw error;
  }
}

/**
 * 检查某个智者卡片是否已收藏
 * @param masterId 智者ID
 * @param content 智者话语内容
 * @param entryId 来源日记ID
 */
export async function isWisdomSaved(
  masterId: string,
  content: string,
  entryId: string
): Promise<string | null> {
  try {
    const wisdoms = await getSavedWisdoms();
    const found = wisdoms.find(
      w => w.masterId === masterId && w.content === content && w.entryId === entryId
    );
    return found ? found.id : null;
  } catch (error) {
    console.error('Failed to check if wisdom is saved:', error);
    return null;
  }
}

/**
 * 切换收藏状态
 * @returns 新的收藏状态（true=已收藏，false=未收藏）
 */
export async function toggleWisdomSaved(
  wisdom: Omit<SavedWisdom, 'id' | 'savedAt'>
): Promise<boolean> {
  try {
    const savedId = await isWisdomSaved(wisdom.masterId, wisdom.content, wisdom.entryId);
    if (savedId) {
      await unsaveWisdom(savedId);
      return false;
    } else {
      await saveWisdom(wisdom);
      return true;
    }
  } catch (error) {
    console.error('Failed to toggle wisdom saved status:', error);
    throw error;
  }
}
