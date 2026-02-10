import { invokeLLM } from "./_core/llm";

async function testSageWisdom() {
  console.log("🧪 Testing Sage Wisdom API...\n");

  const testCases = [
    {
      topic: "家里有什么东西是你每天都在用，但很少感谢的？",
      content: "太阳和风",
      language: "zh" as const,
    },
    {
      topic: "Who smiled at you today?",
      content: "not much",
      language: "en" as const,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test Case: ${testCase.language === 'zh' ? '中文' : 'English'}`);
    console.log(`Topic: ${testCase.topic}`);
    console.log(`Content: ${testCase.content}\n`);

    const isEnglish = testCase.language === 'en';
    const prompt = isEnglish 
      ? `You are a warm writing assistant helping users deepen their gratitude experience through the perspectives of four wise masters.

🔴 CRITICAL REQUIREMENT: You MUST directly quote or reference the user's specific words in your guidance. DO NOT give generic advice.

User is writing a gratitude journal:
Topic: "${testCase.topic}"
Current content:
${testCase.content}

🔴 YOUR GUIDANCE MUST REFERENCE THE ABOVE CONTENT. For example:
- If user wrote "the sun and wind", say "You wrote about the sun and wind..."
- If user wrote "not much", acknowledge "You said 'not much'..."
- If user wrote nothing yet, acknowledge they haven't started and ask what comes to mind

Please provide brief guidance from ONE master only (Messenger of Love).

Return JSON:
{
  "masters": [
    {"id": "jesus", "name": "Messenger of Love", "icon": "✨", "guidance": "..."}
  ]
}`
      : `你是一个温暖的写作助手,帮助用户从四位智者的视角深化感恩体验。

🔴 核心要求：你必须直接引用或提及用户写的具体文字。绝对不要给出通用建议。

用户正在写感恩日记:
题目: "${testCase.topic}"
当前已写内容:
${testCase.content}

🔴 你的引导必须提及上面的内容。例如：
- 如果用户写了"太阳和风"，说"你写到了太阳和风..."
- 如果用户写了"没什么"，承认"你说'没什么'..."
- 如果用户还没写，承认他们还没开始，问他们有什么想法

请只提供一位智者（爱之使者）的简短引导。

返回JSON:
{
  "masters": [
    {"id": "jesus", "name": "爱之使者", "icon": "✨", "guidance": "..."}
  ]
}`;

    try {
      const systemPrompt = isEnglish 
        ? "You are a warm writing companion representing four wise masters. Your MOST IMPORTANT task is to provide deeply personalized guidance based on the user's SPECIFIC content they have written. You MUST quote or reference their actual words/experiences. NEVER give generic advice that could apply to anyone. Each master must speak in their unique voice and directly address what the user wrote."
        : "你是一个温暖的写作助手,代表四位智者。你最重要的任务是基于用户实际写的具体内容提供深度个性化的引导。你必须引用或提及用户写的真实文字/经历。绝对不要给出任何泛泛而谈的通用建议。每位智者必须用自己独特的声音,直接针对用户写的内容说话。";

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (typeof content !== 'string') {
        console.error("❌ Invalid response format");
        continue;
      }

      const parsed = JSON.parse(content);
      const masters = parsed.masters || [];

      if (masters.length === 0) {
        console.error("❌ Empty masters array");
        console.error("Raw response:", content);
        continue;
      }

      console.log("✅ Success!");
      console.log(`Masters count: ${masters.length}`);
      console.log(`\nGuidance from ${masters[0].name}:`);
      console.log(masters[0].guidance);

      // Check if guidance references user's content
      const userContent = testCase.content.toLowerCase();
      const guidance = masters[0].guidance.toLowerCase();
      
      if (isEnglish) {
        if (userContent.includes("not much") && !guidance.includes("not much")) {
          console.warn("⚠️  WARNING: Guidance does not reference user's words 'not much'");
        }
      } else {
        if (userContent.includes("太阳") && !guidance.includes("太阳")) {
          console.warn("⚠️  WARNING: Guidance does not reference user's words '太阳'");
        }
      }

    } catch (error) {
      console.error("❌ Error:", error);
    }
  }
}

testSageWisdom().catch(console.error);
