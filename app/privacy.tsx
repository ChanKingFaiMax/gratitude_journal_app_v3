import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";

const PRIVACY_SECTIONS_ZH = [
  {
    title: "1. 信息收集",
    content: "我们收集的信息非常有限。如果您选择通过Apple登录，我们仅获取Apple提供的基本账户信息（如用户ID）。您的日记内容完全存储在您的设备本地，我们无法访问。"
  },
  {
    title: "2. 信息使用",
    content: "我们收集的有限信息仅用于提供和改进服务，不会用于任何其他目的。我们不会向第三方出售、出租或共享您的个人信息。"
  },
  {
    title: "3. 数据存储",
    content: "您的日记数据存储在您的设备本地，使用iOS系统提供的安全存储机制。我们不会将您的日记内容上传到任何服务器。"
  },
  {
    title: "4. 数据安全",
    content: "我们采取合理的技术和管理措施保护您的信息安全。但请注意，没有任何互联网传输或电子存储方法是100%安全的。"
  },
  {
    title: "5. 第三方服务",
    content: "本应用使用Apple登录服务进行身份验证。使用这些服务时，请参阅Apple的隐私政策了解其如何处理您的信息。"
  },
  {
    title: "6. 儿童隐私",
    content: "本应用不针对13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。"
  },
  {
    title: "7. 您的权利",
    content: "您有权访问、更正或删除您的个人信息。由于日记数据存储在本地，您可以随时在应用设置中清除所有数据。"
  },
  {
    title: "8. 政策更新",
    content: "我们可能会不时更新本隐私政策。更新后的政策将在应用内公布，继续使用本应用即表示您同意接受更新后的政策。"
  },
  {
    title: "9. 联系我们",
    content: "如果您对本隐私政策有任何疑问，请通过应用内的意见反馈功能与我们联系。"
  }
];

const PRIVACY_SECTIONS_EN = [
  {
    title: "1. Information Collection",
    content: "We collect very limited information. If you choose to sign in with Apple, we only obtain basic account information provided by Apple (such as user ID). Your journal content is stored entirely on your local device, and we cannot access it."
  },
  {
    title: "2. Information Use",
    content: "The limited information we collect is only used to provide and improve services, and will not be used for any other purpose. We will not sell, rent, or share your personal information with third parties."
  },
  {
    title: "3. Data Storage",
    content: "Your journal data is stored locally on your device using the secure storage mechanism provided by the iOS system. We will not upload your journal content to any server."
  },
  {
    title: "4. Data Security",
    content: "We take reasonable technical and administrative measures to protect your information security. However, please note that no internet transmission or electronic storage method is 100% secure."
  },
  {
    title: "5. Third-Party Services",
    content: "This app uses Apple Sign-In service for authentication. When using these services, please refer to Apple's privacy policy to understand how they handle your information."
  },
  {
    title: "6. Children's Privacy",
    content: "This app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13."
  },
  {
    title: "7. Your Rights",
    content: "You have the right to access, correct, or delete your personal information. Since journal data is stored locally, you can clear all data at any time in the app settings."
  },
  {
    title: "8. Policy Updates",
    content: "We may update this privacy policy from time to time. The updated policy will be published in the app, and continued use of this app indicates your acceptance of the updated policy."
  },
  {
    title: "9. Contact Us",
    content: "If you have any questions about this privacy policy, please contact us through the feedback feature in the app."
  }
];

export default function PrivacyScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const PRIVACY_SECTIONS = language === 'en' ? PRIVACY_SECTIONS_EN : PRIVACY_SECTIONS_ZH;

  return (
    <ScreenContainer>
      <View className="px-5 py-4 border-b flex-row items-center" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <Text className="text-base" style={{ color: colors.primary }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-foreground mr-8">{t('privacyTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text className="text-sm text-muted mb-6">{language === 'en' ? 'Last updated: January 1, 2025' : '最后更新日期：2025年1月1日'}</Text>

        {PRIVACY_SECTIONS.map((section, index) => (
          <View key={index} className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">{section.title}</Text>
            <Text className="text-base text-foreground leading-7">{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
