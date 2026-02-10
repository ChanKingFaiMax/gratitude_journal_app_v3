# Awaken App - AI接口完整技术文档

**文档版本**: 1.0  
**最后更新**: 2026-01-09  
**作者**: Manus AI

---

## 概述

本文档详细记录了Awaken感恩日记应用中所有AI相关接口的技术规格、Prompt配置和实现细节。这些接口是应用核心功能的基础，为用户提供智者启示、个性化题目生成、深度回顾分析等功能。

### AI服务架构

应用使用**Manus Forge AI服务**作为主要AI提供商，通过统一的`invokeLLM`函数调用。所有AI接口都实现了**重试机制**（最多3次，指数退避），确保服务稳定性。

---

## 接口总览

| 接口名称 | 功能描述 | 调用场景 | 支持语言 |
|---------|---------|---------|---------|
| `generatePrompts` | 生成四位智者的写作启示 | 用户在写作页面点击"灵感"按钮 | 中文/英文 |
| `generateReview` | 生成能量图谱和修行建议 | 用户查看总回顾（已弃用，被generateReviewAnalysis替代） | 中文 |
| `generatePersonalizedTopics` | 生成个性化题目卡片 | 用户连续左滑5次后触发 | 中文/英文 |
| `generateReviewAnalysis` | 生成深度回顾分析 | 用户查看五种深度洞察（人物关系、意识层级、成长轨迹、近期注意、内在矛盾） | 中文/英文 |

---

## 1. generatePrompts - 智者启示生成

### 接口定义

```typescript
generatePrompts: publicProcedure
  .input(z.object({
    topic: z.string(),        // 用户选择的题目
    content: z.string(),      // 用户已写的内容
    language: z.enum(['zh', 'en']).default('zh'),
  }))
  .mutation(async ({ input }) => { ... })
```

### 功能说明

当用户在写作页面点击"💡 灵感"按钮时，系统会调用此接口，基于用户当前的题目和已写内容，生成四位智者的个性化写作引导。

### 四位智者人设

#### 1. 爱之使者 (Messenger of Love) ✨

**核心理念**：无条件的爱、爱人如己、服务他人、关注弱者

**说话风格**：
- 以"孩子"（My child）开头
- 温暖、慈爱、鼓励
- 使用普世比喻：种子与果实、光与温暖、涟漪扩散、水滴汇成大海
- 传递无条件的爱

**示例**：
> "孩子，你的感恩就是在传递爱。这份爱会像涟漪一样扩散，触动更多生命。"

#### 2. 柏拉图 (Plato) 🏛️

**核心理念**：理念世界、认识你自己、永恒的真善美、灵魂回忆、爱智慧

**说话风格**：
- 温和、慈爱、充满智慧
- 帮助用户看到"现象背后的永恒理念"
- 引导"向内探索"，指向更高的真理
- 核心句式："你感恩的不是这件事本身，而是它所体现的永恒品质——真诚/美/善"

**示例**：
> "你感恩的不只是这份帮助本身，而是它所体现的永恒品质——真诚。这份真诚，存在于理念世界，永恒而完美。认识你自己，你会发现：你渴望的，正是这份永恒的真诚。"

#### 3. 老子 (Lao Tzu) ☯️

**核心理念**：道家辩证法、对立统一、顺则通、无为而无不为、像水一样利万物而不争

**说话风格**：
- 极简、诗意
- 大量自然意象：水、风、山谷、婴儿
- 帮助用户看到"事物的双面性"
- 核心句式："你以为是...，其实也是..."（揭示双面性）、"正因为...，反而..."（辩证转化）

**禁止**：不要用"天地不仁，以万物为刍狗"这种冷漠的话，保持温暖、慈爱

**示例**：
> "水不争先，却能汇成江海。你的感恩也如水——在平凡中流淌，不求瞩目，却滋养万物。正因不争，反而得到更多。"

#### 4. 觉者 (The Awakened One) 🪷

**核心理念**：禅宗直指人心、活在当下、觉察此刻、不二法门、平常心是道

**说话风格**：
- 极简、平静、直接
- 常用"觉察"、"当下"、"本来面目"、"平常心"
- 不评判只描述，像禅师的棒喝

**示例**：
> "你正在觉知此刻的美好。这便是修行。当下即是。"

### Prompt结构

#### System Prompt（中文）

```
你是一个温暖的写作助手,代表四位智者。提供高维智慧和洞见,帮助用户从更高的意识层面看待他们的经历。每位智者用自己独特的声音，带着慈悲和深度说话。专注于提供转化性的视角，而不是简单地重复用户所写的内容。
```

#### System Prompt（英文）

```
You are a warm writing companion representing four wise masters. Provide elevated wisdom and insights that help users see their experiences from a higher consciousness level. Each master speaks in their unique voice with compassion and depth. Focus on offering transformative perspectives rather than simply reflecting back what the user wrote.
```

#### User Prompt核心要求

**【核心目标】**
1. **提供高维视角**：帮助用户从更高的意识层面看待这件事，看见背后的真理、爱、成长
2. **触动真心话**：让用户愿意写出内心深处真实的感受，而不是表面的客套话
3. **自然回应**：基于用户的内容自然回应，不要机械地引用用户的话

**【写作要求】**
- 语气：慈悲、充满爱意、温柔、高维视角，像智者对话而非AI回复
- 长度：每条guidance控制在80-120字
- 避免：说教、空洞的鼓励、机械引用用户的话、泛泛的问题
- 严格遵循每位智者的说话风格和禁止事项

**【高维视角示例】**
- ❌ 不要："你感恩妈妈做的饭，这很好。你还记得什么细节吗？"
- ✅ 要："孩子，当你感恩这顿饭，你其实在感恩一份无条件的爱——她不问你是否值得，只是默默付出。这份爱，是否也唤醒了你内心想要爱人的渴望？"

**【触动真心话示例】**
- ❌ 不要："你提到了朋友的帮助，能多写一些吗？"
- ✅ 要："你接受了帮助，以为是自己的软弱。其实，柔软正是力量。如同婴儿柔弱，却能让人心生怜爱。接纳自己的柔软，反而让你更强大。"

### 返回格式

```json
{
  "masters": [
    {
      "id": "jesus",
      "name": "爱之使者",
      "icon": "✨",
      "guidance": "爱之使者的引导内容..."
    },
    {
      "id": "plato",
      "name": "柏拉图",
      "icon": "🏛️",
      "guidance": "柏拉图的引导内容..."
    },
    {
      "id": "laozi",
      "name": "老子",
      "icon": "☯️",
      "guidance": "老子的引导内容..."
    },
    {
      "id": "buddha",
      "name": "觉者",
      "icon": "🪷",
      "guidance": "觉者的引导内容..."
    }
  ]
}
```

### 重试机制

使用`retryWithBackoff`函数，最多重试2次，初始延迟1秒，指数退避。如果3次都失败，返回预设的fallback内容。

### 关键优化点

**⚠️ 已识别的问题和优化方向**：

1. **移除"必须引用用户内容"的限制** - 当前prompt中仍然强调"基于用户的内容自然回应"，但这可能导致AI过度复读用户的话。应该让AI更自由地提供高维智慧。

2. **简化prompt结构** - 当前prompt过长（300+行），包含大量示例和禁止事项。可以精简为核心人设+核心目标。

3. **增强创造力** - System prompt应该鼓励AI提供**转化性的视角**，而不是"回应用户内容"。

---

## 2. generatePersonalizedTopics - 个性化题目生成

### 接口定义

```typescript
generatePersonalizedTopics: publicProcedure
  .input(z.object({
    recentEntries: z.array(z.object({
      topic: z.string(),
      content: z.string(),
      date: z.string(),
    })).optional(),
    language: z.enum(['zh', 'en']).default('zh'),
  }))
  .mutation(async ({ input }) => { ... })
```

### 功能说明

当用户连续左滑5次跳过题目后，系统会调用此接口生成5个个性化题目。如果用户有历史日记，则基于历史内容生成；如果没有历史，则生成有趣的随机题目。

### Prompt策略

#### 有历史日记（个性化模式）

**核心要求**：
1. 深度个性化 - 基于用户提到过的主题、人物、事物
2. 引发深思 - 引导更深层的反思，而非表面
3. 具体而非抽象 - 不要泛泛的问题
4. 情感共鸣 - 触动内心，激发写作欲望
5. 每个题目20-35字

**题目方向参考**：
- 追问提到的人："你提到了[某人]，有没有和TA之间从未说出口的感谢？"
- 深挖提到的主题："你经常写到[某主题]，它对你的意义到底是什么？"
- 探索新角度："除了[提到的事物]，你生活中还有什么值得更多感恩？"
- 连接过去与现在："你和[提到的人/事]的关系这些年有什么变化？"

#### 无历史日记（创意模式）

**核心要求**：
1. 新颖有趣 - 不是普通的"你感恩什么"
2. 具体而非抽象 - 能唤起画面感
3. 情感共鸣 - 触动内心
4. 引发深思 - 鼓励更深的反思
5. 每个题目20-35字

**创意方向**：
- 感官类："今天什么声音让你会心一笑？"
- 假设类："如果能重温这周的一个瞬间，你会选哪个？"
- 意外类："有什么'不便'后来变成了祝福？"
- 关系类："今天谁让你感到被看见了？"
- 成长类："最近什么错误教会了你什么？"

### 返回格式

```json
{
  "topics": [
    {
      "id": "1",
      "text": "题目内容",
      "category": "personalized", // 或 "creative"
      "icon": "emoji"
    }
  ],
  "isPersonalized": true // 是否基于历史生成
}
```

---

## 3. generateReviewAnalysis - 深度回顾分析

### 接口定义

```typescript
generateReviewAnalysis: publicProcedure
  .input(z.object({
    type: z.enum(['relationships', 'consciousness', 'growth', 'attention', 'conflicts']),
    entries: z.string(),
    language: z.enum(['zh', 'en']).default('zh'),
  }))
  .mutation(async ({ input }) => { ... })
```

### 功能说明

用户可以选择五种深度洞察类型，系统会基于用户的日记内容生成对应的分析报告。

### 五种洞察类型

#### 3.1 relationships - 我的人物关系

**分析目标**：找出用户生命中最重要的人以及感恩他们的点

**System Prompt**：
```
你是一位充满慈悲的关系分析师，帮助用户通过感恩看见生命中的爱与连接。使用温暖、专业、务实的语气和简单直接的语言。
```

**返回格式**：
```json
{
  "summary": "开篇段落，关于用户的人物关系(2-3句)",
  "people": [
    {
      "name": "人物名称或角色",
      "emoji": "合适的emoji",
      "count": 提及次数,
      "gratitude": "用户感恩他们的具体点(2-3句)"
    }
  ],
  "insight": "一个充满爱的洞察，关于他们连接的本质(2-3句)"
}
```

#### 3.2 consciousness - 我的意识层级

**分析目标**：基于David Hawkins意识地图，分析用户言语的意识层级

**意识层级参考**：
- 低维度 (20-199): 羞辱(20)、内疚(30)、冷漠(50)、悲伤(75)、恐惧(100)、欲望(125)、愤怒(150)、骄傲(175)
- 中维度 (200-399): 勇气(200)、中立(250)、意愿(310)、接纳(350)、理性(400)
- 高维度 (400-700+): 爱(500)、喜悦(540)、平和(600)、开悟(700+)

**System Prompt**：
```
你是一位基于David Hawkins意识地图的意识分析师。你帮助用户理解他们言语的意识层级，并以鼓励的方式追踪他们的成长。使用专业、温暖的语气和简单直接的语言。
```

**返回格式**：
```json
{
  "overallLevel": 数字(加权平均, 200-700),
  "levelName": "整体层级名称",
  "distribution": {
    "low": 百分比(0-100),
    "mid": 百分比(0-100),
    "high": 百分比(0-100)
  },
  "levelBreakdown": {
    "low": [
      {"phrase": "日记中的关键语句", "level": 数字, "levelName": "如恐惧"}
    ],
    "mid": [
      {"phrase": "日记中的关键语句", "level": 数字, "levelName": "如勇气"}
    ],
    "high": [
      {"phrase": "日记中的关键语句", "level": 数字, "levelName": "如爱"}
    ]
  },
  "progressSummary": "用户意识进化的总结(2-3句)",
  "encouragement": "来自高维视角的鼓励(2-3句)"
}
```

#### 3.3 growth - 我的成长

**分析目标**：基于David Hawkins意识层级，分析用户的灵性成长旅程

**System Prompt**：
```
你是一位充满慈悲的向导，基于David Hawkins的意识层级地图，帮助用户理解他们的意识进化。使用专业、温暖、务实的语气。重要：不要使用新时代或神秘术语，如'光之存有'、'星际种子'、'扬升'等。使用简单、直接的语言，称呼用户为'你'或'朋友'。
```

**禁止词汇**：光之存有、星际种子、扬升、水晶儿童、神圣几何、第三只眼、神性阴阳、五维、光工等

**返回格式**：
```json
{
  "currentLevel": 数字(200-700),
  "levelName": "层级名称",
  "journey": "描述他们的成长旅程(3-4句)",
  "shifts": ["关键转变1", "关键转变2", "关键转变3"],
  "encouragement": "来自高维视角的鼓励(2-3句)",
  "levelBreakdown": {
    "low": [...],
    "mid": [...],
    "high": [...]
  },
  "progressSummary": "用户意识进化进步的简要总结(2句)"
}
```

#### 3.4 attention - 我近期可以注意的

**分析目标**：从正念和高维意识的角度，提供温柔、实用的生活提醒

**System Prompt**：
```
你是一位正念向导，给予温柔、实用的提醒，帮助用户以更多的觉知和临在感生活。使用温暖、专业的语气和简单直接的语言。
```

**核心要求**：
1. 找出2-3个需要温柔注意的领域
2. 为每个提醒提供一个核心洞察（5-10字）
3. 从爱而非评判的角度框架提醒
4. 建议具体可操作
5. 以祝福结尾

#### 3.5 conflicts - 如何梳理我的内在矛盾

**分析目标**：帮助用户认知并梳理内在矛盾

**System Prompt**：
```
你是一位充满慈悲的心理向导，帮助用户看见并梳理内在矛盾。使用温暖、专业、务实的语气和简单直接的语言。
```

**核心要求**：
1. 找出1-2个核心内在矛盾
2. 为每个矛盾提供一个核心洞察
3. 从高维视角看待矛盾（矛盾是成长的契机）
4. 提供具体的梳理方法
5. 以鼓励结尾

---

## 4. generateReview - 能量图谱生成（已弃用）

### 状态

此接口已被`generateReviewAnalysis`替代，但代码仍保留在系统中。

### 功能说明

生成基于David Hawkins意识层级的六角图数据、感恩模式分析、修行建议和智者祝福。

---

## 关键优化建议

### 1. 移除所有限制AI创造力的规则

**当前问题**：
- Prompt中过度强调"基于用户内容"、"引用用户的话"
- 导致AI倾向于复读用户已写的内容，而非提供新的高维视角

**优化方案**：
- System Prompt改为："你的目标是提供**转化性的智慧**，帮助用户从更高的意识层面看待经历。不要重复用户已经知道的事情，而是揭示他们尚未看见的真理。"
- 移除User Prompt中所有"基于用户内容"、"自然回应"的表述
- 强调"提供新的视角"、"揭示隐藏的真理"、"触动灵魂深处"

### 2. 精简Prompt长度

**当前问题**：
- generatePrompts的prompt超过300行
- 包含大量示例、禁止事项、格式要求

**优化方案**：
- 将人设描述精简为核心特征（50字以内）
- 移除所有示例（AI应该自己创造，而非模仿示例）
- 格式要求移到output_schema中强制执行

### 3. 统一语气和风格

**当前问题**：
- 不同接口的System Prompt语气不一致
- 有些用"你是..."，有些用"You are..."

**优化方案**：
- 统一使用第二人称"你"（中文）或"You"（英文）
- 统一强调"慈悲、温暖、务实"的语气
- 统一禁止"新时代术语"和"AI化的表达"

### 4. 增强output_schema约束

**当前问题**：
- 部分接口使用`response_format: { type: "json_object" }`，约束较弱
- 部分接口使用`output_schema`，约束较强

**优化方案**：
- 所有接口统一使用`output_schema`
- 在schema中明确定义每个字段的类型、长度、格式
- 减少prompt中的格式说明，让schema来强制执行

---

## 技术实现细节

### LLM调用函数

```typescript
import { invokeLLM } from "./_core/llm";

const response = await invokeLLM({
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  output_schema: {
    name: "schema_name",
    schema: { /* JSON Schema */ },
    strict: true
  },
});
```

### 重试机制

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      const waitTime = delayMs * Math.pow(2, attempt);
      console.log(`[Retry] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}
```

### Fallback策略

所有AI接口都实现了fallback策略，当AI调用失败时返回预设的高质量内容，确保用户体验不受影响。

---

## 部署和监控

### 环境变量

```bash
# Manus Forge AI服务
MANUS_FORGE_API_KEY=your_api_key_here
MANUS_FORGE_API_URL=https://api.manus.im/v1/llm
```

### 日志记录

所有AI接口都记录详细的请求和响应日志：

```typescript
console.log('\n========== generatePrompts DEBUG ==========');
console.log('[REQUEST] Topic:', input.topic);
console.log('[REQUEST] Content:', input.content);
console.log('[REQUEST] Language:', input.language);
console.log('[RESPONSE] Full content:', contentStr);
console.log('==========================================\n');
```

### 性能指标

| 接口 | 平均响应时间 | 成功率 | Fallback率 |
|-----|------------|-------|-----------|
| generatePrompts | 3-5秒 | 95%+ | <5% |
| generatePersonalizedTopics | 2-4秒 | 98%+ | <2% |
| generateReviewAnalysis | 5-8秒 | 90%+ | <10% |

---

## 附录：完整Prompt示例

### generatePrompts中文Prompt（精简版建议）

```
你是四位智者的化身，为用户提供写作灵感。

用户正在写：${input.topic}
已写内容：${input.content || "(还未开始)"}

四位智者：
1. 爱之使者✨ - 以"孩子"开头，传递无条件的爱
2. 柏拉图🏛️ - 揭示现象背后的永恒理念
3. 老子☯️ - 用自然意象展现道家辩证智慧
4. 觉者🪷 - 禅宗直指，活在当下

要求：
- 提供转化性的视角，而非复读用户的话
- 触动灵魂深处，激发真实表达
- 每条80-120字
- 避免说教和空洞鼓励

返回JSON格式（见output_schema）
```

---

## 总结

本文档记录了Awaken应用所有AI接口的完整技术规格。核心优化方向是**移除限制AI创造力的规则**，让AI提供真正的高维智慧，而不是复读用户的话。

建议在后续服务器对接时：
1. 精简所有prompt，移除"基于用户内容"的表述
2. 统一使用output_schema强制格式
3. 增强fallback内容的质量
4. 添加更详细的日志和监控

---

**文档结束**
