import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { MasterModal } from "@/components/master-modal";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { trpc } from "@/lib/trpc";
import { getJournalEntries, saveJournalEntry } from "@/lib/storage";
import { MasterSummary } from "@/types/journal";
import { toggleWisdomSaved, isWisdomSaved } from "@/lib/saved-wisdom-storage";
import { Platform } from "react-native";

/**
 * Masters Summary Screen - Grid Layout with Modal
 * Displays 4 wise masters in a 2x2 grid
 * Tap a master to open a modal with their full summary
 */
export default function MastersSummaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{ topic: string; content: string; entryId?: string }>();
  const [masters, setMasters] = useState<Array<{ id: string; name: string; icon: string; summary: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState<{ id: string; name: string; icon: string; summary: string } | null>(null);
  const [savedWisdomIds, setSavedWisdomIds] = useState<Set<string>>(new Set());
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  const generateSummaryMutation = trpc.ai.generateMastersSummary.useMutation();

  useEffect(() => {
    loadSummaries();
  }, []);

  // Load saved status when masters are loaded
  useEffect(() => {
    if (masters.length > 0) {
      loadSavedStatus();
    }
  }, [masters]);

  // Load saved status
  const loadSavedStatus = async () => {
    if (!params.entryId) return;
    const savedIds = new Set<string>();
    for (const master of masters) {
      const savedId = await isWisdomSaved(master.id, master.summary, params.entryId);
      if (savedId) {
        savedIds.add(master.id);
      }
    }
    setSavedWisdomIds(savedIds);
  };

  // Toggle save status
  const handleToggleSave = async (master: { id: string; name: string; icon: string; summary: string }) => {
    if (!params.entryId) {
      console.warn('No entryId provided, cannot save wisdom');
      return;
    }
    
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const isSaved = await toggleWisdomSaved({
        masterId: master.id as 'jesus' | 'plato' | 'laozi' | 'buddha',
        masterName: master.name,
        masterIcon: master.icon,
        content: master.summary,
        entryId: params.entryId,
        entryTitle: params.topic || '',
        entryDate: new Date().toISOString().split('T')[0],
        type: 'summary' as const,
      });
      
      setSavedWisdomIds(prev => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.add(master.id);
        } else {
          newSet.delete(master.id);
        }
        return newSet;
      });
      
      // Show success feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          isSaved ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
        );
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      Alert.alert(
        language === 'en' ? 'Error' : '错误',
        language === 'en' ? 'Failed to save wisdom' : '收藏失败',
        [{ text: language === 'en' ? 'OK' : '确定' }]
      );
    }
  };

  const loadSummaries = async () => {
    try {
      const result = await generateSummaryMutation.mutateAsync({
        topic: params.topic || "",
        content: params.content || "",
        language,
      });
      console.log('[MastersSummary] API result:', JSON.stringify(result, null, 2));
      const mastersData = (result.masters || []) as Array<{ id: string; name: string; icon: string; summary: string }>;
      setMasters(mastersData);
      setIsAIGenerated(mastersData.length > 0);
      console.log('[MastersSummary] Masters set:', mastersData.length, 'isAI:', mastersData.length > 0);
      
      // Auto-save mastersSummary immediately after AI generation
      if (mastersData.length > 0 && params.entryId) {
        try {
          const entries = await getJournalEntries();
          const matchingEntry = entries.find(e => e.id === params.entryId);
          if (matchingEntry) {
            const updatedEntry = {
              ...matchingEntry,
              mastersSummary: mastersData as MasterSummary[],
            };
            await saveJournalEntry(updatedEntry);
            console.log('[MastersSummary] Auto-saved mastersSummary to entry:', matchingEntry.id);
          }
        } catch (saveError) {
          console.error('[MastersSummary] Failed to auto-save:', saveError);
        }
      }
    } catch (error) {
      console.error("Failed to generate summaries:", error);
      // Fallback data - Order matches backend: jesus, plato, laozi, buddha
      setMasters(language === 'en' ? [
        { id: "jesus", name: "Messenger of Love", icon: "✨", summary: "My child, the details you recorded show me what love looks like in action. Love is not an abstract concept, but is embodied in these small acts of care and giving. When you can see and cherish this kindness, you are seeing the world through grateful eyes." },
        { id: "plato", name: "Plato", icon: "🏛️", summary: "Your words reveal a soul that seeks to understand the deeper nature of things. The gratitude you express embodies beautiful qualities—sincerity, kindness, and truth. These qualities are reflections of the eternal Good that exists beyond the material world." },
        { id: "laozi", name: "Lao Tzu", icon: "☯️", summary: "You can find beauty in ordinary daily life—this is the wisdom of contentment. Many people chase after distant grand things while overlooking the small beauties nearby. These simple moments you recorded are the true flavor of life." },
        { id: "buddha", name: "The Awakened One", icon: "🪷", summary: "Your words let me see the clarity within you. This experience touched you to the reality of life—love is real, kindness is real, connection is real. When you can see and be grateful for these truths, you are moving closer to inner peace." }
      ] : [
        { id: "jesus", name: "爱之使者", icon: "✨", summary: "孩子，你记录的这些细节让我看到了爱的具体样子。爱不是抽象的概念,而是体现在这些小小的关心和付出中。当你能看见并珍惜这些善意,你就在用感恩的眼睛看世界。" },
        { id: "plato", name: "柏拉图", icon: "🏛️", summary: "你的文字展现了一个追求事物本质的灵魂。你所表达的感恩体现了美好的品质——真诚、善良、真理。这些品质是超越物质世界的永恒之善的投影。" },
        { id: "laozi", name: "老子", icon: "☯️", summary: "你能在平凡的日常中发现美好，这是生活的智慧。很多人总是追逐远方的大事,却忽略了身边的小美好。你记录的这些简单的瞬间,恰恰是生活的真味。" },
        { id: "buddha", name: "觉者", icon: "🪷", summary: "你的文字让我看见了你内心的清明。这件事让你触碰到了生命的实相——爱是真实的、善意是真实的、连接是真实的。当你能够看见并感恩这些真理,你就在向内心的安宁走近。" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Only save if AI-generated content (not fallback placeholder text)
    // Auto-save in loadSummaries already handles the primary save path;
    // this is a safety net in case auto-save failed
    if (masters.length > 0 && isAIGenerated && params.entryId) {
      try {
        const entries = await getJournalEntries();
        const matchingEntry = entries.find(e => e.id === params.entryId);
        
        if (matchingEntry && (!matchingEntry.mastersSummary || matchingEntry.mastersSummary.length === 0)) {
          // Only save if not already saved by auto-save
          const updatedEntry = {
            ...matchingEntry,
            mastersSummary: masters as MasterSummary[],
          };
          await saveJournalEntry(updatedEntry);
          console.log('[MastersSummary] Backup save mastersSummary to entry:', matchingEntry.id);
        }
      } catch (error) {
        console.error('Failed to save masters summary:', error);
      }
    }
    
    router.push("/(tabs)");
  };

  const handleMasterPress = (master: { id: string; name: string; icon: string; summary: string }) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('[MastersSummary] Master pressed:', master.id);
    console.log('[MastersSummary] Master summary length:', master.summary?.length || 0);
    console.log('[MastersSummary] Master summary:', master.summary);
    setSelectedMaster(master);
  };

  const handleChatPress = (masterId: string) => {
    setSelectedMaster(null);
    router.push({
      pathname: '/(tabs)/chat',
      params: { masterId }
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <View style={{ flex: 1, padding: 20, paddingTop: 60, paddingBottom: 40 }}>
        {/* Header - Title only */}
        <View className="items-center mb-12">
          <Text className="text-3xl font-bold text-foreground mb-2">
            ✨ {language === 'en' ? 'Wisdom from the Sages' : '来自智者的总结'} ✨
          </Text>
        </View>

        {/* Masters Grid */}
        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">
              {language === 'en' ? 'The sages are reading your words...' : '智者正在阅读你的文字...'}
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {/* Row 1 */}
            <View className="flex-row gap-4">
              {masters.slice(0, 2).map((master) => (
                <TouchableOpacity
                  key={master.id}
                  onPress={() => handleMasterPress(master)}
                  className="flex-1 rounded-3xl"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: colors.border,
                    paddingVertical: 28,
                    paddingHorizontal: 16,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <View className="items-center gap-2">
                    <Text style={{ fontSize: 32 }}>{master.icon}</Text>
                    <Text className="text-base font-bold text-foreground text-center">
                      {master.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Row 2 */}
            <View className="flex-row gap-4">
              {masters.slice(2, 4).map((master) => (
                <TouchableOpacity
                  key={master.id}
                  onPress={() => handleMasterPress(master)}
                  className="flex-1 rounded-3xl"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: colors.border,
                    paddingVertical: 28,
                    paddingHorizontal: 16,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <View className="items-center gap-2">
                    <Text style={{ fontSize: 32 }}>{master.icon}</Text>
                    <Text className="text-base font-bold text-foreground text-center">
                      {master.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Subtitle - below cards */}
        <View className="items-center" style={{ marginTop: 40 }}>
          <Text style={{ fontSize: 22, color: colors.muted, textAlign: 'center' }}>
            {language === 'en' ? 'Tap a sage to read their wisdom' : '点击智者查看他们的智慧'}
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Complete Button - centered between subtitle and bottom */}
        {!selectedMaster && (
          <TouchableOpacity
            onPress={handleComplete}
            disabled={isLoading}
            style={{
              backgroundColor: colors.primary,
              opacity: isLoading ? 0.5 : 1,
            }}
            className="rounded-full py-4 px-8"
          >
            <Text className="text-background text-center font-semibold text-lg">
              {t('done')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />
      </View>

      {/* Master Modal */}
      {selectedMaster && (
        <MasterModal
          visible={!!selectedMaster}
          master={selectedMaster}
          isSaved={savedWisdomIds.has(selectedMaster.id)}
          topic={params.topic}
          userContent={params.content}
          onClose={() => setSelectedMaster(null)}
          onToggleSave={() => handleToggleSave(selectedMaster)}
        />
      )}
    </ScreenContainer>
  );
}
