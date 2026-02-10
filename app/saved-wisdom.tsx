import { View, Text, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { SavedWisdom } from "@/types/saved-wisdom";
import { getSavedWisdoms, unsaveWisdom } from "@/lib/saved-wisdom-storage";
import { WisdomShareCard, useWisdomShare } from "@/components/wisdom-share-card";

type MasterFilter = 'all' | 'jesus' | 'plato' | 'laozi' | 'buddha';

export default function SavedWisdomScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { captureRef, captureAndShare } = useWisdomShare();
  const [wisdoms, setWisdoms] = useState<SavedWisdom[]>([]);
  const [filteredWisdoms, setFilteredWisdoms] = useState<SavedWisdom[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<MasterFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentShareWisdom, setCurrentShareWisdom] = useState<string | null>(null);
  const [currentShareMaster, setCurrentShareMaster] = useState<{ name: string; icon: string } | null>(null);

  const loadWisdoms = useCallback(async () => {
    const data = await getSavedWisdoms();
    setWisdoms(data);
    setFilteredWisdoms(data);
  }, []);

  useEffect(() => {
    loadWisdoms();
  }, [loadWisdoms]);

  // Filter and search
  useEffect(() => {
    let result = wisdoms;

    // Apply master filter
    if (selectedFilter !== 'all') {
      result = result.filter(w => w.masterId === selectedFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(w => 
        w.content.toLowerCase().includes(query) ||
        w.masterName.toLowerCase().includes(query) ||
        w.entryTitle.toLowerCase().includes(query)
      );
    }

    setFilteredWisdoms(result);
  }, [wisdoms, selectedFilter, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWisdoms();
    setRefreshing(false);
  }, [loadWisdoms]);

  const handleUnsave = async (wisdomId: string) => {
    Alert.alert(
      '',
      language === 'en' ? 'Remove this wisdom from your collection?' : '从收藏中移除这条智慧？',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            await unsaveWisdom(wisdomId);
            await loadWisdoms();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  };

  const handleViewEntry = (entryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/entry-detail' as any,
      params: { entryId }
    });
  };

  const handleShare = async (wisdom: SavedWisdom) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentShareWisdom(wisdom.content);
    setCurrentShareMaster({ name: wisdom.masterName, icon: getMasterIcon(wisdom.masterId) });
    // Wait for next frame to ensure the card is rendered
    setTimeout(async () => {
      await captureAndShare(wisdom.content);
      setCurrentShareWisdom(null);
      setCurrentShareMaster(null);
    }, 100);
  };

  const getMasterIcon = (masterId: string) => {
    switch (masterId) {
      case 'jesus': return '✨';
      case 'plato': return '🏛️';
      case 'laozi': return '☯️';
      case 'buddha': return '🪷';
      default: return '✨';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return language === 'en' ? 'This Week' : '本周';
    if (diffDays < 30) return language === 'en' ? 'Last Month' : '上月';
    return language === 'en' ? 'Earlier' : '更早';
  };

  // Group wisdoms by time period
  const groupedWisdoms: Record<string, SavedWisdom[]> = {};
  filteredWisdoms.forEach(wisdom => {
    const period = formatDate(wisdom.savedAt);
    if (!groupedWisdoms[period]) {
      groupedWisdoms[period] = [];
    }
    groupedWisdoms[period].push(wisdom);
  });

  return (
    <ScreenContainer>
      {/* Hidden share card for capturing */}
      {currentShareWisdom && (
        <View style={{ position: 'absolute', left: -10000, top: -10000 }}>
          <WisdomShareCard
            ref={captureRef}
            wisdom={currentShareWisdom}
            masterName={currentShareMaster?.name}
            masterIcon={currentShareMaster?.icon}
          />
        </View>
      )}
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text className="text-lg" style={{ color: colors.primary }}>
            ← {t('back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text className="text-3xl font-bold mb-2" style={{ color: colors.foreground }}>
          {language === 'en' ? 'Saved Wisdom' : '收藏的智慧'}
        </Text>
        <Text className="text-base mb-6" style={{ color: colors.muted }}>
          {language === 'en' ? 'Treasured insights from the masters' : '珍藏的智者启示'}
        </Text>

        {/* Search Bar */}
        <View
          className="flex-row items-center px-4 py-3 rounded-xl mb-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-lg mr-2">🔍</Text>
          <TextInput
            placeholder={language === 'en' ? 'Search wisdom...' : '搜索智慧...'}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base"
            style={{ color: colors.foreground }}
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 20 }}
        >
          {[
            { id: 'all' as MasterFilter, label: language === 'en' ? 'All' : '全部', icon: '📚' },
            { id: 'jesus' as MasterFilter, label: t('jesus'), icon: '✨' },
            { id: 'plato' as MasterFilter, label: t('plato'), icon: '🏛️' },
            { id: 'laozi' as MasterFilter, label: t('laozi'), icon: '☯️' },
            { id: 'buddha' as MasterFilter, label: t('buddha'), icon: '🪷' },
          ].map(filter => (
            <Pressable
              key={filter.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter(filter.id);
              }}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedFilter === filter.id ? colors.primary : colors.surface,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  color: selectedFilter === filter.id ? '#FFFFFF' : colors.foreground,
                }}
              >
                {filter.icon} {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Empty State */}
        {filteredWisdoms.length === 0 && (
          <View className="items-center justify-center py-16">
            <Text className="text-6xl mb-4">⭐</Text>
            <Text className="text-lg font-medium mb-2" style={{ color: colors.foreground }}>
              {language === 'en' ? 'No saved wisdom yet' : '还没有收藏的智慧'}
            </Text>
            <Text className="text-sm text-center px-8" style={{ color: colors.muted }}>
              {language === 'en' ? 'Tap the star icon when reading wisdom to save it here' : '阅读智者启示时点击星星图标即可收藏'}
            </Text>
          </View>
        )}

        {/* Wisdom Cards */}
        {Object.entries(groupedWisdoms).map(([period, periodWisdoms]) => (
          <View key={period} className="mb-6">
            {/* Period Header */}
            <View className="flex-row items-center mb-3">
              <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
              <Text className="mx-3 text-sm font-medium" style={{ color: colors.muted }}>
                {period}
              </Text>
              <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
            </View>

            {/* Cards */}
            {periodWisdoms.map(wisdom => (
              <View
                key={wisdom.id}
                className="p-4 rounded-2xl mb-3"
                style={{ backgroundColor: colors.surface }}
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-2">{getMasterIcon(wisdom.masterId)}</Text>
                    <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                      {wisdom.masterName}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => handleShare(wisdom)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
                      <Text className="text-xl">📤</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleUnsave(wisdom.id)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
                      <Text className="text-2xl">⭐</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Content */}
                <Text className="text-base leading-6 mb-3" style={{ color: colors.foreground }}>
                  {wisdom.content}
                </Text>

                {/* Meta Info */}
                <View className="flex-row items-center mb-3">
                  <Text className="text-sm mr-2" style={{ color: colors.muted }}>
                    💬 {language === 'en' ? 'From' : '来自'}:
                  </Text>
                  <Text className="text-sm font-medium flex-1" style={{ color: colors.foreground }}>
                    {wisdom.entryTitle}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Text className="text-sm" style={{ color: colors.muted }}>
                    📅 {new Date(wisdom.savedAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* View Entry Button */}
                <Pressable
                  onPress={() => handleViewEntry(wisdom.entryId)}
                  style={({ pressed }) => [
                    {
                      marginTop: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: colors.primary + '20',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-sm font-medium text-center" style={{ color: colors.primary }}>
                    {language === 'en' ? 'View Original Entry' : '查看原日记'} →
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
