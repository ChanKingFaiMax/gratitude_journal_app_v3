# App Store 上线完整指南

本文档提供从当前 Expo 项目到 App Store 上线的完整流程。

---

## 一、前置准备

### 1.1 Apple Developer 账号
- 注册 [Apple Developer Program](https://developer.apple.com/programs/)（$99/年）
- 完成账号验证和协议签署

### 1.2 开发环境
- macOS 系统（必需，用于 Xcode 和 App Store Connect）
- 安装 [Xcode](https://apps.apple.com/us/app/xcode/id497799835)（最新版本）
- 安装 [EAS CLI](https://docs.expo.dev/build/setup/)：
  ```bash
  npm install -g eas-cli
  ```

### 1.3 Expo 账号
- 注册 [Expo 账号](https://expo.dev/signup)
- 登录 EAS CLI：
  ```bash
  eas login
  ```

---

## 二、关键配置修改

### 2.1 应用信息配置 (`app.config.ts`)

打开 `app.config.ts`，确认或修改以下字段：

```typescript
const env = {
  // 应用名称（显示在 App Store 和设备上）
  appName: "感恩日记",  // 修改为您的应用名称
  
  // 应用 slug（用于 Expo 内部标识，不要修改）
  appSlug: "gratitude_journal_app",
  
  // 应用图标 S3 URL（如果已生成自定义 logo，保持不变；否则留空使用默认图标）
  logoUrl: "",
  
  // Bundle ID 和 Package Name（已自动生成，不建议修改）
  iosBundleId: "space.manus.gratitude.journal.app.t20260206...",
  androidPackage: "space.manus.gratitude.journal.app.t20260206...",
};
```

**重要提示：**
- `appName`：这是用户在 App Store 和设备上看到的名称，建议使用简洁、有意义的中文或英文名称
- `iosBundleId` 和 `androidPackage`：这是应用的唯一标识符，**上线后不可更改**，建议保持自动生成的值

### 2.2 版本号配置

在 `app.config.ts` 中修改版本号：

```typescript
const config: ExpoConfig = {
  version: "1.0.0",  // 应用版本号（显示给用户）
  // ...
};
```

### 2.3 隐私权限说明

iOS 要求在 `app.config.ts` 中添加隐私权限说明。当前已配置：

- 麦克风权限：`"Allow $(PRODUCT_NAME) to access your microphone."`
- 如需添加其他权限（如相机、相册），请参考 [Expo 配置文档](https://docs.expo.dev/versions/latest/config/app/)

---

## 三、构建 iOS 应用

### 3.1 初始化 EAS 项目

在项目根目录执行：

```bash
cd /path/to/gratitude_journal_app
eas build:configure
```

这会创建 `eas.json` 配置文件。

### 3.2 配置 `eas.json`

编辑 `eas.json`，确保包含以下配置：

```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "space.manus.gratitude.journal.app.t20260206...",
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

**获取必要信息：**
- `appleId`：您的 Apple ID 邮箱
- `ascAppId`：在 App Store Connect 创建应用后获取（见下一步）
- `appleTeamId`：在 [Apple Developer 账号页面](https://developer.apple.com/account/) 查看

### 3.3 在 App Store Connect 创建应用

1. 访问 [App Store Connect](https://appstoreconnect.apple.com/)
2. 点击"我的 App" → "+" → "新建 App"
3. 填写信息：
   - **平台**：iOS
   - **名称**：感恩日记（或您的应用名称）
   - **主要语言**：简体中文
   - **套装 ID**：选择您在 `app.config.ts` 中的 `iosBundleId`
   - **SKU**：自定义唯一标识符（如 `gratitude-journal-2026`）
4. 创建成功后，记录 **App ID**（在 URL 中，如 `https://appstoreconnect.apple.com/apps/1234567890`）

### 3.4 构建 iOS 应用

执行以下命令开始构建：

```bash
eas build --platform ios --profile production
```

**注意事项：**
- 首次构建需要配置 Apple 证书和 Provisioning Profile，EAS 会自动处理
- 构建过程需要 10-30 分钟，可以在 [Expo 控制台](https://expo.dev/) 查看进度
- 构建完成后会生成 `.ipa` 文件

### 3.5 提交到 App Store

构建完成后，执行：

```bash
eas submit --platform ios --profile production
```

或者手动下载 `.ipa` 文件，使用 [Transporter](https://apps.apple.com/us/app/transporter/id1450874784) 上传。

---

## 四、App Store Connect 配置

### 4.1 应用信息

在 App Store Connect 中填写：

1. **App 信息**：
   - 名称：感恩日记
   - 副标题：每日感恩，唤醒内心的觉知
   - 类别：健康健美 / 生活方式

2. **定价与销售范围**：
   - 价格：免费（或设置付费价格）
   - 销售范围：选择您希望上架的国家/地区

3. **隐私政策**：
   - 提供隐私政策 URL（必需）
   - 如果没有网站，可以使用 [PrivacyPolicies.com](https://www.privacypolicies.com/) 生成

### 4.2 版本信息

在"准备提交"页面填写：

1. **屏幕截图**：
   - 需要提供 6.5 英寸（iPhone 14 Pro Max）和 5.5 英寸（iPhone 8 Plus）的截图
   - 每个尺寸至少 1 张，最多 10 张
   - 使用 iPhone 模拟器或真机截图

2. **描述**：
   ```
   感恩日记是一款帮助您培养感恩习惯、唤醒内心觉知的应用。

   核心功能：
   - 每日感恩记录：通过精心设计的主题卡片，引导您发现生活中的美好
   - 智者对话：与佛陀、老子、柏拉图、爱之使者对话，获得深度智慧启发
   - 深度回顾：AI 生成的个性化回顾报告，帮助您洞察成长轨迹
   - 意识层级追踪：可视化您的情绪和意识状态变化
   - 双语支持：完整的中英文界面和 AI 回复

   开始您的觉醒之旅，每天记录感恩，与智者对话，发现内在的平静与喜悦。
   ```

3. **关键词**：
   ```
   感恩,日记,冥想,正念,觉知,智慧,心理健康,自我成长,幸福,gratitude
   ```

4. **技术支持 URL**：
   - 提供您的支持网站或邮箱（如 `mailto:support@example.com`）

5. **营销 URL**（可选）：
   - 您的应用官网

### 4.3 App 审核信息

1. **联系信息**：
   - 提供您的姓名、电话、邮箱

2. **演示账号**（如果应用需要登录）：
   - 用户名：demo@example.com
   - 密码：DemoPassword123
   - 说明：测试账号，已预置数据

3. **备注**：
   ```
   本应用使用 AI 生成内容（感恩主题、智者对话、回顾报告）。
   所有 AI 内容均经过人工审核和优化，确保积极、健康、符合社区准则。
   ```

---

## 五、提交审核

### 5.1 检查清单

提交前确认：

- [ ] 所有截图已上传（至少 2 个尺寸）
- [ ] 应用描述、关键词已填写
- [ ] 隐私政策 URL 已提供
- [ ] 技术支持 URL 已提供
- [ ] App 图标已设置（1024x1024 PNG，无透明度）
- [ ] 演示账号已提供（如需要）
- [ ] 应用已通过内部测试，无明显 bug

### 5.2 提交审核

1. 在 App Store Connect 中点击"提交以供审核"
2. 回答审核问卷（关于加密、内容分级等）
3. 确认提交

### 5.3 审核时间

- 通常 1-3 个工作日
- 可以在 App Store Connect 查看审核状态
- 如果被拒绝，会收到邮件说明原因，修改后重新提交

---

## 六、常见问题

### 6.1 构建失败

**问题**：`eas build` 失败，提示证书错误

**解决**：
```bash
# 清除本地证书缓存
eas credentials
# 选择 "Remove all credentials" 然后重新构建
```

### 6.2 应用被拒绝

**常见原因**：
1. **缺少隐私政策**：必须提供隐私政策 URL
2. **截图不符合规范**：确保截图清晰、无水印、展示实际功能
3. **演示账号无效**：确保测试账号可以正常登录和使用
4. **AI 内容未说明**：在备注中明确说明 AI 内容的用途和审核机制

### 6.3 更新应用

修改代码后，更新版本号并重新构建：

```bash
# 1. 修改 app.config.ts 中的 version
version: "1.0.1"  # 或 "1.1.0"

# 2. 重新构建
eas build --platform ios --profile production

# 3. 提交新版本
eas submit --platform ios --profile production

# 4. 在 App Store Connect 中创建新版本并提交审核
```

---

## 七、后续优化建议

### 7.1 TestFlight 内测

在正式上线前，建议先通过 TestFlight 进行内测：

```bash
# 构建 TestFlight 版本
eas build --platform ios --profile preview

# 在 App Store Connect 中邀请测试用户
```

### 7.2 性能监控

集成 Sentry 或 Firebase Crashlytics 监控线上错误：

```bash
# 安装 Sentry
npx expo install @sentry/react-native

# 配置 app.config.ts
plugins: [
  ["@sentry/react-native/expo", {
    organization: "your-org",
    project: "your-project",
  }]
]
```

### 7.3 应用分析

集成 Firebase Analytics 或 Amplitude 追踪用户行为：

```bash
npx expo install @react-native-firebase/analytics
```

---

## 八、资源链接

- [Expo 官方文档](https://docs.expo.dev/)
- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [App Store Connect 帮助](https://developer.apple.com/help/app-store-connect/)
- [App Store 审核指南](https://developer.apple.com/app-store/review/guidelines/)
- [Expo 社区论坛](https://forums.expo.dev/)

---

## 九、技术支持

如果在上线过程中遇到问题，可以：

1. 查阅 [Expo 文档](https://docs.expo.dev/)
2. 在 [Expo 论坛](https://forums.expo.dev/) 提问
3. 联系 Apple Developer Support

祝您上线顺利！🎉
