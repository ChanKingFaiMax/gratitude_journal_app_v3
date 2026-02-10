# 环境变量说明

## 生产环境部署所需的环境变量

### 1. 数据库配置（必需）
```
DATABASE_URL=postgresql://user:password@host:port/database
```
- 用于连接PostgreSQL数据库
- 格式：`postgresql://用户名:密码@主机:端口/数据库名`

### 2. 会话密钥（必需）
```
SESSION_SECRET=your-random-secret-key
```
- 用于加密用户会话cookie
- 生成方法：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. 运行环境
```
NODE_ENV=production
PORT=3000
```

### 4. AI服务（Manus平台已配置，自建需要）
```
# 如果不使用Manus平台，需要配置：
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
```

## 当前项目已配置的环境变量

以下变量已在Manus平台配置，无需手动设置：
- BUILT_IN_FORGE_API_KEY
- BUILT_IN_FORGE_API_URL  
- JWT_SECRET
- OAUTH_SERVER_URL
- VITE_APP_TITLE
- VITE_APP_LOGO

## 配置方法

### 在Manus平台
1. 打开管理界面
2. 进入Settings → Secrets
3. 添加所需的环境变量

### 自建服务器
创建 `.env` 文件并填入以上变量
