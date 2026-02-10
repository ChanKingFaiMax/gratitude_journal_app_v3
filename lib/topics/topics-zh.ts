import { DailyTopic } from '@/types/journal';

/**
 * Complete Chinese topic database (201 topics)
 * Categories: people, food, moment, growth, sensory, memory, relationship, object, nature, daily,
 *             work, health, creativity, travel, family, technology, season, selfcare, philosophy
 */
export const TOPICS_ZH: DailyTopic[] = [
  // === 感恩类题目（146题）===
  
  // 人际关系（People & Relationship）- 10题
  { id: '1', text: '💝 你最感恩的人是谁?想对TA说什么?', category: 'people', season: 'all' },
  { id: '2', text: '🤗 最近谁的一个小举动温暖了你的心?', category: 'people', season: 'all' },
  { id: '3', text: '😊 今天有人对你笑了吗?那个笑容让你有什么感觉?', category: 'people', season: 'all' },
  { id: '4', text: '💬 最近收到的最暖心的一句话是什么?', category: 'relationship', season: 'all' },
  { id: '5', text: '🫂 今天有谁主动关心你了?你当时是什么感受?', category: 'relationship', season: 'all' },
  { id: '6', text: '👋 今天你主动向谁问好了?对方的反应如何?', category: 'people', season: 'all' },
  { id: '7', text: '🎂 最近参加的最开心的聚会是什么?', category: 'people', season: 'all' },
  { id: '8', text: '💌 你想对哪位老朋友说声谢谢?为什么?', category: 'relationship', season: 'all' },
  { id: '9', text: '🤝 最近谁给了你很好的建议或帮助?', category: 'people', season: 'all' },
  { id: '10', text: '👨‍👩‍👧 家人中谁最了解你?你们之间有什么特别的默契?', category: 'relationship', season: 'all' },

  // 美食（Food）- 8题
  { id: '11', text: '🍽️ 过去一周吃过最好吃的一顿饭是什么?', category: 'food', season: 'all' },
  { id: '12', text: '☕ 最近喝过的最满足的一杯饮料是什么?', category: 'food', season: 'all' },
  { id: '13', text: '🍰 童年时期最怀念的一道菜是什么?', category: 'food', season: 'all' },
  { id: '14', text: '🥘 你最拿手的一道菜是什么?为什么喜欢做它?', category: 'food', season: 'all' },
  { id: '15', text: '🍜 最近发现的最惊喜的餐厅或小吃是什么?', category: 'food', season: 'all' },
  { id: '16', text: '🍓 当季最喜欢的水果是什么?它让你想起什么?', category: 'food', season: 'all' },
  { id: '17', text: '🍪 最近吃到的最治愈的食物是什么?', category: 'food', season: 'all' },
  { id: '18', text: '🥗 最近尝试的最健康的一餐是什么?感觉如何?', category: 'food', season: 'all' },

  // 美好瞬间（Moments）- 8题
  { id: '19', text: '✨ 今天有哪个瞬间让你会心一笑?', category: 'moment', season: 'all' },
  { id: '20', text: '📸 今天看到的最美的一幕是什么?', category: 'moment', season: 'all' },
  { id: '21', text: '🎁 最近哪个小惊喜让你眼前一亮?', category: 'moment', season: 'all' },
  { id: '22', text: '🌈 最近看到的最美的景色是什么?', category: 'moment', season: 'all' },
  { id: '23', text: '🎶 今天有哪首歌让你心情变好了?', category: 'moment', season: 'all' },
  { id: '24', text: '📺 最近看到的最感动的画面是什么?', category: 'moment', season: 'all' },
  { id: '25', text: '🎭 最近经历的最有趣的巧合是什么?', category: 'moment', season: 'all' },
  { id: '26', text: '⏰ 今天哪个时刻让你感觉时间静止了?', category: 'moment', season: 'all' },

  // 成长（Growth）- 8题
  { id: '27', text: '💪 最近克服的一个小困难是什么?', category: 'growth', season: 'all' },
  { id: '28', text: '🎯 今天你做对了哪件事?为什么为自己骄傲?', category: 'growth', season: 'all' },
  { id: '29', text: '📚 最近学会的一个新技能或知识是什么?', category: 'growth', season: 'all' },
  { id: '30', text: '🏆 最近完成的最有成就感的事情是什么?', category: 'growth', season: 'all' },
  { id: '31', text: '📈 这个月你在哪方面进步最大?', category: 'growth', season: 'all' },
  { id: '32', text: '🎓 最近读到的最有启发的内容是什么?', category: 'growth', season: 'all' },
  { id: '33', text: '🔧 最近解决的一个棘手问题是什么?', category: 'growth', season: 'all' },
  { id: '34', text: '🌟 今天你突破了自己的哪个舒适区?', category: 'growth', season: 'all' },

  // 感官体验（Sensory）- 8题
  { id: '35', text: '🎵 今天听到的最动听的声音是什么?', category: 'sensory', season: 'all' },
  { id: '36', text: '🌸 最近闻到的最让你放松的味道是什么?', category: 'sensory', season: 'all' },
  { id: '37', text: '🤲 今天触摸到的最舒服的东西是什么?', category: 'sensory', season: 'all' },
  { id: '38', text: '🌅 今天看到的最美的光线是什么样的?', category: 'sensory', season: 'all' },
  { id: '39', text: '🎨 最近看到的最喜欢的颜色组合是什么?', category: 'sensory', season: 'all' },
  { id: '40', text: '🍃 今天感受到的最舒服的温度是什么时候?', category: 'sensory', season: 'all' },
  { id: '41', text: '💆 最近体验到的最放松的感觉是什么?', category: 'sensory', season: 'all' },
  { id: '42', text: '🎼 最近听到的最让你平静的声音是什么?', category: 'sensory', season: 'all' },

  // 回忆（Memory）- 6题
  { id: '43', text: '🧸 童年时期最温暖的一个记忆是什么?', category: 'memory', season: 'all' },
  { id: '44', text: '😂 你和好友之间最搞笑的一次经历是什么?', category: 'memory', season: 'all' },
  { id: '45', text: '📷 最珍贵的一张照片背后有什么故事?', category: 'memory', season: 'all' },
  { id: '46', text: '🎈 小时候最期待的节日是什么?为什么?', category: 'memory', season: 'all' },
  { id: '47', text: '🏫 学生时代最难忘的一个老师是谁?', category: 'memory', season: 'all' },
  { id: '48', text: '🎪 人生中第一次独立完成的事情是什么?', category: 'memory', season: 'all' },

  // 物品（Objects）- 6题
  { id: '49', text: '🎁 你拥有的哪件物品让你特别珍惜?为什么?', category: 'object', season: 'all' },
  { id: '50', text: '🛍️ 最近买的最值的一件东西是什么?', category: 'object', season: 'all' },
  { id: '51', text: '📖 最近最喜欢用的一件物品是什么?', category: 'object', season: 'all' },
  { id: '52', text: '🎒 你的包里有什么"必备品"?为什么离不开它?', category: 'object', season: 'all' },
  { id: '53', text: '🖼️ 家里哪件物品承载着特别的回忆?', category: 'object', season: 'all' },
  { id: '54', text: '⌚ 你用得最久的一件东西是什么?', category: 'object', season: 'all' },

  // 自然（Nature）- 8题
  { id: '55', text: '🌅 最近看到的最美的天空是什么样子?', category: 'nature', season: 'all' },
  { id: '56', text: '☀️ 今天天气给你带来了什么好心情?', category: 'nature', season: 'all' },
  { id: '57', text: '🌳 最喜欢的一棵树或一片绿地在哪里?', category: 'nature', season: 'all' },
  { id: '58', text: '🌊 最近一次亲近大自然是什么时候?', category: 'nature', season: 'all' },
  { id: '59', text: '🦋 今天看到的最可爱的小动物是什么?', category: 'nature', season: 'all' },
  { id: '60', text: '🌙 最近看到的最美的月亮是什么时候?', category: 'nature', season: 'all' },
  { id: '61', text: '🌺 最喜欢的一种花是什么?为什么?', category: 'nature', season: 'all' },
  { id: '62', text: '⛰️ 最想去的自然景点是哪里?', category: 'nature', season: 'all' },

  // 日常生活（Daily）- 8题
  { id: '63', text: '🔧 今天哪个小物件让你的生活变得更方便?', category: 'daily', season: 'all' },
  { id: '64', text: '🌱 最近哪个小习惯让你感觉生活变好了?', category: 'daily', season: 'all' },
  { id: '65', text: '🎉 今天你给自己的一个小奖励是什么?', category: 'daily', season: 'all' },
  { id: '66', text: '🛏️ 今天最舒服的时刻是什么?', category: 'daily', season: 'all' },
  { id: '67', text: '🚶 今天的通勤路上有什么新发现?', category: 'daily', season: 'all' },
  { id: '68', text: '🏠 家里哪个角落让你最放松?', category: 'daily', season: 'all' },
  { id: '69', text: '⏰ 今天哪个时段的效率最高?', category: 'daily', season: 'all' },
  { id: '70', text: '🧹 最近完成的最有成就感的家务是什么?', category: 'daily', season: 'all' },

  // 工作/学习（Work/Study）- 10题
  { id: '71', text: '💼 今天工作中最有成就感的时刻是什么?', category: 'work', season: 'all' },
  { id: '72', text: '🎯 最近完成的最满意的一个项目是什么?', category: 'work', season: 'all' },
  { id: '73', text: '👔 最欣赏的同事/同学有什么优点?', category: 'work', season: 'all' },
  { id: '74', text: '📝 今天学到的最有用的东西是什么?', category: 'work', season: 'all' },
  { id: '75', text: '💡 最近想到的最好的点子是什么?', category: 'work', season: 'all' },
  { id: '76', text: '🤝 最近得到的最有价值的反馈是什么?', category: 'work', season: 'all' },
  { id: '77', text: '📊 最近工作/学习中的哪个进步让你骄傲?', category: 'work', season: 'all' },
  { id: '78', text: '☕ 工作/学习中哪个小习惯提升了你的效率?', category: 'work', season: 'all' },
  { id: '79', text: '🎓 最感谢的一位导师/老师是谁?', category: 'work', season: 'all' },
  { id: '80', text: '🌟 今天工作/学习中哪件小事让你开心?', category: 'work', season: 'all' },

  // 健康/运动（Health/Fitness）- 10题
  { id: '81', text: '🏃 最近一次运动后的感觉如何?', category: 'health', season: 'all' },
  { id: '82', text: '🧘 今天做了什么让身体感觉舒服的事?', category: 'health', season: 'all' },
  { id: '83', text: '😴 最近睡得最好的一晚是什么时候?', category: 'health', season: 'all' },
  { id: '84', text: '🥗 今天吃了什么健康的食物?', category: 'health', season: 'all' },
  { id: '85', text: '💧 今天喝水够了吗?身体有什么感觉?', category: 'health', season: 'all' },
  { id: '86', text: '🚴 最喜欢的运动方式是什么?为什么?', category: 'health', season: 'all' },
  { id: '87', text: '🌞 今天晒太阳了吗?感觉如何?', category: 'health', season: 'all' },
  { id: '88', text: '🧘‍♀️ 最近尝试的最有效的放松方式是什么?', category: 'health', season: 'all' },
  { id: '89', text: '💪 最近身体哪方面变得更好了?', category: 'health', season: 'all' },
  { id: '90', text: '🏊 最想尝试的运动项目是什么?', category: 'health', season: 'all' },

  // 创意/艺术（Creativity/Art）- 8题
  { id: '91', text: '🎨 最近创作或制作的东西是什么?', category: 'creativity', season: 'all' },
  { id: '92', text: '📸 最近拍的最满意的一张照片是什么?', category: 'creativity', season: 'all' },
  { id: '93', text: '✍️ 最近写下的最喜欢的一句话是什么?', category: 'creativity', season: 'all' },
  { id: '94', text: '🎵 最近单曲循环的歌曲是什么?为什么?', category: 'creativity', season: 'all' },
  { id: '95', text: '🎬 最近看的最喜欢的电影/剧集是什么?', category: 'creativity', season: 'all' },
  { id: '96', text: '📚 最近读的最有趣的书是什么?', category: 'creativity', season: 'all' },
  { id: '97', text: '🖌️ 最想学习的艺术技能是什么?', category: 'creativity', season: 'all' },
  { id: '98', text: '🎭 最近欣赏的艺术作品是什么?', category: 'creativity', season: 'all' },

  // 旅行/探索（Travel/Exploration）- 8题
  { id: '99', text: '✈️ 最难忘的一次旅行是去哪里?', category: 'travel', season: 'all' },
  { id: '100', text: '🗺️ 最想去的地方是哪里?为什么?', category: 'travel', season: 'all' },
  { id: '101', text: '🏙️ 在你的城市里最喜欢的地方是哪里?', category: 'travel', season: 'all' },
  { id: '102', text: '🚶 最近探索的新地方是哪里?', category: 'travel', season: 'all' },
  { id: '103', text: '🌍 最想体验的异国文化是什么?', category: 'travel', season: 'all' },
  { id: '104', text: '🎒 旅行中最难忘的一次经历是什么?', category: 'travel', season: 'all' },
  { id: '105', text: '🏔️ 最想挑战的冒险活动是什么?', category: 'travel', season: 'all' },
  { id: '106', text: '📍 今天去了哪个新地方?有什么发现?', category: 'travel', season: 'all' },

  // 家庭/宠物（Family/Pets）- 10题
  { id: '107', text: '👨‍👩‍👧 最近和家人一起做的最开心的事是什么?', category: 'family', season: 'all' },
  { id: '108', text: '🐕 宠物今天做了什么可爱的事?', category: 'family', season: 'all' },
  { id: '109', text: '👶 最近和孩子/侄子侄女的互动中印象最深的是什么?', category: 'family', season: 'all' },
  { id: '110', text: '🏡 家里最温馨的时刻是什么时候?', category: 'family', season: 'all' },
  { id: '111', text: '📞 最近和家人的哪次通话让你印象深刻?', category: 'family', season: 'all' },
  { id: '112', text: '🎁 最想送给家人的礼物是什么?', category: 'family', season: 'all' },
  { id: '113', text: '🐱 如果有宠物,它给你带来了什么改变?', category: 'family', season: 'all' },
  { id: '114', text: '👵 最想和哪位长辈多聊聊天?', category: 'family', season: 'all' },
  { id: '115', text: '🍳 最近和家人一起做的最好吃的菜是什么?', category: 'family', season: 'all' },
  { id: '116', text: '💕 家人中谁最懂你?为什么?', category: 'family', season: 'all' },

  // 科技/数字生活（Technology/Digital）- 8题
  { id: '117', text: '📱 最近发现的最好用的App是什么?', category: 'technology', season: 'all' },
  { id: '118', text: '💻 科技如何让你的生活变得更便利?', category: 'technology', season: 'all' },
  { id: '119', text: '🎮 最近玩的最有趣的游戏是什么?', category: 'technology', season: 'all' },
  { id: '120', text: '📧 最近收到的最暖心的消息是什么?', category: 'technology', season: 'all' },
  { id: '121', text: '🎧 最喜欢的播客/音频节目是什么?', category: 'technology', season: 'all' },
  { id: '122', text: '📹 最近看到的最有趣的视频是什么?', category: 'technology', season: 'all' },
  { id: '123', text: '🤖 最期待的未来科技是什么?', category: 'technology', season: 'all' },
  { id: '124', text: '💾 最珍贵的数字回忆是什么?', category: 'technology', season: 'all' },

  // 季节/节日（Seasons/Holidays）- 12题
  { id: '125', text: '🌸 春天最期待的事情是什么?', category: 'season', season: 'spring' },
  { id: '126', text: '☀️ 夏天最喜欢做的事是什么?', category: 'season', season: 'summer' },
  { id: '127', text: '🍂 秋天最美的景色是什么?', category: 'season', season: 'autumn' },
  { id: '128', text: '❄️ 冬天最温暖的回忆是什么?', category: 'season', season: 'winter' },
  { id: '129', text: '🎄 最喜欢的节日是什么?为什么?', category: 'season', season: 'all' },
  { id: '130', text: '🎆 最难忘的新年是哪一年?', category: 'season', season: 'all' },
  { id: '131', text: '🌕 中秋节最温馨的回忆是什么?', category: 'season', season: 'all' },
  { id: '132', text: '🎃 最有趣的节日庆祝方式是什么?', category: 'season', season: 'all' },
  { id: '133', text: '🎁 收到的最特别的节日礼物是什么?', category: 'season', season: 'all' },
  { id: '134', text: '🏮 最喜欢的传统习俗是什么?', category: 'season', season: 'all' },
  { id: '135', text: '🌻 当前季节你最喜欢的是什么?', category: 'season', season: 'all' },
  { id: '136', text: '🎊 最期待的即将到来的节日是什么?', category: 'season', season: 'all' },

  // 自我关怀（Self-care）- 10题
  { id: '137', text: '🧘 今天为自己做的最好的事是什么?', category: 'selfcare', season: 'all' },
  { id: '138', text: '💆 最近最放松的时刻是什么?', category: 'selfcare', season: 'all' },
  { id: '139', text: '📖 最近读的最治愈的内容是什么?', category: 'selfcare', season: 'all' },
  { id: '140', text: '🛀 最喜欢的放松方式是什么?', category: 'selfcare', season: 'all' },
  { id: '141', text: '🕯️ 今天给自己留了多少独处时间?', category: 'selfcare', season: 'all' },
  { id: '142', text: '💭 最近对自己说的最温柔的话是什么?', category: 'selfcare', season: 'all' },
  { id: '143', text: '🌟 今天最欣赏自己的哪一点?', category: 'selfcare', season: 'all' },
  { id: '144', text: '🎯 最近为自己设定的小目标是什么?', category: 'selfcare', season: 'all' },
  { id: '145', text: '💝 今天如何善待了自己?', category: 'selfcare', season: 'all' },
  { id: '146', text: '🌈 最近让你感到平静的事情是什么?', category: 'selfcare', season: 'all' },

  // === 哲学类题目（55题）===
  
  // 基础哲学思考（10题）
  { id: '147', text: '🤔 如果今天是你生命的最后一天,你会做什么不同的选择?', category: 'philosophy', season: 'all' },
  { id: '148', text: '🎭 你认为真实的自己和别人眼中的你,哪个更重要?', category: 'philosophy', season: 'all' },
  { id: '149', text: '🌌 在宇宙的尺度下,个人的存在有意义吗?', category: 'philosophy', season: 'all' },
  { id: '150', text: '🔄 如果生命可以重来,你希望成为现在的自己吗?', category: 'philosophy', season: 'all' },
  { id: '151', text: '🌱 痛苦和快乐,哪个对你的成长更重要?', category: 'philosophy', season: 'all' },
  { id: '152', text: '🤔 什么是真正的幸福?你觉得自己幸福吗?', category: 'philosophy', season: 'all' },
  { id: '153', text: '🌟 你最珍视的价值观是什么?它如何影响你的选择?', category: 'philosophy', season: 'all' },
  { id: '154', text: '💡 如果可以改变一个过去的决定,你会改变什么?为什么?', category: 'philosophy', season: 'all' },
  { id: '155', text: '🌱 你认为人生的意义是什么?这个答案随时间改变过吗?', category: 'philosophy', season: 'all' },
  { id: '156', text: '🤝 什么样的关系对你来说是最重要的?为什么?', category: 'philosophy', season: 'all' },

  // 深度哲学探索（15题）
  { id: '157', text: '🎯 你希望别人记住你的什么?你想留下什么样的遗产?', category: 'philosophy', season: 'all' },
  { id: '158', text: '⚖️ 在自由和安全之间,你更看重哪个?为什么?', category: 'philosophy', season: 'all' },
  { id: '159', text: '📚 哪本书或哪句话深刻影响了你的人生观?', category: 'philosophy', season: 'all' },
  { id: '160', text: '🔮 如果能知道未来,你会想知道什么?或者你宁愿不知道?', category: 'philosophy', season: 'all' },
  { id: '161', text: '🌊 你如何面对生活中的不确定性?它让你焦虑还是兴奋?', category: 'philosophy', season: 'all' },
  { id: '162', text: '🧠 你觉得"成功"的定义是什么?这个定义是你自己的还是社会的?', category: 'philosophy', season: 'all' },
  { id: '163', text: '💔 你如何看待失败?它教会了你什么?', category: 'philosophy', season: 'all' },
  { id: '164', text: '✨ 你相信命运还是选择?为什么?', category: 'philosophy', season: 'all' },
  { id: '165', text: '🌍 如果可以解决世界上的一个问题,你会选择什么?', category: 'philosophy', season: 'all' },
  { id: '166', text: '🕰️ 你如何平衡当下的快乐和未来的目标?', category: 'philosophy', season: 'all' },
  { id: '167', text: '🎨 什么让生活值得活?', category: 'philosophy', season: 'all' },
  { id: '168', text: '🌉 你如何定义"美好的人生"?', category: 'philosophy', season: 'all' },
  { id: '169', text: '🔑 人生中最重要的三件事是什么?', category: 'philosophy', season: 'all' },
  { id: '170', text: '🌟 你最不愿意妥协的原则是什么?', category: 'philosophy', season: 'all' },
  { id: '171', text: '💫 如果可以给10年前的自己一个建议,你会说什么?', category: 'philosophy', season: 'all' },

  // 存在与意识（6题）
  { id: '172', text: '🧠 意识是什么?你如何证明自己的存在?', category: 'philosophy', season: 'all' },
  { id: '173', text: '🪞 如果你的所有记忆都被替换,你还是"你"吗?', category: 'philosophy', season: 'all' },
  { id: '174', text: '🌌 宇宙中是否存在绝对的真理?', category: 'philosophy', season: 'all' },
  { id: '175', text: '💭 思想和现实,哪个更真实?', category: 'philosophy', season: 'all' },
  { id: '176', text: '🎭 人是被环境塑造的,还是可以自由选择的?', category: 'philosophy', season: 'all' },
  { id: '177', text: '🔄 如果时间是循环的,生命还有意义吗?', category: 'philosophy', season: 'all' },

  // 道德与伦理（6题）
  { id: '178', text: '⚖️ 善恶是绝对的还是相对的?', category: 'philosophy', season: 'all' },
  { id: '179', text: '🤲 为了多数人的利益,牺牲少数人是否正当?', category: 'philosophy', season: 'all' },
  { id: '180', text: '💔 说谎是否有时候是正确的?', category: 'philosophy', season: 'all' },
  { id: '181', text: '🎯 目的是否可以证明手段的正当性?', category: 'philosophy', season: 'all' },
  { id: '182', text: '🌍 我们对陌生人有什么道德义务?', category: 'philosophy', season: 'all' },
  { id: '183', text: '🐾 动物是否应该拥有权利?为什么?', category: 'philosophy', season: 'all' },

  // 知识与真理（6题）
  { id: '184', text: '📚 我们能真正"知道"任何事情吗?', category: 'philosophy', season: 'all' },
  { id: '185', text: '🔍 科学能解释一切吗?还是有些东西超越科学?', category: 'philosophy', season: 'all' },
  { id: '186', text: '🎨 美是客观存在的,还是主观感受?', category: 'philosophy', season: 'all' },
  { id: '187', text: '💡 直觉和理性,哪个更可靠?', category: 'philosophy', season: 'all' },
  { id: '188', text: '📖 历史是客观的记录,还是胜利者的叙事?', category: 'philosophy', season: 'all' },
  { id: '189', text: '🗣️ 语言塑造思想,还是思想塑造语言?', category: 'philosophy', season: 'all' },

  // 自我与身份（6题）
  { id: '190', text: '🪪 什么定义了"你"?身体、记忆、还是灵魂?', category: 'philosophy', season: 'all' },
  { id: '191', text: '🎭 我们有多少个"自我"?哪个才是真实的?', category: 'philosophy', season: 'all' },
  { id: '192', text: '🌱 人的本性是善还是恶?还是一张白纸?', category: 'philosophy', season: 'all' },
  { id: '193', text: '🔄 你是在"发现"自己,还是在"创造"自己?', category: 'philosophy', season: 'all' },
  { id: '194', text: '👤 如果可以上传意识到机器,那还是"你"吗?', category: 'philosophy', season: 'all' },
  { id: '195', text: '🎨 你的身份中,哪些是选择的,哪些是被赋予的?', category: 'philosophy', season: 'all' },

  // 生命与死亡（6题）
  { id: '196', text: '⏳ 如果生命是有限的,它更有价值还是更无意义?', category: 'philosophy', season: 'all' },
  { id: '197', text: '💀 死亡是终结还是转变?', category: 'philosophy', season: 'all' },
  { id: '198', text: '🌟 不朽是祝福还是诅咒?', category: 'philosophy', season: 'all' },
  { id: '199', text: '🕊️ 如果没有来世,道德还重要吗?', category: 'philosophy', season: 'all' },
  { id: '200', text: '🌱 生命的价值是内在的还是我们赋予的?', category: 'philosophy', season: 'all' },
  { id: '201', text: '🔄 如果可以重生但失去所有记忆,这算是"你"的重生吗?', category: 'philosophy', season: 'all' },
];
