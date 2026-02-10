import { DailyTopic, WritingPrompt } from '@awaken/shared/types/journal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'app_language';

/**
 * Get current language setting
 */
async function getCurrentLanguage(): Promise<'zh' | 'en'> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    return (lang as 'zh' | 'en') || 'zh';
  } catch {
    return 'zh';
  }
}

/**
 * Fallback topics when AI generation fails - Chinese
 */
const FALLBACK_TOPICS_ZH: DailyTopic[] = [
  // Gratitude - People
  { id: '1', text: '💝 你最感恩的人是谁?想对TA说什么?', category: 'people' },
  { id: '2', text: '🤗 最近谁的一个小举动温暖了你的心?', category: 'people' },
  { id: '3', text: '😊 今天有人对你笑了吗?那个笑容让你有什么感觉?', category: 'people' },
  
  // Gratitude - Food
  { id: '4', text: '🍽️ 过去一周吃过最好吃的一顿饭是什么?', category: 'food' },
  { id: '5', text: '☕ 最近喝过的最满足的一杯饮料是什么?', category: 'food' },
  
  // Gratitude - Moments
  { id: '6', text: '✨ 今天有哪个瞬间让你会心一笑?', category: 'moment' },
  { id: '7', text: '📸 今天看到的最美的一幕是什么?', category: 'moment' },
  { id: '8', text: '🎁 最近哪个小惊喜让你眼前一亮?', category: 'moment' },
  
  // Gratitude - Growth
  { id: '9', text: '💪 最近克服的一个小困难是什么?', category: 'growth' },
  { id: '10', text: '🎯 今天你做对了哪件事?为什么为自己骄傲?', category: 'growth' },
  { id: '11', text: '📚 最近学会的一个新技能或知识是什么?', category: 'growth' },
  
  // Gratitude - Sensory
  { id: '12', text: '🎵 今天听到的最动听的声音是什么?', category: 'sensory' },
  { id: '13', text: '🌸 最近闻到的最让你放松的味道是什么?', category: 'sensory' },
  { id: '14', text: '🤲 今天触摸到的最舒服的东西是什么?', category: 'sensory' },
  
  // Gratitude - Memory
  { id: '15', text: '🧸 童年时期最温暖的一个记忆是什么?', category: 'memory' },
  { id: '16', text: '😂 你和好友之间最搞笑的一次经历是什么?', category: 'memory' },
  
  // Gratitude - Relationship
  { id: '17', text: '💬 最近收到的最暖心的一句话是什么?', category: 'relationship' },
  { id: '18', text: '🫂 今天有谁主动关心你了?你当时是什么感受?', category: 'relationship' },
  
  // Gratitude - Objects
  { id: '19', text: '🎁 你拥有的哪件物品让你特别珍惜?为什么?', category: 'object' },
  { id: '20', text: '🛍️ 最近买的最值的一件东西是什么?', category: 'object' },
  
  // Gratitude - Nature
  { id: '21', text: '🌅 最近看到的最美的天空是什么样子?', category: 'nature' },
  { id: '22', text: '☀️ 今天天气给你带来了什么好心情?', category: 'nature' },
  
  // Gratitude - Daily
  { id: '23', text: '🔧 今天哪个小物件让你的生活变得更方便?', category: 'daily' },
  { id: '24', text: '🌱 最近哪个小习惯让你感觉生活变好了?', category: 'daily' },
  { id: '25', text: '🎉 今天你给自己的一个小奖励是什么?', category: 'daily' },
  
  // Philosophy
  { id: '26', text: '🤔 如果今天是你生命的最后一天,你会做什么不同的选择?', category: 'philosophy' },
  { id: '27', text: '🎭 你认为真实的自己和别人眼中的你,哪个更重要?', category: 'philosophy' },
  { id: '28', text: '🌌 在宇宙的尺度下,个人的存在有意义吗?', category: 'philosophy' },
  { id: '29', text: '🔄 如果生命可以重来,你希望成为现在的自己吗?', category: 'philosophy' },
  { id: '30', text: '🌱 痛苦和快乐,哪个对你的成长更重要?', category: 'philosophy' },
];

/**
 * Fallback topics when AI generation fails - English
 */
const FALLBACK_TOPICS_EN: DailyTopic[] = [
  // Gratitude - People
  { id: '1', text: '💝 Who are you most grateful for? What would you like to say to them?', category: 'people' },
  { id: '2', text: '🤗 Whose small gesture recently warmed your heart?', category: 'people' },
  { id: '3', text: '😊 Did someone smile at you today? How did it make you feel?', category: 'people' },
  
  // Gratitude - Food
  { id: '4', text: '🍽️ What was the best meal you had in the past week?', category: 'food' },
  { id: '5', text: '☕ What was the most satisfying drink you had recently?', category: 'food' },
  
  // Gratitude - Moments
  { id: '6', text: '✨ What moment today made you smile?', category: 'moment' },
  { id: '7', text: '📸 What was the most beautiful scene you saw today?', category: 'moment' },
  { id: '8', text: '🎁 What little surprise recently brightened your day?', category: 'moment' },
  
  // Gratitude - Growth
  { id: '9', text: '💪 What small challenge did you overcome recently?', category: 'growth' },
  { id: '10', text: '🎯 What did you do right today? Why are you proud of yourself?', category: 'growth' },
  { id: '11', text: '📚 What new skill or knowledge did you learn recently?', category: 'growth' },
  
  // Gratitude - Sensory
  { id: '12', text: '🎵 What was the most pleasant sound you heard today?', category: 'sensory' },
  { id: '13', text: '🌸 What scent recently helped you relax?', category: 'sensory' },
  { id: '14', text: '🤲 What was the most comfortable thing you touched today?', category: 'sensory' },
  
  // Gratitude - Memory
  { id: '15', text: '🧸 What is your warmest childhood memory?', category: 'memory' },
  { id: '16', text: '😂 What is the funniest experience you shared with a friend?', category: 'memory' },
  
  // Gratitude - Relationship
  { id: '17', text: '💬 What was the most heartwarming thing someone said to you recently?', category: 'relationship' },
  { id: '18', text: '🫂 Who showed you care today? How did it make you feel?', category: 'relationship' },
  
  // Gratitude - Objects
  { id: '19', text: '🎁 What possession do you treasure most? Why?', category: 'object' },
  { id: '20', text: '🛍️ What was the best purchase you made recently?', category: 'object' },
  
  // Gratitude - Nature
  { id: '21', text: '🌅 What was the most beautiful sky you saw recently?', category: 'nature' },
  { id: '22', text: '☀️ How did today\'s weather lift your mood?', category: 'nature' },
  
  // Gratitude - Daily
  { id: '23', text: '🔧 What small item made your life more convenient today?', category: 'daily' },
  { id: '24', text: '🌱 What small habit has made your life better recently?', category: 'daily' },
  { id: '25', text: '🎉 What small reward did you give yourself today?', category: 'daily' },
  
  // Philosophy
  { id: '26', text: '🤔 If today were your last day, what would you do differently?', category: 'philosophy' },
  { id: '27', text: '🎭 Which matters more: your true self or how others see you?', category: 'philosophy' },
  { id: '28', text: '🌌 On a cosmic scale, does individual existence have meaning?', category: 'philosophy' },
  { id: '29', text: '🔄 If you could live life over, would you want to be who you are now?', category: 'philosophy' },
  { id: '30', text: '🌱 Pain or joy - which has been more important for your growth?', category: 'philosophy' },
];

/**
 * Fallback topics when AI generation fails
 */
export function getFallbackTopics(language?: 'zh' | 'en'): DailyTopic[] {
  const allTopics = language === 'en' ? FALLBACK_TOPICS_EN : FALLBACK_TOPICS_ZH;
  
  // Randomly return 5 topics
  const shuffled = [...allTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

/**
 * Philosophy topics for deep thinking - Chinese
 */
const PHILOSOPHY_TOPICS_ZH: DailyTopic[] = [
  { id: 'p1', text: '🤔 什么是真正的幸福?你觉得自己幸福吗?', category: 'philosophy' },
  { id: 'p2', text: '🌟 你最珍视的价值观是什么?它如何影响你的选择?', category: 'philosophy' },
  { id: 'p3', text: '💡 如果可以改变一个过去的决定,你会改变什么?为什么?', category: 'philosophy' },
  { id: 'p4', text: '🌱 你认为人生的意义是什么?这个答案随时间改变过吗?', category: 'philosophy' },
  { id: 'p5', text: '🤝 什么样的关系对你来说是最重要的?为什么?', category: 'philosophy' },
  { id: 'p6', text: '🎯 你希望别人记住你的什么?你想留下什么样的遗产?', category: 'philosophy' },
  { id: 'p7', text: '⚖️ 在自由和安全之间,你更看重哪个?为什么?', category: 'philosophy' },
  { id: 'p8', text: '📚 哪本书或哪句话深刻影响了你的人生观?', category: 'philosophy' },
  { id: 'p9', text: '🔮 如果能知道未来,你会想知道什么?或者你宁愿不知道?', category: 'philosophy' },
  { id: 'p10', text: '🌊 你如何面对生活中的不确定性?它让你焦虑还是兴奋?', category: 'philosophy' },
  { id: 'p11', text: '🧠 你觉得"成功"的定义是什么?这个定义是你自己的还是社会的?', category: 'philosophy' },
  { id: 'p12', text: '💔 你如何看待失败?它教会了你什么?', category: 'philosophy' },
  { id: 'p13', text: '✨ 你相信命运还是选择?为什么?', category: 'philosophy' },
  { id: 'p14', text: '🌍 如果可以解决世界上的一个问题,你会选择什么?', category: 'philosophy' },
  { id: 'p15', text: '🕰️ 你如何平衡当下的快乐和未来的目标?', category: 'philosophy' },
];

/**
 * Philosophy topics for deep thinking - English
 */
const PHILOSOPHY_TOPICS_EN: DailyTopic[] = [
  { id: 'p1', text: '🤔 What is true happiness? Do you consider yourself happy?', category: 'philosophy' },
  { id: 'p2', text: '🌟 What values do you treasure most? How do they influence your choices?', category: 'philosophy' },
  { id: 'p3', text: '💡 If you could change one past decision, what would it be? Why?', category: 'philosophy' },
  { id: 'p4', text: '🌱 What do you think is the meaning of life? Has this answer changed over time?', category: 'philosophy' },
  { id: 'p5', text: '🤝 What kind of relationships are most important to you? Why?', category: 'philosophy' },
  { id: 'p6', text: '🎯 What do you want to be remembered for? What legacy do you want to leave?', category: 'philosophy' },
  { id: 'p7', text: '⚖️ Between freedom and security, which do you value more? Why?', category: 'philosophy' },
  { id: 'p8', text: '📚 What book or quote has profoundly influenced your worldview?', category: 'philosophy' },
  { id: 'p9', text: '🔮 If you could know the future, what would you want to know? Or would you rather not know?', category: 'philosophy' },
  { id: 'p10', text: '🌊 How do you deal with uncertainty in life? Does it make you anxious or excited?', category: 'philosophy' },
  { id: 'p11', text: '🧠 What is your definition of "success"? Is it your own or society\'s?', category: 'philosophy' },
  { id: 'p12', text: '💔 How do you view failure? What has it taught you?', category: 'philosophy' },
  { id: 'p13', text: '✨ Do you believe in fate or choice? Why?', category: 'philosophy' },
  { id: 'p14', text: '🌍 If you could solve one world problem, what would you choose?', category: 'philosophy' },
  { id: 'p15', text: '🕰️ How do you balance present happiness with future goals?', category: 'philosophy' },
];

/**
 * Philosophy topics for deep thinking
 */
export function getPhilosophyTopics(language?: 'zh' | 'en'): DailyTopic[] {
  const philosophyTopics = language === 'en' ? PHILOSOPHY_TOPICS_EN : PHILOSOPHY_TOPICS_ZH;
  
  // Randomly return 5 topics
  const shuffled = [...philosophyTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

/**
 * Fallback prompts when AI generation fails
 */
export function getFallbackPrompts(language?: 'zh' | 'en'): WritingPrompt[] {
  if (language === 'en') {
    return [
      { text: 'Try to describe the specific scene and details', type: 'suggestion' },
      { text: 'Why is this important to you?', type: 'question' },
      { text: 'What feelings or insights did you gain from this?', type: 'question' },
    ];
  }
  return [
    { text: '试着描述当时的具体场景和细节', type: 'suggestion' },
    { text: '这件事为什么对你很重要?', type: 'question' },
    { text: '你从中获得了什么感受或启发?', type: 'question' },
  ];
}
