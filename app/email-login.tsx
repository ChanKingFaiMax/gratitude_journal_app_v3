import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";

export default function EmailLoginScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);

  const sendCodeMutation = trpc.auth.sendVerificationCode.useMutation();
  const verifyCodeMutation = trpc.auth.verifyEmailCode.useMutation();

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert(t("error"), t("pleaseEnterEmail"));
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("error"), t("invalidEmailFormat"));
      return;
    }

    setLoading(true);
    try {
      await sendCodeMutation.mutateAsync({ email });
      Alert.alert(t("success"), t("verificationCodeSent"));
      setStep("code");
    } catch (error) {
      console.error("Failed to send code:", error);
      Alert.alert(t("error"), t("failedToSendCode"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      Alert.alert(t("error"), t("pleaseEnter6DigitCode"));
      return;
    }

    setLoading(true);
    try {
      const result = await verifyCodeMutation.mutateAsync({ email, code });
      if (result.success) {
        // Save session token and user info for Native platform
        const { setSessionToken, setUserInfo } = await import("@/lib/_core/auth");
        
        if (result.sessionToken) {
          await setSessionToken(result.sessionToken);
          console.log("[EmailLogin] Session token saved");
        }
        
        if (result.user) {
          await setUserInfo({
            id: result.user.id,
            openId: result.user.openId,
            name: result.user.name || result.user.email || 'Email User',
            email: result.user.email,
            loginMethod: 'email',
            lastSignedIn: new Date(),
          });
          console.log("[EmailLogin] User info saved");
        }
        
        // Refresh auth state to load the new user
        await refresh();
        console.log("[EmailLogin] Auth state refreshed");
        
        Alert.alert(t("success"), t("loginSuccessful"), [
          {
            text: t("ok"),
            onPress: () => {
              // Navigate to settings tab to show logged in state
              router.replace("/(tabs)/settings");
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to verify code:", error);
      Alert.alert(t("error"), t("invalidOrExpiredCode"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setCode("");
    handleSendCode();
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.foreground, marginBottom: 8 }}>
              {step === "email" ? t("emailLogin") : t("enterVerificationCode")}
            </Text>
            <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center" }}>
              {step === "email" ? t("emailLoginDescription") : t("verificationCodeSentTo", { email })}
            </Text>
          </View>

          {step === "email" ? (
            <>
              {/* Email Input */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                  {t("emailAddress")}
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("enterYourEmail")}
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>

              {/* Send Code Button */}
              <TouchableOpacity
                onPress={handleSendCode}
                disabled={loading}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.background }}>
                    {t("sendVerificationCode")}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Code Input */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                  {t("verificationCode")}
                </Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="000000"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 24,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    textAlign: "center",
                    letterSpacing: 8,
                  }}
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={handleVerifyCode}
                disabled={loading}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 16,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.background }}>
                    {t("verifyAndLogin")}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Resend Code */}
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={loading}
                style={{ alignItems: "center", padding: 8 }}
              >
                <Text style={{ fontSize: 14, color: colors.primary }}>
                  {t("resendCode")}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (step === "code") {
                setStep("email");
                setCode("");
              } else {
                router.back();
              }
            }}
            style={{ alignItems: "center", marginTop: 24, padding: 8 }}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>
              {step === "code" ? t("changeEmail") : t("cancel")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
