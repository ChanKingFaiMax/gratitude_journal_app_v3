import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAT_SESSIONS_KEY = "chat_sessions";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface ChatMessage {
  id: string;
  masterId: string;
  role: "user" | "master";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  masterId: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

/**
 * Load all chat sessions from storage
 */
export async function loadChatSessions(): Promise<ChatSession[]> {
  try {
    const data = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
    if (!data) return [];

    const sessions: ChatSession[] = JSON.parse(data);
    
    // Filter out sessions older than 1 week
    const now = Date.now();
    const validSessions = sessions.filter(session => {
      return now - session.lastUpdated < ONE_WEEK_MS;
    });

    // Save filtered sessions back if any were removed
    if (validSessions.length !== sessions.length) {
      await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(validSessions));
    }

    return validSessions;
  } catch (error) {
    console.error("Failed to load chat sessions:", error);
    return [];
  }
}

/**
 * Save a new message to the chat session
 */
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  try {
    const sessions = await loadChatSessions();
    const sessionIndex = sessions.findIndex(s => s.masterId === message.masterId);

    if (sessionIndex >= 0) {
      // Update existing session
      sessions[sessionIndex].messages.push(message);
      sessions[sessionIndex].lastUpdated = Date.now();
    } else {
      // Create new session
      sessions.push({
        masterId: message.masterId,
        messages: [message],
        lastUpdated: Date.now(),
      });
    }

    await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Failed to save chat message:", error);
  }
}

/**
 * Get message count for a specific master
 */
export async function getMessageCount(masterId: string): Promise<number> {
  try {
    const sessions = await loadChatSessions();
    const session = sessions.find(s => s.masterId === masterId);
    return session?.messages.length || 0;
  } catch (error) {
    console.error("Failed to get message count:", error);
    return 0;
  }
}

/**
 * Clear all chat sessions (for testing)
 */
export async function clearAllChatSessions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAT_SESSIONS_KEY);
  } catch (error) {
    console.error("Failed to clear chat sessions:", error);
  }
}
