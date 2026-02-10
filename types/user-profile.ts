/**
 * User Profile Types
 * 
 * Extracted from user's journal entries to provide personalized chat experience
 */

export interface UserProfile {
  // Basic demographics (inferred from journals)
  demographics: {
    ageStage: string;        // "20-30岁青年" / "Young adult (20-30)"
    gender?: string;         // Optional, inferred from pronouns
    lifeStage: string;       // "职场新人" / "Early career professional"
    location?: string;       // If mentioned in journals
  };
  
  // Life context
  lifeContext: {
    career: string;          // "互联网行业产品经理" / "Product Manager in tech"
    relationships: string[]; // ["单身", "与父母关系紧张"] / ["Single", "Strained relationship with parents"]
    livingStatus: string;    // "独居" / "Living alone"
    majorChallenges: string[]; // ["工作压力大", "缺乏运动"] / ["High work stress", "Lack of exercise"]
  };
  
  // Psychological characteristics
  psychology: {
    emotionPattern: string;  // "容易焦虑，但善于自我调节" / "Prone to anxiety but good at self-regulation"
    strengthsWeaknesses: {
      strengths: string[];   // ["善于思考", "有责任心"] / ["Thoughtful", "Responsible"]
      weaknesses: string[];  // ["完美主义", "容易自我怀疑"] / ["Perfectionist", "Self-doubting"]
    };
    copingStyle: string;     // "倾向于通过写作和独处来处理情绪" / "Tends to process emotions through writing and solitude"
  };
  
  // Values and goals
  valuesGoals: {
    coreValues: string[];    // ["成长", "真诚", "自由"] / ["Growth", "Authenticity", "Freedom"]
    lifeGoals: string[];     // ["职业晋升", "建立深度关系"] / ["Career advancement", "Build deep relationships"]
    currentFocus: string[];  // ["提升专业能力", "改善睡眠"] / ["Improve professional skills", "Better sleep"]
  };
  
  // Behavioral patterns
  patterns: {
    journalFrequency: string; // "每周3-4次" / "3-4 times per week"
    commonTopics: Array<{topic: string; frequency: number}>;
    // [{"topic": "工作压力", "frequency": 15}, ...] / [{"topic": "Work stress", "frequency": 15}, ...]
    emotionalTrends: string;  // "最近一个月情绪波动较大" / "Emotional fluctuations in the past month"
  };
  
  // Metadata
  meta: {
    totalEntries: number;     // Total number of journal entries
    analyzedEntries: number;  // Number of entries analyzed
    lastUpdated: number;      // Timestamp of last update
    confidence: number;       // 0-1, confidence level of the profile
  };
}

/**
 * Compact summary for chat context (150-200 tokens)
 */
export interface UserProfileSummary {
  summary: string;  // A paragraph summarizing the user profile
  language: 'zh' | 'en';
}
