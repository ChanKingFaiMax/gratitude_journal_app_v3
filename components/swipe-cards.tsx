import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolation,
  cancelAnimation
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { DailyTopic } from "@/types/journal";

interface SwipeCardsProps {
  topics: DailyTopic[];
  onSwipeRight: (topic: DailyTopic) => void;
  onSwipeLeft: (topic: DailyTopic) => void;
  onAllSwiped: () => void;
}

// Get screen dimensions - calculate only once outside component
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 380);
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.48, 400);
const SWIPE_THRESHOLD = CARD_WIDTH * 0.25;

export function SwipeCards({ topics, onSwipeRight, onSwipeLeft, onAllSwiped }: SwipeCardsProps) {
  const colors = useColors();
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isAnimatingRef = useRef(false);
  
  // Use useMemo to stabilize topics key, avoid unnecessary re-renders
  const topicsKey = useMemo(() => topics.map(t => t.id).join(','), [topics]);
  
  // Reset index when topics change
  const prevTopicsKeyRef = useRef(topicsKey);
  if (prevTopicsKeyRef.current !== topicsKey) {
    prevTopicsKeyRef.current = topicsKey;
    if (currentIndex !== 0) {
      setCurrentIndex(0);
    }
  }

  // Animation values - use stable initial values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  // Clean up animations
  useEffect(() => {
    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(cardOpacity);
    };
  }, []);

  // Stable animation style - avoid flickering
  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-CARD_WIDTH, 0, CARD_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );
    
    const swipeOpacity = interpolate(
      Math.abs(translateX.value),
      [0, CARD_WIDTH * 0.8],
      [1, 0.6],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` }
      ],
      opacity: cardOpacity.value * swipeOpacity,
    };
  }, []);

  // Handle swipe complete - use useCallback to stabilize reference
  const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    
    const currentTopic = topics[currentIndex];
    if (!currentTopic) {
      isAnimatingRef.current = false;
      setIsTransitioning(false);
      return;
    }
    
    if (direction === 'right') {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSwipeRight(currentTopic);
    } else {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSwipeLeft(currentTopic);
    }
    
    const nextIndex = currentIndex + 1;
    
    // Hide card first, then update index, finally fade in
    cardOpacity.value = 0;
    
    // Delay state update to ensure animation completes
    setTimeout(() => {
      // Reset position
      translateX.value = 0;
      translateY.value = 0;
      
      if (nextIndex >= topics.length) {
        onAllSwiped();
        setCurrentIndex(0);
      } else {
        setCurrentIndex(nextIndex);
      }
      
      // Delay fade in new card
      setTimeout(() => {
        cardOpacity.value = withTiming(1, { duration: 200 });
        isAnimatingRef.current = false;
        setIsTransitioning(false);
      }, 50);
    }, 50);
  }, [currentIndex, topics, onSwipeRight, onSwipeLeft, onAllSwiped]);

  // Gesture handling
  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-10, 10])
    .enabled(!isTransitioning)
    .onUpdate((event) => {
      if (isAnimatingRef.current || isTransitioning) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3; // Slight vertical movement
    })
    .onEnd((event) => {
      if (isAnimatingRef.current || isTransitioning) return;
      
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      
      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        const targetX = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
        
        translateX.value = withTiming(targetX, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(handleSwipeComplete)(direction);
          }
        });
      } else {
        // Bounce back - use smoother animation
        translateX.value = withSpring(0, { 
          damping: 20, 
          stiffness: 200,
          mass: 0.8
        });
        translateY.value = withSpring(0, { 
          damping: 20, 
          stiffness: 200,
          mass: 0.8
        });
      }
    }), [handleSwipeComplete, isTransitioning]);

  // Empty state handling
  if (topics.length === 0) {
    return (
      <View style={[styles.container, { minHeight: CARD_HEIGHT + 60 }]}>
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            {language === 'en' ? 'No topics available' : '暂无题目'}
          </Text>
        </View>
      </View>
    );
  }

  const currentTopic = topics[currentIndex];
  
  // Debug logging
  console.log('[SwipeCards] Current index:', currentIndex);
  console.log('[SwipeCards] Topics length:', topics.length);
  console.log('[SwipeCards] Current topic:', currentTopic);
  
  if (!currentTopic) {
    console.warn('[SwipeCards] No current topic found!');
    return null;
  }
  
  if (!currentTopic.text) {
    console.error('[SwipeCards] Topic has no text!', currentTopic);
  }

  return (
    <View style={[styles.container, { minHeight: CARD_HEIGHT + 60 }]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[
            styles.card,
            { 
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            animatedStyle
          ]}
        >
          {/* Topic Content */}
          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.topicText,
                { 
                  color: colors.foreground,
                  fontSize: 22,
                  lineHeight: 36,
                  ...(Platform.OS === 'web' ? { 
                    writingMode: 'horizontal-tb' as any,
                    textOrientation: 'mixed' as any,
                  } : {}),
                }
              ]}
              numberOfLines={6}
            >
              {currentTopic.text || '[No text available]'}
            </Text>
          </View>

          {/* Swipe Hints */}
          <View style={[styles.hintsContainer, { borderTopColor: colors.border + '30' }]}>
            <Text style={[styles.hintText, { color: colors.muted, fontSize: 15 }]}>
              {language === 'en' ? '← Skip' : '← 跳过'}
            </Text>
            <Text style={[styles.hintText, { color: colors.muted, fontSize: 15 }]}>
              {language === 'en' ? 'Select →' : '选择 →'}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: colors.muted, fontSize: 14 }]}>
              {currentIndex + 1} / {topics.length}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  topicText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: 0.3,
  },
  hintsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
  },
  hintText: {
    fontSize: 15,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
