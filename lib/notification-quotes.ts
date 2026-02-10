/**
 * Modern spiritual reminders from three masters
 * Three styles: Direct, Poetic, Questioning
 */

export interface SpiritualQuote {
  id: string;
  text: string;
  textEn: string;
  author: string;
  authorEn: string;
  icon: string;
  style: 'direct' | 'poetic' | 'questioning';
}

export const SPIRITUAL_QUOTES: SpiritualQuote[] = [
  // Buddha 🙏 - Present Moment Awareness
  {
    id: 'buddha-1',
    text: '此刻,你正在呼吸,你正活着',
    textEn: 'Right now, you are breathing, you are alive',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'direct',
  },
  {
    id: 'buddha-2',
    text: '放下手机,感受你的呼吸',
    textEn: 'Put down your phone, feel your breath',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'direct',
  },
  {
    id: 'buddha-3',
    text: '你现在感受到什么?',
    textEn: 'What are you feeling right now?',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'questioning',
  },
  {
    id: 'buddha-4',
    text: '当下即永恒',
    textEn: 'The present moment is eternity',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'poetic',
  },
  {
    id: 'buddha-5',
    text: '呼吸即回家',
    textEn: 'Breathing is coming home',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'poetic',
  },
  {
    id: 'buddha-6',
    text: '你上一次真正感受当下是什么时候?',
    textEn: 'When was the last time you truly felt the present?',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'questioning',
  },
  {
    id: 'buddha-7',
    text: '停下来,听听你内心的声音',
    textEn: 'Stop and listen to your inner voice',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'direct',
  },
  {
    id: 'buddha-8',
    text: '觉知即自由',
    textEn: 'Awareness is freedom',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'poetic',
  },
  {
    id: 'buddha-9',
    text: '此刻,你的身体在告诉你什么?',
    textEn: 'What is your body telling you right now?',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'questioning',
  },
  {
    id: 'buddha-10',
    text: '每一次呼吸都是新的开始',
    textEn: 'Every breath is a new beginning',
    author: '觉者',
    authorEn: 'The Awakened One',
    icon: '🪷',
    style: 'direct',
  },

  // Laozi ☯️ - Natural Flow
  {
    id: 'laozi-1',
    text: '顺应此刻的流动',
    textEn: 'Flow with this moment',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'direct',
  },
  {
    id: 'laozi-2',
    text: '无为即自在',
    textEn: 'Non-action is freedom',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'poetic',
  },
  {
    id: 'laozi-3',
    text: '你现在在抗拒什么?',
    textEn: 'What are you resisting right now?',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'questioning',
  },
  {
    id: 'laozi-4',
    text: '放下控制,让生命自然流动',
    textEn: 'Let go of control, let life flow naturally',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'direct',
  },
  {
    id: 'laozi-5',
    text: '静即是道',
    textEn: 'Stillness is the Tao',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'poetic',
  },
  {
    id: 'laozi-6',
    text: '你已经拥有很多了',
    textEn: 'You already have so much',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'questioning',
  },
  {
    id: 'laozi-7',
    text: '像水一样,顺应当下',
    textEn: 'Like water, flow with the present',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'direct',
  },
  {
    id: 'laozi-8',
    text: '不争,故无忧',
    textEn: 'Without striving, there is no worry',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'poetic',
  },
  {
    id: 'laozi-9',
    text: '此刻,你能放下什么?',
    textEn: 'What can you let go of right now?',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'questioning',
  },
  {
    id: 'laozi-10',
    text: '停止追逐,回到当下',
    textEn: 'Stop chasing, return to the present',
    author: '老子',
    authorEn: 'Laozi',
    icon: '☯️',
    style: 'direct',
  },

  // Plato 🏛️ - Self-Knowledge
  {
    id: 'plato-1',
    text: '认识你自己',
    textEn: 'Know thyself',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'direct',
  },
  {
    id: 'plato-2',
    text: '真理在内',
    textEn: 'Truth lies within',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'poetic',
  },
  {
    id: 'plato-3',
    text: '你真正想要的是什么?',
    textEn: 'What do you truly want?',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'questioning',
  },
  {
    id: 'plato-4',
    text: '停下来,审视你的生活',
    textEn: 'Stop and examine your life',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'direct',
  },
  {
    id: 'plato-5',
    text: '美即真理',
    textEn: 'Beauty is truth',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'poetic',
  },
  {
    id: 'plato-6',
    text: '此刻,你看到了什么美好?',
    textEn: 'What beauty do you see right now?',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'questioning',
  },
  {
    id: 'plato-7',
    text: '向内寻找答案',
    textEn: 'Look within for answers',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'direct',
  },
  {
    id: 'plato-8',
    text: '智慧始于惊奇',
    textEn: 'Wisdom begins with wonder',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'poetic',
  },
  {
    id: 'plato-9',
    text: '你的灵魂渴望什么?',
    textEn: 'What does your soul long for?',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'questioning',
  },
  {
    id: 'plato-10',
    text: '感受当下的真实',
    textEn: 'Feel the truth of this moment',
    author: '柏拉图',
    authorEn: 'Plato',
    icon: '🏛️',
    style: 'direct',
  },
];

/**
 * Get a random spiritual quote
 */
export function getRandomQuote(language?: 'zh' | 'en'): { text: string; author: string; icon: string } {
  const randomIndex = Math.floor(Math.random() * SPIRITUAL_QUOTES.length);
  const quote = SPIRITUAL_QUOTES[randomIndex];
  
  if (language === 'en') {
    return {
      text: quote.textEn,
      author: quote.authorEn,
      icon: quote.icon,
    };
  }
  
  return {
    text: quote.text,
    author: quote.author,
    icon: quote.icon,
  };
}

/**
 * Get quotes by style
 */
export function getQuotesByStyle(style: SpiritualQuote['style']): SpiritualQuote[] {
  return SPIRITUAL_QUOTES.filter((quote) => quote.style === style);
}

/**
 * Get quotes by author
 */
export function getQuotesByAuthor(author: string): SpiritualQuote[] {
  return SPIRITUAL_QUOTES.filter((quote) => quote.author === author || quote.authorEn === author);
}

/**
 * Get a balanced random quote (ensures variety across styles)
 */
export function getBalancedRandomQuote(language?: 'zh' | 'en'): { text: string; author: string; icon: string } {
  // Rotate through styles for variety
  const styles: Array<SpiritualQuote['style']> = ['direct', 'poetic', 'questioning'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const quotesOfStyle = getQuotesByStyle(randomStyle);
  const randomIndex = Math.floor(Math.random() * quotesOfStyle.length);
  const quote = quotesOfStyle[randomIndex];
  
  if (language === 'en') {
    return {
      text: quote.textEn,
      author: quote.authorEn,
      icon: quote.icon,
    };
  }
  
  return {
    text: quote.text,
    author: quote.author,
    icon: quote.icon,
  };
}
