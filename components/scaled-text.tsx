import { Text, TextProps } from "react-native";
import { useFontSize } from "@/lib/font-size-provider";

interface ScaledTextProps extends TextProps {
  baseSize?: number; // 基础字体大小（像素）
}

/**
 * 自动应用全局字体缩放的Text组件
 * 
 * 使用方式：
 * <ScaledText baseSize={16} className="text-foreground">
 *   Hello World
 * </ScaledText>
 */
export function ScaledText({ baseSize, style, ...props }: ScaledTextProps) {
  const { scaleMultiplier } = useFontSize();
  
  // 如果没有指定baseSize，从style中提取fontSize
  let finalFontSize: number | undefined;
  
  if (baseSize) {
    finalFontSize = Math.round(baseSize * scaleMultiplier);
  } else if (style && typeof style === 'object' && 'fontSize' in style) {
    const styleFontSize = (style as any).fontSize;
    if (typeof styleFontSize === 'number') {
      finalFontSize = Math.round(styleFontSize * scaleMultiplier);
    }
  }
  
  const scaledStyle = finalFontSize 
    ? [style, { fontSize: finalFontSize }]
    : style;
  
  return <Text style={scaledStyle} {...props} />;
}
