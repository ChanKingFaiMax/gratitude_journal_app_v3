# OpenRouter 配置指南

本文档说明如何将应用的AI服务切换到OpenRouter。

---

## 为什么使用OpenRouter？

OpenRouter是一个AI模型聚合平台，提供：
- **多模型选择**：支持100+种AI模型（OpenAI、Anthropic、Google、Meta等）
- **统一API**：一个API Key访问所有模型
- **灵活定价**：按需付费，部分模型免费
- **高可用性**：自动故障转移和负载均衡

---

## 配置步骤

### 1. 获取OpenRouter API Key

1. 访问 [OpenRouter官网](https://openrouter.ai)
2. 注册账号并登录
3. 进入 [Keys页面](https://openrouter.ai/keys)
4. 创建新的API Key
5. 复制API Key（格式：`sk-or-v1-...`）

### 2. 配置环境变量

在项目根目录创建或编辑 `.env` 文件：

```env
# OpenRouter API Key（必需）
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# OpenRouter模型（可选，默认使用免费的Gemini模型）
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```

### 3. 选择模型

OpenRouter支持多种模型，你可以根据需求选择：

#### 免费模型（推荐用于开发测试）

```env
# Google Gemini 2.0 Flash（免费，推荐）
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# Meta Llama 3.1 8B（免费）
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Mistral 7B（免费）
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
```

#### 付费模型（生产环境推荐）

```env
# Google Gemini 2.0 Flash（付费版，更稳定）
OPENROUTER_MODEL=google/gemini-2.0-flash-thinking-exp

# OpenAI GPT-4o
OPENROUTER_MODEL=openai/gpt-4o

# Anthropic Claude 3.5 Sonnet
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Google Gemini 1.5 Pro
OPENROUTER_MODEL=google/gemini-pro-1.5
```

完整模型列表：https://openrouter.ai/models

### 4. 重启服务器

```bash
# 开发环境
pnpm dev

# 生产环境
pm2 restart gratitude-api
```

---

## 工作原理

代码已经修改为支持**双模式运行**：

1. **OpenRouter模式**（优先）
   - 如果配置了 `OPENROUTER_API_KEY`，使用OpenRouter API
   - API地址：`https://openrouter.ai/api/v1/chat/completions`
   - 模型：`OPENROUTER_MODEL`（默认 `google/gemini-2.0-flash-exp:free`）

2. **Manus Forge模式**（回退）
   - 如果没有配置OpenRouter，继续使用Manus Forge API
   - API地址：`https://forge.manus.im/v1/chat/completions`
   - 模型：`gemini-2.5-pro`

---

## 验证配置

### 1. 检查环境变量

```bash
# 查看当前配置
cat .env | grep OPENROUTER
```

### 2. 测试AI生成

在应用中测试以下功能：
- ✅ 首页：刷新感恩题目
- ✅ 写作页面：点击"灵感"按钮获取智者启示
- ✅ 完成写作：查看智者总结
- ✅ 深度回顾：生成分析报告

### 3. 查看日志

```bash
# PM2日志
pm2 logs gratitude-api

# 如果看到以下内容，说明配置成功：
# "Using OpenRouter API with model: google/gemini-2.0-flash-exp:free"
```

---

## 成本估算

### 免费模型

- **Google Gemini 2.0 Flash (free)**：完全免费
- **限制**：每分钟10次请求，每天200次请求
- **适用场景**：个人使用、开发测试

### 付费模型

以 `google/gemini-2.0-flash-thinking-exp` 为例：
- **输入**：$0.10 / 1M tokens
- **输出**：$0.40 / 1M tokens

**估算**（每天100个用户，每人3篇日记）：
- 每篇日记约500 tokens（输入+输出）
- 每天总tokens：100用户 × 3篇 × 500 = 150,000 tokens
- 每天成本：约 $0.08
- 每月成本：约 $2.40

**实际成本可能更低**，因为：
- 缓存机制减少重复调用
- 不是所有用户每天都写3篇
- 免费模型可以处理大部分请求

---

## 常见问题

### 1. API Key无效

**错误**：`401 Unauthorized`

**解决方案**：
- 检查API Key是否正确复制（包含 `sk-or-v1-` 前缀）
- 确认API Key未过期
- 在OpenRouter网站检查Key状态

### 2. 模型不存在

**错误**：`404 Model not found`

**解决方案**：
- 检查模型名称拼写是否正确
- 访问 https://openrouter.ai/models 确认模型可用
- 某些模型需要付费账户

### 3. 请求限流

**错误**：`429 Too Many Requests`

**解决方案**：
- 免费模型有请求限制，升级到付费模型
- 增加缓存时间减少API调用
- 使用多个API Key轮询

### 4. 生成内容质量下降

**问题**：切换到OpenRouter后，AI回复质量不如之前

**解决方案**：
- 尝试更强大的模型（如 `openai/gpt-4o` 或 `anthropic/claude-3.5-sonnet`）
- 调整prompt提示词
- 检查模型是否支持中文

---

## 模型推荐

### 开发测试

```env
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
```
- ✅ 完全免费
- ✅ 支持中文
- ✅ 速度快
- ⚠️ 有请求限制

### 生产环境（预算有限）

```env
OPENROUTER_MODEL=google/gemini-2.0-flash-thinking-exp
```
- ✅ 价格低（$0.10/1M tokens）
- ✅ 质量好
- ✅ 无请求限制
- ✅ 支持中文

### 生产环境（追求质量）

```env
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```
- ✅ 质量最佳
- ✅ 理解能力强
- ✅ 适合复杂任务
- ⚠️ 价格较高（$3/1M tokens）

---

## 回退到Manus Forge

如果需要回退到原来的Manus Forge API：

```bash
# 方法1：删除OpenRouter配置
# 编辑 .env 文件，删除或注释掉：
# OPENROUTER_API_KEY=...
# OPENROUTER_MODEL=...

# 方法2：清空OpenRouter API Key
OPENROUTER_API_KEY=

# 重启服务
pm2 restart gratitude-api
```

---

## 监控和优化

### 1. 查看使用情况

访问 [OpenRouter Dashboard](https://openrouter.ai/activity)：
- 查看API调用次数
- 查看成本统计
- 查看错误日志

### 2. 优化成本

- **增加缓存时间**：减少重复调用
- **使用免费模型**：开发测试环境
- **批量处理**：合并多个请求
- **设置预算限制**：在OpenRouter设置每月预算上限

### 3. 性能监控

```bash
# 查看API响应时间
pm2 logs gratitude-api | grep "LLM invoke"

# 查看错误率
pm2 logs gratitude-api | grep "LLM invoke failed"
```

---

## 技术细节

### API兼容性

OpenRouter API与OpenAI API完全兼容，支持：
- ✅ Chat Completions
- ✅ Streaming
- ✅ Function Calling
- ✅ JSON Mode
- ✅ Vision (图像输入)

### 请求头

OpenRouter需要额外的请求头：
```javascript
{
  "HTTP-Referer": "https://your-app-url.com",
  "X-Title": "Your App Name"
}
```

代码已自动添加这些头部。

### 错误处理

代码包含完整的错误处理：
- API Key验证
- 请求失败重试
- 详细错误日志

---

## 支持

如有问题，请：
1. 查看 [OpenRouter文档](https://openrouter.ai/docs)
2. 查看项目 `server/_core/llm.ts` 代码
3. 提交GitHub Issue

---

**祝你使用愉快！🚀**
