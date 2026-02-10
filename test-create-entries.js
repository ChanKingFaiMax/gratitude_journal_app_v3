const fs = require('fs');
const path = require('path');

// Get today's date
const today = new Date().toISOString().split('T')[0];

// Create 3 test entries
const entries = [
  {
    id: `entry-${Date.now()}-1`,
    topic: "今天早上,有哪个小细节让你感受到了被照顾或被爱?",
    content: "今天早上醒来,发现妈妈已经把早餐准备好了,还特意煮了我最爱喝的红豆粥。虽然是很小的事情,但让我感受到了满满的爱意。",
    date: today,
    createdAt: new Date().toISOString()
  },
  {
    id: `entry-${Date.now()}-2`,
    topic: "你现在拥有的哪件物品,虽然不贵重,但让你感到生活很舒适?",
    content: "我的那个旧枕头,虽然已经用了好几年,但是睡起来特别舒服。每次出差回来,躺在自己的枕头上都觉得特别安心。",
    date: today,
    createdAt: new Date().toISOString()
  },
  {
    id: `entry-${Date.now()}-3`,
    topic: "过去一周,你用哪个小小的善举帮助了别人?感觉如何?",
    content: "昨天在地铁上给一位老奶奶让座,她对我微笑着说谢谢。虽然只是举手之劳,但看到她的笑容,我也感到很开心。",
    date: today,
    createdAt: new Date().toISOString()
  }
];

// Read existing entries
const storageFile = path.join(process.env.HOME, '.gratitude-journal-entries.json');
let allEntries = [];

if (fs.existsSync(storageFile)) {
  const data = fs.readFileSync(storageFile, 'utf8');
  allEntries = JSON.parse(data);
}

// Remove today's entries first
allEntries = allEntries.filter(e => e.date !== today);

// Add new entries
allEntries.push(...entries);

// Save
fs.writeFileSync(storageFile, JSON.stringify(allEntries, null, 2));

console.log(`✅ Created 3 test entries for ${today}`);
console.log('Entries:', entries.map(e => e.topic));
