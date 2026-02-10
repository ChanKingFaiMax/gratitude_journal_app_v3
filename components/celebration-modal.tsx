import { Modal, View, Text, TouchableOpacity, Animated } from "react-native";
import { useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { IconSymbol } from "./ui/icon-symbol";

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  streak: number;
  newAchievements: string[];
}

export function CelebrationModal({ visible, onClose, streak, newAchievements }: CelebrationModalProps) {
  const colors = useColors();
  const { language } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <TouchableOpacity
          className="absolute inset-0"
          onPress={onClose}
          activeOpacity={1}
        />
        
        <Animated.View
          className="bg-background rounded-3xl p-8 mx-6 items-center"
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            maxWidth: 320,
            width: '100%',
          }}
        >
          {/* Celebration Icon */}
          <View className="mb-4">
            <Text className="text-6xl">🎉</Text>
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-foreground mb-2 text-center">
            {language === 'en' ? "Today's Goal Achieved!" : '今日目标已达成!'}
          </Text>

          {/* Rewards */}
          <View className="w-full gap-3 my-4">
            <View className="flex-row items-center justify-center gap-2">
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text className="text-base text-foreground">
                {language === 'en' ? 'Earned Daily Star ⭐' : '获得每日之星 ⭐'}
              </Text>
            </View>

            {streak > 0 && (
              <View className="flex-row items-center justify-center gap-2">
                <Text className="text-2xl">🔥</Text>
                <Text className="text-base text-foreground">
                  {language === 'en' ? 'Streak +1' : '连续打卡 +1'}
                </Text>
              </View>
            )}

            {newAchievements.length > 0 && (
              <View className="flex-row items-center justify-center gap-2">
                <Text className="text-2xl">🏆</Text>
                <Text className="text-base text-foreground">
                  {language === 'en' 
                    ? `Unlocked ${newAchievements.length} new achievement${newAchievements.length > 1 ? 's' : ''}`
                    : `解锁 ${newAchievements.length} 个新成就`}
                </Text>
              </View>
            )}
          </View>

          {/* Encouragement */}
          <Text className="text-sm text-muted text-center mb-6">
            {language === 'en' 
              ? 'Keep recording, make gratitude a habit'
              : '坚持记录,让感恩成为习惯'}
          </Text>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="w-full rounded-full py-3"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold text-center" style={{ color: '#FFFFFF' }}>
              {language === 'en' ? 'Awesome!' : '太棒了!'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
