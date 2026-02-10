import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { MasterModal } from "@/components/master-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { useFontSize } from "@/lib/font-size-provider";
import { getJournalEntries, saveJournalEntry } from "@/lib/storage";
import { saveChatContext } from "@/lib/chat-context-storage";
import { JournalEntry, MasterSummary } from "@/types/journal";
import { trpc } from "@/lib/trpc";

export default function EntryDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { getScaledSize } = useFontSize();
  const params = useLocalSearchParams<{ entryId: string }>();
  
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Master modal state
  const [selectedMaster, setSelectedMaster] = useState<{ id: string; name: string; icon: string; summary: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Regenerate masters state
  const [isRegenerating, setIsRegenerating] = useState(false);
  const generateSummaryMutation = trpc.ai.generateMastersSummary.useMutation();

  useEffect(() => {
    loadEntry();
  }, [params.entryId]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const entries = await getJournalEntries();
      const found = entries.find(e => e.id === params.entryId);
      
      if (found) {
        setEntry(found);
        setEditedContent(found.content);
      } else {
        setError(language === 'en' ? "Entry not found" : "未找到该日记");
      }
    } catch (err) {
      console.error("Error loading entry:", err);
      setError(language === 'en' ? "Failed to load" : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!entry || !editedContent.trim()) return;
    
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const updatedEntry: JournalEntry = {
        ...entry,
        content: editedContent.trim(),
        wordCount: editedContent.trim().length,
      };
      
      await saveJournalEntry(updatedEntry);
      setEntry(updatedEntry);
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Error saving entry:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(entry?.content || '');
    setIsEditing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // Handle tapping a master card to open modal or start chat
  const handleMasterPress = (master: { id: string; name: string; icon: string; summary: string }) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedMaster(master);
    setModalVisible(true);
  };

  // Regenerate masters summary via AI
  const handleRegenerateMasters = async () => {
    if (!entry || isRegenerating) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRegenerating(true);

    try {
      const result = await generateSummaryMutation.mutateAsync({
        topic: entry.topic || "",
        content: entry.content || "",
        language,
      });

      const mastersData = (result.masters || []) as MasterSummary[];

      if (mastersData.length > 0) {
        // Save to storage
        const entries = await getJournalEntries();
        const matchingEntry = entries.find(e => e.id === entry.id);
        if (matchingEntry) {
          const updatedEntry = {
            ...matchingEntry,
            mastersSummary: mastersData,
          };
          await saveJournalEntry(updatedEntry);
          setEntry(updatedEntry);
          console.log('[EntryDetail] Regenerated and saved mastersSummary for entry:', entry.id);
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        throw new Error('Empty masters data');
      }
    } catch (err) {
      console.error('[EntryDetail] Failed to regenerate masters:', err);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        language === 'en' ? 'Generation Failed' : '生成失败',
        language === 'en' 
          ? 'Failed to generate sage wisdom. Please check your network and try again.' 
          : '智者评论生成失败，请检查网络后重试。',
        [{ text: language === 'en' ? 'OK' : '确定' }]
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4">{t('loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !entry) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-xl text-foreground mb-4">{error || (language === 'en' ? "Entry not found" : "未找到日记")}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-6 py-3 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-background font-semibold">{t('back')}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Display AI-generated masters summary if available
  const mastersToDisplay: Array<{ id: string; name: string; icon: string; summary: string }> = 
    entry.mastersSummary && entry.mastersSummary.length > 0
      ? entry.mastersSummary
      : [];
  
  const hasMastersSummary = mastersToDisplay.length > 0;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-5 py-4 border-b flex-row items-center justify-between" style={{ borderBottomColor: colors.border }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
          >
            <Text className="text-base" style={{ color: colors.primary }}>{t('back')}</Text>
          </TouchableOpacity>
          
          {/* Edit/Save Button */}
          {isEditing ? (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCancelEdit}
                activeOpacity={0.6}
              >
                <Text className="text-base text-muted">{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.6}
                disabled={saving}
              >
                <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                  {saving ? (language === 'en' ? 'Saving...' : '保存中...') : t('save')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditing(true);
              }}
              activeOpacity={0.6}
            >
              <Text className="text-base" style={{ color: colors.primary }}>{t('edit')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
        >
          {/* Date */}
          <View className="flex-row items-center gap-2 mb-4">
            <IconSymbol name="calendar" size={18} color={colors.muted} />
            <Text className="text-sm text-muted">{formatDate(entry.date)}</Text>
          </View>

          {/* Topic */}
          <Text className="text-2xl font-bold text-foreground mb-6">
            {entry.topic}
          </Text>

          {/* Content - Editable or Display */}
          {isEditing ? (
            <View className="bg-surface rounded-2xl p-4 border mb-6" style={{ borderColor: colors.primary }}>
              <TextInput
                value={editedContent}
                onChangeText={setEditedContent}
                multiline
                autoFocus
                className="text-base text-foreground leading-relaxed"
                style={{ minHeight: 150, textAlignVertical: 'top' }}
                placeholder={language === 'en' ? 'Write your thoughts...' : '写下你的想法...'}
                placeholderTextColor={colors.muted}
              />
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-5 border mb-6" style={{ borderColor: colors.border }}>
              <Text 
                className="text-foreground leading-relaxed"
                style={{ 
                  fontSize: getScaledSize(16), 
                  lineHeight: getScaledSize(24) 
                }}
              >
                {entry.content}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View className="bg-surface rounded-xl p-4 border mb-6" style={{ borderColor: colors.border }}>
            <Text className="text-xs text-muted mb-1">{language === 'en' ? 'Characters' : '字数'}</Text>
            <Text className="text-2xl font-bold text-foreground">
              {isEditing ? editedContent.length : entry.wordCount || 0}
            </Text>
          </View>

          {/* Sage Wisdom Section */}
          {!isEditing && (
            <View style={styles.mastersSection}>
              {/* Section header with regenerate button */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: getScaledSize(18) }]}>
                  ✨ {language === 'en' ? 'Wisdom from the Sages' : '来自智者的总结'}
                </Text>
                <TouchableOpacity
                  onPress={handleRegenerateMasters}
                  disabled={isRegenerating}
                  activeOpacity={0.6}
                  style={[
                    styles.regenerateBtn,
                    { backgroundColor: colors.primary + '15' },
                  ]}
                >
                  {isRegenerating ? (
                    <ActivityIndicator size={14} color={colors.primary} />
                  ) : (
                    <Text style={{ fontSize: 16 }}>🔄</Text>
                  )}
                  <Text style={[styles.regenerateBtnText, { color: colors.primary }]}>
                    {isRegenerating
                      ? (language === 'en' ? 'Generating...' : '生成中...')
                      : hasMastersSummary
                        ? (language === 'en' ? 'Regenerate' : '重新生成')
                        : (language === 'en' ? 'Generate' : '生成')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Loading state */}
              {isRegenerating && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ color: colors.muted, marginTop: 12, fontSize: 14 }}>
                    {language === 'en' ? 'The sages are reading your words...' : '智者正在阅读你的文字...'}
                  </Text>
                </View>
              )}

              {/* Masters cards */}
              {!isRegenerating && hasMastersSummary && (
                <>
                  <Text style={[styles.sectionHint, { color: colors.muted }]}>
                    {language === 'en' ? 'Tap a master to read full comment & chat' : '点击智者查看完整评论并对话'}
                  </Text>
                  {mastersToDisplay.map((master, index) => (
                    <TouchableOpacity
                      key={master.id || index}
                      onPress={() => handleMasterPress(master)}
                      activeOpacity={0.7}
                      style={[
                        styles.masterCard,
                        { 
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        }
                      ]}
                    >
                      {/* Master header */}
                      <View style={styles.masterCardHeader}>
                        <View style={styles.masterCardHeaderLeft}>
                          <View style={[styles.masterIconBg, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={styles.masterIconText}>{master.icon}</Text>
                          </View>
                          <Text 
                            style={[styles.masterName, { color: colors.foreground, fontSize: getScaledSize(15) }]}
                            numberOfLines={1}
                          >
                            {master.name}
                          </Text>
                        </View>
                        <View style={styles.chatBadge}>
                          <Text style={styles.chatBadgeText}>
                            {language === 'en' ? 'Chat →' : '对话 →'}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Master summary text */}
                      <Text 
                        style={[
                          styles.masterSummaryText, 
                          { 
                            color: colors.foreground,
                            fontSize: getScaledSize(14),
                            lineHeight: getScaledSize(22),
                          }
                        ]}
                      >
                        {master.summary}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Empty state hint */}
              {!isRegenerating && !hasMastersSummary && (
                <View style={styles.emptyHintContainer}>
                  <Text style={{ fontSize: 32, marginBottom: 12 }}>✨</Text>
                  <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 4 }}>
                    {language === 'en' 
                      ? 'No sage wisdom yet for this entry.'
                      : '这篇日记还没有智者评论。'}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                    {language === 'en' 
                      ? 'Tap "Generate" above to receive personalized wisdom.'
                      : '点击上方「生成」按钮获取智者的个性化智慧。'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* AI Summary */}
          {entry.summary && !isEditing && (
            <View className="bg-surface rounded-2xl p-5 border mt-4" style={{ borderColor: colors.border }}>
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-lg">💡</Text>
                <Text className="text-base font-semibold text-foreground">{language === 'en' ? 'AI Summary' : 'AI 总结'}</Text>
              </View>
              <Text className="text-base text-foreground leading-relaxed">
                {entry.summary}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Master Modal for full view + continue chat */}
      <MasterModal
        visible={modalVisible}
        master={selectedMaster}
        isSaved={false}
        topic={entry?.topic}
        userContent={entry?.content}
        onClose={() => {
          setModalVisible(false);
          setSelectedMaster(null);
        }}
        onToggleSave={() => {}}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mastersSection: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    flex: 1,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  regenerateBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHintContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  masterCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  masterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  masterCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  masterIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterIconText: {
    fontSize: 20,
  },
  masterName: {
    fontWeight: '600',
    flex: 1,
  },
  chatBadge: {
    backgroundColor: 'rgba(232, 168, 56, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chatBadgeText: {
    color: '#E8A838',
    fontSize: 12,
    fontWeight: '600',
  },
  masterSummaryText: {
    fontStyle: 'italic',
    opacity: 0.9,
  },
});
