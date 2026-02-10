import { View, Text, TouchableOpacity } from "react-native";
import { useFontSize, FontSizeScale } from "@/lib/font-size-provider";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";
import * as Haptics from "expo-haptics";

const FONT_SIZES: { scale: FontSizeScale; label: { zh: string; en: string }; multiplier: string }[] = [
  { scale: 'xs', label: { zh: '极小', en: 'Extra Small' }, multiplier: '-10%' },
  { scale: 'sm', label: { zh: '标准', en: 'Standard' }, multiplier: '0%' },
  { scale: 'md', label: { zh: '大', en: 'Large' }, multiplier: '+20%' },
  { scale: 'lg', label: { zh: '特大', en: 'Extra Large' }, multiplier: '+40%' },
  { scale: 'xl', label: { zh: '超大', en: 'Huge' }, multiplier: '+60%' },
];

export function FontSizeSelector() {
  const colors = useColors();
  const { scale, setScale, scaleMultiplier } = useFontSize();
  const { language } = useLanguage();

  const handleSelect = async (newScale: FontSizeScale) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setScale(newScale);
  };

  return (
    <View className="gap-3">
      {FONT_SIZES.map((item) => {
        const isSelected = scale === item.scale;
        const previewFontSize = 16 * (item.scale === 'xs' ? 0.9 : item.scale === 'sm' ? 1.0 : item.scale === 'md' ? 1.2 : item.scale === 'lg' ? 1.4 : 1.6);
        
        return (
          <TouchableOpacity
            key={item.scale}
            onPress={() => handleSelect(item.scale)}
            className="bg-surface rounded-2xl p-4 border"
            style={{
              borderColor: isSelected ? colors.primary : colors.border,
              backgroundColor: isSelected ? colors.primary + '10' : colors.surface,
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-5 h-5 rounded-full border-2 items-center justify-center"
                  style={{
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                  }}
                >
                  {isSelected && (
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fff' }} />
                  )}
                </View>
                <Text className="text-base font-semibold text-foreground">
                  {language === 'zh' ? item.label.zh : item.label.en}
                </Text>
              </View>
              <Text className="text-sm text-muted">{item.multiplier}</Text>
            </View>
            
            {/* Preview Text */}
            <Text 
              className="text-foreground ml-8"
              style={{ fontSize: previewFontSize }}
            >
              {language === 'zh' 
                ? '快速的棕色狐狸跳过懒狗' 
                : 'The quick brown fox jumps over the lazy dog'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
