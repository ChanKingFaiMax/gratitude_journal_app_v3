import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";

const TERMS_SECTIONS_ZH = [
  {
    title: "1. 服务说明",
    content: "开悟日志是一款帮助用户记录日常感恩与哲思的应用程序。我们提供题目引导、自由写作、智者启示等功能，旨在帮助用户培养感恩习惯，提升生活幸福感。"
  },
  {
    title: "2. 用户账户",
    content: "您可以选择通过Apple登录创建账户，也可以在不登录的情况下使用本应用。登录后，您的数据将存储在本地设备上。我们不会在未经您同意的情况下收集或共享您的个人信息。"
  },
  {
    title: "3. 用户内容",
    content: "您在本应用中创建的所有日记内容归您所有。我们不会查看、分析或共享您的私人日记内容。您的数据存储在您的设备本地，我们无法访问。"
  },
  {
    title: "4. 使用规范",
    content: "使用本应用时，您同意不会利用本应用从事任何违法活动，不会尝试破解、修改或干扰本应用的正常运行，不会将本应用用于任何商业目的。"
  },
  {
    title: "5. 知识产权",
    content: "本应用的所有内容，包括但不限于文字、图片、图标、界面设计等，均受知识产权法律保护。未经授权，您不得复制、修改、分发或以其他方式使用这些内容。"
  },
  {
    title: "6. 免责声明",
    content: "本应用中的智者启示仅供参考和启发，不构成任何专业建议。我们不对因使用本应用而产生的任何直接或间接损失承担责任。"
  },
  {
    title: "7. 服务变更",
    content: "我们保留随时修改、暂停或终止本服务的权利。如有重大变更，我们将通过应用内通知或其他方式告知您。"
  },
  {
    title: "8. 协议修改",
    content: "我们可能会不时更新本协议。更新后的协议将在应用内公布，继续使用本应用即表示您同意接受更新后的协议。"
  },
  {
    title: "9. 联系我们",
    content: "如果您对本协议有任何疑问，请通过应用内的意见反馈功能与我们联系。"
  }
];

const TERMS_SECTIONS_EN = [
  {
    title: "1. Service Description",
    content: "Enlighten Journal is an application that helps users record daily gratitude and philosophical reflections. We provide guided prompts, free writing, and sage wisdom features to help users cultivate gratitude habits and improve life satisfaction."
  },
  {
    title: "2. User Account",
    content: "You can choose to create an account via Apple Sign-In, or use the app without logging in. After logging in, your data will be stored locally on your device. We will not collect or share your personal information without your consent."
  },
  {
    title: "3. User Content",
    content: "All journal content you create in this app belongs to you. We will not view, analyze, or share your private journal content. Your data is stored locally on your device, and we cannot access it."
  },
  {
    title: "4. Usage Guidelines",
    content: "When using this app, you agree not to use it for any illegal activities, not to attempt to hack, modify, or interfere with the normal operation of this app, and not to use this app for any commercial purposes."
  },
  {
    title: "5. Intellectual Property",
    content: "All content in this app, including but not limited to text, images, icons, and interface design, is protected by intellectual property laws. Without authorization, you may not copy, modify, distribute, or otherwise use this content."
  },
  {
    title: "6. Disclaimer",
    content: "The sage wisdom in this app is for reference and inspiration only and does not constitute any professional advice. We are not responsible for any direct or indirect losses arising from the use of this app."
  },
  {
    title: "7. Service Changes",
    content: "We reserve the right to modify, suspend, or terminate this service at any time. If there are significant changes, we will notify you through in-app notifications or other means."
  },
  {
    title: "8. Agreement Modifications",
    content: "We may update this agreement from time to time. The updated agreement will be published in the app, and continued use of this app indicates your acceptance of the updated agreement."
  },
  {
    title: "9. Contact Us",
    content: "If you have any questions about this agreement, please contact us through the feedback feature in the app."
  }
];

export default function TermsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const TERMS_SECTIONS = language === 'en' ? TERMS_SECTIONS_EN : TERMS_SECTIONS_ZH;

  return (
    <ScreenContainer>
      <View className="px-5 py-4 border-b flex-row items-center" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <Text className="text-base" style={{ color: colors.primary }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-foreground mr-8">{t('termsTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text className="text-sm text-muted mb-6">{language === 'en' ? 'Last updated: January 1, 2025' : '最后更新日期：2025年1月1日'}</Text>

        {TERMS_SECTIONS.map((section, index) => (
          <View key={index} className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">{section.title}</Text>
            <Text className="text-base text-foreground leading-7">{section.content}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
