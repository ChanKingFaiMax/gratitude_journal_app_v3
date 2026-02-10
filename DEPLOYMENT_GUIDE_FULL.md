# 感恩日记应用 - 完整部署指南

本指南包含后端服务器部署和移动应用发布的完整流程。

---

## 📋 目录

1. [后端服务器部署](#后端服务器部署)
2. [数据库配置](#数据库配置)
3. [iOS应用发布](#ios应用发布)
4. [Android应用发布](#android应用发布)
5. [Web版本部署](#web版本部署)
6. [环境变量配置](#环境变量配置)
7. [监控和维护](#监控和维护)
8. [常见问题](#常见问题)

---

## 后端服务器部署

### 方案一：云服务器部署（推荐）

#### 1. 准备服务器

**支持的平台**：
- AWS EC2
- Google Cloud Platform
- DigitalOcean
- Alibaba Cloud
- 任何支持Node.js的VPS

**最低配置**：
- CPU: 1核
- 内存: 1GB
- 存储: 20GB
- 操作系统: Ubuntu 20.04+ / CentOS 7+

#### 2. 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 安装pnpm
npm install -g pnpm

# 安装PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 启动PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 3. 配置PostgreSQL

```bash
# 切换到postgres用户
sudo -u postgres psql

# 在PostgreSQL中执行：
CREATE DATABASE gratitude_journal;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gratitude_journal TO your_user;
\q
```

#### 4. 上传代码

```bash
# 方法1: 使用git
git clone https://github.com/your-repo/gratitude_journal_app.git
cd gratitude_journal_app

# 方法2: 使用scp上传
# 在本地执行：
scp -r ./gratitude_journal_app user@your-server:/home/user/
```

#### 5. 配置环境变量

创建 `.env` 文件：

```bash
cd gratitude_journal_app
nano .env
```

添加以下内容：

```env
# 数据库配置
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/gratitude_journal

# 服务器端口
PORT=3000

# JWT密钥（生成一个随机字符串）
JWT_SECRET=your_random_jwt_secret_here

# AI服务配置（如果使用）
ANTHROPIC_API_KEY=your_anthropic_api_key

# 生产环境标识
NODE_ENV=production
```

**生成JWT_SECRET**：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 6. 安装依赖并构建

```bash
# 安装依赖
pnpm install

# 运行数据库迁移
pnpm db:push

# 构建服务器
pnpm build
```

#### 7. 使用PM2运行（推荐）

```bash
# 安装PM2
npm install -g pm2

# 启动服务器
pm2 start dist/index.js --name gratitude-api

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs gratitude-api

# 查看状态
pm2 status
```

#### 8. 配置Nginx反向代理

```bash
# 安装Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/gratitude-api
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/gratitude-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 9. 配置SSL证书（Let's Encrypt）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

---

### 方案二：Docker部署

#### 1. 创建Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]
```

#### 2. 创建docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: gratitude_journal
      POSTGRES_USER: your_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://your_user:your_password@postgres:5432/gratitude_journal
      NODE_ENV: production
      JWT_SECRET: your_random_jwt_secret
      ANTHROPIC_API_KEY: your_anthropic_api_key
    depends_on:
      - postgres

volumes:
  postgres_data:
```

#### 3. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 数据库配置

### 数据库迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit migrate

# 或使用快捷命令
pnpm db:push
```

### 数据库备份

```bash
# 备份数据库
pg_dump -U your_user -h localhost gratitude_journal > backup.sql

# 恢复数据库
psql -U your_user -h localhost gratitude_journal < backup.sql

# 自动备份脚本（添加到crontab）
0 2 * * * pg_dump -U your_user gratitude_journal > /backups/gratitude_$(date +\%Y\%m\%d).sql
```

---

## iOS应用发布

### 1. 准备工作

- **Apple Developer账号**：$99/年
- **Mac电脑**：用于构建和上传（使用EAS Build可选）
- **Xcode 15+**：如果本地构建

### 2. 安装EAS CLI

```bash
# 安装EAS CLI
npm install -g eas-cli

# 登录Expo账号
eas login
```

### 3. 配置项目

编辑 `app.config.ts`：

```typescript
export default {
  name: "感恩日记",
  slug: "gratitude_journal_app",
  version: "1.0.0",
  ios: {
    bundleIdentifier: "com.yourcompany.gratitude",
    buildNumber: "1",
    supportsTablet: true,
  },
  // ... 其他配置
}
```

### 4. 配置EAS Build

创建或编辑 `eas.json`：

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

### 5. 构建iOS应用

```bash
# 初始化EAS配置
eas build:configure

# 构建生产版本
eas build --platform ios --profile production

# 等待构建完成（约15-30分钟）
```

### 6. 准备App Store素材

#### 应用图标
- 尺寸：1024x1024px
- 格式：PNG（无透明度）
- 位置：`assets/images/icon.png`

#### 截图要求
- **iPhone 6.7"** (1290 x 2796 px) - 至少3张
- **iPhone 6.5"** (1242 x 2688 px) - 至少3张

#### 应用描述（中文）
```
感恩日记是一款结合古代智慧与现代AI的日记应用。每天记录感恩事项，获得深度洞察和个性化建议。

核心功能：
• 每日感恩记录 - 简单易用的写作体验
• AI深度分析 - 意识层级、成长轨迹、关系洞察
• 数据统计 - 追踪你的成长轨迹
• 云端同步 - 多设备无缝访问
• 每日提醒 - 温柔的习惯养成助手
```

### 7. 在App Store Connect中配置

1. 访问 [App Store Connect](https://appstoreconnect.apple.com)
2. 创建新应用
3. 填写应用信息：
   - 应用名称
   - 副标题
   - 描述
   - 关键词
   - 截图
   - 隐私政策URL
4. 选择构建版本
5. 提交审核

### 8. 提交到App Store

```bash
# 使用EAS Submit
eas submit --platform ios --profile production

# 或手动上传IPA文件到App Store Connect
```

---

## Android应用发布

### 1. 准备工作

- **Google Play开发者账号**：$25一次性费用
- **签名密钥**：用于应用签名

### 2. 生成签名密钥

```bash
# 使用keytool生成
keytool -genkeypair -v -storetype PKCS12 \
  -keystore gratitude-release.keystore \
  -alias gratitude-key \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# 记录密钥信息（重要！）
```

### 3. 配置app.config.ts

```typescript
export default {
  // ... 其他配置
  android: {
    package: "com.yourcompany.gratitude",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundColor: "#E6F4FE"
    }
  },
  version: "1.0.0",
}
```

### 4. 配置eas.json

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "local"
      }
    }
  }
}
```

### 5. 构建Android应用

```bash
# 构建AAB文件（推荐）
eas build --platform android --profile production

# 等待构建完成
```

### 6. 上传到Google Play Console

```bash
# 使用EAS Submit
eas submit --platform android --profile production

# 或手动上传AAB文件
# 访问 https://play.google.com/console
```

### 7. 在Google Play Console中配置

1. 创建应用
2. 填写应用信息
3. 设置内容分级
4. 上传截图（至少2张）
5. 填写隐私政策
6. 提交审核

---

## Web版本部署

### 方案一：Vercel部署（推荐）

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 方案二：Netlify部署

创建 `netlify.toml`：

```toml
[build]
  command = "npx expo export --platform web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod
```

### 方案三：Nginx静态托管

```bash
# 构建Web版本
npx expo export --platform web

# 上传到服务器
scp -r dist/* user@your-server:/var/www/gratitude

# 配置Nginx
sudo nano /etc/nginx/sites-available/gratitude-web
```

Nginx配置：

```nginx
server {
    listen 80;
    server_name app.your-domain.com;
    root /var/www/gratitude;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 环境变量配置

### 服务器环境变量

`.env` 文件：

```env
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/database

# 服务器
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your_random_secret_here

# AI服务
ANTHROPIC_API_KEY=your_key_here
```

### 移动应用环境变量

`.env` 文件：

```env
# API服务器地址
EXPO_PUBLIC_API_BASE_URL=https://api.your-domain.com

# OAuth配置（如果使用）
EXPO_PUBLIC_OAUTH_PORTAL_URL=https://portal.manus.im
EXPO_PUBLIC_OAUTH_SERVER_URL=https://api.manus.im
EXPO_PUBLIC_APP_ID=your_app_id
```

---

## 监控和维护

### 1. 日志管理

```bash
# PM2日志
pm2 logs gratitude-api

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL日志
tail -f /var/log/postgresql/postgresql-15-main.log
```

### 2. 性能监控

推荐工具：
- **服务器监控**：Datadog, New Relic, Prometheus
- **应用监控**：Sentry（错误追踪）
- **数据库监控**：pgAdmin, DataGrip

### 3. 自动备份

创建备份脚本 `/usr/local/bin/backup-gratitude.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/backups/gratitude"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份数据库
pg_dump -U your_user gratitude_journal > "$BACKUP_DIR/db_$DATE.sql"

# 压缩
gzip "$BACKUP_DIR/db_$DATE.sql"

# 删除30天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

添加到crontab：

```bash
chmod +x /usr/local/bin/backup-gratitude.sh
crontab -e
# 添加：每天凌晨2点执行
0 2 * * * /usr/local/bin/backup-gratitude.sh
```

---

## 常见问题

### 1. 数据库连接失败

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查端口
sudo netstat -tulpn | grep 5432

# 检查防火墙
sudo ufw allow 5432
```

### 2. 构建失败

```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 3. iOS构建失败

- 确保Apple Developer账号有效
- 在EAS中配置正确的Bundle ID
- 重新生成证书：`eas credentials`

### 4. API请求失败

```bash
# 检查服务器状态
curl https://api.your-domain.com/api/health

# 检查CORS配置
# 确保服务器允许移动应用的origin
```

### 5. SSL证书问题

```bash
# 检查证书
sudo certbot certificates

# 续期证书
sudo certbot renew

# 重启Nginx
sudo systemctl restart nginx
```

---

## 更新和升级

### 服务器更新

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install

# 运行迁移
pnpm db:push

# 重新构建
pnpm build

# 重启服务
pm2 restart gratitude-api
```

### 移动应用更新

```bash
# 更新版本号（app.config.ts）
version: "1.0.1"
ios.buildNumber: "2"
android.versionCode: 2

# 重新构建
eas build --platform all --profile production

# 提交更新
eas submit --platform all
```

---

## 成本估算

### 基础配置（月费用）

- **服务器**：$5-20（DigitalOcean/Vultr）
- **数据库**：$0（自托管）或 $15（托管服务）
- **域名**：$1-2/月
- **SSL证书**：$0（Let's Encrypt免费）
- **总计**：~$6-40/月

### 应用商店费用

- **Apple App Store**：$99/年
- **Google Play Store**：$25一次性
- **总计**：~$124首年，之后$99/年

---

## 安全建议

1. **使用HTTPS**：生产环境必须使用SSL证书
2. **定期更新**：及时更新依赖包和系统补丁
3. **强密码**：数据库和JWT密钥使用强随机密码
4. **防火墙**：只开放必要的端口（80, 443, 22）
5. **备份**：定期备份数据库和配置文件
6. **监控**：设置错误告警和性能监控
7. **限流**：使用rate limiting防止API滥用

---

## 检查清单

### 服务器部署
- [ ] 服务器已准备
- [ ] Node.js和pnpm已安装
- [ ] PostgreSQL已配置
- [ ] 环境变量已设置
- [ ] 代码已上传
- [ ] 依赖已安装
- [ ] 数据库迁移已完成
- [ ] PM2已配置
- [ ] Nginx已配置
- [ ] SSL证书已安装

### iOS发布
- [ ] Apple Developer账号已准备
- [ ] 应用图标已准备（1024x1024）
- [ ] 截图已准备（至少3张）
- [ ] 应用描述已撰写
- [ ] 隐私政策URL已添加
- [ ] Bundle ID已配置
- [ ] EAS Build已完成
- [ ] App Store Connect已配置
- [ ] 已提交审核

### Android发布
- [ ] Google Play开发者账号已准备
- [ ] 签名密钥已生成
- [ ] 应用图标已准备
- [ ] 截图已准备（至少2张）
- [ ] 应用描述已撰写
- [ ] 隐私政策URL已添加
- [ ] Package名称已配置
- [ ] EAS Build已完成
- [ ] Google Play Console已配置
- [ ] 已提交审核

---

**祝你部署顺利！🎉**

如有问题，请参考项目README或API文档。
