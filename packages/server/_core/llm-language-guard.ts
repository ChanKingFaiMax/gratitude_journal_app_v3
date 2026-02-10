import { invokeLLM, type InvokeParams, type InvokeResult } from "./llm";

type Language = "zh" | "en";

const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/g;

/**
 * Calculate the ratio of Chinese characters in a text string.
 * Only counts actual Chinese characters vs total non-whitespace characters.
 */
function chineseCharRatio(text: string): number {
  const stripped = text.replace(/\s+/g, "");
  if (stripped.length === 0) return 0;
  const chineseMatches = stripped.match(CHINESE_CHAR_REGEX);
  const chineseCount = chineseMatches ? chineseMatches.length : 0;
  return chineseCount / stripped.length;
}

/**
 * Check if the response language matches the expected language.
 * - English mode: Chinese chars should be < 30%
 * - Chinese mode: Chinese chars should be >= 30%
 */
function isLanguageMismatch(text: string, expectedLang: Language): boolean {
  const ratio = chineseCharRatio(text);
  if (expectedLang === "en") {
    // English mode but response has >= 30% Chinese characters
    return ratio >= 0.3;
  } else {
    // Chinese mode but response has < 30% Chinese characters (too much English)
    return ratio < 0.3;
  }
}

/**
 * Extract text content from LLM response for language checking.
 */
function extractResponseText(result: InvokeResult): string | null {
  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === "text")
      .map((part) => (part as { type: "text"; text: string }).text)
      .join("\n");
  }
  return null;
}

/**
 * Wrapper around invokeLLM that enforces language consistency.
 * 
 * If the AI response language doesn't match the expected language (based on 30% 
 * Chinese character threshold), it automatically retries once with an explicit 
 * language correction instruction prepended to the messages.
 * 
 * @param params - Standard invokeLLM parameters
 * @param language - Expected response language ('zh' or 'en')
 * @param maxRetries - Maximum number of retries (default: 1)
 */
export async function invokeLLMWithLanguageGuard(
  params: InvokeParams,
  language: Language,
  maxRetries: number = 1,
): Promise<InvokeResult> {
  const result = await invokeLLM(params);
  const responseText = extractResponseText(result);

  // If we can't extract text (e.g. tool calls), return as-is
  if (!responseText) return result;

  // Check language match
  if (!isLanguageMismatch(responseText, language)) {
    console.log(`[LanguageGuard] Language OK (expected: ${language}, ratio: ${chineseCharRatio(responseText).toFixed(2)})`);
    return result;
  }

  // Language mismatch detected — retry
  const ratio = chineseCharRatio(responseText);
  console.warn(
    `[LanguageGuard] Language MISMATCH detected! Expected: ${language}, Chinese ratio: ${ratio.toFixed(2)}. Retrying...`
  );

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Build retry messages with stronger language enforcement
    const correctionMessage = language === "en"
      ? {
          role: "system" as const,
          content: "YOUR PREVIOUS RESPONSE WAS IN THE WRONG LANGUAGE. The user's language setting is ENGLISH. You MUST respond ENTIRELY in English. Do NOT use any Chinese characters whatsoever. This is a hard requirement — any Chinese in your response is a critical error.",
        }
      : {
          role: "system" as const,
          content: "你上一次的回复使用了错误的语言。用户的语言设置是中文。你必须全程使用中文回复。不要使用任何英文。这是硬性要求——回复中出现任何英文都是严重错误。",
        };

    // Insert correction message right before the last user message
    const retryMessages = [...params.messages];
    const lastUserIdx = retryMessages.map(m => m.role).lastIndexOf("user");
    if (lastUserIdx >= 0) {
      retryMessages.splice(lastUserIdx, 0, correctionMessage);
    } else {
      retryMessages.push(correctionMessage);
    }

    const retryResult = await invokeLLM({ ...params, messages: retryMessages });
    const retryText = extractResponseText(retryResult);

    if (!retryText || !isLanguageMismatch(retryText, language)) {
      console.log(`[LanguageGuard] Retry ${attempt + 1} succeeded (ratio: ${retryText ? chineseCharRatio(retryText).toFixed(2) : "N/A"})`);
      return retryResult;
    }

    console.warn(
      `[LanguageGuard] Retry ${attempt + 1} still mismatched (ratio: ${chineseCharRatio(retryText).toFixed(2)})`
    );
  }

  // All retries failed — return the last result anyway
  console.warn(`[LanguageGuard] All retries exhausted, returning best effort response`);
  return result;
}
