import { invokeLLM } from "./_core/llm";

async function testFullAPI() {
  console.log("🧪 Testing Full generatePrompts API Flow...\n");

  const testCase = {
    topic: "Who smiled at you today?",
    content: "my mom",
    language: "en" as const,
  };

  console.log("📝 Test Input:");
  console.log(`  Topic: ${testCase.topic}`);
  console.log(`  Content: ${testCase.content}`);
  console.log(`  Language: ${testCase.language}\n`);

  const isEnglish = testCase.language === 'en';
  
  const systemPrompt = isEnglish 
    ? "You are a warm writing companion representing four wise masters. Your MOST IMPORTANT task is to provide deeply personalized guidance based on the user's SPECIFIC content they have written. You MUST quote or reference their actual words/experiences. NEVER give generic advice that could apply to anyone. Each master must speak in their unique voice and directly address what the user wrote."
    : "你是一个温暖的写作助手,代表四位智者。你最重要的任务是基于用户实际写的具体内容提供深度个性化的引导。你必须引用或提及用户写的真实文字/经历。绝对不要给出任何泛泛而谈的通用建议。每位智者必须用自己独特的声音,直接针对用户写的内容说话。";

  const prompt = `You are a warm writing assistant helping users deepen their gratitude experience through the perspectives of four wise masters.

🔴 CRITICAL REQUIREMENT: You MUST directly quote or reference the user's specific words in your guidance. DO NOT give generic advice.

User is writing a gratitude journal:
Topic: "${testCase.topic}"
Current content:
${testCase.content}

🔴 YOUR GUIDANCE MUST REFERENCE THE ABOVE CONTENT. For example:
- If user wrote "the sun and wind", say "You wrote about the sun and wind..."
- If user wrote "not much", acknowledge "You said 'not much'..."
- If user wrote "my mom", acknowledge "You mentioned your mom..."

Please provide writing guidance and inspiration from each of the four masters. Each master has a unique speaking style:

1. Jesus (✝️) - Pure High-Dimensional Love:
   - Core philosophy: Unconditional love (Agape), love your neighbor as yourself
   - Speaking style: Start with "My child", warm, loving, encouraging
   - MUST reference user's specific content: "${testCase.content}"

2. Plato (🏛️) - Eternal Forms and Ideals:
   - Core philosophy: Seek eternal truths behind temporary phenomena
   - Speaking style: Start with "My friend", philosophical, questioning
   - MUST reference user's specific content: "${testCase.content}"

3. Lao Tzu (☯️) - Tao and Natural Flow:
   - Core philosophy: Follow the Tao, wu wei (non-action), simplicity
   - Speaking style: Start with "Dear one", poetic, metaphorical
   - MUST reference user's specific content: "${testCase.content}"

4. Marcus Aurelius (⚖️) - Stoic Virtue:
   - Core philosophy: Control what you can, accept what you cannot
   - Speaking style: Start with "Friend", rational, disciplined
   - MUST reference user's specific content: "${testCase.content}"

Return ONLY valid JSON in this exact format:
{
  "masters": [
    {"id": "jesus", "name": "Messenger of Love", "icon": "✨", "guidance": "My child, you mentioned your mom..."},
    {"id": "plato", "name": "Plato", "icon": "🏛️", "guidance": "My friend, when you speak of your mom..."},
    {"id": "laotzu", "name": "Lao Tzu", "icon": "☯️", "guidance": "Dear one, your mom..."},
    {"id": "marcus", "name": "Marcus Aurelius", "icon": "⚖️", "guidance": "Friend, regarding your mom..."}
  ]
}`;

  console.log("📤 Sending request to LLM...\n");

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    
    console.log("📥 Raw AI Response:");
    console.log(typeof content === 'string' ? content : JSON.stringify(content));
    console.log("\n");

    if (typeof content !== 'string') {
      console.error("❌ Invalid response format");
      return;
    }

    const parsed = JSON.parse(content);
    const masters = parsed.masters || [];

    if (masters.length === 0) {
      console.error("❌ Empty masters array");
      console.error("Parsed response:", JSON.stringify(parsed, null, 2));
      return;
    }

    console.log(`✅ Success! Got ${masters.length} masters\n`);

    // Check if each master references user's content
    const userContent = testCase.content.toLowerCase();
    let allGood = true;

    for (const master of masters) {
      const guidance = master.guidance.toLowerCase();
      const hasReference = guidance.includes(userContent) || 
                          guidance.includes("mom") || 
                          guidance.includes("mother");
      
      console.log(`\n${master.icon} ${master.name}:`);
      console.log(`  ${hasReference ? '✅' : '❌'} ${hasReference ? 'References user content' : 'DOES NOT reference user content'}`);
      console.log(`  Guidance: ${master.guidance.substring(0, 150)}...`);
      
      if (!hasReference) {
        allGood = false;
      }
    }

    console.log("\n" + "=".repeat(60));
    if (allGood) {
      console.log("✅ ALL MASTERS CORRECTLY REFERENCE USER CONTENT");
    } else {
      console.log("❌ SOME MASTERS DO NOT REFERENCE USER CONTENT");
    }
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testFullAPI().catch(console.error);
