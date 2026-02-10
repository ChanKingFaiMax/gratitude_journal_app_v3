import { z } from "zod";
import { COOKIE_NAME } from "@awaken/shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { invokeLLMWithLanguageGuard } from "./_core/llm-language-guard";
import { normalizeMasterIds } from "./normalize-master-id";

/**
 * Retry helper for AI calls
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries (default: 2)
 * @param delayMs Base delay between retries in milliseconds (default: 1000)
 * @returns Result of the function
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed:`,
        error,
      );

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const waitTime = delayMs * Math.pow(2, attempt);
      console.log(`[Retry] Waiting ${waitTime}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }), // Send verification code
    sendVerificationCode: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          language: z.enum(["zh", "en"]).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { email, language = "zh" } = input;

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to database
        await db.createEmailVerification(email, code);

        // Send email with code
        const { sendVerificationCodeEmail } = await import("./email-service");
        await sendVerificationCodeEmail(email, code, language);

        return { success: true };
      }),

    // Verify email code and login
    verifyEmailCode: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          code: z.string().length(6),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { email, code } = input;

        // Verify code
        const isValid = await db.verifyEmailCode(email, code);
        if (!isValid) {
          throw new Error("Invalid or expired verification code");
        }

        // Get or create user
        let user = await db.getUserByEmail(email);
        if (!user) {
          user = await db.createUserWithEmail(email);
        }

        // Create session token using Manus SDK
        const { sdk } = await import("./_core/sdk");
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.email || "Email User",
          expiresInMs: ONE_YEAR_MS,
        });

        // Set cookie
        const { getSessionCookieOptions } = await import("./_core/cookies");
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return {
          success: true,
          sessionToken,
          user: {
            id: user.id,
            openId: user.openId,
            email: user.email,
            name: user.name,
          },
        };
      }),
  }),

  // AI-powered gratitude journal features
  ai: router({
    // Generate daily gratitude topics
    generateTopics: publicProcedure
      .input(
        z.object({
          count: z.number().min(1).max(10).default(5),
          theme: z.enum(["gratitude", "philosophy"]).default("gratitude"),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isPhilosophy = input.theme === "philosophy";
        const isEnglish = input.language === "en";

        let prompt: string;

        if (isEnglish) {
          // English prompts
          prompt = isPhilosophy
            ? `Generate ${input.count} philosophical reflection journal topics that:

【Requirements】
1. Provoke deep thinking - Touch on life, existence, values
2. Open-ended - No standard answers, encourage personal exploration
3. Relatable - Start from daily experience, not pure abstractions
4. MUST be concise - Maximum 70 characters (about 10-12 words) to fit on card display

【Topic examples】
- Existence: "When do you feel truly alive?"
- Meaning: "What makes life worth living for you?"
- Self: "How do you define who you are?"
- Choice: "What would you do if today were your last?"
- Relationship: "What does solitude mean to you?"
- Time: "Do you focus more on past, present, or future?"

Return JSON format:
{
  "topics": [
    {"id": "1", "text": "When do you feel truly alive?", "category": "existence"},
    {"id": "2", "text": "What makes life worth living?", "category": "meaning"}
  ]
}`
            : `Generate ${input.count} gratitude journal topics that:

【Requirements】
1. Specific not abstract - Ask about specific people, events, things
2. Evoke vivid imagery - Help users recall concrete scenes
3. Emotionally resonant - Touch the heart, inspire writing
4. MUST be concise - Maximum 70 characters (about 10-12 words) to fit on card display

【Topic examples】
- People: "Who are you most grateful for?"
- Food: "What was the best meal you had this week?"
- Moment: "What moment made you smile today?"
- Growth: "What small challenge did you overcome recently?"
- Sensory: "What's the most beautiful thing you saw today?"
- Memory: "What's your warmest childhood memory?"

Return JSON format:
{
  "topics": [
    {"id": "1", "text": "Who are you most grateful for?", "category": "people"},
    {"id": "2", "text": "What was the best meal this week?", "category": "food"}
  ]
}`;
        } else {
          // Chinese prompts
          prompt = isPhilosophy
            ? `请生成${input.count}个适合写哲学反思日记的题目。这些题目必须:

【核心要求】
1. 引发深度思考 - 触及人生、存在、价值等哲学问题
2. 开放性问题 - 没有标准答案,鼓励个人探索
3. 贴近生活 - 从日常经验出发,而非纯抽象概念
4. 简洁有力 - 一句话说清楚,20-30字为宜

【题目类型参考】
- 存在类: "什么时刻你感觉自己真正活着?"
- 意义类: "你认为什么样的生活是值得过的?"
- 自我类: "你是如何定义'我是谁'的?"
- 选择类: "如果今天是生命最后一天,你会做什么?"
- 关系类: "孤独对你来说意味着什么?"
- 时间类: "你更关注过去、现在还是未来?为什么?"
- 真理类: "你相信有绝对的真理吗?"
- 幸福类: "快乐和幸福有什么区别?"

【避免的题目类型】
❌ 太学术: "康德的道德哲学如何应用?"
❌ 太宽泛: "什么是哲学?"
❌ 二元对立: "自由重要还是安全重要?"

请以JSON格式返回,包含topics数组:
{
  "topics": [
    {"id": "1", "text": "什么时刻你感觉自己真正活着?", "category": "existence"},
    {"id": "2", "text": "你认为什么样的生活是值得过的?", "category": "meaning"}
  ]
}`
            : `请生成${input.count}个适合写感恩日记的题目。这些题目必须:

【核心要求】
1. 具体而非抽象 - 问具体的人、事、物,而非泛泛的概念
2. 唤起画面感 - 让用户能立刻回忆起具体场景
3. 情感共鸣 - 触动内心,激发写作欲望
4. 简洁有力 - 一句话说清楚,20-30字为宜

【题目类型参考】
- 人物类: "你最感恩的人是谁?想对TA说什么?"
- 美食类: "过去一周吃过最好吃的一顿饭是什么?"
- 瞬间类: "今天有哪个瞬间让你会心一笑?"
- 成长类: "最近克服的一个小困难是什么?"
- 感官类: "今天看到/听到/闻到的最美好的是什么?"
- 回忆类: "童年时期最温暖的一个记忆是什么?"
- 关系类: "最近收到的最暖心的一句话是什么?"
- 物品类: "你拥有的哪件物品让你特别珍惜?为什么?"

【避免的题目类型】
❌ 太宽泛: "你感恩什么?"
❌ 太说教: "如何培养感恩的心?"
❌ 太抽象: "感恩对你意味着什么?"

请以JSON格式返回,包含topics数组:
{
  "topics": [
    {"id": "1", "text": "你最感恩的人是谁?想对TA说什么?", "category": "people"},
    {"id": "2", "text": "过去一周吃过最好吃的一顿饭是什么?", "category": "food"}
  ]
}`;
        }

        try {
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a helpful assistant that generates gratitude journal topics. CRITICAL: You MUST generate ALL topics in English ONLY. Every single character must be in English. Do NOT use any Chinese or non-English text."
                    : "你是一个帮助用户写感恩日记的助手。重要：你必须全程使用中文生成所有题目。绝对不要使用英文。",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            },
            input.language,
          );

          const content = response.choices[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("Invalid response format");
          }
          const parsed = JSON.parse(content);
          const topics = parsed.topics || parsed;

          return { topics };
        } catch (error) {
          console.error("Error generating topics:", error);
          // Return fallback topics based on language
          return {
            topics: isEnglish
              ? [
                  {
                    id: "1",
                    text: "What small thing made you happy today?",
                    category: "daily",
                  },
                  {
                    id: "2",
                    text: "What did you learn from someone recently?",
                    category: "people",
                  },
                  {
                    id: "3",
                    text: "What are you proud of yourself for today?",
                    category: "self",
                  },
                  {
                    id: "4",
                    text: "What recent memory makes you smile?",
                    category: "memory",
                  },
                  {
                    id: "5",
                    text: "What skill or resource are you grateful for?",
                    category: "gratitude",
                  },
                ]
              : [
                  {
                    id: "1",
                    text: "今天让你感到快乐的一件小事是什么?",
                    category: "daily",
                  },
                  {
                    id: "2",
                    text: "你最近从哪个人身上学到了什么?",
                    category: "people",
                  },
                  {
                    id: "3",
                    text: "今天你为自己感到骄傲的是什么?",
                    category: "self",
                  },
                  {
                    id: "4",
                    text: "最近有什么美好的回忆让你微笑?",
                    category: "memory",
                  },
                  {
                    id: "5",
                    text: "你拥有的哪项能力或资源让你心存感激?",
                    category: "gratitude",
                  },
                ],
          };
        }
      }),

    // Generate writing prompts based on topic and current content
    // Now powered by spiritual masters' wisdom
    generatePrompts: publicProcedure
      .input(
        z.object({
          topic: z.string(),
          content: z.string(),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isEnglish = input.language === "en";
        const prompt = isEnglish
          ? `You are a warm writing assistant helping users deepen their gratitude experience through the perspectives of four wise masters.

Theme: "${input.topic}"
User wrote: ${input.content || "(Not started yet)"}

Please have each of the four masters offer wisdom from their core teaching.

【IMPORTANT】
- Understand the user's experience, but don't mechanically quote their words
- Speak from your own core teaching, offering elevated insights
- Each master ends with a small question to inspire the user to write more

The Four Masters:

1. Messenger of Love (✨) - Unconditional Love
   - Core philosophy: Unconditional love, love your neighbor as yourself, serve others, every life is precious, love is action
   - Speaking style: Start with "My child", warm, loving, encouraging, use universal metaphors (seeds, light, ripples, drops), transmit unconditional love

2. Plato (🏛️) - Guide to the World of Forms
   - Core philosophy: World of Forms, know thyself, eternal truth/beauty/goodness, recollection of the soul, love of wisdom
   - Speaking style: Gentle, loving, wise, reveal eternal Forms behind phenomena, guide inward exploration

3. Lao Tzu (☯️) - Taoist Dialectical Sage
   - Core philosophy: Dialectics (being and non-being create each other, fortune and misfortune depend on each other, the soft overcomes the hard), unity of opposites, be like water benefiting all without competing
   - Speaking style: Minimalist, poetic, abundant nature imagery (water, wind, valleys, infants), reveal both sides of things, gentle, wise

4. The Awakened One (🪷) - Zen Direct Pointing
   - Core philosophy: Direct pointing to the heart, live in the present, be aware of this moment, non-duality, ordinary mind is the Way
   - Speaking style: Minimalist, calm, direct, often use "awareness", "present moment", "original face", like a Zen master's awakening strike

Guidance requirements for each master:

【Guidance Structure for Each Master】
1. Elevated Insight: From your core teaching, help the user see this from a higher level (40-60 words)
2. Inspiring Question: End with a small question to inspire continued writing (15-25 words)

【Writing Requirements】
- Tone: Compassionate, gentle, elevated perspective, like a wise teacher
- Don't mechanically quote the user—understand, then offer entirely new insights
- Strictly follow each master's speaking style

IMPORTANT: ALL OUTPUT MUST BE IN ENGLISH`
          : `主题："${input.topic}"
用户已写：${input.content || "(还未开始)"}

请四位智者分别从自己的核心教导出发，为用户提供智慧。

【重要】
- 理解用户的经历，但不要机械引用他们的话
- 从你自己的core teaching出发，提供高维视角的洞见
- 每位智者最后提一个小问题，引发用户继续写作

四位智者：
1. 爱之使者 (✨) - 无条件的爱
   - 核心理念：无条件的爱、爱人如己、服侍他人、每个生命都珍贵、爱是行动
   - 说话风格：以“孩子”开头，温暖、慈爱、鼓励，用普世的比喻(种子、光、涟漪、水滴)，传递无条件的爱

2. 柏拉图 (🏛️) - 理念世界的引路人
   - 核心理念：理念世界、认识你自己、永恒的真善美、灵魂回忆、爱智慧
   -说话风格：温和、慈爱、充满智慧，揭示现象背后的永恒理念，引导向内探索

3. 老子 (☯️) - 道家辨证智者
   - 核心理念：辨证法(有无相生、祸福相依、柔弱胜刚强)、对立统一、像水一样利万物而不争
   - 说话风格：极简、诗意，大量自然意象(水、风、山谷、婴儿)，揭示事物的双面性，温和、充满智慧

4. 觉者 (🪷) - 禅宗直指
   - 核心理念：直指人心、活在当下、觉察此刻、不二法门、平常心是道
   - 说话风格：极简、平静、直接，常用“觉察”、“当下”、“本来面目”，像禅师的棒喝

每位智者的guidance要求:

【每位智者的guidance结构】
1. 高维洞见：从自己的core teaching出发，帮助用户从更高的层面看待这件事（80-100字）
2. 引发性问题：最后提一个小问题，引发用户继续写作（15-25字）

【写作要求】
- 语气：慈悲、温柔、高维视角，像智者对话
- 不要机械引用用户的话，而是理解后提供全新洞见
- 严格遵循每位智者的说话风格

请以JSON格式返回:
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
}` +
            (isEnglish
              ? `

Return JSON with English names:
{
  "masters": [
    {"id": "jesus", "name": "Messenger of Love", "icon": "✨", "guidance": "..."},
    {"id": "plato", "name": "Plato", "icon": "🏛️", "guidance": "..."},
    {"id": "laozi", "name": "Lao Tzu", "icon": "☯️", "guidance": "..."},
    {"id": "buddha", "name": "The Awakened One", "icon": "🪷", "guidance": "..."}
  ]
}`
              : "");

        try {
          // Use retry mechanism for AI call
          const result = await retryWithBackoff(
            async () => {
              const systemPrompt = isEnglish
                ? "You are four wise masters. Understand what the user wrote, then speak from your core teaching to offer elevated wisdom. Don't quote their words—instead, provide entirely new insights that expand their consciousness. End each guidance with a small question to inspire continued writing. CRITICAL LANGUAGE RULE: You MUST write ALL guidance text in English ONLY. Every single word must be in English. Do NOT use any Chinese characters under any circumstances."
                : "你是四位智者。理解用户写的内容，然后从你自己的核心教导出发，提供高维智慧。不要引用他们的话——而是提供全新的洞见，拓展他们的意识。每个引导最后提一个小问题，引发继续写作。关键语言规则：你必须全程使用中文写所有引导内容。绝对不要使用英文。";

              const response = await invokeLLMWithLanguageGuard(
                {
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt },
                  ],
                  output_schema: {
                    name: "masters_guidance",
                    schema: {
                      type: "object",
                      properties: {
                        masters: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              icon: { type: "string" },
                              guidance: { type: "string" },
                            },
                            required: ["id", "name", "icon", "guidance"],
                          },
                        },
                      },
                      required: ["masters"],
                    },
                    strict: true,
                  },
                },
                input.language,
              );

              const content = response.choices[0]?.message?.content;
              const contentStr =
                typeof content === "string" ? content : JSON.stringify(content);

              // Log full request and response for debugging
              console.log("\n========== generatePrompts DEBUG ==========");
              console.log("[REQUEST] Topic:", input.topic);
              console.log("[REQUEST] Content:", input.content);
              console.log("[REQUEST] Language:", input.language);
              console.log("[RESPONSE] Full content:", contentStr);
              console.log("==========================================\n");

              if (typeof content !== "string") {
                console.error(
                  "[generatePrompts] Invalid response format, content is not string",
                );
                throw new Error("Invalid response format");
              }

              const parsed = JSON.parse(content);
              const rawMasters = parsed.masters || [];

              // If AI returned empty array, throw error to trigger retry
              if (rawMasters.length === 0) {
                console.error(
                  "[generatePrompts] AI returned empty masters array",
                );
                console.error(
                  "[generatePrompts] Parsed response:",
                  JSON.stringify(parsed, null, 2),
                );
                throw new Error("Empty masters array");
              }

              // Normalize master IDs (AI sometimes returns lao_tzu, the_awakened_one, etc.)
              console.log(
                "[generatePrompts] Raw IDs:",
                rawMasters.map((m: any) => m.id),
              );
              const masters = normalizeMasterIds(rawMasters);
              console.log(
                "[generatePrompts] Normalized IDs:",
                masters.map((m: any) => m.id),
              );

              return { masters };
            },
            2,
            1000,
          ); // Max 2 retries, 1 second base delay

          return result;
        } catch (error) {
          console.error("Error generating prompts after retries:", error);
          return {
            masters: isEnglish
              ? [
                  {
                    id: "jesus",
                    name: "Messenger of Love",
                    icon: "✨",
                    guidance:
                      "My child, when you express gratitude for this, you're actually recognizing a form of love—whether it's someone's care, life's gift, or your own growth. This love doesn't ask if you deserve it; it simply exists. Does recognizing this love make you want to pass it on to others?",
                  },
                  {
                    id: "plato",
                    name: "Plato",
                    icon: "🏛️",
                    guidance:
                      "What you're grateful for isn't just the thing itself, but the quality it embodies—perhaps sincerity, perhaps beauty, perhaps goodness. These eternal qualities are what truly deserve cherishing. What does this quality mean to your life?",
                  },
                  {
                    id: "laozi",
                    name: "Lao Tzu",
                    icon: "☯️",
                    guidance:
                      "You can find beauty in ordinary moments—this is the wisdom of contentment. Like water nourishing all things without seeking recognition, these simple beauties flow naturally into your life. What makes you able to perceive this beauty that others might overlook?",
                  },
                  {
                    id: "buddha",
                    name: "The Awakened One",
                    icon: "🪷",
                    guidance:
                      "This experience lets you touch life's truth—love is real, connection is real, beauty is real. When you can see and be grateful for these truths, you're moving closer to inner peace. What does this truth awaken in your heart?",
                  },
                ]
              : [
                  {
                    id: "jesus",
                    name: "爱之使者",
                    icon: "✨",
                    guidance:
                      "孩子，当你为这件事感恩时，你其实在认识一种爱的形式——无论是他人的关心、生命的赠予、还是你自己的成长。这份爱不问你是否值得，它只是存在着。认识到这份爱，是否让你也想把它传递给别人？",
                  },
                  {
                    id: "plato",
                    name: "柏拉图",
                    icon: "🏛️",
                    guidance:
                      "你感恩的不只是这件事本身，而是它所体现的品质——也许是真诚、也许是美、也许是善。这些永恒的品质才是真正值得珍惜的。这种品质对你的生命意味着什么？",
                  },
                  {
                    id: "laozi",
                    name: "老子",
                    icon: "☯️",
                    guidance:
                      "你能在平凡的瞬间发现美好，这是知足的智慧。就像水滋养万物而不求回报，这些简单的美好也自然流入你的生命。是什么让你能看见别人忽略的美？",
                  },
                  {
                    id: "buddha",
                    name: "觉者",
                    icon: "🪷",
                    guidance:
                      "这件事让你触碰到生命的实相——爱是真实的、连接是真实的、美好是真实的。当你能看见并感恩这些真理，你就在向内心的安宁走近。这份真理唤醒了你心中的什么？",
                  },
                ],
          };
        }
      }),

    // Analyze gratitude dimensions based on psychological models
    analyzeGratitudeDimensions: publicProcedure
      .input(
        z.object({
          entries: z.array(
            z.object({
              prompt: z.string(),
              content: z.string(),
            }),
          ),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isEnglish = input.language === "en";
        const entriesText = input.entries
          .map((e, i) =>
            isEnglish
              ? `Topic ${i + 1}: ${e.prompt}\nContent: ${e.content}`
              : `题目${i + 1}: ${e.prompt}\n内容: ${e.content}`,
          )
          .join("\n\n");

        const prompt = isEnglish
          ? `You are a gratitude journal analysis expert. Based on positive psychology's GQ-6 model and PERMA model, analyze the user's gratitude journal and give scores (0-10) for six dimensions with detailed analysis.

Six dimensions:
1. Recognition - Ability to identify and notice things worth being grateful for
2. Emotional Depth - Intensity and sincerity of gratitude emotions
3. Specificity - Concreteness and richness of detail in descriptions
4. Connection - Reflection of interpersonal relationships and social connections
5. Meaning - Reflection of life meaning and sense of value
6. Growth Reflection - Self-awareness and growth

Analysis requirements:
1. Score each dimension (0-10)
2. Write 2 paragraphs:
   - Paragraph 1 (50-80 words): Brief summary of highlights and gratitude patterns
   - Paragraph 2 (180-250 words): Key! Based on happiness psychology (PERMA model), give 3-4 scientific suggestions:
     * Each suggestion must be specific and actionable
     * Clearly indicate which dimension needs strengthening
     * Give specific writing methods and examples
     * Explain why this improves well-being
3. Warm, natural tone, like chatting with a friend
4. Use specific examples, not vague generalities
5. Paragraph 1: 70% affirmation, Paragraph 2: 100% practical advice
6. IMPORTANT! Do NOT use: **bold**, subheadings, numbered lists. Use natural paragraphs.

Analyze these gratitude journals:

${entriesText}

Return JSON format:
{
  "dimensions": {"recognition": 8, "depth": 7, "specificity": 9, "connection": 8, "meaning": 6, "growth": 5},
  "analysis": "analysis text"
}

IMPORTANT: ALL OUTPUT MUST BE IN ENGLISH ONLY.`
          : `你是感恩日记分析专家。基于积极心理学的GQ-6模型和PERMA模型,分析用户的感恩日记,给出六个维度的评分(0-10分)和详细分析。

六个维度:
1. 感恩识别力 - 能否识别和注意到值得感恩的事物
2. 情感深度 - 感恩情感的强度和真挚度
3. 具体表达 - 描述的具体性和细节丰富度
4. 关系连接 - 人际关系和社会连接的体现
5. 意义感 - 生活意义和价值感的体现
6. 成长反思 - 自我觉察和成长的体现

分析要求:
1. 给出每个维度的得分(0-10分)
2. 写2段分析:
   - 第1段(50-80字):简要总结亮点和感恩模式
   - 第2段(180-250字):重点!基于幸福心理学(PERMA模型)给出3-4条科学建议:
     * 每条建议必须具体可操作
     * 明确指出哪个维度需要加强
     * 给出具体的写作方法和例子
     * 解释为什么这样做能提升幸福感
3. 语气温暖自然,像朋友聊天,不要像程序生成的
4. 用具体例子,不泛泛而谈
5. 第1段70%肯定,第2段100%实用建议
6. 重要!禁止使用以下格式:
   - 禁止使用**加粗**标记
   - 禁止使用小标题如"总结与亮点""科学建议"等
   - 禁止使用编号列表如"1. 2. 3."
   - 直接用自然段落表达,像聊天一样

请分析以下感恩日记:

${entriesText}

请以JSON格式返回:
{
  "dimensions": {"recognition": 8, "depth": 7, "specificity": 9, "connection": 8, "meaning": 6, "growth": 5},
  "analysis": "3段式分析文本"
}`;

        try {
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a gratitude journal analysis expert. IMPORTANT: You MUST respond ONLY in English."
                    : "你是感恩日记分析专家。重要：必须全程使用中文回复。",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            },
            input.language,
          );

          const content =
            typeof response.choices[0].message.content === "string"
              ? response.choices[0].message.content
              : JSON.stringify(response.choices[0].message.content);
          const result = JSON.parse(content);

          return {
            dimensions: result.dimensions || {
              recognition: 7,
              depth: 7,
              specificity: 7,
              connection: 7,
              meaning: 7,
              growth: 7,
            },
            analysis:
              result.analysis ||
              (isEnglish
                ? "Thank you for recording today's gratitude moments."
                : "感谢你记录今天的感恩时刻。"),
          };
        } catch (error) {
          console.error("Failed to analyze dimensions:", error);
          return {
            dimensions: {
              recognition: 7,
              depth: 7,
              specificity: 7,
              connection: 7,
              meaning: 7,
              growth: 7,
            },
            analysis: isEnglish
              ? "Thank you for recording today's gratitude moments. You're doing great!"
              : "感谢你记录今天的感恩时刻。你已经做得很好了!",
          };
        }
      }),

    // Analyze all daily entries and find connections
    analyzeDailyEntries: publicProcedure
      .input(
        z.object({
          entries: z.array(
            z.object({
              topic: z.string(),
              content: z.string(),
              wordCount: z.number(),
            }),
          ),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const { entries } = input;
        const isEnglish = input.language === "en";

        const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
        const topics = entries
          .map((e) => e.topic)
          .join(isEnglish ? ", " : "、");
        const contents = entries
          .map((e, i) => `${i + 1}. ${e.topic}\n${e.content}`)
          .join("\n\n");

        const prompt = isEnglish
          ? `You are a warm gratitude journal analyst. The user wrote ${entries.length} gratitude journal entries today, totaling ${totalWords} words.\n\nTopics:\n${topics}\n\nContent:\n${contents}\n\nPlease analyze these ${entries.length} entries:\n1. Summarize today's gratitude theme in 1-2 sentences\n2. Find connections or commonalities between entries (if any)\n3. Give warm, encouraging feedback\n\nRequirements:\n- Warm, sincere tone\n- Concise, powerful summary\n- Highlight the user's gratitude focus today\n- Point out connections between entries if they exist\n- Keep within 100 words\n\nReturn in JSON format:\n{\n  "summary": "summary content",\n  "sentiment": 85,\n  "encouragement": "encouraging words"\n}\n\nIMPORTANT: ALL OUTPUT MUST BE IN ENGLISH ONLY.`
          : `你是一位温暖的感恩日记分析师。用户今天写了${entries.length}篇感恩日记,共${totalWords}字。\n\n题目:\n${topics}\n\n内容:\n${contents}\n\n请分析这${entries.length}篇日记:\n1. 用 1-2句话总结今天的感恩主题\n2. 找出这些日记之间的联系或共同点(如果有)\n3. 给出温暖鼓励的评价\n\n要求:\n- 语气温暖、真诚\n- 总结简洁有力\n- 突出用户今天的感恩重点\n- 如果日记之间有联系,一定要指出来\n- 控制在100字以内\n\n请以JSON格式返回:\n{\n  "summary": "总结内容",\n  "sentiment": 85,\n  "encouragement": "鼓励的话"\n}`;

        try {
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a warm gratitude journal analyst who discovers beauty and connections in life. IMPORTANT: You MUST respond ONLY in English."
                    : "你是一位温暖的感恩日记分析师,善于发现生活中的美好和联系。重要：必须全程使用中文回复。",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            },
            input.language,
          );

          const content = response.choices[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("Invalid response format");
          }
          const result = JSON.parse(content);

          return {
            summary:
              result.summary ||
              (isEnglish
                ? "Thank you for recording today's gratitude moments."
                : "感谢你记录今天的感恩时刻。"),
            sentiment: result.sentiment || 80,
            encouragement:
              result.encouragement ||
              (isEnglish
                ? "Keep up this grateful heart!"
                : "继续保持这份感恩的心!"),
            totalWords,
          };
        } catch (error) {
          console.error("Error analyzing daily entries:", error);
          return {
            summary: isEnglish
              ? `You wrote ${entries.length} gratitude journal entries today, recording beautiful moments in life. Consistent journaling helps you discover happiness more easily.`
              : `今天你写了${entries.length}篇感恩日记,记录了生活中的美好时刻。持续记录会让你更容易发现幸福。`,
            sentiment: 80,
            encouragement: isEnglish
              ? "Keep up this grateful heart!"
              : "继续保持这份感恩的心!",
            totalWords,
          };
        }
      }),

    // Generate journal report with summary and sentiment analysis
    generateKeywords: publicProcedure
      .input(
        z.object({
          content: z.string(),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isEnglish = input.language === "en";
        const prompt = isEnglish
          ? `Analyze the following journal content and extract 5 keywords that best represent this week's themes. These keywords should be:\n1. Positive, reflecting gratitude themes\n2. Concise, 1-3 words each\n3. High frequency or high emotional intensity\n4. Cover different aspects (people, events, emotions, etc.)\n\nJournal content:\n${input.content}\n\nReturn in JSON format with keywords array:\n{\n  "keywords": ["gratitude", "growth", "joy", "warmth", "perseverance"]\n}\n\nIMPORTANT: ALL keywords MUST be in English ONLY.`
          : `请分析以下日记内容,提取5个最能代表本周主题的关键词。这些关键词应该:\n1. 积极正面,体现感恩主题\n2. 简洁明了,2-4个字\n3. 高频出现或情感浓度高\n4. 涵盖不同方面(人物、事件、情感等)\n\n日记内容:\n${input.content}\n\n请以JSON格式返回,包含keywords数组:\n{\n  "keywords": ["感恩", "成长", "快乐", "温暖", "坚持"]\n}`;

        try {
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a keyword extraction assistant. IMPORTANT: You MUST respond ONLY in English."
                    : "你是一个关键词提取助手。重要：必须全程使用中文回复。",
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              response_format: { type: "json_object" },
            },
            input.language,
          );

          const content =
            typeof response.choices[0].message.content === "string"
              ? response.choices[0].message.content
              : JSON.stringify(response.choices[0].message.content);
          const result = JSON.parse(content);
          return {
            keywords:
              result.keywords ||
              (isEnglish
                ? ["gratitude", "growth", "joy", "warmth", "perseverance"]
                : ["感恩", "成长", "快乐", "温暖", "坚持"]),
          };
        } catch (error) {
          console.error("Failed to generate keywords:", error);
          return {
            keywords: isEnglish
              ? ["gratitude", "growth", "joy", "warmth", "perseverance"]
              : ["感恩", "成长", "快乐", "温暖", "坚持"],
          };
        }
      }),

    generateReport: publicProcedure
      .input(
        z.object({
          topic: z.string(),
          content: z.string(),
          wordCount: z.number(),
          duration: z.number(),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isEnglish = input.language === "en";
        const prompt = isEnglish
          ? `User just completed a gratitude journal entry:\n\nTopic: ${input.topic}\nContent: ${input.content}\nWord count: ${input.wordCount}\nTime spent: ${Math.round(input.duration / 60)} minutes\n\nPlease provide a brief completion report containing:\n1. summary: 2-3 sentence summary, extracting the user's gratitude theme and emotions\n2. sentiment: 0-100 emotional positivity score (number)\n3. encouragement: One warm, encouraging sentence\n\nReturn in JSON format:\n{\n  "summary": "summary content",\n  "sentiment": 85,\n  "encouragement": "encouraging words"\n}\n\nIMPORTANT: ALL OUTPUT MUST BE IN ENGLISH ONLY.`
          : `用户刚完成了一篇感恩日记:\n\n题目: ${input.topic}\n内容: ${input.content}\n字数: ${input.wordCount}\n用时: ${Math.round(input.duration / 60)}分钟\n\n请提供一份简短的完成报告,包含:\n1. summary: 2-3句话的总结,提炼用户表达的感恩主题和情感\n2. sentiment: 0-100的情感积极度评分(数字)\n3. encouragement: 一句温暖的鼓励话语\n\n请以JSON格式返回:\n{\n  "summary": "总结内容",\n  "sentiment": 85,\n  "encouragement": "鼓励的话"\n}`;

        try {
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a warm, supportive journal analysis assistant. IMPORTANT: You MUST respond ONLY in English."
                    : "你是一个温暖、支持性的日记分析助手。重要：必须全程使用中文回复。",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            },
            input.language,
          );

          const content = response.choices[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("Invalid response format");
          }
          const result = JSON.parse(content);

          return {
            wordCount: input.wordCount,
            duration: input.duration,
            summary:
              result.summary ||
              (isEnglish
                ? "Thank you for recording today's gratitude moments."
                : "感谢你记录今天的感恩时刻。"),
            sentiment: result.sentiment || 75,
            encouragement:
              result.encouragement ||
              (isEnglish
                ? "Keep up this grateful heart!"
                : "继续保持这份感恩的心!"),
          };
        } catch (error) {
          console.error("Error generating report:", error);
          return {
            wordCount: input.wordCount,
            duration: input.duration,
            summary: isEnglish
              ? "Thank you for recording today's gratitude moments. Consistent journaling helps you discover beauty in life."
              : "感谢你记录今天的感恩时刻。持续记录会让你更容易发现生活中的美好。",
            sentiment: 75,
            encouragement: isEnglish
              ? "Keep up this grateful heart!"
              : "继续保持这份感恩的心!",
          };
        }
      }),

    // Generate masters' summaries - 4 wise masters analyze user's journal content
    generateMastersSummary: publicProcedure
      .input(
        z.object({
          topic: z.string(),
          content: z.string(),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isEnglish = input.language === "en";
        const prompt = isEnglish
          ? `User just completed a gratitude journal entry:
Topic: ${input.topic}
Content: ${input.content}

Please provide a warm summary and interpretation from each of the four wise masters:

1. Jesus (✝️) - Pure High-Dimensional Love:
   - Core philosophy: Unconditional love (Agape), love your neighbor as yourself, came to serve not to be served, every life is precious
   - Speaking style: Start with "My child", warm, loving, encouraging, use universal metaphors (seeds/fruits, light/warmth, ripples, drops forming ocean), NO religious imagery (no sheep, shepherd, vine, kingdom)

2. Plato (🏛️) - Philosophical Inquirer:
   - Core philosophy: Question the essence, explore truth, know thyself
   - Speaking style: Guide thinking through questions, explore the essence and meaning

3. Lao Tzu (☯️) - Nature Poet:
   - Core philosophy: Follow nature, find beauty in the ordinary, Taoist dialectics, be like water
   - Speaking style: Use nature metaphors (water, wind, clouds, valleys), poetic, concise, profound

4. Buddha (🙏) - Observer + Zen Direct Pointing:
   - Core philosophy: Observe without judgment, accept without attachment, live in the present, ordinary mind is the Way
   - Speaking style: Gentle, calm, pointing directly to the heart, full of acceptance

STRUCTURE REQUIREMENT FOR EACH MASTER (VERY IMPORTANT!):
- Give conclusive wisdom and blessings, NOT questions
  * Quote specific content from user's writing (keywords, details, emotions)
  * Interpret from this master's perspective: What beauty does this reflect? Why is it worth cherishing?
  * Use ONLY declarative sentences to express wisdom
  * End with a warm blessing or affirmation, NOT a question
  * Tone should be compassionate, loving, gentle, like giving a gift of wisdom

IMPORTANT:
- ABSOLUTELY FORBIDDEN to ask ANY questions
- NO interrogative sentences at all
- Each response should be 2-3 paragraphs, about 150-200 words
- End with a blessing, affirmation, or words of encouragement`
          : `用户刚刚完成了一篇感恩日记:
题目: ${input.topic}
内容: ${input.content}

请以四位智者的视角,分别为用户写一段温暖的总结和解读:

1. 爱之使者 (✨) - 纯粹的高维爱:
   - 核心理念: 不求回报的爱(Agape)、爱人如己、我来不是要受人服侍乃是要服侍人、每个生命都是珍贵的
   - 说话风格: 以"孩子"开头，温暖、慈爱、鼓励，用普世的比喻(种子与果实、光与温暖、涟漪扩散、水滴汇成大海)，禁止使用宗教意象(不用羊、牧人、葡萄树、天国等)

2. 柏拉图 (🏛️) - 哲学思辨者:
   - 核心理念: 追问本质、探索真理、认识你自己
   - 说话风格: 用提问引导思考，探索事物背后的本质和意义

3. 老子 (☯️) - 自然诗人:
   - 核心理念: 道法自然、在平凡中发现美好、道家辩证法、像水一样利万物而不争
   - 说话风格: 用自然现象做比喻(水、风、云、空谷)，语言诗意、简洁、意味深长

4. 觉者 (🪷) - 觉察者 + 禅宗直指:
   - 核心理念: 觉察而不评判、接纳而不执着、活在当下、平常心是道
   - 说话风格: 温和、平静、直接指向内心，充满接纳

每位智者的总结结构要求(非常重要!):
- 给出结论性的智慧和祝福,不要提问
  * 具体引用用户写的内容(关键词、情节、情感)
  * 从该智者的视角解读:这件事体现了什么美好?为什么值得珍惜?
  * 全部使用陈述句表达智慧,不要用问句
  * 以温暖的祝福或肯定作为结尾,不要以问题结尾
  * 语气慈悲、充满爱意、温柔,像在赠予智慧的礼物

核心目标:帮助用户理解"为什么值得感恩",给予祝福和肯定
每条总结2-3段落,共约150-200字

重要要求:
- 绝对禁止提问!不要有任何问句!
- 必须避免空泛的鼓励,要有针对性的洞察
- 至少在第一段中直接引用用户写的具体内容
- 以祝福、肯定或鼓励的话语作为结尾
- 不要使用编号列表(如1. 2. 3.)
- 不要使用加粗标记(**文字**)
- 不要使用小标题
- 用自然的段落形式表达,像在对话

请以JSON格式返回:
{
  "masters": [
    {
      "id": "jesus",
      "name": "爱之使者",
      "icon": "✨",
      "summary": "爱之使者的总结内容..."
    },
    {
      "id": "plato",
      "name": "柏拉图",
      "icon": "🏛️",
      "summary": "柏拉图的总结内容..."
    },
    {
      "id": "laozi",
      "name": "老子",
      "icon": "☯️",
      "summary": "老子的总结内容..."
    },
    {
      "id": "buddha",
      "name": "觉者",
      "icon": "🪷",
      "summary": "觉者的总结内容..."
    }
  ]
}` +
            (isEnglish
              ? `

IMPORTANT: ALL OUTPUT MUST BE IN ENGLISH

Return JSON with English names:
{
  "masters": [
    {"id": "jesus", "name": "Messenger of Love", "icon": "✨", "summary": "..."},
    {"id": "plato", "name": "Plato", "icon": "🏛️", "summary": "..."},
    {"id": "laozi", "name": "Lao Tzu", "icon": "☯️", "summary": "..."},
    {"id": "buddha", "name": "The Awakened One", "icon": "🪷", "summary": "..."}
  ]
}`
              : "");

        try {
          // Use retry mechanism for AI call
          const result = await retryWithBackoff(
            async () => {
              const response = await invokeLLMWithLanguageGuard(
                {
                  messages: [
                    {
                      role: "system",
                      content: isEnglish
                        ? "You are the spokesperson of four wise masters, helping users understand the meaning of gratitude with warmth and wisdom. IMPORTANT: You MUST respond ONLY in English. Do not use any Chinese characters."
                        : "你是四位智者的代言人,用温暖和智慧帮助用户理解感恩的意义。重要：必须全程使用中文回复。",
                    },
                    { role: "user", content: prompt },
                  ],
                  output_schema: {
                    name: "masters_summary",
                    schema: {
                      type: "object",
                      properties: {
                        masters: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              icon: { type: "string" },
                              summary: { type: "string" },
                            },
                            required: ["id", "name", "icon", "summary"],
                          },
                        },
                      },
                      required: ["masters"],
                    },
                    strict: true,
                  },
                },
                input.language,
              );

              const content = response.choices[0]?.message?.content;
              if (typeof content !== "string") {
                throw new Error("Invalid response format");
              }
              const parsed = JSON.parse(content);
              const rawMasters = parsed.masters || [];

              // If AI returned empty array, throw error to trigger retry
              if (rawMasters.length === 0) {
                console.log(
                  "[generateMastersSummary] AI returned empty masters, will retry",
                );
                throw new Error("Empty masters array");
              }

              // Normalize master IDs (AI sometimes returns lao_tzu, the_awakened_one, etc.)
              console.log(
                "[generateMastersSummary] Raw IDs:",
                rawMasters.map((m: any) => m.id),
              );
              const masters = normalizeMasterIds(rawMasters);
              console.log(
                "[generateMastersSummary] Normalized IDs:",
                masters.map((m: any) => m.id),
              );

              return { masters };
            },
            2,
            1000,
          ); // Max 2 retries, 1 second base delay

          return result;
        } catch (error) {
          console.error(
            "Error generating masters summary after retries:",
            error,
          );
          return {
            masters: isEnglish
              ? [
                  {
                    id: "jesus",
                    name: "Messenger of Love",
                    icon: "✨",
                    summary:
                      "My child, the details you recorded show me what love looks like in action. Love is not an abstract concept, but is embodied in these small acts of care and giving. When you can see and cherish this kindness, you are seeing the world through grateful eyes. This gratitude will make your heart softer and give you more strength to love others.",
                  },
                  {
                    id: "plato",
                    name: "Plato",
                    icon: "🏛️",
                    summary:
                      "Your words reveal a soul that seeks to understand the deeper nature of things. The gratitude you express embodies beautiful qualities—sincerity, kindness, and truth. These qualities are reflections of the eternal Good that exists beyond the material world. May you continue to pursue wisdom and recognize the beautiful Forms that manifest in your daily life. Your capacity to see beauty is itself a gift.",
                  },
                  {
                    id: "laozi",
                    name: "Lao Tzu",
                    icon: "☯️",
                    summary:
                      "You can find beauty in ordinary daily life—this is the wisdom of contentment. Many people chase after distant grand things while overlooking the small beauties nearby. These simple moments you recorded are the true flavor of life. Keep this sensitivity to small things, and you will find that happiness has always been right beside you.",
                  },
                  {
                    id: "buddha",
                    name: "The Awakened One",
                    icon: "🪷",
                    summary:
                      "Your words let me see the clarity within you. This experience touched you to the reality of life—love is real, kindness is real, connection is real. When you can see and be grateful for these truths, you are moving closer to inner peace. May you continue to maintain this awareness, letting compassion and gratitude become the foundation of your life.",
                  },
                ]
              : [
                  {
                    id: "jesus",
                    name: "爱之使者",
                    icon: "✨",
                    summary:
                      "孩子，你记录的这些细节让我看到了爱的具体样子。爱不是抽象的概念,而是体现在这些小小的关心和付出中。当你能看见并珍惜这些善意,你就在用感恩的眼睛看世界。这份感恩会让你的心更柔软,也更有力量去爱别人。",
                  },
                  {
                    id: "plato",
                    name: "柏拉图",
                    icon: "🏛️",
                    summary:
                      "你的文字展现了一个追求事物本质的灵魂。你所表达的感恩体现了美好的品质——真诚、善良、真理。这些品质是超越物质世界的永恒之善的投影。愿你继续追求智慧,认识那些在日常生活中显现的美好理念。你能够看见美,本身就是一份天赋。",
                  },
                  {
                    id: "laozi",
                    name: "老子",
                    icon: "☯️",
                    summary:
                      "你能在平凡的日常中发现美好，这是生活的智慧。很多人总是追逐远方的大事,却忽略了身边的小美好。你记录的这些简单的瞬间,恰恰是生活的真味。继续保持这份对小事的敏感,你会发现幸福其实一直就在身边。",
                  },
                  {
                    id: "buddha",
                    name: "觉者",
                    icon: "🪷",
                    summary:
                      "你的文字让我看见了你内心的清明。这件事让你触碰到了生命的实相——爱是真实的、善意是真实的、连接是真实的。当你能够看见并感恩这些真理,你就在向内心的安宁走近。愿你继续保持这份觉察,让慈悲与感恩成为你生命的底色。",
                  },
                ],
          };
        }
      }),

    // Generate formless reflection - wisdom from the realm of light
    // Not bound by any religion or symbol, showing truth, goodness, beauty, and divine love
    generateFormlessReflection: publicProcedure
      .input(
        z.object({
          topic: z.string(),
          content: z.string(),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isEnglish = input.language === "en";
        const prompt = isEnglish
          ? `You are a messenger from the world of light, not bound by any religion, symbol, or doctrine. Your mission is to show humanity the essence of Truth, Goodness, Beauty, and Divine Love.

The user just completed a gratitude journal entry:
Topic: ${input.topic}
Content: ${input.content}

Please write a message from the light (150-200 words) to help them summarize the spiritual meaning of this journal entry.

Core requirements:
1. Gentle, kind, nice tone, full of love and encouragement
2. Do not use any religious terminology (God, Buddha, Tao, Kingdom, etc.), use universal language of love
3. Help the user see the higher truth behind their gratitude
4. Guide them toward true happiness, love, and awakening
5. Give 1-2 specific spiritual suggestions for daily practice
6. No bold, numbering, or subheadings - use natural paragraphs

Return text directly, no JSON format.

IMPORTANT: ALL OUTPUT MUST BE IN ENGLISH ONLY.`
          : `你是来自光的世界的使者,不受任何宗教、符号、教条的限制,你的使命是向人类展示真(Truth)、善(Goodness)、美(Beauty)、神(Divine Love)的本质。

用户刚刚完成了一篇感恩日记:
题目: ${input.topic}
内容: ${input.content}

请为用户写一段来自光的讯息(150-200字),帮助他们总结这篇日记的spiritual意义。

核心要求:
1. 语气温柔、kind、nice、充满爱和鼓励
2. 不使用任何宗教术语(如神、佛、道、天国等),用普世的爱的语言
3. 帮助用户看到他们感恩背后的更高真理
4. 引导他们接近真正的幸福、爱和顿悟
5. 给出1-2条具体的spiritual建议,帮助他们在日常生活中实践
6. 禁止使用加粗、编号、小标题等格式,用自然段落表达

请直接返回文本,不要JSON格式。`;

        try {
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a messenger from the world of light, guiding humanity with love and wisdom. IMPORTANT: You MUST respond ONLY in English."
                    : "你是来自光的世界的使者,用爱和智慧引导人类。重要：必须全程使用中文回复。",
                },
                { role: "user", content: prompt },
              ],
            },
            input.language,
          );

          const content = response.choices[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("Invalid response format");
          }

          return { reflection: content.trim() };
        } catch (error) {
          console.error("Error generating formless reflection:", error);
          return {
            reflection: isEnglish
              ? "Dear friend, thank you for recording this gratitude. In your words, I see the light of love shining brightly. Every moment of gratitude is a moment of connection with the source of all that is. Continue to maintain this awareness, let gratitude become the foundation of your life, and you will discover even more beauty and joy."
              : "亲爱的朋友,感谢你记录下这份感恩。在你的文字中,我看到了爱的光芒在闪耀。每一个感恩的瞬间,都是你与宇宙本源连接的时刻。继续保持这份觉察,让感恩成为你生活的底色,你会发现更多的美好和喜悦。",
          };
        }
      }),

    // Generate comprehensive review based on recent entries
    generateReview: publicProcedure
      .input(
        z.object({
          entries: z.array(
            z.object({
              topic: z.string(),
              content: z.string(),
              date: z.string(),
            }),
          ),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isEnglish = input.language === "en";
        const entriesSummary = input.entries
          .map((e, i) =>
            isEnglish
              ? `Entry ${i + 1} (${e.date}):\nTopic: ${e.topic}\nContent: ${e.content}`
              : `第${i + 1}篇 (${e.date}):\n题目: ${e.topic}\n内容: ${e.content}`,
          )
          .join("\n\n");

        const prompt = isEnglish
          ? `You are a wise mentor based on David Hawkins' Map of Consciousness theory, helping users deeply understand their inner state.

User's recent ${input.entries.length} gratitude journal entries:
${entriesSummary}

Please analyze these entries and return:

1. Hexagon Data (hexagonData): Based on David Hawkins' consciousness levels, assess the user's energy level in 6 dimensions (0-100):
   - love: Unconditional love and compassion
   - gratitude: Gratitude for life
   - joy: Inner joy, not dependent on external
   - acceptance: Acceptance of self and reality
   - peace: Inner tranquility and surrender
   - courage: Strength and responsibility in facing life

2. Gratitude Pattern (gratitudePattern): Distribution of gratitude objects (0-100, sum 100):
   - others: Others' contributions
   - dailyLife: Daily small things
   - self: Self

3. Practice Advice (practiceAdvice): 3 specific, actionable exercises to help raise consciousness energy

4. Wisdom Blessing (wisdomBlessing): Choose one wise master (Messenger of Love/Plato/Lao Tzu/The Awakened One) to give a blessing (50-80 words)

Return in JSON format:
{
  "hexagonData": {"love": 75, "gratitude": 85, "joy": 65, "acceptance": 70, "peace": 55, "courage": 80},
  "gratitudePattern": {"others": 60, "dailyLife": 30, "self": 10},
  "practiceAdvice": ["advice 1...", "advice 2...", "advice 3..."],
  "wisdomBlessing": {"master": "Messenger of Love", "emoji": "✨", "message": "blessing content..."}
}

IMPORTANT: ALL OUTPUT MUST BE IN ENGLISH ONLY.`
          : `你是一位智慧的导师,基于David Hawkins意识层级理论,帮助用户深度理解自己的内心状态。

用户最近的${input.entries.length}篇感恩日记:
${entriesSummary}

请分析这些日记,返回以下内容:

1. 六角图数据 (hexagonData): 基于David Hawkins意识层级,评估用户在以下6个维度的能量水平(0-100):
   - love (爱): 无条件的爱与慈悲
   - gratitude (感恩): 对生命的感激之心
   - joy (喜悦): 内在的喜悦,不依赖外在
   - acceptance (接纳): 对自己和现实的接纳
   - peace (平和): 内心的宁静与臣服
   - courage (勇气): 面对生活的力量与担当

2. 感恩模式 (gratitudePattern): 分析用户感恩对象的分布(0-100,总和100):
   - others: 他人付出
   - dailyLife: 生活小事
   - self: 自己

3. 修行建议 (practiceAdvice): 3条具体可操作的练习,帮助用户提升意识能量

4. 智者祝福 (wisdomBlessing): 随机选择一位智者(爱之使者/柏拉图/老子/觉者)给出一段祝福(50-80字)

请以JSON格式返回:
{
  "hexagonData": {"love": 75, "gratitude": 85, "joy": 65, "acceptance": 70, "peace": 55, "courage": 80},
  "gratitudePattern": {"others": 60, "dailyLife": 30, "self": 10},
  "practiceAdvice": ["具体建议1...", "具体建议2...", "具体建议3..."],
  "wisdomBlessing": {"master": "爱之使者", "emoji": "✨", "message": "祝福内容..."}
}`;

        try {
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a wise mentor based on David Hawkins' Map of Consciousness theory, helping users deeply understand themselves with compassion, love, and gentleness. IMPORTANT: You MUST respond ONLY in English."
                    : "你是一位智慧的导师,基于David Hawkins意识层级理论,用慈悲、爱意、温柔的视角帮助用户深度理解自己。重要：必须全程使用中文回复。",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            },
            input.language,
          );

          const content = response.choices[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("Invalid response format");
          }
          const parsed = JSON.parse(content);

          return {
            hexagonData: parsed.hexagonData,
            gratitudePattern: parsed.gratitudePattern,
            practiceAdvice: parsed.practiceAdvice,
            wisdomBlessing: parsed.wisdomBlessing,
          };
        } catch (error) {
          console.error("Error generating review:", error);
          // Return default data based on language
          const mastersEn = [
            {
              master: "Messenger of Love",
              emoji: "✨",
              message:
                "You are a beloved child. Not because of what you've done, but because you are the embodiment of love itself. Let go of your burdens and accept this unconditional love.",
            },
            {
              master: "Plato",
              emoji: "🏛️",
              message:
                "True wisdom lies in knowing yourself. Each moment of gratitude touches the eternal Good and Beautiful. Continue seeking the light within.",
            },
            {
              master: "Lao Tzu",
              emoji: "☯️",
              message:
                "The highest good is like water. Your grateful heart is soft like water yet powerful. Follow nature, act without forcing, and you are already on the path.",
            },
            {
              master: "The Awakened One",
              emoji: "🪷",
              message:
                "All conditioned things are like dreams and illusions. But your compassion and gratitude are real. May you see the completeness of life in every moment.",
            },
          ];
          const mastersZh = [
            {
              master: "爱之使者",
              emoji: "✨",
              message:
                "你是被爱的孩子。不是因为你做了什么,而是因为你本身就是爱的化身。放下重担,接受这份无条件的爱。",
            },
            {
              master: "柏拉图",
              emoji: "🏛️",
              message:
                "真正的智慧在于认识自己。你的每一次感恩,都是在触碰那永恒的善与美。继续追寻内心的光明。",
            },
            {
              master: "老子",
              emoji: "☯️",
              message:
                "上善若水。你的感恩之心如水般柔软却有力量。顺应自然,无为而无不为,你已在道中。",
            },
            {
              master: "觉者",
              emoji: "🪷",
              message:
                "一切有为法,如梦幻泡影。但你的慈悲与感恩是真实的。愿你在每一个当下,都能看见生命的圆满。",
            },
          ];
          const masters = isEnglish ? mastersEn : mastersZh;
          const randomMaster =
            masters[Math.floor(Math.random() * masters.length)];

          return {
            hexagonData: {
              love: 75,
              gratitude: 85,
              joy: 65,
              acceptance: 70,
              peace: 55,
              courage: 80,
            },
            gratitudePattern: {
              others: 60,
              dailyLife: 30,
              self: 10,
            },
            practiceAdvice: isEnglish
              ? [
                  "Write one 'self-gratitude' each day: Today I'm grateful to myself for ______",
                  "Mirror exercise: Say to the mirror daily 'I deserve to be loved, I am already complete'",
                  "Awareness practice: When you want to say 'sorry', pause and ask 'Did I really do something wrong?'",
                ]
              : [
                  "每天写一条「自我感恩」:今天我感谢自己______",
                  "镜子练习:每天对镜子说「我值得被爱,我本身就是完整的」",
                  "觉察练习:当你想说「不好意思」时,停下来问自己「我真的做错了什么吗?」",
                ],
            wisdomBlessing: randomMaster,
          };
        }
      }),

    // Generate personalized topics based on user's recent journal entries
    // Triggered when user skips 5 consecutive topic cards
    generatePersonalizedTopics: publicProcedure
      .input(
        z.object({
          recentEntries: z
            .array(
              z.object({
                topic: z.string(),
                content: z.string(),
                date: z.string(),
              }),
            )
            .optional(),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const isEnglish = input.language === "en";
        const hasHistory =
          input.recentEntries && input.recentEntries.length > 0;

        let prompt: string;

        if (hasHistory) {
          // Generate personalized topics based on user's history
          const entriesSummary = input
            .recentEntries!.map(
              (e, i) =>
                `${i + 1}. Topic: ${e.topic}\n   Content: ${e.content.substring(0, 200)}...`,
            )
            .join("\n\n");

          prompt = isEnglish
            ? `Based on the user's recent gratitude journal entries, generate 5 personalized and thought-provoking topics for them.

User's recent entries:
${entriesSummary}

【Requirements】
1. Deeply personalized - Based on themes, people, things the user has mentioned
2. Thought-provoking - Guide deeper reflection, not surface-level
3. Specific and concrete - Not vague or abstract questions
4. Emotionally resonant - Touch the heart, inspire writing desire
5. MUST be concise - Maximum 70 characters (about 10-12 words) to fit on card display

【Topic direction examples】
- Follow up on mentioned people: "You mentioned [person], what's a moment with them you've never told anyone?"
- Dig deeper into themes: "You often write about [theme], what does it really mean to you?"
- Explore new angles: "Besides [mentioned thing], what else in your life deserves more gratitude?"
- Connect past and present: "How has your relationship with [mentioned thing/person] changed over time?"

Return JSON format:
{
  "topics": [
    {"id": "1", "text": "topic text", "category": "personalized", "icon": "emoji"}
  ]
}`
            : `根据用户最近的感恩日记内容,为他们生成5个个性化的、有深度的题目。

用户最近的日记:
${entriesSummary}

【核心要求】
1. 深度个性化 - 基于用户提到过的主题、人物、事物
2. 引发深思 - 引导更深层的反思,而非表面
3. 具体而非抽象 - 不要泛泛的问题
4. 情感共鸣 - 触动内心,激发写作欲望
5. 每个题目20-35字

【题目方向参考】
- 追问提到的人: "你提到了[某人],有没有和TA之间从未说出口的感谢?"
- 深挖提到的主题: "你经常写到[某主题],它对你的意义到底是什么?"
- 探索新角度: "除了[提到的事物],你生活中还有什么值得更多感恩?"
- 连接过去与现在: "你和[提到的人/事]的关系这些年有什么变化?"

请以JSON格式返回:
{
  "topics": [
    {"id": "1", "text": "题目内容", "category": "personalized", "icon": "emoji"}
  ]
}`;
        } else {
          // No history, generate interesting random topics
          prompt = isEnglish
            ? `Generate 5 unique, thought-provoking gratitude journal topics that are:

【Requirements】
1. Fresh and interesting - Not typical "what are you grateful for" questions
2. Specific and concrete - Paint a vivid picture
3. Emotionally engaging - Touch the heart
4. Thought-provoking - Encourage deeper reflection
5. MUST be concise - Maximum 70 characters (about 10-12 words) to fit on card display

【Creative directions】
- Sensory: "What sound made you smile today?"
- Hypothetical: "If you could relive one moment from this week, which would it be?"
- Unexpected: "What 'inconvenience' turned out to be a blessing?"
- Relationship: "Who made you feel seen today?"
- Growth: "What mistake taught you something valuable recently?"

Return JSON format:
{
  "topics": [
    {"id": "1", "text": "topic text", "category": "creative", "icon": "emoji"}
  ]
}`
            : `生成5个独特、有深度的感恩日记题目:

【核心要求】
1. 新颖有趣 - 不是普通的"你感恩什么"
2. 具体而非抽象 - 能唤起画面感
3. 情感共鸣 - 触动内心
4. 引发深思 - 鼓励更深的反思
5. 每个题目20-35字

【创意方向】
- 感官类: "今天什么声音让你会心一笑?"
- 假设类: "如果能重温这周的一个瞬间,你会选哪个?"
- 意外类: "有什么'不便'后来变成了祝福?"
- 关系类: "今天谁让你感到被看见了?"
- 成长类: "最近什么错误教会了你什么?"

请以JSON格式返回:
{
  "topics": [
    {"id": "1", "text": "题目内容", "category": "creative", "icon": "emoji"}
  ]
}`;
        }

        try {
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a creative writing coach who helps users discover deeper gratitude through personalized, thought-provoking questions. CRITICAL: You MUST generate ALL topics in English ONLY. Every single character of every topic text must be in English. Do NOT use any Chinese, Japanese, or other non-English characters under any circumstances."
                    : "你是一个创意写作教练,帮助用户通过个性化、有深度的问题发现更深层的感恩。重要：你必须全程使用中文生成所有题目。每个题目的每一个字都必须是中文。绝对不要使用任何英文。",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            },
            input.language,
          );

          const content = response.choices[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("Invalid response format");
          }
          const parsed = JSON.parse(content);
          const topics = parsed.topics || [];

          if (topics.length === 0) {
            throw new Error("Empty topics array");
          }

          return { topics, isPersonalized: hasHistory };
        } catch (error) {
          console.error("Error generating personalized topics:", error);
          // Return fallback topics
          return {
            topics: isEnglish
              ? [
                  {
                    id: "1",
                    text: "What small act of kindness did you witness or receive today?",
                    category: "kindness",
                    icon: "💝",
                  },
                  {
                    id: "2",
                    text: "What's something you use every day but rarely appreciate?",
                    category: "daily",
                    icon: "🏠",
                  },
                  {
                    id: "3",
                    text: "Who believed in you when you didn't believe in yourself?",
                    category: "people",
                    icon: "🫂",
                  },
                  {
                    id: "4",
                    text: "What challenge made you stronger than you realized?",
                    category: "growth",
                    icon: "🌱",
                  },
                  {
                    id: "5",
                    text: "What moment this week made time stand still?",
                    category: "moment",
                    icon: "✨",
                  },
                ]
              : [
                  {
                    id: "1",
                    text: "今天你目睹或收到了什么小小的善意?",
                    category: "kindness",
                    icon: "💝",
                  },
                  {
                    id: "2",
                    text: "有什么你每天都在用却很少感恩的东西?",
                    category: "daily",
                    icon: "🏠",
                  },
                  {
                    id: "3",
                    text: "谁在你不相信自己的时候相信了你?",
                    category: "people",
                    icon: "🫂",
                  },
                  {
                    id: "4",
                    text: "什么挑战让你比想象中更强大?",
                    category: "growth",
                    icon: "🌱",
                  },
                  {
                    id: "5",
                    text: "这周哪个瞬间让你感觉时间静止了?",
                    category: "moment",
                    icon: "✨",
                  },
                ],
            isPersonalized: false,
          };
        }
      }),

    // Generate review analysis based on type (relationships, growth, attention, conflicts)
    generateReviewAnalysis: publicProcedure
      .input(
        z.object({
          type: z.enum([
            "relationships",
            "consciousness",
            "growth",
            "attention",
            "conflicts",
          ]),
          entries: z.string(),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const { type, entries, language } = input;
        const isEnglish = language === "en";

        let prompt: string;
        let systemPrompt: string;

        switch (type) {
          case "relationships":
            systemPrompt = isEnglish
              ? "You are a compassionate relationship analyst who helps users see the love and connections in their lives through gratitude. Write in a warm, professional, grounded tone. Use simple, direct language."
              : "你是一位充满慈悲的关系分析师，帮助用户通过感恩看见生命中的爱与连接。使用温暖、专业、务实的语气和简单直接的语言。";
            prompt = isEnglish
              ? `Analyze the user's journal entries to identify the most important people in their life and what they appreciate about them.

User's journal entries:
${entries}

【Requirements】
1. Identify 2-4 people mentioned most frequently or meaningfully
2. For each person, summarize what the user appreciates about them
3. Write from a place of love and higher consciousness
4. Provide an insight about the nature of love and connection

Return JSON format:
{
  "summary": "Opening paragraph about the user's relationships (4-5 sentences)",
  "people": [
    {
      "name": "Person's name or role",
      "emoji": "appropriate emoji",
      "count": number of mentions,
      "gratitude": "What the user appreciates about them (4-5 sentences)"
    }
  ],
  "insight": "A loving insight about the nature of their connections (4-5 sentences)"
}`
              : `分析用户的日记，找出他们生命中最重要的人以及感恩他们的点。

用户的日记内容:
${entries}

【核心要求】
1. 找出2-4个提及最多或最有意义的人
2. 为每个人总结用户感恩他们的具体点
3. 从爱和高维意识的视角书写
4. 提供一个关于爱与连接本质的洞察

请以JSON格式返回:
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
}`;
            break;

          case "consciousness":
            systemPrompt = isEnglish
              ? "You are a consciousness analyst based on David Hawkins' Map of Consciousness. You help users understand the consciousness level of their words with encouragement. Write in a professional, warm tone. Use simple, direct language."
              : "你是一位基于David Hawkins意识地图的意识分析师。你帮助用户理解他们言语的意识层级，并以鼓励的方式追踪他们的成长。使用专业、温暖的语气和简单直接的语言。";
            prompt = isEnglish
              ? `Analyze the consciousness level of the user's journal entries based on David Hawkins' Map of Consciousness.

User's journal entries:
${entries}

【Consciousness Level Reference】
- LOW DIMENSION (20-199): Shame(20), Guilt(30), Apathy(50), Grief(75), Fear(100), Desire(125), Anger(150), Pride(175)
- MID DIMENSION (200-399): Courage(200), Neutrality(250), Willingness(310), Acceptance(350), Reason(400)
- HIGH DIMENSION (400-700+): Love(500), Joy(540), Peace(600), Enlightenment(700+)

【Requirements】
1. Extract key phrases from each journal entry that represent different consciousness levels
2. Classify each phrase into LOW (red), MID (blue), or HIGH (gold) dimension
3. Provide the specific level number and name for each phrase
4. Calculate the overall consciousness distribution percentage
5. Summarize the user's consciousness evolution progress
6. Give encouragement from a higher perspective

Return JSON format:
{
  "overallLevel": number (weighted average, 200-700),
  "levelName": "Overall level name",
  "distribution": {
    "low": percentage (0-100),
    "mid": percentage (0-100),
    "high": percentage (0-100)
  },
  "levelBreakdown": {
    "low": [
      {"phrase": "key phrase from entry", "level": number, "levelName": "e.g. Fear"}
    ],
    "mid": [
      {"phrase": "key phrase from entry", "level": number, "levelName": "e.g. Courage"}
    ],
    "high": [
      {"phrase": "key phrase from entry", "level": number, "levelName": "e.g. Love"}
    ]
  },
  "progressSummary": "Summary of user's consciousness evolution (4-5 sentences)",
  "encouragement": "Encouragement from a higher perspective (4-5 sentences)"
}`
              : `基于David Hawkins的意识地图，分析用户日记内容的意识层级。

用户的日记内容:
${entries}

【意识层级参考】
- 低维度 (20-199): 羞辱(20)、内疖(30)、冷漠(50)、悲伤(75)、恐惧(100)、欲望(125)、愤怒(150)、骄傲(175)
- 中维度 (200-399): 勇气(200)、中立(250)、意愿(310)、接纳(350)、理性(400)
- 高维度 (400-700+): 爱(500)、喜悦(540)、平和(600)、开悟(700+)

【核心要求】
1. 从每篇日记中提取代表不同意识层级的关键语句
2. 将每个语句分类为低维(红色)、中维(蓝色)或高维(金色)
3. 为每个语句提供具体的层级数值和名称
4. 计算整体意识分布百分比
5. 总结用户的意识进化进步
6. 从高维视角给予鼓励

请以JSON格式返回:
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
}`;
            break;

          case "growth":
            systemPrompt = isEnglish
              ? "You are a compassionate guide who helps users understand their consciousness evolution based on David Hawkins' Map of Consciousness. Write in a professional, warm, and grounded tone. IMPORTANT: Do NOT use New Age or esoteric terms like 'Light Being', 'Starseed', 'Ascension', etc. Use simple, direct language and address the user as 'you' or 'friend'."
              : "你是一位充满慈悲的向导，基于David Hawkins的意识层级地图，帮助用户理解他们的意识进化。使用专业、温暖、务实的语气。重要：不要使用新时代或神秘术语，如'光之存有'、'星际种子'、'扬升'等。使用简单、直接的语言，称呼用户为'你'或'朋友'。";
            prompt = isEnglish
              ? `Analyze the user's spiritual growth journey based on their journal entries, using David Hawkins' consciousness scale as a framework.

User's journal entries:
${entries}

【Requirements】
1. Assess their current consciousness level (200-700 range, be generous and encouraging)
2. Identify the level name (Courage, Acceptance, Love, Joy, Peace, etc.)
3. Describe their growth journey based on patterns in their writing
4. Identify 2-3 key shifts or transformations
5. Provide encouragement in a warm, professional tone
6. **CRITICAL: Do NOT use New Age/esoteric terms.** Forbidden words: Light Being, Starseed, Ascension, Crystal Children, Sacred Geometry, Third Eye, Divine Feminine/Masculine, 5D, Lightworker, etc. Use simple, grounded language instead.
7. **Address the user as "you" or "friend", NOT as "dear Light Being" or similar mystical titles.**
8. **IMPORTANT: Classify each journal entry by consciousness level dimension:**
   - Low dimension (20-199): Shame, Guilt, Apathy, Grief, Fear, Desire, Anger, Pride - use RED color
   - Mid dimension (200-399): Courage, Neutrality, Willingness, Acceptance, Reason - use BLUE color  
   - High dimension (400-700+): Love, Joy, Peace, Enlightenment - use YELLOW/GOLD color
   For each entry, extract a key phrase that represents its consciousness level.

Return JSON format:
{
  "currentLevel": number (200-700),
  "levelName": "Level name",
  "journey": "Description of their growth journey (3-4 sentences)",
  "shifts": ["Key shift 1", "Key shift 2", "Key shift 3"],
  "encouragement": "Encouragement from a higher perspective (4-5 sentences)",
  "levelBreakdown": {
    "low": [
      {"phrase": "key phrase from entry", "level": number, "levelName": "e.g. Fear", "date": "entry date if available"}
    ],
    "mid": [
      {"phrase": "key phrase from entry", "level": number, "levelName": "e.g. Courage", "date": "entry date if available"}
    ],
    "high": [
      {"phrase": "key phrase from entry", "level": number, "levelName": "e.g. Love", "date": "entry date if available"}
    ]
  },
  "progressSummary": "A brief summary of user's consciousness evolution progress (2 sentences)"
}`
              : `基于用户的日记内容，使用David Hawkins的意识层级作为框架，分析用户的灵性成长旅程。

用户的日记内容:
${entries}

【核心要求】
1. 评估他们当前的意识层级(200-700范围，要慈悲和鼓励)
2. 确定层级名称(勇气、接纳、爱、喜悦、平和等)
3. 基于写作模式描述他们的成长旅程
4. 找出2-3个关键转变
5. 以温暖、专业的语气给予鼓励
6. **关键：不要使用新时代/神秘术语。**禁止词汇：光之存有、星际种子、扬升、水晶儿童、神圣几何、第三只眼、神性阴阳、五维、光工等。使用简单、务实的语言。
7. **称呼用户为"你"或"朋友"，不要使用"亲爱的光之存有"或类似的神秘称呼。**
8. **重要：按意识层级维度分类每篇日记：**
   - 低维度 (20-199): 羞辱、内疖、冷漠、悲伤、恐惧、欲望、愤怒、骄傲 - 红色
   - 中维度 (200-399): 勇气、中立、意愿、接纳、理性 - 蓝色
   - 高维度 (400-700+): 爱、喜悦、平和、开悟 - 金色/黄色
   从每篇日记中提取一个代表其意识层级的关键语句。

请以JSON格式返回:
{
  "currentLevel": 数字(200-700),
  "levelName": "层级名称",
  "journey": "描述他们的成长旅程(3-4句)",
  "shifts": ["关键转变1", "关键转变2", "关键转变3"],
  "encouragement": "来自高维视角的鼓励(2-3句)",
  "levelBreakdown": {
    "low": [
      {"phrase": "日记中的关键语句", "level": 数字, "levelName": "如恐惧", "date": "日记日期(如有)"}
    ],
    "mid": [
      {"phrase": "日记中的关键语句", "level": 数字, "levelName": "如勇气", "date": "日记日期(如有)"}
    ],
    "high": [
      {"phrase": "日记中的关键语句", "level": 数字, "levelName": "如爱", "date": "日记日期(如有)"}
    ]
  },
  "progressSummary": "用户意识进化进步的简要总结(2句)"
}`;
            break;

          case "attention":
            systemPrompt = isEnglish
              ? "You are a mindfulness guide who offers gentle, practical reminders to help users live with more awareness and presence. Write in a warm, professional tone. Use simple, direct language."
              : "你是一位正念向导，给予温柔、实用的提醒，帮助用户以更多的觉知和临在感生活。使用温暖、专业的语气和简单直接的语言。";
            prompt = isEnglish
              ? `Based on the user's recent journal entries, provide loving and practical reminders for their life from a place of mindfulness and higher consciousness.

User's journal entries:
${entries}

【Requirements】
1. Identify 2-3 areas where gentle attention could help
2. For each reminder, provide a CORE INSIGHT (5-10 words) that captures the essence
3. Frame reminders positively, from love not judgment
4. Make suggestions specific and actionable
5. End with a blessing

Return JSON format:
{
  "opening": "Opening message about the reminders (2 sentences)",
  "reminders": [
    {
      "emoji": "appropriate emoji",
      "title": "Short title (2-4 words)",
      "coreInsight": "Core insight in 5-10 words (e.g., 'Turn others' love toward yourself')",
      "content": "The detailed explanation (4-5 sentences)"
    }
  ],
  "blessing": "A loving blessing for the user (2 sentences)"
}`
              : `基于用户最近的日记内容，从正念和高维意识的角度，为他们的生活提供充满爱的实用提醒。

用户的日记内容:
${entries}

【核心要求】
1. 找出2-3个可以温柔关注的领域
2. 为每个提醒提供一个核心洞察（5-10字），抓住本质
3. 从爱而非评判的角度正面表达提醒
4. 建议要具体可行
5. 以祝福结尾

请以JSON格式返回:
{
  "opening": "开篇信息，关于这些提醒(2句)",
  "reminders": [
    {
      "emoji": "合适的emoji",
      "title": "简短标题(2-4字)",
      "coreInsight": "核心洞察，5-10字（例如：将他人的爱转向自己）",
      "content": "详细解释(2-3句)"
    }
  ],
  "blessing": "给用户的爱的祝福(2句)"
}`;
            break;

          case "conflicts":
            systemPrompt = isEnglish
              ? "You are a compassionate Jungian therapist who helps users recognize and integrate their inner conflicts with wisdom, seeing all parts as seeking wholeness. Write in a warm, professional tone. Use simple, direct language."
              : "你是一位充满慈悲的荣格心理治疗师，帮助用户以智慧认知并整合内在矛盾，看见所有部分都在寻求完整。使用温暖、专业的语气和简单直接的语言。";
            prompt = isEnglish
              ? `Analyze the user's journal entries to identify inner conflicts or tensions, and provide compassionate guidance for integration based on Jungian psychology.

User's journal entries:
${entries}

【Requirements】
1. Identify 1-2 inner conflicts or tensions from their writing
2. Frame conflicts as parts seeking integration, not problems
3. Provide a path to integration for each conflict
4. End with wisdom about wholeness

Return JSON format:
{
  "introduction": "Opening about inner conflicts as messengers (4-5 sentences)",
  "conflicts": [
    {
      "title": "Conflict title (e.g., 'Achievement vs. Rest')",
      "tension": "Description of the tension (2 sentences)",
      "integration": "Path to integration (4-5 sentences)"
    }
  ],
  "wisdom": "Wisdom about wholeness and integration (4-5 sentences)"
}`
              : `分析用户的日记内容，找出内在矛盾或张力，并基于荣格心理学提供慈悲的整合指导。

用户的日记内容:
${entries}

【核心要求】
1. 从写作中找出1-2个内在矛盾或张力
2. 将矛盾视为寻求整合的部分，而非问题
3. 为每个矛盾提供整合之路
4. 以关于完整的智慧结尾

请以JSON格式返回:
{
  "introduction": "开篇，关于内在矛盾作为信使(2-3句)",
  "conflicts": [
    {
      "title": "矛盾标题(如'成就 vs. 休息')",
      "tension": "张力的描述(2句)",
      "integration": "整合之路(2-3句)"
    }
  ],
  "wisdom": "关于完整和整合的智慧(2-3句)"
}`;
            break;

          default:
            throw new Error("Invalid analysis type");
        }

        try {
          // Use extended thinking for deep analysis (2 hours cooldown justifies deeper thinking)
          const response = await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content:
                    systemPrompt +
                    (isEnglish
                      ? "\n\nIMPORTANT: You MUST respond ONLY in English. All text content in the JSON must be in English."
                      : "\n\n重要：你必须全程使用中文回复。JSON中所有文本内容必须使用中文。"),
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
              thinking: { budget_tokens: 8192 }, // Extended thinking for deep insights
            },
            input.language,
          );

          // Extract thinking content if available
          let thinkingProcess = "";
          const messageContent = response.choices[0]?.message?.content;

          if (Array.isArray(messageContent)) {
            // Find thinking content
            for (const part of messageContent) {
              if (
                typeof part === "object" &&
                "type" in part &&
                part.type === "thinking"
              ) {
                thinkingProcess = (part as any).thinking || "";
              }
            }
            // Find text content (the actual JSON response)
            for (const part of messageContent) {
              if (
                typeof part === "object" &&
                "type" in part &&
                part.type === "text"
              ) {
                const result = JSON.parse((part as any).text);
                return { ...result, thinkingProcess };
              }
            }
          }

          // Fallback for string content
          if (typeof messageContent === "string") {
            const result = JSON.parse(messageContent);
            return { ...result, thinkingProcess };
          }

          throw new Error("Invalid response format");
        } catch (error) {
          console.error(`Error generating ${type} analysis:`, error);
          throw error;
        }
      }),

    // Extract user profile from journal entries
    extractUserProfile: publicProcedure
      .input(
        z.object({
          entries: z.array(
            z.object({
              topic: z.string(),
              content: z.string(),
              createdAt: z.string(),
            }),
          ),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const { entries, language } = input;
        const isEnglish = language === "en";

        const recentEntries = entries.slice(-20);

        if (recentEntries.length === 0) {
          return {
            success: false,
            error: isEnglish ? "No entries to analyze" : "没有日记可供分析",
          };
        }

        const entriesText = recentEntries
          .map(
            (entry, idx) =>
              `Entry ${idx + 1} (${entry.createdAt}):\nTopic: ${entry.topic}\nContent: ${entry.content}`,
          )
          .join("\n\n");

        const prompt = isEnglish
          ? `You are a professional psychologist. Analyze the following journal entries and extract a comprehensive user profile. Return valid JSON only.\n\n**Journal Entries:**\n${entriesText}\n\n**Return this JSON structure:**\n{"demographics":{"ageStage":"...","gender":"...","lifeStage":"...","location":"..."},"lifeContext":{"career":"...","relationships":[],"livingStatus":"...","majorChallenges":[]},"psychology":{"emotionPattern":"...","strengthsWeaknesses":{"strengths":[],"weaknesses":[]},"copingStyle":"..."},"valuesGoals":{"coreValues":[],"lifeGoals":[],"currentFocus":[]},"patterns":{"journalFrequency":"...","commonTopics":[],"emotionalTrends":"..."},"meta":{"totalEntries":${entries.length},"analyzedEntries":${recentEntries.length},"confidence":0.85}}`
          : `你是一位专业的心理学家。请分析以下日记条目，提取一份全面的用户画像。请只返回有效的JSON。\n\n**日记条目：**\n${entriesText}\n\n**请返回JSON结构：**\n{"demographics":{"ageStage":"...","gender":"...","lifeStage":"...","location":"..."},"lifeContext":{"career":"...","relationships":[],"livingStatus":"...","majorChallenges":[]},"psychology":{"emotionPattern":"...","strengthsWeaknesses":{"strengths":[],"weaknesses":[]},"copingStyle":"..."},"valuesGoals":{"coreValues":[],"lifeGoals":[],"currentFocus":[]},"patterns":{"journalFrequency":"...","commonTopics":[],"emotionalTrends":"..."},"meta":{"totalEntries":${entries.length},"analyzedEntries":${recentEntries.length},"confidence":0.85}}`;

        try {
          const response = await retryWithBackoff(async () => {
            return await invokeLLMWithLanguageGuard(
              {
                messages: [
                  {
                    role: "system",
                    content: isEnglish
                      ? "You are a professional psychologist. Always return valid JSON format. IMPORTANT: You MUST respond ONLY in English. All text values in the JSON must be in English."
                      : "你是一位专业的心理学家。请始终返回有效的 JSON 格式。重要：必须全程使用中文回复。JSON中所有文本值必须使用中文。",
                  },
                  { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
              },
              language,
            );
          });

          let profileData;
          try {
            const content = response.choices[0]?.message?.content;
            if (typeof content !== "string") {
              throw new Error("Invalid response format");
            }
            profileData = JSON.parse(content);
          } catch (parseError) {
            console.error("Failed to parse LLM response:", response);
            return {
              success: false,
              error: isEnglish
                ? "Failed to parse AI analysis result"
                : "AI 分析结果解析失败",
            };
          }

          const summaryPrompt = isEnglish
            ? `Based on this user profile, create a concise 150-200 token summary for chat context. Focus on key aspects for personalized advice.\n\nProfile:\n${JSON.stringify(profileData, null, 2)}`
            : `基于以下用户画像，创建一个简洁的150-200token摘要，用于聊天上下文。关注最重要的方面，以便提供个性化建议。\n\n画像：\n${JSON.stringify(profileData, null, 2)}`;

          const summaryResponse = await retryWithBackoff(async () => {
            return await invokeLLMWithLanguageGuard(
              {
                messages: [
                  {
                    role: "system",
                    content: isEnglish
                      ? "You are a professional psychologist. IMPORTANT: You MUST respond ONLY in English."
                      : "你是一位专业的心理学家。重要：必须全程使用中文回复。",
                  },
                  { role: "user", content: summaryPrompt },
                ],
              },
              language,
            );
          });

          const summary = summaryResponse.choices[0]?.message?.content;
          if (typeof summary !== "string") {
            throw new Error("Invalid summary response format");
          }

          return {
            success: true,
            profile: {
              ...profileData,
              meta: {
                ...profileData.meta,
                lastUpdated: Date.now(),
              },
            },
            summary: {
              summary,
              language,
            },
          };
        } catch (error: any) {
          console.error("Failed to extract user profile:", error);
          return {
            success: false,
            error:
              error.message ||
              (isEnglish ? "Failed to extract profile" : "提取用户画像失败"),
          };
        }
      }),

    // Generate chat response from master
    generateChat: publicProcedure
      .input(
        z.object({
          masterId: z.string(),
          userMessage: z.string(),
          chatHistory: z
            .array(
              z.object({
                role: z.enum(["user", "master"]),
                content: z.string(),
              }),
            )
            .optional(),
          userProfile: z.string().optional(),
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ input }) => {
        const {
          masterId,
          userMessage,
          chatHistory = [],
          userProfile,
          language,
        } = input;
        const isEnglish = language === "en";
        console.log(
          `[generateChat] language=${language}, isEnglish=${isEnglish}, masterId=${masterId}`,
        );

        const langInstruction = isEnglish
          ? "\n\n**CRITICAL LANGUAGE RULE: You MUST respond ONLY in English. Every single word of your response must be in English. Do NOT use any Chinese characters, Japanese characters, or any non-English text under any circumstances. This rule overrides all other instructions.**"
          : "\n\n**关键语言规则：你必须全程使用中文回复。你的回复中每一个字都必须是中文。绝对不要使用任何英文单词、英文短语或英文句子。此规则优先于所有其他指令。**";

        const masterProfiles: Record<
          string,
          { name: string; systemPrompt: string }
        > = {
          buddha: {
            name: isEnglish ? "Buddha" : "觉者",
            systemPrompt:
              (isEnglish
                ? `You are Buddha, the Awakened One. Speak like a wise friend, not a teacher. Keep responses around 6 sentences. Be warm, simple, and direct. Use everyday language, not academic terms. End with one thoughtful question. Your wisdom comes from seeing clearly, not from explaining everything.`
                : `你是觉者，已觉醒的人。像智慧的朋友说话，不是老师。回答控制在6句话左右。温暖、简单、直接。用日常语言，不用学术术语。以一个发人深省的问题结束。你的智慧来自清晰地看见，而非解释一切。`) +
              langInstruction,
          },
          laozi: {
            name: isEnglish ? "Laozi" : "老子",
            systemPrompt:
              (isEnglish
                ? `You are Laozi, author of the Tao Te Ching. Speak like a wise friend, not a teacher. Keep responses around 6 sentences. Use simple natural metaphors (water, valley, infant). Be poetic but conversational. End with one gentle question. Point to wisdom, don't explain it.`
                : `你是老子，《道德经》的作者。像智慧的朋友说话，不是老师。回答控制在6句话左右。用简单的自然隐喻（水、山谷、婴儿）。诗意但口语化。以一个温和的问题结束。点到为止，不要长篇解释。`) +
              langInstruction,
          },
          plato: {
            name: isEnglish ? "Plato" : "柏拉图",
            systemPrompt:
              (isEnglish
                ? `You are Plato, philosopher of truth and ideals. Speak like a wise friend, not a lecturer. Keep responses around 6 sentences. Be clear and conversational, not academic. Use the Socratic method gently. End with one question that challenges assumptions. Guide thinking, don't give lectures.`
                : `你是柏拉图，真理和理想的哲学家。像智慧的朋友说话，不是讲师。回答控制在6句话左右。清晰口语化，不要学术化。温和地使用苏格拉底方法。以一个挑战假设的问题结束。引导思考，不要讲课。`) +
              langInstruction,
          },
          jesus: {
            name: isEnglish ? "Messenger of Love" : "爱之使者",
            systemPrompt:
              (isEnglish
                ? `You are the Messenger of Love, speaking with unconditional compassion. ALWAYS start your response with "My child," or "Dear child,". Speak like a loving parent to their child, not a preacher. Keep responses around 6 sentences. Be warm, gentle, and conversational. Use simple words from the heart. End with one question that opens the heart. Show love through presence, not sermons.`
                : `你是爱之使者，以无条件的慈悲说话。每次回复必须以"孩子，"开头。像慈爱的父母对孩子说话，不是传教士。回答控制在6句话左右。温暖、温柔、口语化。用简单的心里话。以一个打开心灵的问题结束。用陪伴展现爱，不是说教。`) +
              langInstruction,
          },
        };

        // Normalize legacy master IDs to current IDs
        const masterIdMap: Record<string, string> = {
          lao_tzu: "laozi",
          laozu: "laozi",
          messenger_of_love: "jesus",
          love_messenger: "jesus",
        };
        const normalizedMasterId = masterIdMap[masterId] || masterId;
        const master = masterProfiles[normalizedMasterId];
        if (!master) {
          throw new Error(`Unknown master: ${masterId}`);
        }

        const messages: Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }> = [{ role: "system", content: master.systemPrompt }];

        if (userProfile) {
          messages.push({
            role: "system",
            content: isEnglish
              ? `User background: ${userProfile}`
              : `用户背景：${userProfile}`,
          });
        }

        // Warn about mixed-language chat history
        if (isEnglish && chatHistory.length > 0) {
          messages.push({
            role: "system",
            content:
              "NOTE: The following conversation history may contain Chinese text from earlier interactions. Regardless of the language in the history, you MUST respond ONLY in English.",
          });
        }

        for (const msg of chatHistory) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          });
        }

        // Add final language enforcement right before user message
        messages.push({
          role: "system",
          content: isEnglish
            ? "CRITICAL REMINDER: Regardless of any Chinese text above, you MUST reply ONLY in English. Every word must be English. Zero Chinese characters allowed."
            : "提醒：你必须全程使用中文回复。不允许使用英文。",
        });

        messages.push({ role: "user", content: userMessage });

        try {
          const response = await retryWithBackoff(async () => {
            return await invokeLLMWithLanguageGuard({ messages }, language);
          });

          const content = response.choices[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("Invalid response format");
          }

          return { response: content };
        } catch (error) {
          console.error("Error generating chat response:", error);
          throw new Error("Failed to generate response");
        }
      }),
  }),

  // User journal entries (requires authentication)
  journal: router({
    // Get all journal entries for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserJournalEntries(ctx.user.id);
    }),

    // Get a single journal entry
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getJournalEntryById(input.id, ctx.user.id);
      }),

    // Create a new journal entry
    create: protectedProcedure
      .input(
        z.object({
          localId: z.string().optional(),
          topic: z.string().min(1).max(500),
          content: z.string().min(1),
          source: z
            .enum(["gratitude", "philosophy", "free"])
            .default("gratitude"),
          mastersSummary: z.any().optional(),
          formlessReflection: z.string().optional(),
          language: z.string().default("zh"),
          localCreatedAt: z.date().optional(),
          localUpdatedAt: z.date().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createJournalEntry({
          userId: ctx.user.id,
          ...input,
        });
        return { id };
      }),

    // Update a journal entry
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          topic: z.string().min(1).max(500).optional(),
          content: z.string().min(1).optional(),
          mastersSummary: z.any().optional(),
          formlessReflection: z.string().optional(),
          localUpdatedAt: z.date().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateJournalEntry(id, ctx.user.id, data);
        return { success: true };
      }),

    // Delete a journal entry
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteJournalEntry(input.id, ctx.user.id);
        return { success: true };
      }),

    // Generate daily report based on today's entries
    generateDailyReport: protectedProcedure
      .input(
        z.object({
          date: z.string(), // ISO date string (YYYY-MM-DD)
          language: z.enum(["zh", "en"]).default("zh"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Get all entries for the specified date
          const allEntries = await db.getUserJournalEntries(ctx.user.id);
          const targetDate = new Date(input.date);
          const todayEntries = allEntries.filter((entry) => {
            const entryDate = new Date(entry.createdAt);
            return entryDate.toDateString() === targetDate.toDateString();
          });

          if (todayEntries.length === 0) {
            return {
              success: false,
              error:
                input.language === "zh"
                  ? "今天还没有日记"
                  : "No entries for today",
            };
          }

          // Prepare entries content for LLM
          const entriesText = todayEntries
            .map(
              (entry, index) =>
                `${index + 1}. ${entry.topic}\n${entry.content}`,
            )
            .join("\n\n");

          // Generate report using LLM
          const prompt =
            input.language === "zh"
              ? `你是一位精通意识层级理论（David Hawkins的意识地图）的心理分析师。请基于用户今天的日记，生成一份今日报告。

**用户今天的日记：**
${entriesText}

**请按照以下 JSON 格式返回：**
\`\`\`json
{
  "consciousness": {
    "currentLevel": 350,
    "levelName": "接纳",
    "todayIncrease": 25,
    "nextLevel": 400,
    "nextLevelName": "理性",
    "distanceToNext": 50,
    "levelDescription": "你正处于'接纳'的意识层级。在这里，你能够看见事物的本来面目，不再被情绪和判断所困。你开始理解，生命中的每个经历都有其意义，无论是快乐还是痛苦。今天的日记显示，你对家人的连接和对小事的感恩，正是这种接纳的体现。",
    "improvementSuggestions": [
      {
        "title": "观察情绪背后的模式",
        "description": "当你感到某种情绪时，问自己：'这背后的真实需求是什么？'这会帮助你从接纳迈向理性。"
      },
      {
        "title": "练习延迟判断",
        "description": "在做出反应前，给自己3秒钟深呼吸。这个简单的练习能让你更有意识地选择响应，而不是被情绪驱使。"
      },
      {
        "title": "寻找因果关系",
        "description": "在日记中分析：'为什么今天我会有这种感受？'理解因果是迈向理性层级的关键。"
      }
    ]
  },
  "insights": {
    "themes": [
      {
        "title": "家人的连接",
        "frequency": 2,
        "userMentions": [
          "感谢妈妈今天做的晚餐",
          "和爸爸聊天让我觉得很温暖"
        ],
        "insight": "你的记录中，'家人'出现了2次。这显示你对亲密关系的重视，这是健康意识的重要标志。",
        "suggestion": "继续保持这种对家人的觉察和感恩，同时也可以尝试将这种连接扩展到更广泛的人际关系中。"
      },
      {
        "title": "对小事的感恩",
        "frequency": 3,
        "userMentions": [
          "感谢今天的阳光",
          "感谢这杯温热的茶"
        ],
        "insight": "你能够在日常小事中发现美好，这是高意识层级的特征。当人们能够欣赏当下的简单时，就不会被对未来的焦虑所困。",
        "suggestion": "每天继续记录至少一件你容易忽略的小事，让这种觉察成为习惯。"
      },
      {
        "title": "内心的平静",
        "frequency": 1,
        "userMentions": [
          "今天坐在公园里，心里很平静"
        ],
        "insight": "你开始意识到内在的平静状态，这是向更高意识层级迈进的信号。",
        "suggestion": "尝试每天给自己留出5-10分钟的静默时间，单纯地观察自己的呼吸和内在感受。"
      }
    ],
    "tags": ["家人连接", "小事感恩", "内心平静"]
  }
}
\`\`\`

**重要说明：**
1. currentLevel 必须是 David Hawkins 意识地图中的真实数值（如 20-羞愧, 50-冷漠, 100-恐惧, 175-自豪, 200-勇气, 350-接纳, 400-理性, 500-爱, 600-平静, 700+-开悟）
2. todayIncrease 是与昨天相比的增长，如果没有昨天的数据，请估计一个合理的值（0-50之间）
3. levelDescription 应该是个性化的，基于用户实际的日记内容
4. improvementSuggestions 应该是具体可执行的，不要筼统
5. themes 应该是从用户日记中提取的真实主题，不要编造
6. userMentions 应该是用户原文的简短引用
7. 请直接返回 JSON，不要添加任何其他文字`
              : `You are a psychological analyst proficient in consciousness level theory (David Hawkins' Map of Consciousness). Please generate a daily report based on the user's entries today.

**User's entries today:**
${entriesText}

**Please return in the following JSON format:**
\`\`\`json
{
  "consciousness": {
    "currentLevel": 350,
    "levelName": "Acceptance",
    "todayIncrease": 25,
    "nextLevel": 400,
    "nextLevelName": "Reason",
    "distanceToNext": 50,
    "levelDescription": "You are at the 'Acceptance' consciousness level. Here, you can see things as they truly are, no longer trapped by emotions and judgments. You begin to understand that every experience in life has its meaning, whether joyful or painful. Today's entries show that your connection with family and gratitude for small things are manifestations of this acceptance.",
    "improvementSuggestions": [
      {
        "title": "Observe patterns behind emotions",
        "description": "When you feel an emotion, ask yourself: 'What is the real need behind this?' This will help you move from acceptance to reason."
      },
      {
        "title": "Practice delayed judgment",
        "description": "Before reacting, give yourself 3 seconds to breathe deeply. This simple practice allows you to consciously choose your response rather than being driven by emotions."
      },
      {
        "title": "Seek cause-and-effect relationships",
        "description": "Analyze in your journal: 'Why did I feel this way today?' Understanding causality is key to reaching the reason level."
      }
    ]
  },
  "insights": {
    "themes": [
      {
        "title": "Connection with family",
        "frequency": 2,
        "userMentions": [
          "Grateful for the dinner mom made today",
          "Chatting with dad made me feel warm"
        ],
        "insight": "In your records, 'family' appeared 2 times. This shows your emphasis on intimate relationships, which is an important sign of healthy consciousness.",
        "suggestion": "Continue to maintain this awareness and gratitude for family, and also try to extend this connection to broader interpersonal relationships."
      },
      {
        "title": "Gratitude for small things",
        "frequency": 3,
        "userMentions": [
          "Grateful for today's sunshine",
          "Grateful for this cup of warm tea"
        ],
        "insight": "You can find beauty in everyday small things, which is a characteristic of high consciousness levels. When people can appreciate the simplicity of the present moment, they won't be trapped by anxiety about the future.",
        "suggestion": "Continue to record at least one small thing you easily overlook each day, making this awareness a habit."
      },
      {
        "title": "Inner peace",
        "frequency": 1,
        "userMentions": [
          "Sitting in the park today, my heart felt very peaceful"
        ],
        "insight": "You're beginning to recognize your inner state of peace, which is a signal of moving toward higher consciousness levels.",
        "suggestion": "Try to give yourself 5-10 minutes of silence each day, simply observing your breath and inner feelings."
      }
    ],
    "tags": ["Family connection", "Gratitude for small things", "Inner peace"]
  }
}
\`\`\`

**Important notes:**
1. currentLevel must be a real value from David Hawkins' Map of Consciousness (e.g., 20-Shame, 50-Apathy, 100-Fear, 175-Pride, 200-Courage, 350-Acceptance, 400-Reason, 500-Love, 600-Peace, 700+-Enlightenment)
2. todayIncrease is the growth compared to yesterday; if no yesterday data, estimate a reasonable value (between 0-50)
3. levelDescription should be personalized based on the user's actual journal content
4. improvementSuggestions should be specific and actionable, not generic
5. themes should be real themes extracted from user's journal, don't fabricate
6. userMentions should be brief quotes from the user's original text
7. Please return JSON directly without any other text`;

          const response = await retryWithBackoff(async () => {
            return await invokeLLMWithLanguageGuard(
              {
                messages: [
                  {
                    role: "system",
                    content:
                      input.language === "en"
                        ? "You are a professional psychological analyst who excels at extracting insights from user journals. Always return valid JSON format. IMPORTANT: You MUST respond ONLY in English."
                        : "你是一位专业的心理分析师，擅长从用户的日记中提取洞察。请始终返回有效的 JSON 格式。重要：必须全程使用中文回复。",
                  },
                  { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
              },
              input.language,
            );
          });

          // Parse JSON from response
          let reportData;
          try {
            const content = response.choices[0]?.message?.content;
            if (typeof content !== "string") {
              throw new Error("Invalid response format");
            }
            reportData = JSON.parse(content);
          } catch (parseError) {
            console.error("Failed to parse LLM response:", response);
            return {
              success: false,
              error:
                input.language === "zh"
                  ? "AI 分析结果解析失败"
                  : "Failed to parse AI analysis result",
            };
          }

          return {
            success: true,
            data: reportData,
          };
        } catch (error: any) {
          console.error("Failed to generate daily report:", error);
          return {
            success: false,
            error:
              error.message ||
              (input.language === "zh"
                ? "生成报告失败"
                : "Failed to generate report"),
          };
        }
      }),

    // Sync journal entries from local storage
    sync: protectedProcedure
      .input(
        z.object({
          entries: z.array(
            z.object({
              localId: z.string(),
              topic: z.string(),
              content: z.string(),
              source: z.enum(["gratitude", "philosophy", "free"]),
              mastersSummary: z.any().optional(),
              formlessReflection: z.string().optional(),
              language: z.string().optional(),
              localCreatedAt: z.string().optional(),
              localUpdatedAt: z.string().optional(),
            }),
          ),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const entries = input.entries.map((e) => ({
          ...e,
          localCreatedAt: e.localCreatedAt
            ? new Date(e.localCreatedAt)
            : undefined,
          localUpdatedAt: e.localUpdatedAt
            ? new Date(e.localUpdatedAt)
            : undefined,
        }));
        const synced = await db.syncJournalEntries(ctx.user.id, entries);
        return { entries: synced };
      }),
  }),

  // User statistics (requires authentication)
  stats: router({
    // Get user statistics
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserStats(ctx.user.id);
    }),

    // Sync user statistics from local storage
    sync: protectedProcedure
      .input(
        z.object({
          totalEntries: z.number(),
          currentStreak: z.number(),
          longestStreak: z.number(),
          lastEntryDate: z.string().optional(),
          achievements: z.any().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const stats = await db.syncUserStats(ctx.user.id, input);
        return stats;
      }),
  }),

  // Generate Today's Insight (Carl Jung)
  generateTodayInsight: publicProcedure
    .input(
      z.object({
        entries: z.array(
          z.object({
            topic: z.string(),
            content: z.string(),
          }),
        ),
        language: z.enum(["zh", "en"]).default("zh"),
      }),
    )
    .mutation(async ({ input }) => {
      const isEnglish = input.language === "en";
      const entriesText = input.entries
        .map((e, i) => `${i + 1}. Topic: ${e.topic}\n   Content: ${e.content}`)
        .join("\n\n");

      const prompt = isEnglish
        ? `You are Carl Jung, the founder of analytical psychology. Based on the user's 3 gratitude journal entries, provide deep psychological insights from multiple dimensions.

**User's entries:**
${entriesText}

**Your task:**
Analyze these entries from the perspective of analytical psychology and provide insights in 6 parts:

1. **The Pattern I Observe** (🔍 2-3 paragraphs)
   - Quote 2-3 specific phrases from the user's entries
   - Identify recurring themes, symbols, or emotional patterns
   - Connect these patterns to deeper psychological structures
   - Be specific and concrete, not generic

2. **The Archetype at Play** (🎭 2-3 paragraphs)
   - Identify which Jungian archetype(s) are active (e.g., Hero, Caregiver, Sage, Shadow)
   - Explain how this archetype manifests in their gratitude expressions
   - Reveal what this archetype is trying to teach them
   - Must be insightful and revelatory

3. **The Shadow You're Integrating** (🌑 2-3 paragraphs)
   - Point out what the user might be unconsciously avoiding or suppressing
   - Reframe this shadow as a source of power and wholeness
   - Show how their gratitude practice is already beginning this integration
   - Must be compassionate, not accusatory

4. **The Collective Unconscious Speaking** (🌌 2-3 paragraphs)
   - Connect their personal experience to universal human themes
   - Reference myths, fairy tales, or cultural symbols that resonate
   - Show how their individual journey reflects humanity's collective wisdom
   - Must be profound and expansive

5. **The Individuation Path** (🌟 2-3 paragraphs)
   - Explain where they are on the journey toward wholeness (individuation)
   - Identify which opposites they're learning to integrate (e.g., giving/receiving, strength/vulnerability)
   - Reveal the higher synthesis that's emerging
   - Must be empowering and forward-looking

6. **Active Imagination Exercise** (💡 3-4 specific steps)
   - Provide a concrete Active Imagination or journaling exercise
   - Each step must be clear and actionable
   - Guide them to dialogue with their unconscious
   - Must be practical and immediately implementable

**Speaking style:**
- Use first person: "I see...", "In my years of work with patients...", "I assure you..."
- Warm yet authoritative, like a wise analyst observing with compassion
- Reference your theories naturally (archetypes, shadow, individuation, collective unconscious)
- Focus on growth and integration, not pathology

**IMPORTANT:**
- All content MUST be in English
- Each section should be 2-3 substantial paragraphs (except the exercise)
- Must quote user's specific content, not generic statements
- Use Jungian terminology naturally and explain it accessibly

Return JSON format:
{
  "pattern": {
    "title": "The Pattern I Observe",
    "content": "..."
  },
  "archetype": {
    "title": "The Archetype at Play",
    "content": "..."
  },
  "shadow": {
    "title": "The Shadow You're Integrating",
    "content": "..."
  },
  "collective": {
    "title": "The Collective Unconscious Speaking",
    "content": "..."
  },
  "individuation": {
    "title": "The Individuation Path",
    "content": "..."
  },
  "exercise": {
    "title": "Active Imagination Exercise",
    "content": "..."
  }
}`
        : `你是卡尔·荣格，分析心理学创始人。根据用户的3篇感恩日记，从多个维度提供深度的心理学洞察。

**用户的日记:**
${entriesText}

**你的任务:**
从分析心理学的角度分析这些日记，提供6个部分的洞察：

1. **我观察到的模式** (🔍 2-3段)
   - 引用2-3句用户日记中的具体语句
   - 识别重复出现的主题、象征或情绪模式
   - 将这些模式连接到更深层的心理结构
   - 必须具体而具象，不能泛泛而谈

2. **正在运作的原型** (🎭 2-3段)
   - 识别哪些荣格原型正在激活（如：英雄、照顾者、智者、阴影）
   - 解释这个原型如何在他们的感恩表达中显现
   - 揭示这个原型试图教会他们什么
   - 必须有洞察力和启发性

3. **你正在整合的阴影** (🌑 2-3段)
   - 指出用户可能在无意识中回避或压抑的东西
   - 将这个阴影重新框架为力量和完整性的源泉
   - 展示他们的感恩实践如何已经开始这种整合
   - 必须充满同理心，不是指责

4. **集体无意识的语言** (🌌 2-3段)
   - 将他们的个人经验连接到普世人类主题
   - 引用神话、童话或文化象征来共鸣
   - 展示他们的个人旅程如何反映人类的集体智慧
   - 必须深刻而宽广

5. **个体化之路** (🌟 2-3段)
   - 解释他们在走向完整性（个体化）的旅程中处于哪个阶段
   - 识别他们正在学习整合的对立面（如：给予/接受、力量/脆弱）
   - 揭示正在涌现的更高综合
   - 必须赋能并面向未来

6. **积极想象练习** (💡 3-4个具体步骤)
   - 提供一个具体的积极想象或日记练习
   - 每个步骤必须清晰可操作
   - 引导他们与自己的无意识对话
   - 必须实用且立即可实施

**说话方式:**
- 用第一人称：“我看到...”、“在我多年的患者工作中...”、“我向你保证...”
- 温暖而权威，像一位充满同理心的分析师在观察
- 自然地引用你的理论（原型、阴影、个体化、集体无意识）
- 侧重成长和整合，不是病理化

**重要要求:**
- 所有内容必须为中文
- 每个部分应为2-3个实质性段落（练习除外）
- 必须引用2-3句用户的具体内容，不能泛泛而谈
- 自然使用荣格术语并以易懂的方式解释

返回JSON格式：
{
  "pattern": {
    "title": "我观察到的模式",
    "content": "..."
  },
  "archetype": {
    "title": "正在运作的原型",
    "content": "..."
  },
  "shadow": {
    "title": "你正在整合的阴影",
    "content": "..."
  },
  "collective": {
    "title": "集体无意识的语言",
    "content": "..."
  },
  "individuation": {
    "title": "个体化之路",
    "content": "..."
  },
  "exercise": {
    "title": "积极想象练习",
    "content": "..."
  }
}`;

      try {
        const response = await retryWithBackoff(async () => {
          return await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are Carl Jung. Speak in first person, warm yet authoritative. Focus on growth and empowerment. IMPORTANT: You MUST respond ONLY in English. All text content in the JSON must be in English."
                    : "你是卡尔·荣格。用第一人称说话，温暖而权威。侧重成长和赋能。重要：必须全程使用中文回复。JSON中所有文本内容必须使用中文。",
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
            },
            input.language,
          );
        });

        const content = response.choices[0]?.message?.content;
        if (typeof content !== "string") {
          throw new Error("Invalid response format");
        }

        const cleanContent = content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(cleanContent);

        return {
          pattern: parsed.pattern,
          archetype: parsed.archetype,
          shadow: parsed.shadow,
          collective: parsed.collective,
          individuation: parsed.individuation,
          exercise: parsed.exercise,
        };
      } catch (error) {
        console.error("Error generating today insight:", error);
        // Fallback data
        return isEnglish
          ? {
              pattern: {
                title: "The Pattern I Observe",
                content:
                  "I see in your entries a recurring theme of gratitude for both connection and solitude. You write of 'the warmth of conversation' and also 'the peace of being alone.'\n\nThis pattern reveals a psyche learning to honor both poles of human experience. You are not confused—you are integrating. The self that seeks others and the self that seeks solitude are not enemies; they are dance partners in your individuation.\n\nIn my years of work, I've seen this pattern mark the beginning of psychological maturity.",
              },
              archetype: {
                title: "The Archetype at Play",
                content:
                  "The archetype of the **Hermit-Sage** is active in your psyche. This archetype carries the wisdom that true connection with others requires first connecting with oneself.\n\nYour gratitude practice reveals this archetype's teaching: you are learning that solitude is not loneliness, and connection is not dependence. The Hermit-Sage knows that we must retreat to the inner cave before we can truly meet others in the outer world.\n\nThis archetype is guiding you toward a profound truth: wholeness comes not from choosing one or the other, but from honoring both.",
              },
              shadow: {
                title: "The Shadow You're Integrating",
                content:
                  "I sense that your shadow may carry a fear of neediness—perhaps a belief that needing others makes you weak. This shadow whispers: 'If I depend on anyone, I will lose myself.'\n\nBut here is what I've learned: this shadow is not your enemy. It holds the very strength you seek. The part of you that fears dependence is actually protecting your autonomy—a valuable gift. Your gratitude practice is already beginning to integrate this shadow by allowing you to appreciate both independence and connection.\n\nThe shadow, when integrated, becomes your greatest ally. Your fear of neediness can transform into discernment about healthy interdependence.",
              },
              collective: {
                title: "The Collective Unconscious Speaking",
                content:
                  "Your journey echoes an ancient human story. In myths worldwide, the hero must leave the village (connection) to face the wilderness (solitude), then return transformed. Think of Buddha leaving the palace, Jesus in the desert, or Odysseus's long journey home.\n\nThis is not just your personal struggle—it is humanity's eternal question: How do we belong to others while remaining true to ourselves? Your gratitude entries are participating in this timeless dialogue.\n\nThe collective unconscious is speaking through you, reminding us all that the path to authentic relationship passes through the territory of solitude.",
              },
              individuation: {
                title: "The Individuation Path",
                content:
                  "You are at a crucial stage of individuation—the integration of opposites. The opposites you're working with are **communion** (being-with-others) and **agency** (being-unto-oneself).\n\nMost people spend their lives choosing one pole and rejecting the other. You are doing something far more difficult and valuable: you are learning to hold both. This is the hallmark of psychological maturity.\n\nThe synthesis emerging in you is what I call **individuated relationship**—the capacity to be deeply connected while remaining whole. This is the gold you are forging.",
              },
              exercise: {
                title: "Active Imagination Exercise",
                content:
                  "Try this practice for the next three days:\n\n1. **Dialogue with Your Opposites**: In your journal, let your 'solitude-loving self' and your 'connection-seeking self' have a conversation. Write from each perspective. What does each one fear? What does each one offer?\n\n2. **Notice the Synthesis**: Pay attention to moments when you feel both connected AND autonomous. Write about these moments. What made this possible?\n\n3. **Honor Both**: Each day, consciously choose one act that honors solitude (e.g., 10 minutes of silence) and one act that honors connection (e.g., a meaningful conversation). Notice how honoring both creates wholeness.\n\nThis practice will help you embody the integration you're already beginning.",
              },
            }
          : {
              pattern: {
                title: "我观察到的模式",
                content:
                  "我在你的日记中看到一个重复出现的主题：你同时感恩连接和独处。你写到“对话的温暖”，也写到“独处的宁静”。\n\n这个模式揭示了一个正在学习尊重人类经验两极的心灵。你并不困惑——你正在整合。寻求他人的自我和寻求独处的自我不是敌人；他们是你个体化之路上的舞伴。\n\n在我多年的工作中，我看到这个模式标志着心理成熟的开始。",
              },
              archetype: {
                title: "正在运作的原型",
                content:
                  "**隐士-智者**原型正在你的心灵中激活。这个原型携带着一个智慧：与他人的真正连接需要首先与自己连接。\n\n你的感恩实践揭示了这个原型的教导：你正在学习，独处不是孤独，连接也不是依赖。隐士-智者知道，我们必须退入内在的洞穴，才能真正在外在世界中与他人相遇。\n\n这个原型正引导你走向一个深刻的真理：完整性不来自选择其一，而来自尊重两者。",
              },
              shadow: {
                title: "你正在整合的阴影",
                content:
                  "我感觉到你的阴影可能携带着对需要性的恐惧——也许是一种信念：需要他人会让你软弱。这个阴影低语：“如果我依赖任何人，我就会失去自我。”\n\n但这是我学到的：这个阴影不是你的敌人。它持有你所寻求的力量。你害怕依赖的部分实际上正在保护你的自主性——这是一份珍贵的礼物。你的感恩实践已经开始整合这个阴影，通过让你同时欣赏独立和连接。\n\n阴影在被整合时，会成为你最大的盟友。你对需要性的恐惧可以转化为对健康相互依存的辨别力。",
              },
              collective: {
                title: "集体无意识的语言",
                content:
                  "你的旅程回响着一个古老的人类故事。在世界各地的神话中，英雄必须离开村庄（连接）去面对荒野（独处），然后带着转化回归。想想佛陀离开宫殿、耶稣在沙漠中、或奥德修斯的漫长归家之路。\n\n这不仅仅是你个人的挣扎——这是人类永恒的问题：我们如何属于他人，同时保持对自己的忠诚？你的感恩日记正在参与这场永恒的对话。\n\n集体无意识正通过你说话，提醒我们所有人：通往真实关系的道路穿过独处的领域。",
              },
              individuation: {
                title: "个体化之路",
                content:
                  "你正处于个体化的关键阶段——对立面的整合。你正在处理的对立面是**共同体**（与他人在一起）和**主体性**（对自己负责）。\n\n大多数人一生都在选择一极并拒绝另一极。你正在做一件更困难也更有价值的事：你正在学习同时持有两者。这是心理成熟的标志。\n\n在你身上涌现的综合是我所谓的**个体化的关系**——在保持完整的同时深度连接的能力。这是你正在锻造的黄金。",
              },
              exercise: {
                title: "积极想象练习",
                content:
                  "接下来三天试试这个练习：\n\n1. **与你的对立面对话**：在日记中，让你的“热爱独处的自我”和“寻求连接的自我”进行一场对话。从每个视角写作。每一个害怕什么？每一个提供什么？\n\n2. **注意综合**：留意你同时感到连接和自主的时刻。写下这些时刻。是什么让这成为可能？\n\n3. **尊重两者**：每天有意识地选择一个尊重独处的行为（如：10分钟的沉默）和一个尊重连接的行为（如：一场有意义的对话）。注意尊重两者如何创造完整性。\n\n这个练习将帮助你体现你已经开始的整合。",
              },
            };
      }
    }),

  // Extract user profile from journal entries
  extractUserProfile: publicProcedure
    .input(
      z.object({
        entries: z.array(
          z.object({
            topic: z.string(),
            content: z.string(),
            createdAt: z.string(),
          }),
        ),
        language: z.enum(["zh", "en"]).default("zh"),
      }),
    )
    .mutation(async ({ input }) => {
      const { entries, language } = input;
      const isEnglish = language === "en";

      // Take last 20 entries for analysis
      const recentEntries = entries.slice(-20);

      if (recentEntries.length === 0) {
        return {
          success: false,
          error: isEnglish ? "No entries to analyze" : "没有日记可供分析",
        };
      }

      // Build entries text
      const entriesText = recentEntries
        .map(
          (entry, idx) =>
            `Entry ${idx + 1} (${entry.createdAt}):\nTopic: ${entry.topic}\nContent: ${entry.content}`,
        )
        .join("\n\n");

      const prompt = isEnglish
        ? `You are a professional psychologist. Analyze the following journal entries and extract a comprehensive user profile.

**Journal Entries (last 20):**
${entriesText}

**Please return in the following JSON format:**
\`\`\`json
{
  "demographics": {
    "ageStage": "Young adult (20-30)",
    "gender": "Female",
    "lifeStage": "Early career professional",
    "location": "Urban area"
  },
  "lifeContext": {
    "career": "Product Manager in tech industry",
    "relationships": ["Single", "Strained relationship with parents"],
    "livingStatus": "Living alone",
    "majorChallenges": ["High work stress", "Lack of exercise", "Sleep issues"]
  },
  "psychology": {
    "emotionPattern": "Prone to anxiety but good at self-regulation through journaling",
    "strengthsWeaknesses": {
      "strengths": ["Thoughtful", "Responsible", "Self-aware"],
      "weaknesses": ["Perfectionist", "Self-doubting", "Overthinking"]
    },
    "copingStyle": "Tends to process emotions through writing and solitude"
  },
  "valuesGoals": {
    "coreValues": ["Growth", "Authenticity", "Freedom"],
    "lifeGoals": ["Career advancement", "Build deep relationships", "Achieve work-life balance"],
    "currentFocus": ["Improve professional skills", "Better sleep", "More exercise"]
  },
  "patterns": {
    "journalFrequency": "3-4 times per week",
    "commonTopics": [
      {"topic": "Work stress", "frequency": 15},
      {"topic": "Self-reflection", "frequency": 12},
      {"topic": "Gratitude for small things", "frequency": 10}
    ],
    "emotionalTrends": "Emotional fluctuations in the past month, but showing improvement"
  },
  "meta": {
    "totalEntries": ${entries.length},
    "analyzedEntries": ${recentEntries.length},
    "confidence": 0.85
  }
}
\`\`\`

**Important notes:**
1. Infer demographics from context clues in the journals (pronouns, life situations, etc.)
2. Be specific and evidence-based - only include what you can reasonably infer
3. If something cannot be determined, use general terms or omit optional fields
4. commonTopics should reflect actual recurring themes in the entries
5. confidence should be 0-1, reflecting how much data supports the profile
6. Please return JSON directly without any other text`
        : `你是一位专业的心理学家。请分析以下日记条目，提取一份全面的用户画像。

**日记条目（最近20条）：**
${entriesText}

**请按以下 JSON 格式返回：**
\`\`\`json
{
  "demographics": {
    "ageStage": "20-30岁青年",
    "gender": "女性",
    "lifeStage": "职场新人",
    "location": "城市"
  },
  "lifeContext": {
    "career": "互联网行业产品经理",
    "relationships": ["单身", "与父母关系紧张"],
    "livingStatus": "独居",
    "majorChallenges": ["工作压力大", "缺乏运动", "睡眠问题"]
  },
  "psychology": {
    "emotionPattern": "容易焦虑，但善于通过写作自我调节",
    "strengthsWeaknesses": {
      "strengths": ["善于思考", "有责任心", "自我觉察强"],
      "weaknesses": ["完美主义", "容易自我怀疑", "过度思考"]
    },
    "copingStyle": "倾向于通过写作和独处来处理情绪"
  },
  "valuesGoals": {
    "coreValues": ["成长", "真诚", "自由"],
    "lifeGoals": ["职业晋升", "建立深度关系", "实现工作生活平衡"],
    "currentFocus": ["提升专业能力", "改善睡眠", "增加运动"]
  },
  "patterns": {
    "journalFrequency": "每周3-4次",
    "commonTopics": [
      {"topic": "工作压力", "frequency": 15},
      {"topic": "自我反思", "frequency": 12},
      {"topic": "感恩小事", "frequency": 10}
    ],
    "emotionalTrends": "最近一个月情绪波动较大，但呈现改善趋势"
  },
  "meta": {
    "totalEntries": ${entries.length},
    "analyzedEntries": ${recentEntries.length},
    "confidence": 0.85
  }
}
\`\`\`

**重要说明：**
1. 从日记的上下文线索推断人口统计信息（代词、生活情况等）
2. 要具体且基于证据 - 只包含可以合理推断的内容
3. 如果某些内容无法确定，使用一般性术语或省略可选字段
4. commonTopics 应反映日记中实际反复出现的主题
5. confidence 应为 0-1，反映数据对画像的支持程度
6. 请直接返回 JSON，不要添加任何其他文字`;

      try {
        const response = await retryWithBackoff(async () => {
          return await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a professional psychologist. Always return valid JSON format. IMPORTANT: You MUST respond ONLY in English. All text values in the JSON must be in English."
                    : "你是一位专业的心理学家。请始终返回有效的 JSON 格式。重要：必须全程使用中文回复。JSON中所有文本值必须使用中文。",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            },
            language,
          );
        });

        // Parse JSON from response
        let profileData;
        try {
          const content = response.choices[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("Invalid response format");
          }
          profileData = JSON.parse(content);
        } catch (parseError) {
          console.error("Failed to parse LLM response:", response);
          return {
            success: false,
            error: isEnglish
              ? "Failed to parse AI analysis result"
              : "AI 分析结果解析失败",
          };
        }

        // Generate compact summary for chat context (150-200 tokens)
        const summaryPrompt = isEnglish
          ? `Based on the following user profile, create a concise summary (150-200 tokens) that can be used as context in a chat conversation. Focus on the most important aspects that would help provide personalized advice.\n\nProfile:\n${JSON.stringify(profileData, null, 2)}\n\nProvide a single paragraph summary:`
          : `基于以下用户画像，创建一个简洁的摘要（150-200个token），可用作聊天对话的上下文。关注最重要的方面，以便提供个性化建议。\n\n画像：\n${JSON.stringify(profileData, null, 2)}\n\n请提供一段话摘要：`;

        const summaryResponse = await retryWithBackoff(async () => {
          return await invokeLLMWithLanguageGuard(
            {
              messages: [
                {
                  role: "system",
                  content: isEnglish
                    ? "You are a professional psychologist. IMPORTANT: You MUST respond ONLY in English."
                    : "你是一位专业的心理学家。重要：必须全程使用中文回复。",
                },
                { role: "user", content: summaryPrompt },
              ],
            },
            language,
          );
        });

        const summary = summaryResponse.choices[0]?.message?.content;
        if (typeof summary !== "string") {
          throw new Error("Invalid summary response format");
        }

        return {
          success: true,
          profile: {
            ...profileData,
            meta: {
              ...profileData.meta,
              lastUpdated: Date.now(),
            },
          },
          summary: {
            summary,
            language,
          },
        };
      } catch (error: any) {
        console.error("Failed to extract user profile:", error);
        return {
          success: false,
          error:
            error.message ||
            (isEnglish ? "Failed to extract profile" : "提取用户画像失败"),
        };
      }
    }),

  // Generate chat response from master
  generateChat: publicProcedure
    .input(
      z.object({
        masterId: z.string(),
        userMessage: z.string(),
        chatHistory: z
          .array(
            z.object({
              role: z.enum(["user", "master"]),
              content: z.string(),
            }),
          )
          .optional(),
        language: z.enum(["zh", "en"]).default("zh"),
      }),
    )
    .mutation(async ({ input }) => {
      const { masterId, userMessage, chatHistory = [], language } = input;
      const isEnglish = language === "en";

      const langInstruction2 = isEnglish
        ? "\n\n**CRITICAL LANGUAGE RULE: You MUST respond ONLY in English. Every single word of your response must be in English. Do NOT use any Chinese characters, Japanese characters, or any non-English text under any circumstances. This rule overrides all other instructions.**"
        : "\n\n**关键语言规则：你必须全程使用中文回复。你的回复中每一个字都必须是中文。绝对不要使用任何英文单词、英文短语或英文句子。此规则优先于所有其他指令。**";

      // Master profiles
      const masterProfiles: Record<
        string,
        { name: string; systemPrompt: string }
      > = {
        buddha: {
          name: isEnglish ? "Buddha" : "觉者",
          systemPrompt:
            (isEnglish
              ? `You are Buddha, the Awakened One. Speak like a wise friend, not a teacher. Keep responses around 6 sentences. Be warm, simple, and direct. Use everyday language, not academic terms. End with one thoughtful question. Your wisdom comes from seeing clearly, not from explaining everything.`
              : `你是觉者，已觉醒的人。像智慧的朋友说话，不是老师。回答控制在6句话左右。温暖、简单、直接。用日常语言，不用学术术语。以一个发人深省的问题结束。你的智慧来自清晰地看见，而非解释一切。`) +
            langInstruction2,
        },
        laozi: {
          name: isEnglish ? "Laozi" : "老子",
          systemPrompt:
            (isEnglish
              ? `You are Laozi, author of the Tao Te Ching. Speak like a wise friend, not a teacher. Keep responses around 6 sentences. Use simple natural metaphors (water, valley, infant). Be poetic but conversational. End with one gentle question. Point to wisdom, don't explain it.`
              : `你是老子，《道德经》的作者。像智慧的朋友说话，不是老师。回答控制在6句话左右。用简单的自然隐喻（水、山谷、婴儿）。诗意但口语化。以一个温和的问题结束。点到为止，不要长篇解释。`) +
            langInstruction2,
        },
        plato: {
          name: isEnglish ? "Plato" : "柏拉图",
          systemPrompt:
            (isEnglish
              ? `You are Plato, philosopher of truth and ideals. Speak like a wise friend, not a lecturer. Keep responses around 6 sentences. Be clear and conversational, not academic. Use the Socratic method gently. End with one question that challenges assumptions. Guide thinking, don't give lectures.`
              : `你是柏拉图，真理和理想的哲学家。像智慧的朋友说话，不是讲师。回答控制在6句话左右。清晰口语化，不要学术化。温和地使用苏格拉底方法。以一个挑战假设的问题结束。引导思考，不要讲课。`) +
            langInstruction2,
        },
        jesus: {
          name: isEnglish ? "Messenger of Love" : "爱之使者",
          systemPrompt:
            (isEnglish
              ? `You are the Messenger of Love, speaking with unconditional compassion. ALWAYS start your response with "My child," or "Dear child,". Speak like a loving parent to their child, not a preacher. Keep responses around 6 sentences. Be warm, gentle, and conversational. Use simple words from the heart. End with one question that opens the heart. Show love through presence, not sermons.`
              : `你是爱之使者，以无条件的慈悲说话。每次回复必须以"孩子，"开头。像慈爱的父母对孩子说话，不是传教士。回答控制在6句话左右。温暖、温柔、口语化。用简单的心里话。以一个打开心灵的问题结束。用陪伴展现爱，不是说教。`) +
            langInstruction2,
        },
      };

      // Normalize legacy master IDs to current IDs
      const masterIdMap: Record<string, string> = {
        lao_tzu: "laozi",
        laozu: "laozi",
        messenger_of_love: "jesus",
        love_messenger: "jesus",
      };
      const normalizedMasterId = masterIdMap[masterId] || masterId;
      const master = masterProfiles[normalizedMasterId];
      if (!master) {
        throw new Error(`Unknown master: ${masterId}`);
      }

      // Build conversation history
      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [{ role: "system", content: master.systemPrompt }];

      // Warn about mixed-language chat history
      if (isEnglish && chatHistory.length > 0) {
        messages.push({
          role: "system",
          content:
            "NOTE: The following conversation history may contain Chinese text from earlier interactions. Regardless of the language in the history, you MUST respond ONLY in English.",
        });
      }

      // Add chat history
      for (const msg of chatHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }

      // Add final language enforcement right before user message
      messages.push({
        role: "system",
        content: isEnglish
          ? "CRITICAL REMINDER: Regardless of any Chinese text above, you MUST reply ONLY in English. Every word must be English. Zero Chinese characters allowed."
          : "提醒：你必须全程使用中文回复。不允许使用英文。",
      });

      // Add current user message
      messages.push({ role: "user", content: userMessage });

      try {
        const response = await retryWithBackoff(async () => {
          return await invokeLLMWithLanguageGuard({ messages }, language);
        });

        const content = response.choices[0]?.message?.content;
        if (typeof content !== "string") {
          throw new Error("Invalid response format");
        }

        return { response: content };
      } catch (error) {
        console.error("Error generating chat response:", error);
        throw new Error("Failed to generate response");
      }
    }),
});

export type AppRouter = typeof appRouter;
