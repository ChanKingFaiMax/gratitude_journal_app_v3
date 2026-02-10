# Go后端架构设计

本文档描述将Node.js/TypeScript后端重写为Go语言的架构设计。

---

## 技术栈

### 核心框架
- **Web框架**：Gin（高性能HTTP框架）
- **ORM**：GORM（PostgreSQL）
- **认证**：Firebase Admin SDK + JWT
- **配置管理**：Viper
- **日志**：Zap（结构化日志）
- **验证**：go-playground/validator

### 外部服务
- **数据库**：PostgreSQL
- **AI服务**：OpenRouter API
- **邮件服务**：SMTP（Gmail）
- **认证**：Firebase Authentication

---

## 项目结构

```
server-go/
├── cmd/
│   └── api/
│       └── main.go              # 入口文件
├── internal/
│   ├── config/
│   │   └── config.go            # 配置加载
│   ├── middleware/
│   │   ├── auth.go              # 认证中间件
│   │   ├── cors.go              # CORS中间件
│   │   └── logger.go            # 日志中间件
│   ├── models/
│   │   ├── user.go              # 用户模型
│   │   ├── journal.go           # 日记模型
│   │   └── stats.go             # 统计模型
│   ├── repository/
│   │   ├── user_repo.go         # 用户数据访问
│   │   ├── journal_repo.go      # 日记数据访问
│   │   └── stats_repo.go        # 统计数据访问
│   ├── service/
│   │   ├── auth_service.go      # 认证服务
│   │   ├── journal_service.go   # 日记业务逻辑
│   │   ├── ai_service.go        # AI服务（OpenRouter）
│   │   └── email_service.go     # 邮件服务
│   ├── handler/
│   │   ├── auth_handler.go      # 认证API
│   │   ├── journal_handler.go   # 日记API
│   │   ├── stats_handler.go     # 统计API
│   │   └── review_handler.go    # 深度回顾API
│   └── router/
│       └── router.go            # 路由配置
├── pkg/
│   ├── jwt/
│   │   └── jwt.go               # JWT工具
│   ├── response/
│   │   └── response.go          # 统一响应格式
│   └── utils/
│       └── utils.go             # 工具函数
├── migrations/
│   └── *.sql                    # 数据库迁移文件
├── .env.example                 # 环境变量示例
├── go.mod                       # Go模块定义
├── go.sum                       # 依赖锁定
├── Dockerfile                   # Docker构建文件
└── README.md                    # Go后端文档
```

---

## API设计

### 认证相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/email/send-code` | 发送邮箱验证码 | 否 |
| POST | `/api/auth/email/verify` | 验证邮箱并登录 | 否 |
| POST | `/api/auth/firebase/verify` | Firebase ID Token验证 | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |
| POST | `/api/auth/logout` | 登出 | 是 |

### 日记相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/journal/list` | 获取日记列表 | 是 |
| POST | `/api/journal/create` | 创建日记 | 是 |
| PUT | `/api/journal/:id` | 更新日记 | 是 |
| DELETE | `/api/journal/:id` | 删除日记 | 是 |
| POST | `/api/journal/sync` | 批量同步日记 | 是 |

### AI相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/ai/wisdom` | 获取智者启示 | 否 |
| POST | `/api/ai/summary` | 获取智者总结 | 是 |
| POST | `/api/ai/topics` | 生成个性化题目 | 是 |
| POST | `/api/ai/review` | 深度回顾分析 | 是 |

### 统计相关

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/stats` | 获取用户统计 | 是 |
| POST | `/api/stats/sync` | 同步统计数据 | 是 |

---

## 数据模型

### User（用户）

```go
type User struct {
    ID           int64      `gorm:"primaryKey;autoIncrement"`
    OpenID       string     `gorm:"uniqueIndex;not null"`
    Email        string     `gorm:"uniqueIndex"`
    Name         string     `gorm:"not null"`
    LoginMethod  string     `gorm:"not null"` // email, firebase, google, apple
    LastSignedIn time.Time  `gorm:"not null"`
    CreatedAt    time.Time  `gorm:"autoCreateTime"`
    UpdatedAt    time.Time  `gorm:"autoUpdateTime"`
}
```

### JournalEntry（日记）

```go
type JournalEntry struct {
    ID              int64     `gorm:"primaryKey;autoIncrement"`
    UserID          int64     `gorm:"index;not null"`
    LocalID         string    `gorm:"index"`
    Source          string    `gorm:"not null"` // gratitude, philosophy, free
    Topic           string    `gorm:"type:text"`
    Content         string    `gorm:"type:text;not null"`
    MastersSummary  string    `gorm:"type:jsonb"`
    TimeOfDay       string    // morning, afternoon, evening, night
    CreatedAt       time.Time `gorm:"index;not null"`
    UpdatedAt       time.Time `gorm:"autoUpdateTime"`
}
```

### UserStats（统计）

```go
type UserStats struct {
    ID                  int64     `gorm:"primaryKey;autoIncrement"`
    UserID              int64     `gorm:"uniqueIndex;not null"`
    TotalEntries        int       `gorm:"default:0"`
    GratitudeCount      int       `gorm:"default:0"`
    PhilosophyCount     int       `gorm:"default:0"`
    FreeNoteCount       int       `gorm:"default:0"`
    CurrentStreak       int       `gorm:"default:0"`
    LongestStreak       int       `gorm:"default:0"`
    LastEntryDate       time.Time
    UpdatedAt           time.Time `gorm:"autoUpdateTime"`
}
```

### EmailVerification（邮箱验证码）

```go
type EmailVerification struct {
    ID        int64     `gorm:"primaryKey;autoIncrement"`
    Email     string    `gorm:"index;not null"`
    Code      string    `gorm:"not null"`
    ExpiresAt time.Time `gorm:"not null"`
    Used      bool      `gorm:"default:false"`
    CreatedAt time.Time `gorm:"autoCreateTime"`
}
```

---

## 认证流程

### 1. 邮箱验证码登录

```
Client                    Server                    Database
  |                          |                          |
  |--POST /auth/email/send-code-->|                     |
  |    { email: "user@example.com" }                    |
  |                          |                          |
  |                          |--生成6位验证码-->        |
  |                          |--保存到DB-->             |
  |                          |                    |--INSERT-->
  |                          |--发送邮件-->             |
  |<--200 OK-----------------|                          |
  |                          |                          |
  |--POST /auth/email/verify-->|                        |
  |    { email, code }       |                          |
  |                          |--验证码检查-->           |
  |                          |                    |--SELECT-->
  |                          |--创建/更新用户-->        |
  |                          |                    |--UPSERT-->
  |                          |--生成JWT token-->        |
  |<--200 OK-----------------|                          |
  |    { token, user }       |                          |
```

### 2. Firebase认证

```
Client                    Server                    Firebase
  |                          |                          |
  |--Firebase登录-->         |                          |
  |                          |                    |--验证-->
  |<--Firebase ID Token------|                          |
  |                          |                          |
  |--POST /auth/firebase/verify-->|                     |
  |    { idToken }           |                          |
  |                          |--验证ID Token-->         |
  |                          |                    |--Verify-->
  |                          |<--用户信息---------------|
  |                          |--创建/更新用户-->        |
  |                          |--生成JWT token-->        |
  |<--200 OK-----------------|                          |
  |    { token, user }       |                          |
```

### 3. 后续请求认证

```
Client                    Server
  |                          |
  |--GET /api/journal/list-->|
  |    Header: Authorization: Bearer <JWT>
  |                          |
  |                          |--验证JWT-->
  |                          |--提取user_id-->
  |                          |--查询数据-->
  |<--200 OK-----------------|
  |    { entries: [...] }    |
```

---

## 配置管理

### 环境变量（.env）

```env
# 服务器配置
PORT=3000
ENV=production

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/gratitude_journal

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=168h  # 7天

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json

# 邮件服务
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Awaken <your-email@gmail.com>

# CORS
CORS_ORIGINS=http://localhost:8081,https://your-app.com
```

---

## 依赖管理（go.mod）

```go
module github.com/yourusername/gratitude-journal-api

go 1.21

require (
    github.com/gin-gonic/gin v1.10.0
    github.com/gin-contrib/cors v1.7.0
    gorm.io/gorm v1.25.5
    gorm.io/driver/postgres v1.5.4
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/spf13/viper v1.18.2
    go.uber.org/zap v1.26.0
    github.com/go-playground/validator/v10 v10.16.0
    firebase.google.com/go/v4 v4.13.0
    gopkg.in/gomail.v2 v2.0.0-20160411212932-81ebce5c23df
)
```

---

## 错误处理

### 统一错误响应格式

```go
type ErrorResponse struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}
```

### 错误码定义

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| `INVALID_REQUEST` | 400 | 请求参数错误 |
| `UNAUTHORIZED` | 401 | 未认证 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

---

## 日志规范

使用Zap结构化日志：

```go
logger.Info("User logged in",
    zap.String("user_id", userID),
    zap.String("method", "email"),
    zap.String("ip", clientIP),
)

logger.Error("Failed to create journal entry",
    zap.Error(err),
    zap.String("user_id", userID),
    zap.Any("entry", entry),
)
```

---

## 性能优化

### 1. 数据库连接池

```go
db.DB().SetMaxOpenConns(100)
db.DB().SetMaxIdleConns(10)
db.DB().SetConnMaxLifetime(time.Hour)
```

### 2. 缓存策略

- 用户信息缓存（Redis，可选）
- AI生成结果缓存（2小时）
- 统计数据缓存（5分钟）

### 3. 并发处理

- 使用goroutine处理耗时操作（AI生成、邮件发送）
- 使用context控制超时

---

## 安全措施

### 1. 认证安全
- JWT token过期时间：7天
- 验证码有效期：5分钟
- 验证码只能使用一次
- 密码（如需要）使用bcrypt加密

### 2. API安全
- CORS配置
- Rate limiting（限流）
- 请求体大小限制
- SQL注入防护（GORM参数化查询）

### 3. 数据安全
- 敏感信息加密存储
- HTTPS强制
- 数据库连接加密

---

## 部署方案

### 1. Docker部署

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/api .
COPY --from=builder /app/.env .
EXPOSE 3000
CMD ["./api"]
```

### 2. Systemd服务

```ini
[Unit]
Description=Gratitude Journal API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/gratitude-journal
ExecStart=/opt/gratitude-journal/api
Restart=always
RestartSec=5
Environment="ENV=production"

[Install]
WantedBy=multi-user.target
```

### 3. Nginx反向代理

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 迁移计划

### 阶段1：Go后端开发（1-2天）
- ✅ 创建项目结构
- ✅ 实现数据库层
- ✅ 实现认证中间件
- ✅ 实现核心API

### 阶段2：前端适配（1天）
- ✅ 修改API调用（tRPC → REST）
- ✅ 测试所有功能
- ✅ 修复bug

### 阶段3：部署和测试（1天）
- ✅ Docker构建
- ✅ 服务器部署
- ✅ 性能测试
- ✅ 安全检查

---

## 测试策略

### 1. 单元测试
- 使用`testing`包
- 覆盖核心业务逻辑
- Mock外部依赖

### 2. 集成测试
- 测试API端点
- 测试数据库操作
- 测试认证流程

### 3. 性能测试
- 使用`wrk`或`hey`压测
- 目标：1000 req/s
- 响应时间：<100ms（P95）

---

## 监控和运维

### 1. 健康检查

```go
// GET /health
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-05T22:10:00Z"
}
```

### 2. 指标收集
- 请求数量和延迟
- 错误率
- 数据库连接数
- 内存和CPU使用

### 3. 日志管理
- 日志轮转
- 错误日志告警
- 访问日志分析

---

## 与Node.js版本对比

| 特性 | Node.js | Go |
|------|---------|-----|
| 性能 | 中等 | 高 |
| 内存占用 | 较高 | 低 |
| 并发处理 | 事件循环 | Goroutine |
| 部署 | 需要Node运行时 | 单一二进制文件 |
| 启动速度 | 慢 | 快 |
| 类型安全 | TypeScript | 原生支持 |
| 生态系统 | 丰富 | 丰富 |
| 学习曲线 | 平缓 | 中等 |

---

## 下一步

1. ✅ 创建Go项目结构
2. ✅ 实现核心功能
3. ✅ 编写测试
4. ✅ 部署到服务器
5. ✅ 前端切换到新API
6. ✅ 性能优化
7. ✅ 文档完善

---

**准备开始实现！🚀**
