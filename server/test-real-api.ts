// Test the real generatePrompts API endpoint
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

async function testRealAPI() {
  console.log("🧪 Testing Real generatePrompts API Endpoint...\n");

  const ctx = await createContext({ req: {} as any, res: {} as any, info: {} as any });
  const caller = appRouter.createCaller(ctx);

  const testCases = [
    {
      topic: "今天有谁主动关心你了？你当时是什么感受？",
      content: "我妈妈",
      language: "zh" as const,
    },
    {
      topic: "Who smiled at you today?",
      content: "my mom",
      language: "en" as const,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📝 Test Case: ${testCase.language === 'zh' ? '中文' : 'English'}`);
    console.log(`Topic: ${testCase.topic}`);
    console.log(`Content: ${testCase.content}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      const result = await caller.ai.generatePrompts({
        topic: testCase.topic,
        content: testCase.content,
        language: testCase.language,
      });

      console.log(`✅ Success! Got ${result.masters.length} masters\n`);

      // Check if each master references user's content
      const userContent = testCase.content.toLowerCase();
      let allGood = true;

      for (const master of result.masters as Array<{ id: string; name: string; icon: string; guidance: string }>) {
        const guidance = master.guidance.toLowerCase();
        const hasReference = testCase.language === 'zh'
          ? (guidance.includes("妈妈") || guidance.includes("母亲"))
          : (guidance.includes("mom") || guidance.includes("mother"));

        console.log(`${master.icon} ${master.name}:`);
        console.log(`  ${hasReference ? '✅' : '❌'} ${hasReference ? 'References user content' : 'DOES NOT reference user content'}`);
        console.log(`  Guidance: ${master.guidance.substring(0, 100)}...`);
        console.log();

        if (!hasReference) {
          allGood = false;
        }
      }

      console.log("=".repeat(60));
      if (allGood) {
        console.log("✅ ALL MASTERS CORRECTLY REFERENCE USER CONTENT");
      } else {
        console.log("❌ SOME MASTERS DO NOT REFERENCE USER CONTENT");
        console.log("\nFull responses:");
        result.masters.forEach((m: any) => {
          console.log(`\n${m.icon} ${m.name}:`);
          console.log(m.guidance);
        });
      }
      console.log("=".repeat(60));

    } catch (error) {
      console.error("❌ Error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    }
  }
}

testRealAPI().catch(console.error);
