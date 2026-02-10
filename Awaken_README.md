# Awaken（觉醒日志）- 部署包

**版本**: v1.0  
**打包日期**: 2026年1月5日  
**包体大小**: 51MB (压缩后)

---

## 📦 包含内容

本部署包包含完整的Awaken应用源代码：

### 前端代码
- React Native (Expo SDK 54)
- TypeScript
- NativeWind (Tailwind CSS)
- 中英文双语支持

### 后端代码
- Node.js + Express
- Go + Gin (可选)
- PostgreSQL数据库Schema
- Docker配置

### 核心功能
- ✅ 感恩/哲思双主题日记
- ✅ 四位智者启示（爱之使者、觉者、柏拉图、老子）
- ✅ 智者总结与深度回顾
- ✅ 邮箱验证码登录
- ✅ 云端数据同步
- ✅ 每日提醒推送
- ✅ 历史记录与统计
- ✅ 自由笔记功能

---

## 🚀 快速开始

### 1. 解压

```bash
tar -xzf awaken_deployment_20260105.tar.gz
cd gratitude_journal_app
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，填入配置：

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/awaken
OPENROUTER_API_KEY=your_api_key
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
JWT_SECRET=your_random_secret
```

### 4. 初始化数据库

```bash
pnpm db:push
```

### 5. 启动开发服务器

```bash
pnpm dev
```

### 6. 在手机测试

- 安装 Expo Go
- 扫描二维码
- 开始测试

---

## 📱 构建生产版本

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

---

## 🐳 Docker部署

```bash
docker-compose up -d
```

---

## 📖 详细文档

请查看 **`Awaken部署指南.md`** 获取完整的部署说明，包括：

- 系统要求
- 环境变量配置
- 数据库Schema
- 安全配置
- 生产环境部署
- 常见问题解决
- 更新与维护

---

## 🔑 重要提示

### 必需的API密钥

1. **OpenRouter API Key** (推荐)
   - 访问: https://openrouter.ai
   - 注册并获取API密钥
   - 模型: `google/gemini-2.0-flash-exp:free`

2. **Gmail App Password** (邮件验证码)
   - 访问: https://myaccount.google.com/security
   - 启用两步验证
   - 生成应用专用密码

### 数据库

- PostgreSQL 14+
- 需要创建数据库: `awaken`
- 运行 `pnpm db:push` 初始化表结构

---

## 📊 技术栈

**前端**:
- React Native 0.81
- Expo SDK 54
- TypeScript 5.9
- NativeWind 4

**后端**:
- Node.js 22 / Go 1.21
- Express / Gin
- PostgreSQL 14+
- Drizzle ORM

**AI服务**:
- OpenRouter (推荐)
- Manus Forge (回退)

---

## 🎯 系统要求

### 开发环境
- Node.js 22.x
- pnpm 9.x
- PostgreSQL 14+

### 生产环境
- CPU: 2核+
- 内存: 4GB+
- 存储: 20GB+ SSD
- 带宽: 10Mbps+

---

## 📞 支持

如有问题，请参考：
1. **Awaken部署指南.md** - 完整部署文档
2. **server/README.md** - 后端API文档
3. **server-go/README.md** - Go后端文档

---

## 📝 文件清单

```
gratitude_journal_app/
├── app/                    # 前端页面
├── components/             # UI组件
├── lib/                    # 工具函数
├── server/                 # Node.js后端
├── server-go/              # Go后端（可选）
├── assets/                 # 静态资源
├── app.config.ts           # Expo配置
├── package.json            # 依赖配置
├── docker-compose.yml      # Docker配置
└── README.md               # 项目说明
```

---

## ✅ 部署前检查

- [ ] Node.js 22.x 已安装
- [ ] PostgreSQL 14+ 已安装
- [ ] pnpm 已安装
- [ ] 已获取 OpenRouter API Key
- [ ] 已获取 Gmail App Password
- [ ] 已创建数据库
- [ ] 已配置 .env 文件

---

**准备就绪，开始部署！** 🚀

详细步骤请参考 **Awaken部署指南.md**
