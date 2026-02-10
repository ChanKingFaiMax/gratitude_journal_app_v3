/**
 * 实时测试 4 位智者 master ID 的一致性
 * 多次调用 generatePrompts 和 generateMastersSummary，验证标准化修复效果
 */

const API_BASE = 'http://127.0.0.1:3000';
const VALID_IDS = new Set(['jesus', 'plato', 'laozi', 'buddha']);

interface Master {
  id: string;
  name: string;
  [key: string]: any;
}

interface TestResult {
  api: string;
  attempt: number;
  success: boolean;
  masters: { id: string; name: string; valid: boolean }[];
  error?: string;
  duration: number;
}

async function callTrpc(procedure: string, input: any): Promise<any> {
  const url = `${API_BASE}/api/trpc/${procedure}`;  // tRPC nested routes use dot notation
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: input }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }
  
  const data = await response.json();
  if (data.error) {
    throw new Error(`tRPC error: ${JSON.stringify(data.error)}`);
  }
  return data.result?.data?.json ?? data.result?.data;
}

async function testGeneratePrompts(attempt: number, language: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await callTrpc('ai.generatePrompts', {
      topic: '感恩美好的一天',
      content: '今天阳光很好，感恩美好的一天',
      language,
    });
    
    const masters: Master[] = result?.masters || [];
    const masterResults = masters.map((m: Master) => ({
      id: m.id,
      name: m.name,
      valid: VALID_IDS.has(m.id),
    }));
    
    const allValid = masterResults.every(m => m.valid);
    return {
      api: `generatePrompts (${language})`,
      attempt,
      success: allValid,
      masters: masterResults,
      duration: Date.now() - start,
    };
  } catch (e: any) {
    return {
      api: `generatePrompts (${language})`,
      attempt,
      success: false,
      masters: [],
      error: e.message,
      duration: Date.now() - start,
    };
  }
}

async function testGenerateMastersSummary(attempt: number, language: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await callTrpc('ai.generateMastersSummary', {
      topic: '家人与工作',
      content: '感恩家人的陪伴，让我感到温暖。今天工作顺利完成了一个重要项目。',
      language,
    });
    
    const masters: Master[] = result?.masters || [];
    const masterResults = masters.map((m: Master) => ({
      id: m.id,
      name: m.name,
      valid: VALID_IDS.has(m.id),
    }));
    
    const allValid = masterResults.every(m => m.valid);
    return {
      api: `generateMastersSummary (${language})`,
      attempt,
      success: allValid,
      masters: masterResults,
      duration: Date.now() - start,
    };
  } catch (e: any) {
    return {
      api: `generateMastersSummary (${language})`,
      attempt,
      success: false,
      masters: [],
      error: e.message,
      duration: Date.now() - start,
    };
  }
}

async function testGenerateChat(masterId: string, language: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await callTrpc('ai.generateChat', {
      masterId,
      userMessage: '你好，请给我一些智慧的建议',
      language,
      chatHistory: [],
    });
    
    return {
      api: `generateChat (${masterId}, ${language})`,
      attempt: 1,
      success: !!result?.response,
      masters: [{ id: masterId, name: masterId, valid: true }],
      duration: Date.now() - start,
    };
  } catch (e: any) {
    return {
      api: `generateChat (${masterId}, ${language})`,
      attempt: 1,
      success: false,
      masters: [],
      error: e.message,
      duration: Date.now() - start,
    };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('智者 Master ID 一致性测试');
  console.log('='.repeat(70));
  console.log(`有效 ID: ${[...VALID_IDS].join(', ')}`);
  console.log(`API 地址: ${API_BASE}`);
  console.log('');

  const allResults: TestResult[] = [];

  // 测试1: generatePrompts 中文 x3
  console.log('--- 测试 generatePrompts (中文) x3 ---');
  for (let i = 1; i <= 3; i++) {
    console.log(`  第 ${i} 次调用...`);
    const r = await testGeneratePrompts(i, 'zh');
    allResults.push(r);
    const ids = r.masters.map(m => `${m.id}${m.valid ? '✅' : '❌'}`).join(', ');
    console.log(`  结果: ${r.success ? '✅ 通过' : '❌ 失败'} | IDs: [${ids}] | ${r.duration}ms`);
    if (r.error) console.log(`  错误: ${r.error}`);
  }

  console.log('');

  // 测试2: generatePrompts 英文 x2
  console.log('--- 测试 generatePrompts (英文) x2 ---');
  for (let i = 1; i <= 2; i++) {
    console.log(`  第 ${i} 次调用...`);
    const r = await testGeneratePrompts(i, 'en');
    allResults.push(r);
    const ids = r.masters.map(m => `${m.id}${m.valid ? '✅' : '❌'}`).join(', ');
    console.log(`  结果: ${r.success ? '✅ 通过' : '❌ 失败'} | IDs: [${ids}] | ${r.duration}ms`);
    if (r.error) console.log(`  错误: ${r.error}`);
  }

  console.log('');

  // 测试3: generateMastersSummary 中文 x2
  console.log('--- 测试 generateMastersSummary (中文) x2 ---');
  for (let i = 1; i <= 2; i++) {
    console.log(`  第 ${i} 次调用...`);
    const r = await testGenerateMastersSummary(i, 'zh');
    allResults.push(r);
    const ids = r.masters.map(m => `${m.id}${m.valid ? '✅' : '❌'}`).join(', ');
    console.log(`  结果: ${r.success ? '✅ 通过' : '❌ 失败'} | IDs: [${ids}] | ${r.duration}ms`);
    if (r.error) console.log(`  错误: ${r.error}`);
  }

  console.log('');

  // 测试4: generateChat 对每个智者各调用1次
  console.log('--- 测试 generateChat (每位智者各1次) ---');
  for (const id of ['jesus', 'plato', 'laozi', 'buddha']) {
    console.log(`  调用 ${id}...`);
    const r = await testGenerateChat(id, 'zh');
    allResults.push(r);
    console.log(`  结果: ${r.success ? '✅ 通过' : '❌ 失败'} | ${r.duration}ms`);
    if (r.error) console.log(`  错误: ${r.error}`);
  }

  // 汇总
  console.log('');
  console.log('='.repeat(70));
  console.log('测试汇总');
  console.log('='.repeat(70));
  
  const passed = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => !r.success).length;
  console.log(`总测试: ${allResults.length} | 通过: ${passed} | 失败: ${failed}`);
  
  // 收集所有返回的 master IDs
  const allReturnedIds = new Set<string>();
  for (const r of allResults) {
    for (const m of r.masters) {
      allReturnedIds.add(m.id);
    }
  }
  console.log(`所有返回的 ID: ${[...allReturnedIds].sort().join(', ')}`);
  
  const invalidIds = [...allReturnedIds].filter(id => !VALID_IDS.has(id));
  if (invalidIds.length > 0) {
    console.log(`❌ 发现无效 ID: ${invalidIds.join(', ')}`);
  } else {
    console.log('✅ 所有返回的 ID 均为有效标准 ID');
  }

  if (failed > 0) {
    console.log('');
    console.log('失败详情:');
    for (const r of allResults.filter(r => !r.success)) {
      console.log(`  ${r.api} #${r.attempt}: ${r.error || '返回了无效ID'}`);
      if (r.masters.length > 0) {
        console.log(`    IDs: ${r.masters.map(m => `${m.id}(${m.valid ? '有效' : '无效'})`).join(', ')}`);
      }
    }
  }
}

main().catch(console.error);
