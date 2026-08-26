import express from 'express';
import { readDatabase, writeDatabase } from './db.js';
import { HSK1_LESSON_WORDS } from '../src/data/hsk1StarterWords.js';

export const apiRouter = express();

apiRouter.use(express.json());

// Support both /api/... and /...
const router = express.Router();

router.use(express.json());

// 1. Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// 2. Get full database state
router.get('/data', (req, res) => {
  const db = readDatabase();
  res.json(db);
});

// 3. Get shared words
router.get('/words', (req, res) => {
  const db = readDatabase();
  res.json(db.words || []);
});

// 4. Add a single shared word
router.post('/words', (req, res) => {
  const db = readDatabase();
  const wordData = req.body;
  const newWord = {
    id: wordData.id || `w-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    hanzi: wordData.hanzi?.trim() || '',
    pinyin: wordData.pinyin?.trim() || '',
    vietnamese: wordData.vietnamese?.trim() || '',
    hanViet: wordData.hanViet?.trim() || '',
    hskLevel: wordData.hskLevel || 1,
    lesson: wordData.lesson || 'Từ tự thêm',
    source: wordData.source || 'custom',
    exampleSentence: wordData.exampleSentence || '',
    examplePinyin: wordData.examplePinyin || '',
    exampleVietnamese: wordData.exampleVietnamese || '',
    radicals: wordData.radicals || '',
    mnemonic: wordData.mnemonic || '',
    createdAt: Date.now()
  };

  db.words = [newWord, ...(db.words || [])];
  writeDatabase(db);
  res.json({ success: true, word: newWord });
});

// 5. Add batch shared words
router.post('/words/batch', (req, res) => {
  const db = readDatabase();
  const { newWords } = req.body;
  if (!Array.isArray(newWords) || newWords.length === 0) {
    return res.status(400).json({ error: 'newWords must be a non-empty array' });
  }

  const prepared = newWords.map((item, idx) => ({
    id: item.id || `batch-${Date.now()}-${idx}`,
    hanzi: item.hanzi?.trim() || '',
    pinyin: item.pinyin?.trim() || '',
    vietnamese: item.vietnamese?.trim() || '',
    hanViet: item.hanViet?.trim() || '',
    hskLevel: item.hskLevel || 1,
    lesson: item.lesson || 'Thêm hàng loạt AI',
    source: item.source || 'ai',
    exampleSentence: item.exampleSentence || '',
    examplePinyin: item.examplePinyin || '',
    exampleVietnamese: item.exampleVietnamese || '',
    radicals: item.radicals || '',
    mnemonic: item.mnemonic || '',
    createdAt: Date.now()
  }));

  db.words = [...prepared, ...(db.words || [])];
  writeDatabase(db);
  res.json({ success: true, count: prepared.length, words: prepared });
});

// 6. Update shared word
router.put('/words/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = readDatabase();
  const idx = db.words.findIndex(w => w.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Word not found' });
  }

  db.words[idx] = { ...db.words[idx], ...updates };
  writeDatabase(db);
  res.json({ success: true, word: db.words[idx] });
});

// 7. Delete shared word
router.delete('/words/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.words = db.words.filter(w => w.id !== id);

  if (db.userProgress) {
    Object.keys(db.userProgress).forEach(uid => {
      if (db.userProgress[uid] && db.userProgress[uid][id]) {
        delete db.userProgress[uid][id];
      }
    });
  }

  writeDatabase(db);
  res.json({ success: true });
});

// 8. Get users
router.get('/users', (req, res) => {
  const db = readDatabase();
  res.json(db.users || []);
});

// 9. Create or login User
router.post('/users', (req, res) => {
  const { name, avatar } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const db = readDatabase();
  const trimmedName = name.trim();

  let user = (db.users || []).find(u => u.name.toLowerCase() === trimmedName.toLowerCase());
  if (!user) {
    user = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      avatar: avatar || '🐼',
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };
    db.users = [...(db.users || []), user];
    if (!db.userProgress[user.id]) {
      db.userProgress[user.id] = {};
    }
    writeDatabase(db);
  }

  res.json({ success: true, user });
});

// 10. Rename / Update User profile
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, avatar } = req.body;
  const db = readDatabase();

  const idx = (db.users || []).findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name && name.trim()) {
    db.users[idx].name = name.trim();
  }
  if (avatar) {
    db.users[idx].avatar = avatar;
  }

  writeDatabase(db);
  res.json({ success: true, user: db.users[idx] });
});

// 11. Delete User profile
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const db = readDatabase();
  db.users = (db.users || []).filter(u => u.id !== id);
  if (db.userProgress && db.userProgress[id]) {
    delete db.userProgress[id];
  }
  writeDatabase(db);
  res.json({ success: true });
});

// 12. Update User's Word Progress
router.post('/users/:userId/progress', (req, res) => {
  const { userId } = req.params;
  const { wordId, box, isStarred, remembered, lastReviewed } = req.body;

  if (!wordId) {
    return res.status(400).json({ error: 'wordId is required' });
  }

  const db = readDatabase();
  if (!db.userProgress) db.userProgress = {};
  if (!db.userProgress[userId]) db.userProgress[userId] = {};

  const current = db.userProgress[userId][wordId] || {
    box: 1,
    isStarred: false,
    reviewCount: 0,
    correctCount: 0,
    wrongCount: 0,
    lastReviewed: null
  };

  if (box !== undefined) current.box = box;
  if (isStarred !== undefined) current.isStarred = isStarred;
  if (lastReviewed !== undefined) current.lastReviewed = lastReviewed;

  if (remembered !== undefined) {
    current.reviewCount = (current.reviewCount || 0) + 1;
    if (remembered) {
      current.correctCount = (current.correctCount || 0) + 1;
      current.box = Math.min(5, (current.box || 1) + 1);
    } else {
      current.wrongCount = (current.wrongCount || 0) + 1;
      current.box = 1;
    }
    current.lastReviewed = Date.now();
  }

  db.userProgress[userId][wordId] = current;
  writeDatabase(db);
  res.json({ success: true, progress: current });
});

// 13. Update User's Streak & Stats
router.put('/users/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const { streakDays, lastActiveDate } = req.body;
  const db = readDatabase();

  const user = (db.users || []).find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (streakDays !== undefined) user.streakDays = streakDays;
  if (lastActiveDate !== undefined) user.lastActiveDate = lastActiveDate;

  writeDatabase(db);
  res.json({ success: true, user });
});

// 14. Reset to Default HSK 1 Words
router.post('/reset-hsk1', (req, res) => {
  const db = readDatabase();
  db.words = HSK1_LESSON_WORDS.map(w => ({ ...w, source: 'hsk1' }));
  writeDatabase(db);
  res.json({ success: true, count: db.words.length });
});

// Mount router on both '/' and '/api'
apiRouter.use('/api', router);
apiRouter.use('/', router);
