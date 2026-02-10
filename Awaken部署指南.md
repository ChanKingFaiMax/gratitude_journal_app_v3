# Awaken（觉醒日志）部署指南

**版本**: v1.0  
**日期**: 2026年1月5日  
**项目**: Awaken / 觉醒日志

---

## 📦 部署包内容

本部署包包含：
- ✅ 完整的React Native (Expo) 前端代码
- ✅ Node.js后端代码
- ✅ Go后端代码（可选）
- ✅ 数据库Schema
- ✅ Docker配置文件
- ✅ 环境变量配置示例

---

## 🎯 系统要求

### 前端开发环境
- Node.js 22.x
- pnpm 9.x
- Expo CLI
- iOS: Xcode 15+ (macOS)
- Android: Android Studio

### 后端环境
**Node.js版本**:
- Node.js 22.x
- PostgreSQL 14+

**Go版本（可选）**:
- Go 1.21+
- PostgreSQL 14+

---

## 🚀 快速开始

### 1. 解压部署包

```bash
tar -xzf awaken_deployment_20260105.tar.gz
cd gratitude_journal_app
```

### 2. 安装依赖

```bash
# 安装前端依赖
pnpm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/awaken

# OpenRouter AI配置（推荐）
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# 邮件服务配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# JWT密钥
JWT_SECRET=your_random_secret_key_here

# 服务器端口
PORT=3000
EXPO_PORT=8081
```

### 4. 初始化数据库

```bash
# 运行数据库迁移
pnpm db:push
```

### 5. 启动开发服务器

```bash
# 启动前端+后端
pnpm dev

# 或分别启动
pnpm dev:server  # 后端
pnpm dev:metro   # 前端
```

### 6. 在手机上测试

- 安装 **Expo Go** App
- 扫描终端显示的二维码
- 或运行 `pnpm qr` 生成二维码

---

## 📱 构建生产版本

### iOS构建

```bash
# 使用EAS Build
eas build --platform ios

# 或使用Expo本地构建
expo build:ios
```

### Android构建

```bash
# 使用EAS Build
eas build --platform android

# 或使用Expo本地构建
expo build:android
```

---

## 🐳 Docker部署

### 使用Node.js后端

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 使用Go后端

```bash
cd server-go
docker-compose up -d
```

---

## 🔧 环境变量详解

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL连接字符串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT签名密钥 | 随机生成的长字符串 |

### AI服务配置（二选一）

**方案A: OpenRouter（推荐）**
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

**方案B: Manus内置AI**
```bash
# 无需配置，自动使用Manus Forge
```

### 邮件服务配置

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

**获取Gmail App Password**:
1. 访问 https://myaccount.google.com/security
2. 启用两步验证
3. 生成应用专用密码
4. 使用生成的16位密码

---

## 📊 数据库Schema

### 主要表结构

**users** - 用户表
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**journal_entries** - 日记表
```sql
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'gratitude',
  date TEXT NOT NULL,
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**user_stats** - 用户统计表
```sql
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  total_entries INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 安全配置

### 1. JWT密钥生成

```bash
# 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 数据库安全

- ✅ 使用强密码
- ✅ 启用SSL连接
- ✅ 限制数据库访问IP
- ✅ 定期备份

### 3. API密钥保护

- ✅ 不要提交到Git
- ✅ 使用环境变量
- ✅ 定期轮换密钥

---

## 🌐 生产环境部署

### 推荐架构

```
[用户手机] 
    ↓
[CDN] (静态资源)
    ↓
[负载均衡器]
    ↓
[Node.js/Go后端] ← [PostgreSQL数据库]
    ↓
[OpenRouter API]
```

### 服务器要求

**最低配置**:
- CPU: 2核
- 内存: 4GB
- 存储: 20GB SSD
- 带宽: 10Mbps

**推荐配置**:
- CPU: 4核
- 内存: 8GB
- 存储: 50GB SSD
- 带宽: 100Mbps

---

## 📈 监控与日志

### 应用日志

```bash
# 查看后端日志
pm2 logs awaken-server

# 查看Docker日志
docker-compose logs -f
```

### 性能监控

建议集成：
- ✅ Sentry (错误追踪)
- ✅ New Relic (性能监控)
- ✅ Datadog (基础设施监控)

---

## 🔄 更新与维护

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
pnpm install

# 运行数据库迁移
pnpm db:push

# 重启服务
pm2 restart awaken-server
```

### 数据库备份

```bash
# 备份数据库
pg_dump -U user -d awaken > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U user -d awaken < backup_20260105.sql
```

---

## 🐛 常见问题

### Q1: 数据库连接失败

**解决方案**:
1. 检查 `DATABASE_URL` 是否正确
2. 确认PostgreSQL服务已启动
3. 检查防火墙设置
4. 验证数据库用户权限

### Q2: AI生成失败

**解决方案**:
1. 检查 `OPENROUTER_API_KEY` 是否有效
2. 确认API配额未用完
3. 查看后端日志获取详细错误
4. 如果OpenRouter不可用，会自动回退到Manus Forge

### Q3: 邮件发送失败

**解决方案**:
1. 确认Gmail App Password正确
2. 检查SMTP配置
3. 确认Gmail账户未被锁定
4. 查看后端日志

### Q4: Expo Go无法连接

**解决方案**:
1. 确保手机和电脑在同一网络
2. 检查防火墙设置
3. 尝试使用Tunnel模式: `expo start --tunnel`
4. 重启开发服务器

---

## 📞 技术支持

### 文档资源

- **Expo文档**: https://docs.expo.dev
- **React Native文档**: https://reactnative.dev
- **PostgreSQL文档**: https://www.postgresql.org/docs/

### 联系方式

如有问题，请联系开发团队。

---

## 📝 更新日志

### v1.0 (2026-01-05)

**核心功能**:
- ✅ 感恩/哲思双主题日记
- ✅ 四位智者启示系统
- ✅ 深度回顾与洞察
- ✅ 邮箱登录与云端同步
- ✅ 中英文双语支持
- ✅ 每日提醒推送

**技术栈**:
- React Native (Expo SDK 54)
- Node.js + Express
- Go + Gin (可选)
- PostgreSQL
- OpenRouter AI

---

## ✅ 部署检查清单

部署前确认：

- [ ] 环境变量配置完成
- [ ] 数据库连接测试通过
- [ ] AI服务配置正确
- [ ] 邮件服务测试通过
- [ ] SSL证书配置完成
- [ ] 域名DNS解析正确
- [ ] 防火墙规则设置
- [ ] 备份策略制定
- [ ] 监控告警配置
- [ ] 日志收集配置

---

**祝部署顺利！** 🚀

如有问题，请参考文档或联系技术支持。
