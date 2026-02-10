import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, Keyboard, InputAccessoryView, KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { useFontSize } from "@/lib/font-size-provider";
import { trpc } from "@/lib/trpc";
import { saveJournalEntry, getJournalEntries } from "@/lib/storage";
import { updateStatsAfterEntry } from "@/lib/stats-service";
import { toggleWisdomSaved } from "@/lib/saved-wisdom-storage";

export default function FreeNoteScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { getScaledSize } = useFontSize();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showWisdomPanel, setShowWisdomPanel] = useState(false);
  const [wisdomMessages, setWisdomMessages] = useState<Array<{ id: string; name: string; icon: string; guidance: string }>>([]);
  const [isLoadingWisdom, setIsLoadingWisdom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [savedWisdomIds, setSavedWisdomIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const generatePromptsMutation = trpc.ai.generatePrompts.useMutation();

  const wordCount = content.trim().length;

  // Listen for keyboard events
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
        // Keep wisdom panel visible when keyboard shows - user can write while viewing inspiration
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Generate title from content if empty
  const getDisplayTitle = () => {
    if (title.trim()) return title.trim();
    if (content.trim()) {
      const firstLine = content.trim().split('\n')[0];
      return firstLine.length > 20 ? firstLine.substring(0, 20) + '...' : firstLine;
    }
    return language === 'en' ? 'Free Note' : '自由记录';
  };

  // Fetch wisdom from four philosophers
  const fetchWisdom = async () => {
    setIsLoadingWisdom(true);
    // 重置收藏状态，因为这是全新的智者启示
    setSavedWisdomIds(new Set());
    try {
      const displayTitle = getDisplayTitle();
      const result = await generatePromptsMutation.mutateAsync({
        topic: displayTitle,
        content,
        language,
      });
      setWisdomMessages((result.masters || []) as Array<{ id: string; name: string; icon: string; guidance: string }>);
      // Keep keyboard visible so user can continue writing while viewing inspiration
    } catch (error) {
      console.error('Failed to generate wisdom:', error);
      // Fallback wisdom messages
      // Keep keyboard visible so user can continue writing while viewing inspiration
      setWisdomMessages(language === 'en' ? [
        { 
          id: "buddha", 
          name: "The Awakened One", 
          icon: "🪷", 
          guidance: "Just observe this moment. What arises? What passes? No need to hold on, no need to push away. Your awareness itself is freedom." 
        },
        { 
          id: "laozi", 
          name: "Laozi", 
          icon: "☯️", 
          guidance: "An empty valley echoes all sounds. Your heart, when empty, can hold everything. Let your thoughts flow like clouds passing through the sky." 
        },
        { 
          id: "plato", 
          name: "Plato", 
          icon: "🏛️", 
          guidance: "Does this moment you recorded touch upon some eternal truth? What new understanding of life did it give you? Write more about these feelings." 
        },
        { 
          id: "jesus", 
          name: "Messenger of Love", 
          icon: "✨", 
          guidance: "My child, when you look at the world with love and gratitude, you can see grace everywhere. What details in this moment made you feel the presence of love?" 
        }
      ] : [
        { 
          id: "buddha", 
          name: "觉者", 
          icon: "🪷", 
          guidance: "只是观察这个瞬间。什么升起？什么消失？不需执着，也不需排斥。你的觉察本身，就是自由。" 
        },
        { 
          id: "laozi", 
          name: "老子", 
          icon: "☯️", 
          guidance: "空谷回音，因其空而能容纳万声。你的心也是如此。让你的思绪像云彩一样自由流过天空。" 
        },
        { 
          id: "plato", 
          name: "柏拉图", 
          icon: "🏛️", 
          guidance: "你所记录的这个瞬间，是否触碰到了某种永恒的真理？它让你对生命有了什么新的理解？多写一些这方面的感受。" 
        },
        { 
          id: "jesus", 
          name: "爱之使者", 
          icon: "✨", 
          guidance: "孩子，用爱和感恩的心看待世界，你就能看到恩典无处不在。这个瞬间中，有哪些细节让你感受到爱的存在？" 
        }
      ]);
    } finally {
      setIsLoadingWisdom(false);
      // Auto scroll to bottom to show wisdom panel (Android/Web)
      if (Platform.OS !== 'ios') {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
    }
  };

  // Handle clicking the inspiration button
  const handleInspirationPress = async () => {
    console.log('[Inspire] Button clicked, showWisdomPanel:', showWisdomPanel, 'isLoadingWisdom:', isLoadingWisdom);
    if (isLoadingWisdom) {
      console.log('[Inspire] Already loading, ignoring click');
      return; // Prevent multiple simultaneous requests
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If panel is already showing, refresh wisdom content
    if (showWisdomPanel) {
      // Panel is already visible - refresh wisdom
      console.log('[Inspire] Refreshing wisdom');
      await fetchWisdom();
    } else {
      // Panel is hidden - show it and fetch wisdom
      console.log('[Inspire] Showing panel');
      setShowWisdomPanel(true);
      console.log('[Inspire] showWisdomPanel set to true, wisdomMessages.length:', wisdomMessages.length);
      if (wisdomMessages.length === 0) {
        console.log('[Inspire] Fetching initial wisdom');
        await fetchWisdom();
      } else {
        console.log('[Inspire] Using existing wisdom messages');
      }
      // Auto scroll to bottom to show wisdom panel (Android/Web)
      if (Platform.OS !== 'ios') {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
    }
  };

  // Handle refreshing wisdom (get new inspiration)
  const handleRefreshWisdom = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchWisdom();
  };

  // Handle collapsing the wisdom panel
  const handleCollapsePanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowWisdomPanel(false);
  };

  // Handle cancel
  const handleCancel = () => {
    if (content.trim().length > 0) {
      Alert.alert(
        t('discardEntry'),
        language === 'en' ? 'Are you sure you want to discard this note?' : '确定要放弃这篇笔记吗?',
        [
          { text: t('continueWriting'), style: "cancel" },
          { text: t('discard'), style: "destructive", onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  // Handle finish writing
  const handleFinish = async () => {
    if (wordCount < 10) {
      Alert.alert(
        t('contentTooShort'), 
        t('contentTooShortMessage'), 
        [{ text: t('ok') }]
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(true);

    try {
      // Get current count for today
      const allEntries = await getJournalEntries();
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = allEntries.filter(e => e.date === today);
      const currentCount = todayEntries.length;

      const displayTitle = getDisplayTitle();
      
      // Collect favorited wisdom (not needed for saving to storage)
      
      const entry = {
        id: `entry-${Date.now()}`,
        topic: displayTitle,
        content,
        wordCount,
        date: today,
        createdAt: Date.now(),
        source: 'free' as const,
      };

      await saveJournalEntry(entry);
      await updateStatsAfterEntry(entry.id);

      // Reset saving state before navigation
      setIsSaving(false);

      // Navigate to masters summary screen
      router.push({
        pathname: "/masters-summary",
        params: {
          topic: displayTitle,
          content,
          entryId: entry.id,
          currentCount: (currentCount + 1).toString(),
        },
      });
    } catch (error) {
      console.error('Failed to save entry:', error);
      setIsSaving(false);
    }
  };

  const inputAccessoryViewID = 'freeNoteScreenAccessory';

  // Determine if we should show the complete button
  // Hide when keyboard is visible or wisdom panel is showing
  const showCompleteButton = !keyboardVisible && !showWisdomPanel;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={handleCancel}>
              <Text className="text-base" style={{ color: colors.primary }}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">{t('freeNote')}</Text>
            <Text className="text-sm text-muted">{wordCount} {t('chars')}</Text>
          </View>
          
          {/* Title Input - 更柔和的设计 */}
          <View className="bg-surface rounded-xl px-4 py-3" style={{ borderWidth: 1, borderColor: colors.border }}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={language === 'en' ? "Title (optional)" : "标题（可选）"}
              placeholderTextColor={colors.muted}
              className="text-base font-medium text-foreground"
              style={{ padding: 0 }}
            />
          </View>
        </View>

        {/* Content Input - Tap empty area to dismiss keyboard */}
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => Keyboard.dismiss()}
          style={{ flex: 1 }}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={{ flex: 1 }} 
            contentContainerStyle={{ 
              paddingHorizontal: 20, 
              paddingTop: 12, 
              paddingBottom: showCompleteButton ? 100 : 20,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Content Card */}
            <View 
              className="bg-surface rounded-xl p-4" 
              style={{ 
                borderWidth: 1, 
                borderColor: colors.border,
                minHeight: 280,
              }}
            >
              <TextInput
                ref={inputRef}
                value={content}
                onChangeText={(text) => {
                  setContent(text);
                  // Auto scroll to bottom when content changes
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 50);
                }}
                placeholder={language === 'en' ? "Write your thoughts..." : "写下你的想法..."}
                placeholderTextColor={colors.muted}
                multiline
                autoFocus
                returnKeyType="default"
                className="text-foreground leading-relaxed"
                style={{ minHeight: 250, textAlignVertical: 'top', fontSize: getScaledSize(16), lineHeight: getScaledSize(24) }}
                inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
              />
            </View>
          </ScrollView>
        </TouchableOpacity>

        {/* Wisdom Panel - Dark themed bottom sheet, stays visible after keyboard dismissal */}
        {/* Show in main view when keyboard is hidden OR on Android/Web */}
        {showWisdomPanel && (Platform.OS !== 'ios' || !keyboardVisible) && (
          <LinearGradient
            colors={['#1e1b3c', '#2a2550']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ 
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: keyboardVisible ? '40%' : '60%',
              paddingBottom: keyboardVisible ? 8 : insets.bottom + 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            }}
          >
            {/* Panel Header */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
            }}>
              <Text style={{ color: '#f5f5f5', fontSize: 16, fontWeight: '600', textShadowColor: 'rgba(255,255,255,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>
                ✨ {t('sageWisdom')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* New Inspiration Button */}
                <TouchableOpacity 
                  onPress={handleRefreshWisdom}
                  disabled={isLoadingWisdom}
                  style={{ 
                    paddingHorizontal: 12, 
                    paddingVertical: 6, 
                    backgroundColor: 'rgba(184,167,217,0.25)',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text style={{ color: '#b8a7d9', fontSize: 13, fontWeight: '500' }}>
                    {isLoadingWisdom ? t('loading') : t('newWisdom')}
                  </Text>
                </TouchableOpacity>
                {/* Collapse Button */}
                <TouchableOpacity 
                  onPress={handleCollapsePanel}
                  style={{ 
                    paddingHorizontal: 12, 
                    paddingVertical: 6, 
                    backgroundColor: 'rgba(139,157,195,0.2)',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Text style={{ color: '#8b9dc3', fontSize: 13, fontWeight: '500', opacity: 0.85 }}>{language === 'en' ? 'Collapse ↓' : '收起 ↓'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Wisdom Content - Scrollable */}
            <ScrollView 
              style={{ paddingHorizontal: 20 }}
              showsVerticalScrollIndicator={true}
            >
              {isLoadingWisdom ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={{ color: '#a0a0a0', marginTop: 8, fontSize: 14 }}>
                    {t('gettingInspiration')}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 16, paddingBottom: 16 }}>
                  {wisdomMessages.map((master) => (
                    <View key={master.id} style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <Text style={{ fontSize: 20 }}>{master.icon}</Text>
                          <Text style={{ color: '#f5f5f5', fontSize: 16, fontWeight: '600' }}>
                            {master.name}:
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              const isSaved = await toggleWisdomSaved({
                                masterId: master.id as any,
                                masterName: master.name,
                                masterIcon: master.icon,
                                content: master.guidance,
                                entryId: 'free_' + Date.now(),
                                entryTitle: title || (language === 'en' ? 'Free Note' : '自由笔记'),
                                entryDate: new Date().toISOString().split('T')[0],
                                type: 'guidance',
                              });
                              
                              const newSaved = new Set(savedWisdomIds);
                              if (isSaved) {
                                newSaved.add(master.id);
                              } else {
                                newSaved.delete(master.id);
                              }
                              setSavedWisdomIds(newSaved);
                              
                              if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                            } catch (error) {
                              console.error('Failed to toggle wisdom saved:', error);
                            }
                          }}
                          style={{
                            padding: 8,
                            borderRadius: 12,
                            backgroundColor: savedWisdomIds.has(master.id) ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                          }}
                        >
                          <Text style={{ fontSize: 18 }}>
                            {savedWisdomIds.has(master.id) ? '⭐' : '☆'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={{ 
                        color: '#e8e4f0', 
                        fontSize: 15, 
                        lineHeight: 24,
                        paddingLeft: 26,
                        letterSpacing: 0.3,
                      }}>
                        {master.guidance}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        )}

        {/* Floating Inspiration Button - Android only, when keyboard visible - HIDDEN per user request */}
        {/* {Platform.OS === 'android' && keyboardVisible && !showWisdomPanel && (
          <TouchableOpacity
            onPress={handleInspirationPress}
            disabled={isLoadingWisdom}
            style={{ 
              position: 'absolute',
              right: 16,
              bottom: keyboardHeight + 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: colors.primary,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              opacity: content.trim().length > 0 ? 1 : 0.5,
            }}
          >
            <Text style={{ fontSize: 16 }}>💡</Text>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>{t('inspire')}</Text>
          </TouchableOpacity>
        )} */}

        {/* Web Floating Inspiration Button - HIDDEN per user request */}
        {/* {Platform.OS === 'web' && !showWisdomPanel && (
          <TouchableOpacity
            onPress={handleInspirationPress}
            disabled={isLoadingWisdom}
            style={{ 
              position: 'absolute',
              right: 16,
              bottom: 100,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: colors.primary,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              opacity: content.trim().length > 0 ? 1 : 0.5,
            }}
          >
            <Text style={{ fontSize: 16 }}>💡</Text>
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>{t('inspire')}</Text>
          </TouchableOpacity>
        )} */}

        {/* Bottom Complete Button - Show when keyboard and panel are both hidden */}
        {showCompleteButton && (
          <View
            className="px-5 py-4"
            style={{ 
              paddingBottom: insets.bottom + 16,
              backgroundColor: colors.background,
            }}
          >
            <TouchableOpacity
              onPress={handleFinish}
              disabled={wordCount === 0 || isSaving}
              className="rounded-full py-4"
              style={{
                backgroundColor: wordCount === 0 ? colors.border : '#E8A838',
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-base font-semibold text-center" style={{ color: '#FFFFFF' }}>
                  {t('finishEntry')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      </KeyboardAvoidingView>

      {/* iOS InputAccessoryView - Wisdom Panel + Inspiration Button Above Keyboard */}
      {/* Only show when keyboard is visible */}
      {Platform.OS === 'ios' && keyboardVisible && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={{ backgroundColor: colors.background }}>
            {/* Wisdom Panel in InputAccessoryView - Shows above keyboard */}
            {showWisdomPanel && (
              <LinearGradient
                colors={['#1e1b3c', '#2a2550']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ 
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: 200,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255,255,255,0.1)',
                }}
              >
                {/* Panel Header */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 8,
                }}>
                  <Text style={{ color: '#f5f5f5', fontSize: 14, fontWeight: '600', textShadowColor: 'rgba(255,255,255,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 }}>
                    ✨ {t('sageWisdom')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity 
                      onPress={handleRefreshWisdom}
                      disabled={isLoadingWisdom}
                      style={{ 
                        paddingHorizontal: 10, 
                        paddingVertical: 4, 
                        backgroundColor: 'rgba(184,167,217,0.25)',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <Text style={{ color: '#b8a7d9', fontSize: 12, fontWeight: '500' }}>
                        {isLoadingWisdom ? t('loading') : t('newWisdom')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleCollapsePanel}
                      style={{ 
                        paddingHorizontal: 10, 
                        paddingVertical: 4, 
                        backgroundColor: 'rgba(139,157,195,0.2)',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <Text style={{ color: '#8b9dc3', fontSize: 12, fontWeight: '500', opacity: 0.85 }}>{language === 'en' ? 'Collapse ↓' : '收起 ↓'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Wisdom Content - Compact Scrollable */}
                <ScrollView 
                  style={{ paddingHorizontal: 16, maxHeight: 140 }}
                  showsVerticalScrollIndicator={true}
                >
                  {isLoadingWisdom ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  ) : (
                    <View style={{ gap: 10, paddingBottom: 8 }}>
                      {wisdomMessages.map((master) => (
                        <View key={master.id} style={{ gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                              <Text style={{ fontSize: 16 }}>{master.icon}</Text>
                              <Text style={{ color: '#f5f5f5', fontSize: 14, fontWeight: '600' }}>
                                {master.name}:
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={async () => {
                                try {
                                  const isSaved = await toggleWisdomSaved({
                                    masterId: master.id as any,
                                    masterName: master.name,
                                    masterIcon: master.icon,
                                    content: master.guidance,
                                    entryId: 'free_' + Date.now(),
                                    entryTitle: title || (language === 'en' ? 'Free Note' : '\u81ea\u7531\u7b14\u8bb0'),
                                    entryDate: new Date().toISOString().split('T')[0],
                                    type: 'guidance',
                                  });
                                  
                                  const newSaved = new Set(savedWisdomIds);
                                  if (isSaved) {
                                    newSaved.add(master.id);
                                  } else {
                                    newSaved.delete(master.id);
                                  }
                                  setSavedWisdomIds(newSaved);
                                  
                                  if (Platform.OS !== 'web') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  }
                                } catch (error) {
                                  console.error('Failed to toggle wisdom saved:', error);
                                }
                              }}
                              style={{
                                padding: 6,
                                borderRadius: 10,
                                backgroundColor: savedWisdomIds.has(master.id) ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                              }}
                            >
                              <Text style={{ fontSize: 16 }}>
                                {savedWisdomIds.has(master.id) ? '\u2b50' : '\u2606'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={{ 
                            color: '#e8e4f0', 
                            fontSize: 14, 
                            lineHeight: 20,
                            paddingLeft: 20,
                            letterSpacing: 0.2,
                          }}>
                            {master.guidance}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </LinearGradient>
            )}

            {/* Toolbar with Dismiss and Inspiration buttons only */}
            <View
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderTopWidth: showWisdomPanel ? 0 : 0.5,
                borderTopColor: colors.border,
                backgroundColor: showWisdomPanel ? '#1a1a2e' : colors.background,
              }}
            >
              {/* Dismiss Keyboard Button */}
              <TouchableOpacity
                onPress={() => Keyboard.dismiss()}
                style={{ 
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 18,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 13 }}>↓ {language === 'en' ? 'Done' : '收起'}</Text>
              </TouchableOpacity>

              {/* Inspiration Button only - Complete button removed, user can dismiss keyboard to see bottom button */}
              <TouchableOpacity
                onPress={handleInspirationPress}
                disabled={isLoadingWisdom}
                style={{ 
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: 'rgba(184,167,217,0.25)',
                  borderRadius: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ fontSize: 14 }}>💡</Text>
                <Text style={{ color: '#b8a7d9', fontSize: 13, fontWeight: '600' }}>{t('inspire')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </InputAccessoryView>
      )}
    </ScreenContainer>
  );
}
