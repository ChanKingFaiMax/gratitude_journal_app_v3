import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_CONTEXT_KEY = 'chat-context-temp';

export interface ChatContext {
  masterId: string;
  masterName: string;
  masterIcon: string;
  topic: string;
  userContent: string;
  masterSummary: string;
  timestamp: number;
}

/**
 * Save temporary chat context for navigation
 * This is used when user clicks "Continue Chat" from master summary modal
 */
export async function saveChatContext(context: Omit<ChatContext, 'timestamp'>): Promise<void> {
  try {
    const data: ChatContext = {
      ...context,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CHAT_CONTEXT_KEY, JSON.stringify(data));
    console.log('[ChatContext] Saved context for master:', context.masterId);
  } catch (error) {
    console.error('[ChatContext] Failed to save context:', error);
  }
}

/**
 * Load and consume chat context
 * Returns the context and immediately clears it to prevent reuse
 */
export async function loadAndConsumeChatContext(): Promise<ChatContext | null> {
  try {
    const data = await AsyncStorage.getItem(CHAT_CONTEXT_KEY);
    if (!data) {
      return null;
    }

    const context: ChatContext = JSON.parse(data);
    
    // Check if context is too old (more than 5 minutes)
    const age = Date.now() - context.timestamp;
    if (age > 5 * 60 * 1000) {
      console.log('[ChatContext] Context expired, clearing');
      await AsyncStorage.removeItem(CHAT_CONTEXT_KEY);
      return null;
    }

    // Clear context immediately to prevent reuse
    await AsyncStorage.removeItem(CHAT_CONTEXT_KEY);
    console.log('[ChatContext] Loaded and consumed context for master:', context.masterId);
    
    return context;
  } catch (error) {
    console.error('[ChatContext] Failed to load context:', error);
    return null;
  }
}

/**
 * Clear chat context manually
 */
export async function clearChatContext(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAT_CONTEXT_KEY);
    console.log('[ChatContext] Cleared context');
  } catch (error) {
    console.error('[ChatContext] Failed to clear context:', error);
  }
}
