import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Keyboard,
  Dimensions,
  InputAccessoryView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { loadAndConsumeChatContext } from "@/lib/chat-context-storage";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { trpc } from "@/lib/trpc";
import { loadChatSessions, saveChatMessage, type ChatMessage } from "@/lib/chat-storage";
import { getProfileSummary, getUserProfile, saveUserProfile, saveProfileSummary, shouldUpdateProfile } from "@/lib/user-profile-storage";
import { getJournalEntries } from "@/lib/storage";

const MASTERS = [
  { id: 'buddha', name: '觉者', nameEn: 'Buddha', icon: '🪷' },
  { id: 'laozi', name: '老子', nameEn: 'Laozi', icon: '☯️' },
  { id: 'plato', name: '柏拉图', nameEn: 'Plato', icon: '🏛️' },
  { id: 'jesus', name: '爱之使者', nameEn: 'Messenger of Love', icon: '✨' },
];

export default function ChatScreen() {
  const colors = useColors();
  const { language } = useLanguage();
  const params = useLocalSearchParams<{ masterId?: string; context?: string; initContext?: string }>();
  const insets = useSafeAreaInsets();
  
  const [selectedMasterId, setSelectedMasterId] = useState(params.masterId || 'buddha');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  
  // Unique ID for chat input accessory view
  const chatInputAccessoryID = 'chat-input-accessory';

  // @ts-ignore - Type not yet updated after server changes
  const generateChatMutation = trpc.ai.generateChat.useMutation();
  // @ts-ignore - Type not yet updated after server changes
  const extractProfileMutation = trpc.ai.extractUserProfile.useMutation();

  const selectedMaster = MASTERS.find(m => m.id === selectedMasterId) || MASTERS[0];

  // Tab bar height calculation
  const TAB_BAR_HEIGHT = 56 + Math.max(insets.bottom, 8);

  // Listen to keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Load chat history and user profile
  useEffect(() => {
    loadChatHistory();
    loadUserContext();
  }, [selectedMasterId]);

  // Auto scroll to bottom when messages change or keyboard appears
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages.length, keyboardHeight]);

  const loadUserContext = async () => {
    try {
      let summary = await getProfileSummary();
      
      if (!summary) {
        const entries = await getJournalEntries();
        if (entries.length >= 5) {
          console.log('[UserProfile] Extracting profile from', entries.length, 'entries');
          await extractAndSaveProfile(entries);
          summary = await getProfileSummary();
        }
      } else {
        const profile = await getUserProfile();
        if (profile) {
          const entries = await getJournalEntries();
          const newEntriesCount = entries.length - profile.meta.totalEntries;
          if (await shouldUpdateProfile(newEntriesCount)) {
            console.log('[UserProfile] Profile needs update, extracting...');
            await extractAndSaveProfile(entries);
            summary = await getProfileSummary();
          }
        }
      }
      
      if (summary) {
        setUserContext(summary.summary);
        console.log('[UserProfile] Loaded user context for chat');
      }
    } catch (error) {
      console.error('[UserProfile] Failed to load user context:', error);
    }
  };

  const extractAndSaveProfile = async (entries: any[]) => {
    try {
      const formattedEntries = entries.map(e => ({
        topic: e.topic,
        content: e.content,
        createdAt: new Date(e.createdAt).toISOString(),
      }));

      const result = await extractProfileMutation.mutateAsync({
        entries: formattedEntries,
        language,
      });

      if (result.success && result.profile && result.summary) {
        await saveUserProfile(result.profile);
        await saveProfileSummary(result.summary);
        console.log('[UserProfile] Profile extracted and saved successfully');
      }
    } catch (error) {
      console.error('[UserProfile] Failed to extract profile:', error);
    }
  };

  // Initialize chat context from saved data
  useEffect(() => {
    if (params.initContext === 'true') {
      initializeChatContext();
    }
  }, [params.initContext, selectedMasterId]);

  const initializeChatContext = async () => {
    try {
      const context = await loadAndConsumeChatContext();
      if (!context) {
        console.log('[Chat] No context found');
        return;
      }

      if (context.masterId !== selectedMasterId) {
        console.log('[Chat] Context master mismatch, ignoring');
        return;
      }

      const sessions = await loadChatSessions();
      const session = sessions.find(s => s.masterId === selectedMasterId);
      const existingMessages = session?.messages || [];

      const hasContext = existingMessages.some(m => 
        m.content === context.userContent || m.content === context.masterSummary
      );

      if (hasContext) {
        console.log('[Chat] Context already exists, skipping initialization');
        setMessages(existingMessages);
        return;
      }

      const timestamp = Date.now();
      
      const topicMessage: ChatMessage = {
        id: `topic-${timestamp}`,
        masterId: selectedMasterId,
        role: 'user',
        content: language === 'en' ? `📝 Topic: ${context.topic}` : `📝 主题：${context.topic}`,
        timestamp: timestamp,
      };

      const userMessage: ChatMessage = {
        id: `user-${timestamp}`,
        masterId: selectedMasterId,
        role: 'user',
        content: context.userContent,
        timestamp: timestamp + 1,
      };

      const masterMessage: ChatMessage = {
        id: `master-${timestamp}`,
        masterId: selectedMasterId,
        role: 'master',
        content: context.masterSummary,
        timestamp: timestamp + 2,
      };

      const newMessages = [...existingMessages, topicMessage, userMessage, masterMessage];
      setMessages(newMessages);

      await saveChatMessage(topicMessage);
      await saveChatMessage(userMessage);
      await saveChatMessage(masterMessage);

      console.log('[Chat] Context initialized with 3 messages');
    } catch (error) {
      console.error('[Chat] Failed to initialize context:', error);
    }
  };

  const loadChatHistory = async () => {
    const sessions = await loadChatSessions();
    const session = sessions.find(s => s.masterId === selectedMasterId);
    setMessages(session?.messages || []);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      masterId: selectedMasterId,
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const chatHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      let firstMessage = userMessage.content;
      if (userContext && messages.length === 0) {
        firstMessage = `[User Context: ${userContext}]\n\n${userMessage.content}`;
      }

      const result = await generateChatMutation.mutateAsync({
        masterId: selectedMasterId,
        userMessage: firstMessage,
        chatHistory,
        language,
      });

      const masterMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        masterId: selectedMasterId,
        role: 'master',
        content: result.response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, masterMessage]);
      await saveChatMessage(masterMessage);
    } catch (error) {
      console.error('Failed to generate chat response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMasterSwitch = (masterId: string) => {
    if (masterId === selectedMasterId) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedMasterId(masterId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Safe area for top */}
      <View style={{ height: insets.top, backgroundColor: colors.background }} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground, textAlign: 'center' }}>
            {language === 'en' ? 'Chat with Masters' : '与智者对话'}
          </Text>
        </View>

        {/* Master Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border }}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {MASTERS.map(master => {
            const isSelected = master.id === selectedMasterId;
            return (
              <TouchableOpacity
                key={master.id}
                onPress={() => handleMasterSwitch(master.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: isSelected ? 2 : 0,
                  borderBottomColor: '#E8A838',
                }}
              >
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 24 }}>{master.icon}</Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: isSelected ? colors.foreground : colors.muted,
                    fontWeight: isSelected ? '600' : '400',
                  }}>
                    {language === 'en' ? master.nameEn : master.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chat Messages - flex: 1 to take remaining space */}
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: 16, 
            paddingBottom: 8,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {messages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>{selectedMaster.icon}</Text>
              <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>
                {language === 'en' 
                  ? `Start a conversation with ${selectedMaster.nameEn}` 
                  : `开始与${selectedMaster.name}的对话`}
              </Text>
            </View>
          ) : (
            messages.map(message => {
              const isTopicMessage = message.content.startsWith('📝');
              
              return (
                <View
                  key={message.id}
                  style={{
                    marginBottom: 12,
                    alignSelf: isTopicMessage ? 'center' : (message.role === 'user' ? 'flex-end' : 'flex-start'),
                    maxWidth: isTopicMessage ? '100%' : '85%',
                  }}
                >
                  {message.role === 'master' && !isTopicMessage && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontSize: 16 }}>{selectedMaster.icon}</Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {language === 'en' ? selectedMaster.nameEn : selectedMaster.name}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      backgroundColor: isTopicMessage ? 'transparent' : (message.role === 'user' ? '#E8A838' : colors.surface),
                      paddingHorizontal: isTopicMessage ? 8 : 12,
                      paddingVertical: isTopicMessage ? 6 : 10,
                      borderRadius: 16,
                      borderWidth: isTopicMessage ? 1 : 0,
                      borderColor: isTopicMessage ? colors.border : 'transparent',
                      borderStyle: 'dashed',
                    }}
                  >
                    <Text style={{ 
                      fontSize: isTopicMessage ? 13 : 15, 
                      lineHeight: 21, 
                      color: isTopicMessage ? colors.muted : (message.role === 'user' ? '#fff' : colors.foreground),
                      textAlign: isTopicMessage ? 'center' : 'left',
                      fontStyle: isTopicMessage ? 'italic' : 'normal',
                    }}>
                      {message.content}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
          {isLoading && (
            <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={{ fontSize: 16 }}>{selectedMaster.icon}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {language === 'en' ? selectedMaster.nameEn : selectedMaster.name}
                </Text>
              </View>
              <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 16 }}>
                <ActivityIndicator size="small" color={colors.muted} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'flex-end', 
            gap: 10,
            paddingHorizontal: 16, 
            paddingTop: 8,
            paddingBottom: 8,
            borderTopWidth: 0.5,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <TextInput
            ref={textInputRef}
            value={inputText}
            onChangeText={setInputText}
            placeholder={language === 'en' ? 'Type a message...' : '输入消息...'}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            returnKeyType="default"
            blurOnSubmit={false}
            inputAccessoryViewID={Platform.OS === 'ios' ? chatInputAccessoryID : undefined}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 15,
              color: colors.foreground,
              maxHeight: 100,
              minHeight: 40,
            }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            style={{
              backgroundColor: inputText.trim() && !isLoading ? '#E8A838' : colors.border,
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 0,
            }}
          >
            <Text style={{ fontSize: 18, color: inputText.trim() && !isLoading ? '#fff' : colors.muted }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* iOS InputAccessoryView - Only Done button */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={chatInputAccessoryID}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: colors.surface,
            borderTopWidth: 0.5,
            borderTopColor: colors.border,
          }}>
            <TouchableOpacity
              onPress={() => Keyboard.dismiss()}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: colors.background,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 13 }}>↓ {language === 'en' ? 'Done' : '收起'}</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}
