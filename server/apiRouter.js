import express from 'express';
import { connectToDatabase } from './mongodb.js';
import { HSK1_ALL_LESSONS } from './hsk1StarterData.js';

export const apiRouter = express();

apiRouter.use(express.json());

const router = express.Router();
router.use(express.json());

// 1. Health check
router.get('/health', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    res.json({ status: 'ok', database: 'mongodb', time: Date.now() });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 2. Get full database state
router.get('/data', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const words = await db.collection('words').find({}, { projection: { _id: 0 } }).toArray();
    const users = await db.collection('users').find({}, { projection: { _id: 0 } }).toArray();
    const progressList = await db.collection('user_progress').find({}, { projection: { _id: 0 } }).toArray();
    const settingsDoc = await db.collection('settings').findOne({ id: 'app_settings' }, { projection: { _id: 0 } });

    // Map user progress to { [userId]: { [wordId]: progress } }
    const userProgress = {};
    for (const item of progressList) {
      if (!userProgress[item.userId]) {
        userProgress[item.userId] = {};
      }
      userProgress[item.userId][item.wordId] = {
        box: item.box ?? 1,
        isStarred: item.isStarred ?? false,
        reviewCount: item.reviewCount ?? 0,
        correctCount: item.correctCount ?? 0,
        wrongCount: item.wrongCount ?? 0,
        lastReviewed: item.lastReviewed ?? null
      };
    }

    res.json({
      words,
      users,
      userProgress,
      settings: settingsDoc?.settings || null
    });
  } catch (err) {
    console.error('[API /data] Error:', err);
    res.status(500).json({ error: 'Failed to fetch database data', details: err.message });
  }
});

// 3. Get shared words
router.get('/words', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const words = await db.collection('words').find({}, { projection: { _id: 0 } }).toArray();
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch words', details: err.message });
  }
});

// 4. Add a single shared word
router.post('/words', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const wordData = req.body;
    const newWord = {
      id: wordData.id || `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      hanzi: wordData.hanzi?.trim() || '',
      pinyin: wordData.pinyin?.trim() || '',
      vietnamese: wordData.vietnamese?.trim() || '',
      hanViet: wordData.hanViet?.trim() || '',
      exampleSentence: wordData.exampleSentence?.trim() || '',
      examplePinyin: wordData.examplePinyin?.trim() || '',
      exampleVietnamese: wordData.exampleVietnamese?.trim() || '',
      radicals: wordData.radicals?.trim() || '',
      mnemonic: wordData.mnemonic?.trim() || '',
      hskLevel: wordData.hskLevel || 1,
      lesson: wordData.lesson || 'Từ tự thêm',
      source: wordData.source || 'custom',
      box: wordData.box || 1,
      isStarred: Boolean(wordData.isStarred),
      reviewCount: wordData.reviewCount || 0,
      correctCount: wordData.correctCount || 0,
      wrongCount: wordData.wrongCount || 0,
      createdAt: wordData.createdAt || Date.now()
    };

    await db.collection('words').insertOne(newWord);
    const { _id, ...cleanWord } = newWord;
    res.status(201).json({ success: true, word: cleanWord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add word', details: err.message });
  }
});

// 5. Add batch words
router.post('/words/batch', async (req, res) => {
  try {
    const { words: newWords } = req.body;
    if (!Array.isArray(newWords) || newWords.length === 0) {
      return res.status(400).json({ error: 'Invalid words array' });
    }

    const { db } = await connectToDatabase();
    const formattedWords = newWords.map((w, index) => ({
      id: w.id || `w-batch-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 5)}`,
      hanzi: w.hanzi?.trim() || '',
      pinyin: w.pinyin?.trim() || '',
      vietnamese: w.vietnamese?.trim() || '',
      hanViet: w.hanViet?.trim() || '',
      exampleSentence: w.exampleSentence?.trim() || '',
      examplePinyin: w.examplePinyin?.trim() || '',
      exampleVietnamese: w.exampleVietnamese?.trim() || '',
      radicals: w.radicals?.trim() || '',
      mnemonic: w.mnemonic?.trim() || '',
      hskLevel: w.hskLevel || 1,
      lesson: w.lesson || 'Từ tự thêm (Bulk)',
      source: w.source || 'ai',
      box: 1,
      isStarred: false,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      createdAt: Date.now()
    }));

    await db.collection('words').insertMany(formattedWords);
    res.status(201).json({ success: true, count: formattedWords.length, words: formattedWords });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add batch words', details: err.message });
  }
});

// 6. Update a word
router.put('/words/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id;
    delete updates.id;

    const { db } = await connectToDatabase();
    const result = await db.collection('words').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after', projection: { _id: 0 } }
    );

    if (!result) {
      return res.status(404).json({ error: 'Word not found' });
    }

    res.json({ success: true, word: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update word', details: err.message });
  }
});

// 7. Delete shared word
router.delete('/words/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = await connectToDatabase();

    await db.collection('words').deleteOne({ id });
    await db.collection('user_progress').deleteMany({ wordId: id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete word', details: err.message });
  }
});

// 8. Get users
router.get('/users', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const users = await db.collection('users').find({}, { projection: { _id: 0 } }).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// 9. Create or login User
router.post('/users', async (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { db } = await connectToDatabase();
    const trimmedName = name.trim();

    let user = await db.collection('users').findOne({ name: trimmedName }, { projection: { _id: 0 } });
    if (!user) {
      const newUser = {
        id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: trimmedName,
        avatar: avatar || '🐉',
        streakDays: 1,
        lastActiveDate: new Date().toISOString()
      };
      await db.collection('users').insertOne(newUser);
      const { _id, ...cleanUser } = newUser;
      user = cleanUser;
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// 10. Update user profile
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (avatar) updates.avatar = avatar;

    const { db } = await connectToDatabase();
    const result = await db.collection('users').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after', projection: { _id: 0 } }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
});

// 11. Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = await connectToDatabase();

    await db.collection('users').deleteOne({ id });
    await db.collection('user_progress').deleteMany({ userId: id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});

// 12. Save User Word Progress (SRS Flashcard Learning State)
router.post('/progress', async (req, res) => {
  try {
    const { userId, wordId, progress } = req.body;
    if (!userId || !wordId || !progress) {
      return res.status(400).json({ error: 'userId, wordId, and progress are required' });
    }

    const { db } = await connectToDatabase();
    await db.collection('user_progress').updateOne(
      { userId, wordId },
      {
        $set: {
          userId,
          wordId,
          box: progress.box ?? 1,
          isStarred: progress.isStarred ?? false,
          reviewCount: progress.reviewCount ?? 0,
          correctCount: progress.correctCount ?? 0,
          wrongCount: progress.wrongCount ?? 0,
          lastReviewed: progress.lastReviewed ?? Date.now(),
          updatedAt: Date.now()
        }
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress', details: err.message });
  }
});

// 13. Update User Streak
router.put('/users/:id/streak', async (req, res) => {
  try {
    const { id } = req.params;
    const { streakDays, lastActiveDate } = req.body;

    const updates = {};
    if (streakDays !== undefined) updates.streakDays = streakDays;
    if (lastActiveDate !== undefined) updates.lastActiveDate = lastActiveDate;

    const { db } = await connectToDatabase();
    const result = await db.collection('users').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after', projection: { _id: 0 } }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update streak', details: err.message });
  }
});

// 14. Reset to Starter HSK 1 Words (Bài 1, 2, 3)
router.post('/reset-hsk1', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const wordsCol = db.collection('words');

    await wordsCol.deleteMany({});
    const starterLessons = HSK1_ALL_LESSONS.filter(l => l.lessonNumber <= 3);
    const starterWords = starterLessons.flatMap(lesson =>
      lesson.words.map(w => ({
        id: w.id,
        hanzi: w.hanzi,
        pinyin: w.pinyin,
        vietnamese: w.vietnamese,
        hanViet: w.hanViet || '',
        exampleSentence: w.exampleSentence || '',
        examplePinyin: w.examplePinyin || '',
        exampleVietnamese: w.exampleVietnamese || '',
        radicals: w.radicals || '',
        mnemonic: w.mnemonic || '',
        hskLevel: w.hskLevel || 1,
        lesson: w.lesson || `HSK 1 - Bài ${lesson.lessonNumber}`,
        source: 'hsk1',
        box: 1,
        isStarred: false,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        createdAt: Date.now()
      }))
    );

    await wordsCol.insertMany(starterWords);
    res.json({ success: true, count: starterWords.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset HSK1 words', details: err.message });
  }
});

// Mount router on both '/' and '/api'
apiRouter.use('/api', router);
apiRouter.use('/', router);
