import { View, Text, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface ServerWakeupOverlayProps {
  visible: boolean;
}

/**
 * 服务器唤醒加载遮罩
 * 当服务器休眠需要唤醒时显示
 */
export function ServerWakeupOverlay({ visible }: ServerWakeupOverlayProps) {
  const colors = useColors();

  if (!visible) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
          minWidth: 200,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          正在唤醒服务器
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          服务器正在启动中{"\n"}请稍候...
        </Text>
      </View>
    </View>
  );
}
