import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

interface WisdomShareCardProps {
  wisdom: string;
  masterName?: string;
  masterIcon?: string;
  onCaptureComplete?: (uri: string) => void;
}

/**
 * Calculate dynamic font size based on text length to ensure
 * the wisdom text fits within the card without being truncated.
 */
function getDynamicFontSize(text: string): { fontSize: number; lineHeight: number } {
  const len = text.length;
  if (len < 100) {
    return { fontSize: 48, lineHeight: 72 };
  } else if (len < 200) {
    return { fontSize: 40, lineHeight: 62 };
  } else if (len < 400) {
    return { fontSize: 34, lineHeight: 52 };
  } else {
    return { fontSize: 28, lineHeight: 44 };
  }
}

/**
 * Wisdom Share Card Component
 *
 * Compact layout with reduced top/bottom padding for better space utilization.
 * - Black background (#000000)
 * - White text for wisdom content (#FFFFFF)
 * - Master name with icon displayed above the quote
 * - Golden signature "- Insight Entries" (#E8A838)
 * - 3:4 portrait aspect ratio (1080x1440)
 * - Dynamic font sizing to prevent text truncation
 */
export const WisdomShareCard = React.forwardRef<ViewShot, WisdomShareCardProps>(
  ({ wisdom, masterName, masterIcon }, ref) => {
    const { fontSize, lineHeight } = useMemo(() => getDynamicFontSize(wisdom), [wisdom]);

    return (
      <ViewShot
        ref={ref}
        options={{
          format: 'png',
          quality: 1.0,
        }}
        style={styles.container}
      >
        <View style={styles.card}>
          {/* Master Name Header */}
          {masterName && (
            <View style={styles.masterContainer}>
              <Text style={styles.masterText}>
                {masterIcon ? `${masterIcon} ` : ''}{masterName}
              </Text>
            </View>
          )}

          {/* Wisdom Content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.wisdomText, { fontSize, lineHeight }]}>"{wisdom}"</Text>
          </View>

          {/* Signature */}
          <View style={styles.signatureContainer}>
            <Text style={styles.signature}>- Insight Entries</Text>
          </View>
        </View>
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 1080,
    height: 1440,
  },
  card: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 60,
    justifyContent: 'space-between',
  },
  masterContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  masterText: {
    color: '#E8A838',
    fontSize: 36,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  wisdomText: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 54,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  signatureContainer: {
    alignItems: 'flex-end',
    paddingBottom: 8,
  },
  signature: {
    color: '#E8A838',
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 1,
  },
});

/**
 * Hook for sharing wisdom cards
 */
export const useWisdomShare = () => {
  const captureRef = useRef<ViewShot>(null);

  const captureAndShare = async (wisdom: string) => {
    try {
      if (!captureRef.current) {
        throw new Error('Capture ref not ready');
      }

      const uri = await captureRef.current?.capture?.();

      if (!uri) {
        throw new Error('Failed to capture image');
      }

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Wisdom',
        });
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Success', 'Wisdom card saved to your photo library!');
        } else {
          Alert.alert('Permission Denied', 'Cannot save image without permission.');
        }
      }
    } catch (error) {
      console.error('Failed to share wisdom:', error);
      Alert.alert('Error', 'Failed to share wisdom card. Please try again.');
    }
  };

  const saveToLibrary = async (wisdom: string) => {
    try {
      if (!captureRef.current) {
        throw new Error('Capture ref not ready');
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot save image without permission.');
        return;
      }

      const uri = await captureRef.current?.capture?.();

      if (!uri) {
        throw new Error('Failed to capture image');
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Wisdom card saved to your photo library!');
    } catch (error) {
      console.error('Failed to save wisdom:', error);
      Alert.alert('Error', 'Failed to save wisdom card. Please try again.');
    }
  };

  return {
    captureRef,
    captureAndShare,
    saveToLibrary,
  };
};
