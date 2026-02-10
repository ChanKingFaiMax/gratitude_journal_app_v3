import { Modal, View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import { useFontSize } from "@/lib/font-size-provider";
import { saveChatContext } from "@/lib/chat-context-storage";

interface MasterModalProps {
  visible: boolean;
  master: {
    id: string;
    name: string;
    icon: string;
    summary: string;
  } | null;
  isSaved: boolean;
  topic?: string;
  userContent?: string;
  onClose: () => void;
  onToggleSave: () => void;
}

export function MasterModal({ visible, master, isSaved, topic, userContent, onClose, onToggleSave }: MasterModalProps) {
  const colors = useColors();
  const router = useRouter();
  const { language } = useLanguage();
  const { getScaledSize } = useFontSize();

  if (!master) return null;

  const handleContinueChat = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    await saveChatContext({
      masterId: master.id,
      masterName: master.name,
      masterIcon: master.icon,
      topic: topic || '',
      userContent: userContent || '',
      masterSummary: master.summary,
    });
    
    onClose();
    
    router.push({
      pathname: '/(tabs)/chat',
      params: { 
        masterId: master.id,
        initContext: 'true'
      }
    });
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleToggleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        isSaved 
          ? Haptics.ImpactFeedbackStyle.Medium 
          : Haptics.ImpactFeedbackStyle.Light
      );
    }
    onToggleSave();
  };

  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  
  const modalWidth = Math.min(screenWidth - 40, 400);
  const modalMaxHeight = screenHeight - 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        
        {/* Modal Card */}
        <View
          style={[
            styles.modalCard,
            {
              width: modalWidth,
              maxHeight: modalMaxHeight,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {/* Fixed Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>{master.icon}</Text>
              <Text style={[styles.headerName, { fontSize: getScaledSize(18), color: colors.foreground }]}>
                {master.name}
              </Text>
            </View>
            <TouchableOpacity onPress={handleToggleSave}>
              <Text style={styles.saveIcon}>
                {isSaved ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Scrollable Content Area - this is the key fix */}
          {/* Using explicit height calculation instead of flex to ensure ScrollView works in Modal */}
          <View style={{ height: modalMaxHeight - 230 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              indicatorStyle="white"
              nestedScrollEnabled={true}
              bounces={true}
              scrollEnabled={true}
              overScrollMode="always"
            >
              <Text style={{ 
                fontSize: getScaledSize(15), 
                lineHeight: getScaledSize(24), 
                color: colors.foreground,
              }}>
                {master.summary || '(No content available)'}
              </Text>
              
              {/* Bottom spacer to ensure last line is visible */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>

          {/* Fixed Buttons */}
          <View style={[styles.buttonContainer, { backgroundColor: colors.surface }]}>
            {/* Scroll hint text */}
            <Text style={[styles.scrollHint, { color: colors.muted }]}>
              {language === 'en' ? '↕ Swipe to read more' : '↕ 上下滑动阅读更多'}
            </Text>
            
            <TouchableOpacity
              onPress={handleContinueChat}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {language === 'en' ? 'Continue Chat' : '继续聊天'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.secondaryButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                {language === 'en' ? 'Close' : '关闭'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerName: {
    fontWeight: '600',
  },
  saveIcon: {
    fontSize: 24,
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  scrollHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.6,
  },
  buttonContainer: {
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#E8A838',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
