# Gratitude Journal Go Backend

这是感恩日记应用的Go语言后端服务，使用Gin框架构建，提供RESTful API。

## 技术栈

- **Go 1.21+** - 编程语言
- **Gin** - Web框架
- **GORM** - ORM框架
- **PostgreSQL** - 数据库
- **JWT** - 认证
- **OpenRouter** - AI服务
- **Zap** - 日志
- **Viper** - 配置管理

## 项目结构

```
server-go/
├── cmd/
│   └── api/
│       └── main.go          # 应用入口
├── internal/
│   ├── config/
│   │   └── config.go        # 配置加载
│   ├── handler/
│   │   ├── auth_handler.go  # 认证处理
│   │   ├── journal_handler.go # 日记处理
│   │   ├── ai_handler.go    # AI处理
│   │   └── stats_handler.go # 统计处理
│   ├── middleware/
│   │   ├── auth.go          # JWT认证中间件
│   │   └── middleware.go    # CORS、日志等中间件
│   ├── models/
│   │   └── models.go        # 数据模型
│   ├── repository/
│   │   ├── database.go      # 数据库连接
│   │   ├── user_repo.go     # 用户数据访问
│   │   ├── journal_repo.go  # 日记数据访问
│   │   └── stats_repo.go    # 统计数据访问
│   ├── router/
│   │   └── router.go        # 路由配置
│   └── service/
│       ├── auth_service.go  # 认证服务
│       ├── email_service.go # 邮件服务
│       └── ai_service.go    # AI服务
├── pkg/
│   ├── jwt/
│   │   └── jwt.go           # JWT工具
│   └── response/
│       └── response.go      # 统一响应格式
├── Dockerfile               # Docker构建文件
├── docker-compose.yml       # Docker Compose配置
├── Makefile                 # 构建脚本
├── go.mod                   # Go模块定义
└── README.md                # 本文档
```

## 快速开始

### 1. 环境要求

- Go 1.21 或更高版本
- PostgreSQL 14 或更高版本
- Make（可选，用于简化命令）

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# 服务器配置
PORT=3000
ENV=development

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/gratitude_journal?sslmode=disable

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=168h

# OpenRouter AI服务
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# 邮件服务
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=Awaken <your-email@gmail.com>

# CORS
CORS_ORIGINS=http://localhost:8081,https://your-app.com
```

### 3. 安装依赖

```bash
cd server-go
go mod download
go mod tidy
```

### 4. 运行服务

**开发模式：**
```bash
go run cmd/api/main.go
```

**编译运行：**
```bash
make build
make run
```

**Docker运行：**
```bash
make docker-run
```

## API 文档

### 认证接口

#### 发送验证码
```
POST /api/auth/email/send-code
Content-Type: application/json

{
  "email": "user@example.com",
  "language": "zh"  // 可选，默认zh
}
```

#### 验证并登录
```
POST /api/auth/email/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "name": "用户名"  // 可选
}
```

响应：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "openId": "email_user@example.com_...",
      "email": "user@example.com",
      "name": "用户名",
      "loginMethod": "email",
      "lastSignedIn": "2025-01-05T10:00:00Z"
    }
  }
}
```

#### 获取当前用户
```
GET /api/auth/me
Authorization: Bearer <token>
```

### 日记接口

#### 获取日记列表
```
GET /api/journal/list?limit=50&offset=0
Authorization: Bearer <token>
```

#### 创建日记
```
POST /api/journal/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "localId": "uuid-string",
  "source": "gratitude",  // gratitude | philosophy | free
  "topic": "今天的感恩",
  "content": "我感恩...",
  "mastersSummary": "{...}",  // JSON字符串
  "timeOfDay": "morning",
  "createdAt": "2025-01-05T10:00:00Z"  // 可选
}
```

#### 更新日记
```
PUT /api/journal/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "更新的标题",
  "content": "更新的内容"
}
```

#### 删除日记
```
DELETE /api/journal/:id
Authorization: Bearer <token>
```

#### 同步日记
```
POST /api/journal/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "entries": [...],
  "since": "2025-01-01T00:00:00Z"  // 可选
}
```

### AI接口

#### 获取智者启示
```
POST /api/ai/wisdom
Content-Type: application/json

{
  "topic": "感恩的主题",
  "content": "用户写的内容",
  "language": "zh"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "wisdoms": [
      {"sage": "爱之使者", "emoji": "✨", "message": "..."},
      {"sage": "觉者", "emoji": "🪷", "message": "..."},
      {"sage": "老子", "emoji": "☯️", "message": "..."},
      {"sage": "柏拉图", "emoji": "🏛️", "message": "..."}
    ]
  }
}
```

#### 获取智者总结
```
POST /api/ai/summary
Content-Type: application/json

{
  "topic": "感恩的主题",
  "content": "完整的日记内容",
  "language": "zh"
}
```

#### 获取个性化题目（需认证）
```
POST /api/ai/topics
Authorization: Bearer <token>
Content-Type: application/json

{
  "language": "zh"
}
```

#### 深度回顾（需认证）
```
POST /api/ai/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "consciousness",  // consciousness | growth | relationships | attention
  "language": "zh"
}
```

### 统计接口

#### 获取统计
```
GET /api/stats
Authorization: Bearer <token>
```

#### 同步统计
```
POST /api/stats/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "totalEntries": 10,
  "gratitudeCount": 5,
  "philosophyCount": 3,
  "freeNoteCount": 2,
  "currentStreak": 3,
  "longestStreak": 7,
  "lastEntryDate": "2025-01-05T10:00:00Z"
}
```

## 部署

### Docker部署

1. 构建镜像：
```bash
docker build -t gratitude-api:latest .
```

2. 运行容器：
```bash
docker run -d \
  --name gratitude-api \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e OPENROUTER_API_KEY="..." \
  gratitude-api:latest
```

### Docker Compose部署

```bash
# 启动所有服务（API + PostgreSQL）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 手动部署

1. 编译：
```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o api ./cmd/api
```

2. 上传到服务器并运行：
```bash
chmod +x api
./api
```

### 使用systemd管理

创建 `/etc/systemd/system/gratitude-api.service`：

```ini
[Unit]
Description=Gratitude Journal API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/gratitude-api
ExecStart=/opt/gratitude-api/api
Restart=always
RestartSec=5
EnvironmentFile=/opt/gratitude-api/.env

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl enable gratitude-api
sudo systemctl start gratitude-api
```

## 与前端集成

修改前端的API配置，将tRPC调用改为REST API调用。

### 示例：修改lib/api.ts

```typescript
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = {
  // 认证
  auth: {
    sendCode: (email: string, language: string) =>
      fetch(`${API_BASE}/api/auth/email/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language }),
      }).then(r => r.json()),
    
    verify: (email: string, code: string, name?: string) =>
      fetch(`${API_BASE}/api/auth/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name }),
      }).then(r => r.json()),
    
    me: (token: string) =>
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
  },
  
  // 日记
  journal: {
    list: (token: string, limit = 50, offset = 0) =>
      fetch(`${API_BASE}/api/journal/list?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    
    create: (token: string, entry: any) =>
      fetch(`${API_BASE}/api/journal/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      }).then(r => r.json()),
    
    sync: (token: string, entries: any[], since?: string) =>
      fetch(`${API_BASE}/api/journal/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entries, since }),
      }).then(r => r.json()),
  },
  
  // AI
  ai: {
    wisdom: (topic: string, content: string, language: string) =>
      fetch(`${API_BASE}/api/ai/wisdom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, content, language }),
      }).then(r => r.json()),
    
    summary: (topic: string, content: string, language: string) =>
      fetch(`${API_BASE}/api/ai/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, content, language }),
      }).then(r => r.json()),
  },
};
```

## 开发

### 添加新的API端点

1. 在 `internal/handler/` 创建handler
2. 在 `internal/router/router.go` 注册路由
3. 如需要，在 `internal/service/` 添加业务逻辑
4. 如需要，在 `internal/repository/` 添加数据访问

### 运行测试

```bash
make test
make test-coverage
```

### 代码格式化

```bash
make fmt
make lint
```

## 常见问题

### 1. 数据库连接失败
确保PostgreSQL正在运行，且DATABASE_URL配置正确。

### 2. 邮件发送失败
- 检查EMAIL_*环境变量配置
- Gmail需要使用App Password，不是账户密码
- 确保开启了"允许不够安全的应用"或使用App Password

### 3. AI服务无响应
- 检查OPENROUTER_API_KEY是否正确
- 检查网络是否能访问api.openrouter.ai

### 4. JWT验证失败
- 确保前后端使用相同的JWT_SECRET
- 检查token是否过期

## License

MIT
