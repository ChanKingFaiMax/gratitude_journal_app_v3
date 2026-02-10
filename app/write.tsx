import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Keyboard, Alert, ActivityIndicator, InputAccessoryView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useRef, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from '@/hooks/use-language';
import { useFontSize } from '@/lib/font-size-provider';
import { trpc } from "@/lib/trpc";
import { saveJournalEntry } from "@/lib/storage";
import { updateStatsAfterEntry } from "@/lib/stats-service";
import { toggleWisdomSaved, isWisdomSaved } from "@/lib/saved-wisdom-storage";

export default function WriteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { getScaledSize } = useFontSize();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ topic: string; topicId: string; currentCount: string; source?: string }>();
  const currentCount = parseInt(params.currentCount || "0");
  const topic = params.topic || (language === 'en' ? "Gratitude Journal" : "感恩日记");

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

  // Fetch wisdom from four philosophers
  const fetchWisdom = async () => {
    setIsLoadingWisdom(true);
    // 重置收藏状态，因为这是全新的智者启示
    setSavedWisdomIds(new Set());
    try {
      const result = await generatePromptsMutation.mutateAsync({
        topic,
        content,
        language,
      });
      setWisdomMessages((result.masters || []) as Array<{ id: string; name: string; icon: string; guidance: string }>);
      // Auto dismiss keyboard after wisdom is loaded
      Keyboard.dismiss();
    } catch (error) {
      console.error('Failed to generate wisdom:', error);
      // Fallback wisdom messages
      // Auto dismiss keyboard after wisdom is loaded
      Keyboard.dismiss();
      setWisdomMessages(language === 'en' ? [
        { 
          id: "buddha", 
          name: "The Awakened One", 
          icon: "🪷", 
          guidance: "In this moment, just observe. What do you see? What do you feel? No need to judge, just be aware. Your awareness itself is the practice." 
        },
        { 
          id: "laozi", 
          name: "Laozi", 
          icon: "☯️", 
          guidance: "Water benefits all things without competing. How did this kindness flow to you naturally? Like wind through bamboo, let your words flow without force." 
        },
        { 
          id: "plato", 
          name: "Plato", 
          icon: "🏛️", 
          guidance: "Think deeply: Why is this so important to you? What inner desires does it fulfill? How would your life be different without it? Write more about these feelings." 
        },
        { 
          id: "jesus", 
          name: "Messenger of Love", 
          icon: "✨", 
          guidance: "My child, love is the greatest gift. Is there love flowing behind this gratitude? Whose love is it? What would you like to say to them? Write it down." 
        }
      ] : [
        { 
          id: "buddha", 
          name: "觉者", 
          icon: "🪷", 
          guidance: "此刻，只是观察。你看到了什么？感受到了什么？不需评判，只是觉察。你的觉察本身，就是修行。" 
        },
        { 
          id: "laozi", 
          name: "老子", 
          icon: "☯️", 
          guidance: "水利万物而不争。这份善意是如何自然地流淌到你身上的？像风过竹林，让你的文字也自然流淌，不必强求。" 
        },
        { 
          id: "plato", 
          name: "柏拉图", 
          icon: "🏛️", 
          guidance: "深入想想：为什么这件事对你如此重要？它满足了你内心的哪些渴望？如果没有它，你的生活会有什么不同？多写一些这方面的感受。" 
        },
        { 
          id: "jesus", 
          name: "爱之使者", 
          icon: "✨", 
          guidance: "孩子，爱是最大的礼物。这份感恩背后，是否有一份爱在流动？是谁的爱？你想对他们说什么？把这些话写下来吧。" 
        }
      ]);
    } finally {
      setIsLoadingWisdom(false);
    }
  };

  // Handle clicking the inspiration button
  const handleInspirationPress = async () => {
    if (isLoadingWisdom) {
      console.log('[Inspire] Already loading, ignoring click');
      return; // Prevent multiple simultaneous requests
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If panel is already showing, refresh wisdom content
    // If panel is hidden, show it and fetch wisdom
    if (showWisdomPanel) {
      // Panel is showing - refresh content instead of closing
      console.log('[Inspire] Refreshing wisdom');
      await fetchWisdom();
    } else {
      // Panel is hidden - show it and fetch wisdom
      console.log('[Inspire] Showing panel');
      setShowWisdomPanel(true);
      if (wisdomMessages.length === 0) {
        console.log('[Inspire] Fetching initial wisdom');
        await fetchWisdom();
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
        t('discardEntryConfirm'),
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
      // Collect favorited wisdom (not needed for saving to storage)
      
      const entry = {
        id: `entry-${Date.now()}`,
        topic,
        content,
        wordCount,
        date: new Date().toISOString().split('T')[0],
        createdAt: Date.now(),
        source: (params.source || 'gratitude') as 'gratitude' | 'philosophy' | 'free',
      };

      await saveJournalEntry(entry);
      await updateStatsAfterEntry(entry.id);

      // Reset saving state before navigation
      setIsSaving(false);

      // Navigate to masters summary screen
      router.push({
        pathname: "/masters-summary",
        params: {
          topic,
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

  const inputAccessoryViewID = 'writeScreenAccessory';

  // Determine if we should show the complete button
  // Show when: keyboard is hidden AND wisdom panel is hidden
  const showCompleteButton = !keyboardVisible && !showWisdomPanel;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-5 py-4 border-b" style={{ borderBottomColor: colors.border }}>
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity onPress={handleCancel}>
              <Text className="text-base" style={{ color: colors.primary }}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text className="text-sm text-muted">{wordCount} {t('chars')}</Text>
          </View>
          <Text className="text-lg font-semibold text-foreground" numberOfLines={2}>
            {topic}
          </Text>
        </View>

        {/* Content Input - Tap empty area to dismiss keyboard */}
        {Platform.OS === 'web' ? (
          <ScrollView 
            ref={scrollViewRef}
            style={{ flex: 1 }} 
            contentContainerStyle={{ 
              paddingHorizontal: 20, 
              paddingVertical: 16, 
              paddingBottom: showCompleteButton ? 100 : 20,
              flexGrow: 1,
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
              placeholder={language === 'en' ? "Write your thoughts..." : "写下你的思考..."}
              placeholderTextColor={colors.muted}
              multiline
              autoFocus
              returnKeyType="default"
              className="text-foreground leading-relaxed"
              style={{ minHeight: 300, fontSize: getScaledSize(16), lineHeight: getScaledSize(24) }}
            />
          </ScrollView>
        ) : (
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
                paddingVertical: 16, 
                paddingBottom: showCompleteButton ? 100 : 20,
                flexGrow: 1,
              }}
              keyboardShouldPersistTaps="handled"
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
                placeholder={language === 'en' ? "Write your thoughts..." : "写下你的思考..."}
                placeholderTextColor={colors.muted}
                multiline
                autoFocus
                returnKeyType="default"
                className="text-foreground leading-relaxed"
                style={{ minHeight: 300, fontSize: getScaledSize(16), lineHeight: getScaledSize(24) }}
                inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
              />
            </ScrollView>
          </TouchableOpacity>
        )}

        {/* Wisdom Panel - Dark themed bottom sheet, stays visible while writing */}
        {showWisdomPanel && (
          <LinearGradient
            colors={['#1e1b3c', '#2a2550']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ 
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: keyboardVisible ? '40%' : '55%',
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
              ) : wisdomMessages.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#a0a0a0', fontSize: 14 }}>
                    {t('tapInspireToGetWisdom')}
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
                                entryId: params.topicId || 'temp',
                                entryTitle: topic,
                                entryDate: new Date().toISOString().split('T')[0],
                                type: 'guidance',
                              });
                              
                              // Update local state
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
                        fontSize: getScaledSize(15), 
                        lineHeight: getScaledSize(24),
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

        {/* Native Floating Inspiration Button (keyboard上方) - HIDDEN per user request */}
        {/* {Platform.OS !== 'web' && keyboardVisible && !showWisdomPanel && (
          <TouchableOpacity
            onPress={handleInspirationPress}
            disabled={isLoadingWisdom}
            style={{ 
              position: 'absolute',
              right: 16,
              bottom: keyboardHeight + 16,
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

      {/* iOS InputAccessoryView - Wisdom Panel + Inspiration Button Above Keyboard */}
      {Platform.OS === 'ios' && (
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
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>{master.icon}</Text>
                            <Text style={{ color: '#f5f5f5', fontSize: 14, fontWeight: '600' }}>
                              {master.name}:
                            </Text>
                          </View>
                          <Text style={{ 
                            color: '#e8e4f0', 
                            fontSize: getScaledSize(14), 
                            lineHeight: getScaledSize(20),
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
