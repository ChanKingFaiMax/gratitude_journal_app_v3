# 感恩日记 API 接口文档

## 服务器配置

### 端口信息
- **默认端口**: 3000
- **环境变量**: `PORT`（可选，默认3000）
- **自动端口查找**: 如果3000被占用，会自动尝试3001-3019

### API Base URL
- **开发环境**: `http://localhost:3000`
- **生产环境**: 通过环境变量 `EXPO_PUBLIC_API_BASE_URL` 配置

### CORS 配置
服务器已启用CORS，支持：
- 所有来源（反射请求的origin）
- 方法：GET, POST, PUT, DELETE, OPTIONS
- 允许凭证（credentials）

---

## 技术栈

- **框架**: Express.js + tRPC
- **数据传输**: SuperJSON（支持Date等复杂类型）
- **认证**: Bearer Token（JWT）
- **数据库**: PostgreSQL + Drizzle ORM

---

## API 路由结构

所有tRPC接口都挂载在 `/api/trpc` 路径下。

### 基础路由

#### Health Check
```
GET /api/health
```
**响应**:
```json
{
  "ok": true,
  "timestamp": 1704067200000
}
```

#### OAuth 回调
```
GET /api/oauth/callback
```
用于处理OAuth登录回调。

---

## tRPC API 接口

### 1. 认证模块 (`auth`)

#### 获取当前用户信息
```typescript
auth.me: query
```
**返回**: 当前登录用户信息或null

#### 登出
```typescript
auth.logout: mutation
```
**功能**: 清除用户session

---

### 2. 引导问题模块 (`prompts`)

#### 生成引导问题
```typescript
prompts.generate: mutation
```
**输入**:
```typescript
{
  count: number;        // 问题数量（1-10）
  language?: 'zh' | 'en'; // 语言，默认'zh'
}
```
**返回**: 引导问题数组

#### 验证验证码
```typescript
prompts.verify: mutation
```
**输入**:
```typescript
{
  code: string; // 6位验证码
}
```
**返回**: 验证结果

---

### 3. 日记模块 (`journal`)

#### 获取所有日记
```typescript
journal.list: query
```
**返回**: 当前用户的所有日记列表

#### 获取单篇日记
```typescript
journal.get: query
```
**输入**:
```typescript
{
  id: number; // 日记ID
}
```

#### 创建日记
```typescript
journal.create: mutation
```
**输入**:
```typescript
{
  content: string;
  mood?: string;
  tags?: string[];
  localCreatedAt?: Date;
  localUpdatedAt?: Date;
}
```

#### 更新日记
```typescript
journal.update: mutation
```
**输入**:
```typescript
{
  id: number;
  content?: string;
  mood?: string;
  tags?: string[];
  localUpdatedAt?: Date;
}
```

#### 删除日记
```typescript
journal.delete: mutation
```
**输入**:
```typescript
{
  id: number;
}
```

#### 批量同步日记
```typescript
journal.sync: mutation
```
**输入**:
```typescript
{
  entries: Array<{
    localId: string;
    content: string;
    mood?: string;
    tags?: string[];
    localCreatedAt: Date;
    localUpdatedAt: Date;
  }>;
}
```

---

### 4. 统计模块 (`stats`)

#### 获取统计数据
```typescript
stats.get: query
```
**返回**:
```typescript
{
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  // ... 其他统计数据
}
```

#### 更新统计数据
```typescript
stats.update: mutation
```
**输入**:
```typescript
{
  totalEntries?: number;
  currentStreak?: number;
  longestStreak?: number;
  achievements?: any;
}
```

---

### 5. 深度回顾模块 (`review`)

#### 生成深度回顾分析
```typescript
review.generateAnalysis: mutation
```
**输入**:
```typescript
{
  type: 'consciousness' | 'growth' | 'relationship' | 'attention';
  language?: 'zh' | 'en';
}
```

**返回**: 根据type不同返回不同格式的分析结果

**分析类型**:
- `consciousness`: 意识层级分析（基于David Hawkins理论）
- `growth`: 成长轨迹分析
- `relationship`: 关系洞察分析
- `attention`: 近期注意事项

---

## 前端配置

### 环境变量

在 `.env` 文件中配置：

```bash
# API服务器地址（可选，默认自动推导）
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# OAuth配置（如果使用Manus OAuth）
EXPO_PUBLIC_OAUTH_PORTAL_URL=https://portal.manus.im
EXPO_PUBLIC_OAUTH_SERVER_URL=https://api.manus.im
EXPO_PUBLIC_APP_ID=your_app_id
EXPO_PUBLIC_OWNER_OPEN_ID=your_owner_id
EXPO_PUBLIC_OWNER_NAME=your_name
```

### 修改API Base URL

如果你想将应用连接到自己的服务器：

1. **方法一：环境变量**
   ```bash
   # .env
   EXPO_PUBLIC_API_BASE_URL=https://your-api-server.com
   ```

2. **方法二：直接修改代码**
   
   编辑 `constants/oauth.ts`:
   ```typescript
   export function getApiBaseUrl(): string {
     // 直接返回你的服务器地址
     return "https://your-api-server.com";
   }
   ```

---

## 认证机制

### Bearer Token

所有受保护的接口都需要在请求头中携带JWT token：

```
Authorization: Bearer <your_jwt_token>
```

### Token 存储

Token存储在 `SecureStore` 中，key为 `app_session_token`。

### 获取Token

```typescript
import * as Auth from "@/lib/_core/auth";

const token = await Auth.getSessionToken();
```

---

## 数据库Schema

### journal_entries 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| user_id | varchar | 用户ID |
| content | text | 日记内容 |
| mood | varchar | 心情 |
| tags | text[] | 标签数组 |
| local_created_at | timestamp | 本地创建时间 |
| local_updated_at | timestamp | 本地更新时间 |
| created_at | timestamp | 服务器创建时间 |
| updated_at | timestamp | 服务器更新时间 |

### user_stats 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| user_id | varchar | 用户ID |
| total_entries | integer | 总日记数 |
| current_streak | integer | 当前连续天数 |
| longest_streak | integer | 最长连续天数 |
| achievements | jsonb | 成就数据 |

---

## 部署自己的服务器

### 1. 安装依赖

```bash
cd gratitude_journal_app
pnpm install
```

### 2. 配置数据库

创建 `.env` 文件：

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/gratitude_journal
PORT=3000
```

### 3. 运行数据库迁移

```bash
pnpm db:push
```

### 4. 启动服务器

```bash
# 开发模式
pnpm dev:server

# 生产模式
pnpm build
pnpm start
```

### 5. 修改前端配置

在移动应用的 `.env` 文件中：

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-server.com
```

---

## 注意事项

1. **SuperJSON**: 所有API使用SuperJSON进行数据序列化，支持Date、Map、Set等复杂类型
2. **CORS**: 确保你的服务器正确配置CORS，允许移动应用的origin
3. **HTTPS**: 生产环境建议使用HTTPS
4. **认证**: 如果不使用Manus OAuth，需要自行实现JWT签发逻辑
5. **缓存**: 前端实现了2小时的分析结果缓存，减少服务器负担

---

## 联系方式

如有问题，请参考项目README或提交issue。
