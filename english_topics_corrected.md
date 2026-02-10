# 英文题库完整版（201题）- 格式检查版

## ⚠️ 格式问题说明

**问题1：单引号转义**
- ❌ 错误：`text: 'What's your name'` 
- ✅ 正确：`text: "What's your name"` （使用双引号）
- ✅ 或者：`text: 'What\'s your name'` （转义单引号）

**问题2：模板字符串混用**
- ❌ 错误：`text: `What's your name`, category:` （反引号未闭合）
- ✅ 正确：统一使用双引号

**推荐方案：全部使用双引号包裹文本内容**

---

## 完整英文题库（201题）

### People & Relationship - 10 topics
```typescript
{ id: "1", text: "💝 Who are you most grateful for? What would you say to them?", category: "people", season: "all" },
{ id: "2", text: "🤗 Whose small gesture recently warmed your heart?", category: "people", season: "all" },
{ id: "3", text: "😊 Did someone smile at you today? How did it make you feel?", category: "people", season: "all" },
{ id: "4", text: "💬 What's the warmest thing someone said to you recently?", category: "relationship", season: "all" },
{ id: "5", text: "🫂 Who showed care for you today? How did you feel?", category: "relationship", season: "all" },
{ id: "6", text: "👋 Who did you greet today? How did they respond?", category: "people", season: "all" },
{ id: "7", text: "🎂 What was the most joyful gathering you attended recently?", category: "people", season: "all" },
{ id: "8", text: "💌 Which old friend would you like to thank? Why?", category: "relationship", season: "all" },
{ id: "9", text: "🤝 Who gave you valuable advice or help recently?", category: "people", season: "all" },
{ id: "10", text: "👨‍👩‍👧 Who in your family knows you best? What special connection do you share?", category: "relationship", season: "all" },
```

### Food - 8 topics
```typescript
{ id: "11", text: "🍽️ What was the best meal you had this week?", category: "food", season: "all" },
{ id: "12", text: "☕ What drink recently satisfied you the most?", category: "food", season: "all" },
{ id: "13", text: "🍰 What childhood dish do you miss the most?", category: "food", season: "all" },
{ id: "14", text: "🥘 What's your signature dish? Why do you enjoy making it?", category: "food", season: "all" },
{ id: "15", text: "🍜 What surprising restaurant or snack did you discover recently?", category: "food", season: "all" },
{ id: "16", text: "🍓 What's your favorite seasonal fruit? What does it remind you of?", category: "food", season: "all" },
{ id: "17", text: "🍪 What comforting food did you have recently?", category: "food", season: "all" },
{ id: "18", text: "🥗 What healthy meal did you try recently? How did it feel?", category: "food", season: "all" },
```

### Beautiful Moments - 8 topics
```typescript
{ id: "19", text: "✨ What moment made you smile today?", category: "moment", season: "all" },
{ id: "20", text: "📸 What was the most beautiful scene you saw today?", category: "moment", season: "all" },
{ id: "21", text: "🌅 What recent sunrise or sunset moved you?", category: "moment", season: "all" },
{ id: "22", text: "🎵 What song recently touched your heart?", category: "moment", season: "all" },
{ id: "23", text: "📚 What book or article recently inspired you?", category: "moment", season: "all" },
{ id: "24", text: "🎬 What movie or show recently resonated with you?", category: "moment", season: "all" },
{ id: "25", text: "🌟 What unexpected surprise delighted you recently?", category: "moment", season: "all" },
{ id: "26", text: "💫 What small detail brought you joy today?", category: "moment", season: "all" },
```

### Growth - 8 topics
```typescript
{ id: "27", text: "🌱 What new skill did you learn recently?", category: "growth", season: "all" },
{ id: "28", text: "💪 What challenge did you overcome recently?", category: "growth", season: "all" },
{ id: "29", text: "🎯 What goal are you proud of achieving?", category: "growth", season: "all" },
{ id: "30", text: "🔍 What did you discover about yourself recently?", category: "growth", season: "all" },
{ id: "31", text: "📈 What progress have you made recently?", category: "growth", season: "all" },
{ id: "32", text: "🧠 What insight changed your perspective?", category: "growth", season: "all" },
{ id: "33", text: "🌟 What mistake taught you a valuable lesson?", category: "growth", season: "all" },
{ id: "34", text: "🚀 What new beginning are you grateful for?", category: "growth", season: "all" },
```

### Sensory Experience - 8 topics
```typescript
{ id: "35", text: "👃 What scent brings you comfort?", category: "sensory", season: "all" },
{ id: "36", text: "🎶 What sound makes you feel peaceful?", category: "sensory", season: "all" },
{ id: "37", text: "🤲 What texture do you enjoy touching?", category: "sensory", season: "all" },
{ id: "38", text: "👀 What color brings you joy?", category: "sensory", season: "all" },
{ id: "39", text: "😌 What physical sensation makes you feel alive?", category: "sensory", season: "all" },
{ id: "40", text: "🌊 From delicious food to dolphins and sunlight, you find joy in sensory experiences. What specific flow of life moment, felt through your senses, recently brought you gratitude?", category: "sensory", season: "all" },
{ id: "41", text: "🌡️ What temperature makes you feel most comfortable?", category: "sensory", season: "all" },
{ id: "42", text: "💨 What weather condition do you appreciate most?", category: "sensory", season: "all" },
```

### Memories - 6 topics
```typescript
{ id: "43", text: "📖 What childhood memory still warms your heart?", category: "memory", season: "all" },
{ id: "44", text: "🎓 What learning experience shaped who you are?", category: "memory", season: "all" },
{ id: "45", text: "🌍 What travel memory do you treasure?", category: "memory", season: "all" },
{ id: "46", text: "🎉 What celebration stands out in your memory?", category: "memory", season: "all" },
{ id: "47", text: "💝 What gift (given or received) meant the most to you?", category: "memory", season: "all" },
{ id: "48", text: "🕰️ What moment would you like to relive?", category: "memory", season: "all" },
```

### Objects - 6 topics
```typescript
{ id: "49", text: "📱 What tool or device makes your life easier?", category: "object", season: "all" },
{ id: "50", text: "📚 What book changed your perspective?", category: "object", season: "all" },
{ id: "51", text: "👕 What piece of clothing brings you comfort?", category: "object", season: "all" },
{ id: "52", text: "🎁 What possession holds special meaning?", category: "object", season: "all" },
{ id: "53", text: "🖼️ What item in your home holds special memories?", category: "object", season: "all" },
{ id: "54", text: "⌚ What's the longest you've used something?", category: "object", season: "all" },
```

### Nature - 8 topics
```typescript
{ id: "55", text: "🌳 What natural scene brings you peace?", category: "nature", season: "all" },
{ id: "56", text: "🌸 What flower or plant do you appreciate?", category: "nature", season: "all" },
{ id: "57", text: "🐾 What animal encounter brought you joy?", category: "nature", season: "all" },
{ id: "58", text: "⛰️ What landscape takes your breath away?", category: "nature", season: "all" },
{ id: "59", text: "🌊 What body of water calms your mind?", category: "nature", season: "all" },
{ id: "60", text: "🌙 What celestial sight amazes you?", category: "nature", season: "all" },
{ id: "61", text: "🦋 What small creature fascinates you?", category: "nature", season: "all" },
{ id: "62", text: "🍂 What natural phenomenon do you find beautiful?", category: "nature", season: "all" },
```

### Daily Life - 8 topics
```typescript
{ id: "63", text: "🏡 What aspect of your home brings you comfort?", category: "daily", season: "all" },
{ id: "64", text: "🛏️ What part of your daily routine do you enjoy?", category: "daily", season: "all" },
{ id: "65", text: "🚶 What simple activity brings you peace?", category: "daily", season: "all" },
{ id: "66", text: "☕ What morning ritual do you appreciate?", category: "daily", season: "all" },
{ id: "67", text: "🌙 What evening habit helps you unwind?", category: "daily", season: "all" },
{ id: "68", text: "🧘 What practice helps you stay grounded?", category: "daily", season: "all" },
{ id: "69", text: "📝 What daily habit are you proud of?", category: "daily", season: "all" },
{ id: "70", text: "🎯 What small win did you have today?", category: "daily", season: "all" },
```

### Work & Study - 10 topics
```typescript
{ id: "71", text: "💼 What work achievement are you proud of?", category: "work", season: "all" },
{ id: "72", text: "🤝 What colleague or mentor helped you grow?", category: "work", season: "all" },
{ id: "73", text: "📊 What project brought you satisfaction?", category: "work", season: "all" },
{ id: "74", text: "💡 What problem did you solve creatively?", category: "work", season: "all" },
{ id: "75", text: "📚 What knowledge or skill are you grateful to have?", category: "work", season: "all" },
{ id: "76", text: "🎓 What learning opportunity came your way?", category: "work", season: "all" },
{ id: "77", text: "🌟 What recognition or feedback meant a lot to you?", category: "work", season: "all" },
{ id: "78", text: "⚖️ What work-life balance moment did you appreciate?", category: "work", season: "all" },
{ id: "79", text: "🚀 What career milestone are you grateful for?", category: "work", season: "all" },
{ id: "80", text: "🧩 What challenging task taught you something valuable?", category: "work", season: "all" },
```

### Health & Fitness - 10 topics
```typescript
{ id: "81", text: "💪 What physical activity made you feel good?", category: "health", season: "all" },
{ id: "82", text: "🧘 What wellness practice benefits you?", category: "health", season: "all" },
{ id: "83", text: "😴 What good night's sleep are you grateful for?", category: "health", season: "all" },
{ id: "84", text: "🥗 What healthy choice did you make?", category: "health", season: "all" },
{ id: "85", text: "🏃 What fitness goal did you achieve?", category: "health", season: "all" },
{ id: "86", text: "🧠 What mental health practice helps you?", category: "health", season: "all" },
{ id: "87", text: "💊 What health improvement are you grateful for?", category: "health", season: "all" },
{ id: "88", text: "🌿 What natural remedy or habit supports your wellbeing?", category: "health", season: "all" },
{ id: "89", text: "🤸 What movement brought you joy?", category: "health", season: "all" },
{ id: "90", text: "❤️ What aspect of your health do you appreciate?", category: "health", season: "all" },
```

### Creativity & Art - 8 topics
```typescript
{ id: "91", text: "🎨 What creative project brought you joy?", category: "creativity", season: "all" },
{ id: "92", text: "🖌️ What artistic expression resonated with you?", category: "creativity", season: "all" },
{ id: "93", text: "🎭 What performance moved you?", category: "creativity", season: "all" },
{ id: "94", text: "📷 What photo or image captured your attention?", category: "creativity", season: "all" },
{ id: "95", text: "✍️ What piece of writing inspired you?", category: "creativity", season: "all" },
{ id: "96", text: "🎼 What music creation process fascinated you?", category: "creativity", season: "all" },
{ id: "97", text: "🏗️ What design or architecture impressed you?", category: "creativity", season: "all" },
{ id: "98", text: "💡 What creative solution did you come up with?", category: "creativity", season: "all" },
```

### Travel & Exploration - 8 topics
```typescript
{ id: "99", text: "✈️ What journey are you grateful for?", category: "travel", season: "all" },
{ id: "100", text: "🗺️ What new place did you discover?", category: "travel", season: "all" },
{ id: "101", text: "🌍 What cultural experience enriched you?", category: "travel", season: "all" },
{ id: "102", text: "🏞️ What natural wonder amazed you?", category: "travel", season: "all" },
{ id: "103", text: "🍜 What local cuisine did you enjoy?", category: "travel", season: "all" },
{ id: "104", text: "👥 What traveler or local did you connect with?", category: "travel", season: "all" },
{ id: "105", text: "📸 What travel memory do you cherish?", category: "travel", season: "all" },
{ id: "106", text: "🧳 What adventure taught you something new?", category: "travel", season: "all" },
```

### Family & Pets - 10 topics
```typescript
{ id: "107", text: "👨‍👩‍👧‍👦 What family moment warmed your heart?", category: "family", season: "all" },
{ id: "108", text: "🐕 What did your pet do that made you smile?", category: "family", season: "all" },
{ id: "109", text: "👶 What child's laughter or curiosity delighted you?", category: "family", season: "all" },
{ id: "110", text: "👵 What wisdom did an elder share with you?", category: "family", season: "all" },
{ id: "111", text: "🏠 What family tradition do you appreciate?", category: "family", season: "all" },
{ id: "112", text: "💕 What act of love did a family member show?", category: "family", season: "all" },
{ id: "113", text: "🎉 What family celebration brought you together?", category: "family", season: "all" },
{ id: "114", text: "🐾 What animal companion brings you comfort?", category: "family", season: "all" },
{ id: "115", text: "👫 What sibling or cousin moment do you treasure?", category: "family", season: "all" },
{ id: "116", text: "🤗 What family support are you grateful for?", category: "family", season: "all" },
```

### Technology & Digital Life - 8 topics
```typescript
{ id: "117", text: "💻 What technology makes your life better?", category: "tech", season: "all" },
{ id: "118", text: "📱 What app or tool do you find helpful?", category: "tech", season: "all" },
{ id: "119", text: "🌐 What online connection enriched your life?", category: "tech", season: "all" },
{ id: "120", text: "🎮 What digital experience brought you joy?", category: "tech", season: "all" },
{ id: "121", text: "📺 What online content inspired you?", category: "tech", season: "all" },
{ id: "122", text: "💬 What meaningful conversation happened online?", category: "tech", season: "all" },
{ id: "123", text: "🔧 What tech problem did you solve?", category: "tech", season: "all" },
{ id: "124", text: "🤖 What innovation amazed you?", category: "tech", season: "all" },
```

### Seasons & Holidays - 12 topics
```typescript
{ id: "125", text: "🎄 What holiday tradition brings you joy?", category: "season", season: "all" },
{ id: "126", text: "🌸 What spring moment delighted you?", category: "season", season: "spring" },
{ id: "127", text: "☀️ What summer experience do you treasure?", category: "season", season: "summer" },
{ id: "128", text: "🍂 What autumn beauty caught your eye?", category: "season", season: "autumn" },
{ id: "129", text: "❄️ What winter coziness do you appreciate?", category: "season", season: "winter" },
{ id: "130", text: "🎁 What gift exchange touched your heart?", category: "season", season: "all" },
{ id: "131", text: "🎆 What's your warmest Mid-Autumn Festival memory?", category: "season", season: "all" },
{ id: "132", text: "🎊 What's the most fun way you've celebrated a holiday?", category: "season", season: "all" },
{ id: "133", text: "🎀 What's the most special holiday gift you received?", category: "season", season: "all" },
{ id: "134", text: "🎎 What's your favorite traditional custom?", category: "season", season: "all" },
{ id: "135", text: "🎋 What do you love most about the current season?", category: "season", season: "all" },
{ id: "136", text: "🌺 What seasonal change brings you happiness?", category: "season", season: "all" },
```

### Self-Care - 10 topics
```typescript
{ id: "137", text: "🛀 What self-care practice rejuvenates you?", category: "self_care", season: "all" },
{ id: "138", text: "📖 What quiet moment did you enjoy?", category: "self_care", season: "all" },
{ id: "139", text: "🕯️ What helps you relax and unwind?", category: "self_care", season: "all" },
{ id: "140", text: "💆 What treat did you give yourself?", category: "self_care", season: "all" },
{ id: "141", text: "🌅 What peaceful moment did you create?", category: "self_care", season: "all" },
{ id: "142", text: "🧘 What mindfulness practice helps you?", category: "self_care", season: "all" },
{ id: "143", text: "💝 What act of self-love did you practice?", category: "self_care", season: "all" },
{ id: "144", text: "🌿 What boundary did you set for yourself?", category: "self_care", season: "all" },
{ id: "145", text: "😌 What moment of rest did you appreciate?", category: "self_care", season: "all" },
{ id: "146", text: "🎯 What personal need did you honor?", category: "self_care", season: "all" },
```

### Philosophy - 55 topics

#### Existence & Consciousness - 6 topics
```typescript
{ id: "147", text: "🌌 What does it mean to truly exist?", category: "philosophy", season: "all" },
{ id: "148", text: "🧠 Are you your thoughts, or the observer of your thoughts?", category: "philosophy", season: "all" },
{ id: "149", text: "💭 Is consciousness the universe experiencing itself?", category: "philosophy", season: "all" },
{ id: "150", text: "🔮 How do you know reality is real?", category: "philosophy", season: "all" },
{ id: "151", text: "🌀 What is the nature of the self?", category: "philosophy", season: "all" },
{ id: "152", text: "✨ Does everything happen for a reason?", category: "philosophy", season: "all" },
```

#### Morality & Ethics - 6 topics
```typescript
{ id: "153", text: "⚖️ What makes an action right or wrong?", category: "philosophy", season: "all" },
{ id: "154", text: "💔 Can a good intention justify a bad outcome?", category: "philosophy", season: "all" },
{ id: "155", text: "🤝 Do we have a duty to help others?", category: "philosophy", season: "all" },
{ id: "156", text: "🌍 Is there universal morality, or is it cultural?", category: "philosophy", season: "all" },
{ id: "157", text: "⚡ Would you sacrifice one to save many?", category: "philosophy", season: "all" },
{ id: "158", text: "⚖️ Between freedom and security, which do you value more? Why?", category: "philosophy", season: "all" },
```

#### Knowledge & Truth - 6 topics
```typescript
{ id: "159", text: "📚 What book or quote deeply influenced your worldview?", category: "philosophy", season: "all" },
{ id: "160", text: "🔮 If you could know the future, what would you want to know? Or would you rather not?", category: "philosophy", season: "all" },
{ id: "161", text: "🌊 How do you face uncertainty? Does it make you anxious or excited?", category: "philosophy", season: "all" },
{ id: "162", text: "🧠 What is your definition of success? Is it yours or society's?", category: "philosophy", season: "all" },
{ id: "163", text: "💔 How do you view failure? What has it taught you?", category: "philosophy", season: "all" },
{ id: "164", text: "✨ Do you believe in fate or choice? Why?", category: "philosophy", season: "all" },
```

#### Purpose & Meaning - 6 topics
```typescript
{ id: "165", text: "🌍 If you could solve one world problem, what would it be?", category: "philosophy", season: "all" },
{ id: "166", text: "🕰️ How do you balance present joy with future goals?", category: "philosophy", season: "all" },
{ id: "167", text: "🎯 What gives your life meaning?", category: "philosophy", season: "all" },
{ id: "168", text: "🌟 What legacy do you want to leave?", category: "philosophy", season: "all" },
{ id: "169", text: "💡 What is your purpose in life?", category: "philosophy", season: "all" },
{ id: "170", text: "🔥 What are you willing to sacrifice for?", category: "philosophy", season: "all" },
```

#### Love & Relationships - 6 topics
```typescript
{ id: "171", text: "❤️ What is love to you?", category: "philosophy", season: "all" },
{ id: "172", text: "💞 Can love exist without attachment?", category: "philosophy", season: "all" },
{ id: "173", text: "🤗 Is it better to have loved and lost?", category: "philosophy", season: "all" },
{ id: "174", text: "👥 What do you owe to others?", category: "philosophy", season: "all" },
{ id: "175", text: "🪞 How much of yourself do you share with others?", category: "philosophy", season: "all" },
{ id: "176", text: "🌉 Can you truly understand another person?", category: "philosophy", season: "all" },
```

#### Time & Change - 5 topics
```typescript
{ id: "177", text: "⏰ Is time real or an illusion?", category: "philosophy", season: "all" },
{ id: "178", text: "🔄 Can you step in the same river twice?", category: "philosophy", season: "all" },
{ id: "179", text: "🌱 Is change growth or loss?", category: "philosophy", season: "all" },
{ id: "180", text: "⏳ If you could stop time, would you?", category: "philosophy", season: "all" },
{ id: "181", text: "🕰️ Do you live in the past, present, or future?", category: "philosophy", season: "all" },
```

#### Knowledge & Truth (continued) - 6 topics
```typescript
{ id: "182", text: "🔍 What is truth?", category: "philosophy", season: "all" },
{ id: "183", text: "🎭 Can we ever truly know ourselves?", category: "philosophy", season: "all" },
{ id: "184", text: "📚 Can we truly know anything?", category: "philosophy", season: "all" },
{ id: "185", text: "🔍 Can science explain everything? Or are some things beyond it?", category: "philosophy", season: "all" },
{ id: "186", text: "🎨 Is beauty objective or subjective?", category: "philosophy", season: "all" },
{ id: "187", text: "💡 Which is more reliable: intuition or reason?", category: "philosophy", season: "all" },
```

#### History & Society - 2 topics
```typescript
{ id: "188", text: "📖 Is history objective record or victor's narrative?", category: "philosophy", season: "all" },
{ id: "189", text: "🗣️ Does language shape thought, or does thought shape language?", category: "philosophy", season: "all" },
```

#### Self & Identity - 6 topics
```typescript
{ id: "190", text: "🪪 What defines you? Body, memory, or soul?", category: "philosophy", season: "all" },
{ id: "191", text: "🎭 Are you the same person you were 10 years ago?", category: "philosophy", season: "all" },
{ id: "192", text: "🪞 How much of your identity is chosen vs. given?", category: "philosophy", season: "all" },
{ id: "193", text: "👤 If you lost all memories, would you still be you?", category: "philosophy", season: "all" },
{ id: "194", text: "🌊 Are you a wave or the ocean?", category: "philosophy", season: "all" },
{ id: "195", text: "🔮 Do you create yourself or discover yourself?", category: "philosophy", season: "all" },
```

#### Life & Death - 6 topics
```typescript
{ id: "196", text: "⏳ If life is finite, is it more valuable or more meaningless?", category: "philosophy", season: "all" },
{ id: "197", text: "💀 Is death an end or a transformation?", category: "philosophy", season: "all" },
{ id: "198", text: "🌟 Is immortality a blessing or a curse?", category: "philosophy", season: "all" },
{ id: "199", text: "🕊️ If there's no afterlife, does morality still matter?", category: "philosophy", season: "all" },
{ id: "200", text: "🌱 Is life's value intrinsic or assigned by us?", category: "philosophy", season: "all" },
{ id: "201", text: "🔄 If you could be reborn but lose all memories, is it still your rebirth?", category: "philosophy", season: "all" },
```

---

## 总结

- **总题目数：201题**
- **感恩类题目：146题**（分11个分类）
- **哲学类题目：55题**（分6个哲学分支）
- **格式要求：全部使用双引号包裹文本，避免转义问题**
