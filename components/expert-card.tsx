import { View, Text } from "react-native";

type ExpertCardProps = {
  nameZh: string;
  nameEn: string;
  years: string;
  bioZh: string;
  bioEn: string;
  emoji: string;
  language: string;
};

export function ExpertCard({ nameZh, nameEn, years, bioZh, bioEn, emoji, language }: ExpertCardProps) {
  const isEnglish = language === 'en';
  const name = isEnglish ? nameEn : nameZh;
  const bio = isEnglish ? bioEn : bioZh;
  
  return (
    <View className="bg-surface rounded-2xl p-5 border border-border mt-4">
      <View className="flex-row items-center">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: '#4ECDC420' }}
        >
          <Text className="text-2xl">{emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {isEnglish ? `Perspective from ${name}` : `来自 ${name} 的视角`}
          </Text>
          <Text className="text-xs text-muted mt-0.5">
            {name} ({years})
          </Text>
          <Text className="text-xs text-muted mt-1">
            {bio}
          </Text>
        </View>
      </View>
    </View>
  );
}
