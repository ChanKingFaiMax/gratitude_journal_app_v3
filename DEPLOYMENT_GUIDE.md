# App Store 部署指南

## 项目信息

**应用名称：** Awaken（开悟日志 / 感恩日记）  
**Bundle ID：** `space.manus.gratitude.journal.app.t20250103192045`  
**版本号：** 1.0.0  
**技术栈：** React Native + Expo SDK 54

---

## 一、前置准备

### 1. 开发者账号
- [ ] Apple Developer Account（$99/年）
- [ ] 登录 https://developer.apple.com

### 2. 必需工具
```bash
# 安装 EAS CLI（Expo Application Services）
npm install -g eas-cli

# 登录 Expo 账号
eas login
```

### 3. 项目配置检查
```bash
# 进入项目目录
cd gratitude_journal_app

# 安装依赖
pnpm install

# 检查配置
cat app.config.ts
```

---

## 二、构建iOS应用

### 方法A：使用EAS Build（推荐）

**1. 初始化EAS**
```bash
eas build:configure
```

**2. 配置eas.json**
项目中已包含 `eas.json`，内容如下：
```json
{
  "build": {
    "production": {
      "ios": {
        "buildType": "release",
        "distribution": "store"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-id"
      }
    }
  }
}
```

**3. 构建iOS应用**
```bash
# 构建生产版本
eas build --platform ios --profile production

# 构建过程中会要求：
# - 选择 Apple Developer Team
# - 自动创建 Provisioning Profile
# - 自动创建 Distribution Certificate
```

**4. 下载IPA文件**
构建完成后，EAS会提供下载链接，下载 `.ipa` 文件。

---

### 方法B：本地构建（需要Mac）

**1. 安装Xcode**
- 从Mac App Store安装最新版Xcode
- 打开Xcode，同意许可协议

**2. 生成原生代码**
```bash
npx expo prebuild --platform ios
```

**3. 在Xcode中打开**
```bash
open ios/gratitudejournal.xcworkspace
```

**4. 配置签名**
- 在Xcode中选择项目
- 选择 Signing & Capabilities
- 选择你的开发团队
- 确保Bundle ID正确

**5. Archive**
- Product → Archive
- 等待构建完成
- 点击 "Distribute App"
- 选择 "App Store Connect"

---

## 三、准备App Store素材

### 1. 应用图标
- **位置：** `assets/images/icon.png`
- **尺寸：** 1024x1024px
- **格式：** PNG（无透明度）

### 2. 截图要求

**iPhone 6.7" (iPhone 14 Pro Max)**
- 尺寸：1290 x 2796 px
- 数量：至少3张，最多10张

**iPhone 6.5" (iPhone 11 Pro Max)**
- 尺寸：1242 x 2688 px
- 数量：至少3张

**建议截图内容：**
1. 首页 - 展示今日进度和感恩卡片
2. 写作页面 - 展示智者启示功能
3. 智者总结 - 展示四位智者的评论
4. 统计页面 - 展示连续打卡和成就
5. 设置页面 - 展示多语言和云同步

### 3. 应用描述

**中文简介（170字以内）：**
```
开悟日志是一款结合古代智慧与现代AI的感恩日记应用。每天记录3个感恩，获得爱之使者、柏拉图、老子、觉者四位智者的启示。通过感恩练习，培养积极心态，发现生活中的美好。

核心功能：
• 每日感恩记录 - 简单易用的写作体验
• 智者启示 - AI生成个性化的智慧引导
• 数据分析 - 追踪你的成长轨迹
• 云端同步 - 多设备无缝访问
• 每日提醒 - 温柔的习惯养成助手
```

**英文简介：**
```
Awaken is a gratitude journal app that combines ancient wisdom with modern AI. Record 3 gratitudes daily and receive insights from four wise masters: Messenger of Love, Plato, Lao Tzu, and The Awakened One. Cultivate positivity and discover life's beauty through gratitude practice.

Key Features:
• Daily Gratitude - Simple and intuitive writing experience
• Wisdom Insights - AI-generated personalized guidance
• Analytics - Track your growth journey
• Cloud Sync - Seamless access across devices
• Daily Reminders - Gentle habit-building assistant
```

### 4. 关键词（100字符以内）
```
中文：感恩,日记,冥想,正念,习惯,成长,心理健康,幸福,智慧,自我提升
英文：gratitude,journal,meditation,mindfulness,habit,growth,mental health,happiness,wisdom,self improvement
```

### 5. 分类
- **主分类：** 健康健美 (Health & Fitness)
- **次分类：** 生活 (Lifestyle)

### 6. 年龄分级
- **建议：** 4+（所有年龄）
- 无暴力、色情、赌博等内容

---

## 四、App Store Connect配置

### 1. 创建应用
1. 登录 https://appstoreconnect.apple.com
2. 点击 "我的App" → "+" → "新建App"
3. 填写信息：
   - 平台：iOS
   - 名称：Awaken（或 开悟日志）
   - 主要语言：简体中文
   - Bundle ID：选择项目的Bundle ID
   - SKU：gratitude-journal-app

### 2. 上传构建版本

**使用EAS：**
```bash
eas submit --platform ios --profile production
```

**使用Xcode：**
- 在Archive完成后，选择 "Upload to App Store"

### 3. 填写应用信息
- 上传截图（至少3张）
- 填写应用描述
- 设置关键词
- 选择分类
- 设置年龄分级
- 添加隐私政策URL（必需）
- 添加用户协议URL

### 4. 隐私信息
需要在App Store Connect中声明：
- [ ] 收集用户账户信息（Apple登录）
- [ ] 收集用户内容（日记内容）
- [ ] 使用第三方分析工具（如有）

### 5. 提交审核
- 选择构建版本
- 填写审核备注（可选）
- 提交审核

---

## 五、环境变量配置

### 生产环境需要的环境变量

**后端服务器：**
```env
# 数据库连接（需要提供生产数据库）
DATABASE_URL=postgresql://user:password@host:port/database

# AI服务（Manus平台提供）
# 如果使用外部AI，需要配置：
# OPENAI_API_KEY=sk-...

# 会话密钥（生成一个随机字符串）
SESSION_SECRET=your-random-secret-key-here

# 环境
NODE_ENV=production
```

**如何生成SESSION_SECRET：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 六、服务器部署

### 选项A：继续使用Manus平台
- 已发布的生产环境会自动处理
- 数据库、AI服务都已配置好
- 无需额外配置

### 选项B：自建服务器
需要部署以下服务：
1. Node.js服务器（运行后端API）
2. PostgreSQL数据库
3. AI服务（OpenAI或其他）

**部署步骤：**
```bash
# 1. 构建后端
pnpm build

# 2. 启动服务
NODE_ENV=production node dist/index.js

# 3. 确保服务器暴露在公网
# 需要配置域名和HTTPS证书
```

---

## 七、审核注意事项

### 1. 测试账号
Apple审核需要测试账号，准备：
- 测试邮箱：test@example.com
- 测试密码：TestPassword123

### 2. 审核备注
建议在审核备注中说明：
```
这是一款感恩日记应用，使用AI技术提供个性化的智慧启示。

核心功能：
1. 用户可以每天记录3个感恩事项
2. AI会从四位智者的角度提供写作灵感
3. 完成后可以查看智者的总结和分析

测试流程：
1. 使用Apple登录（或跳过登录）
2. 点击首页的"+"按钮开始写作
3. 点击"灵感"按钮获取智者启示
4. 完成3个感恩后提交
5. 查看智者总结页面

注意：AI生成需要几秒钟时间，请耐心等待。
```

### 3. 常见拒绝原因及应对
- **隐私政策缺失** → 确保在设置中添加隐私政策链接
- **功能不完整** → 确保所有按钮都有功能
- **崩溃问题** → 提交前充分测试
- **元数据问题** → 确保截图、描述与实际功能一致

---

## 八、审核时间线

1. **提交审核** → 进入"等待审核"状态
2. **审核中** → 通常1-3天（可能更快）
3. **审核结果**：
   - ✅ 通过 → 可以发布
   - ❌ 拒绝 → 查看拒绝原因，修改后重新提交

---

## 九、发布后

### 1. 监控
- 在App Store Connect查看下载量
- 查看崩溃报告
- 收集用户评价

### 2. 更新
需要更新时：
1. 修改 `app.config.ts` 中的版本号
2. 重新构建
3. 上传新版本
4. 提交审核

---

## 十、联系信息

**技术支持：**
- 项目GitHub：（如有）
- 技术文档：见项目README.md
- 问题反馈：https://help.manus.im

**重要文件位置：**
- 应用配置：`app.config.ts`
- 构建配置：`eas.json`
- 包管理：`package.json`
- 环境变量：`.env`（需要创建）

---

## 常见问题

**Q: 需要Mac电脑吗？**
A: 使用EAS Build不需要，使用本地构建需要Mac。

**Q: 构建需要多久？**
A: EAS Build通常15-30分钟，本地构建5-10分钟。

**Q: 审核需要多久？**
A: 通常1-3天，首次提交可能需要更长时间。

**Q: 审核被拒怎么办？**
A: 查看拒绝原因，修改后重新提交。常见问题都可以快速解决。

**Q: 需要付费吗？**
A: Apple Developer账号需要$99/年，EAS Build有免费额度。

---

## 检查清单

提交前请确认：
- [ ] 应用图标已准备（1024x1024）
- [ ] 截图已准备（至少3张）
- [ ] 应用描述已撰写
- [ ] 隐私政策URL已添加
- [ ] 用户协议URL已添加
- [ ] 测试账号已准备
- [ ] 所有功能已测试
- [ ] 环境变量已配置
- [ ] 后端服务已部署
- [ ] Bundle ID正确
- [ ] 版本号正确

---

**祝您顺利上架！** 🚀

如有问题，请联系技术支持团队。
