import express from 'express';
import { connectToDatabase } from './mongodb.js';
import { HSK1_ALL_LESSONS } from './hsk1StarterData.js';

export const apiRouter = express();

apiRouter.use(express.json({ limit: '10mb' }));

const router = express.Router();
router.use(express.json({ limit: '10mb' }));

// Prevent any caching on API endpoints
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ==================== HELPER: MULTI-KEY POOL & ROTATION ====================
function getServerKeyPool() {
  const raw = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  return raw
    .split(/[,;\n]+/)
    .map(k => k.trim())
    .filter(k => k.length > 0);
}

let serverActiveKeyIndex = 0;

function getActiveServerKey(clientKey) {
  if (clientKey && typeof clientKey === 'string' && clientKey.trim().length > 0) {
    return clientKey.trim();
  }
  const pool = getServerKeyPool();
  if (pool.length === 0) return '';
  if (serverActiveKeyIndex >= pool.length) {
    serverActiveKeyIndex = 0;
  }
  return pool[serverActiveKeyIndex];
}

function rotateServerKey() {
  const pool = getServerKeyPool();
  if (pool.length <= 1) return null;
  serverActiveKeyIndex = (serverActiveKeyIndex + 1) % pool.length;
  console.log(`[AI Server Pool] Đã xoay sang Key #${serverActiveKeyIndex + 1}/${pool.length}`);
  return pool[serverActiveKeyIndex];
}

// 1. Health check
router.get('/health', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    await db.command({ ping: 1 });
    res.json({ status: 'ok', database: 'mongodb', time: Date.now() });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 2. Get full database state (Words sorted newest first)
router.get('/data', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const [words, users, progressList, settingsDoc] = await Promise.all([
      db.collection('words').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1, _id: -1 }).toArray(),
      db.collection('users').find({}, { projection: { _id: 0 } }).toArray(),
      db.collection('user_progress').find({}, { projection: { _id: 0 } }).toArray(),
      db.collection('settings').findOne({ id: 'app_settings' }, { projection: { _id: 0 } })
    ]);

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

// 3. Get shared words (Words sorted newest first)
router.get('/words', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const words = await db.collection('words').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1, _id: -1 }).toArray();
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch words', details: err.message });
  }
});

// 4. Add a single shared word (Prevent duplicates by Hanzi)
router.post('/words', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const wordData = req.body;
    const hanzi = wordData.hanzi?.trim() || '';

    if (!hanzi) {
      return res.status(400).json({ error: 'Chữ Hán không được để trống' });
    }

    const wordsCol = db.collection('words');
    const existing = await wordsCol.findOne({ hanzi });

    if (existing) {
      return res.status(409).json({
        error: `Chữ "${hanzi}" đã tồn tại trong danh sách từ vựng!`,
        code: 'WORD_ALREADY_EXISTS',
        existingWord: existing
      });
    }

    const now = Date.now();
    const newWord = {
      id: wordData.id || `w-${now}-${Math.random().toString(36).substring(2, 6)}`,
      hanzi,
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
      createdAt: wordData.createdAt || now
    };

    await wordsCol.insertOne(newWord);
    const { _id, ...cleanWord } = newWord;
    res.status(201).json({ success: true, word: cleanWord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add word', details: err.message });
  }
});

// 5. Add batch words (High-speed indexed lookup to prevent duplicates)
router.post('/words/batch', async (req, res) => {
  try {
    const { words: newWords } = req.body;
    if (!Array.isArray(newWords) || newWords.length === 0) {
      return res.status(400).json({ error: 'Invalid words array' });
    }

    const { db } = await connectToDatabase();
    const wordsCol = db.collection('words');

    // Extract all non-empty hanzis
    const candidateHanzis = newWords
      .map(w => w.hanzi?.trim())
      .filter(Boolean);

    // Optimized: Only query candidate hanzis with indexed $in lookup (O(1)) instead of loading entire collection
    const existingMatches = await wordsCol
      .find({ hanzi: { $in: candidateHanzis } }, { projection: { hanzi: 1 } })
      .toArray();
    const existingHanzis = new Set(existingMatches.map(w => w.hanzi));

    // Filter duplicates within incoming list and against database
    const seenIncoming = new Set();
    const uniqueIncoming = [];

    for (const w of newWords) {
      const hanzi = w.hanzi?.trim();
      if (hanzi && !existingHanzis.has(hanzi) && !seenIncoming.has(hanzi)) {
        seenIncoming.add(hanzi);
        uniqueIncoming.push(w);
      }
    }

    if (uniqueIncoming.length === 0) {
      return res.json({ success: true, count: 0, words: [] });
    }

    const now = Date.now();
    const formattedWords = uniqueIncoming.map((w, index) => ({
      id: w.id || `w-batch-${now}-${index}-${Math.random().toString(36).substring(2, 5)}`,
      hanzi: w.hanzi.trim(),
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
      createdAt: now + index
    }));

    await wordsCol.insertMany(formattedWords, { ordered: false });
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

    await Promise.all([
      db.collection('words').deleteOne({ id }),
      db.collection('user_progress').deleteMany({ wordId: id })
    ]);

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
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
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

    await Promise.all([
      db.collection('users').deleteOne({ id }),
      db.collection('user_progress').deleteMany({ userId: id })
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});

// 12. Save Single User Word Progress (Supports both nested progress and flat fields)
router.post('/progress', async (req, res) => {
  try {
    const { userId, wordId } = req.body;
    const p = req.body.progress || req.body;

    if (!userId || !wordId) {
      return res.status(400).json({ error: 'userId and wordId are required' });
    }

    const updateFields = {
      userId,
      wordId,
      updatedAt: Date.now()
    };
    if (p.box !== undefined) updateFields.box = p.box;
    if (p.isStarred !== undefined) updateFields.isStarred = p.isStarred;
    if (p.reviewCount !== undefined) updateFields.reviewCount = p.reviewCount;
    if (p.correctCount !== undefined) updateFields.correctCount = p.correctCount;
    if (p.wrongCount !== undefined) updateFields.wrongCount = p.wrongCount;
    if (p.lastReviewed !== undefined) updateFields.lastReviewed = p.lastReviewed;

    const { db } = await connectToDatabase();
    await db.collection('user_progress').updateOne(
      { userId, wordId },
      {
        $set: updateFields,
        $setOnInsert: {
          box: 1,
          isStarred: false,
          reviewCount: 0,
          correctCount: 0,
          wrongCount: 0,
          lastReviewed: null
        }
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress', details: err.message });
  }
});

// 13. Batch Save User Word Progress (Using MongoDB bulkWrite for ultra-fast performance)
router.post('/progress/batch', async (req, res) => {
  try {
    const { userId, updates } = req.body;
    if (!userId || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'userId and valid updates array are required' });
    }

    const { db } = await connectToDatabase();
    const progressCol = db.collection('user_progress');
    const now = Date.now();

    const bulkOps = updates.map(item => {
      const p = item.progress || item;
      const updateFields = {
        userId,
        wordId: item.wordId,
        updatedAt: now
      };
      if (p.box !== undefined) updateFields.box = p.box;
      if (p.isStarred !== undefined) updateFields.isStarred = p.isStarred;
      if (p.reviewCount !== undefined) updateFields.reviewCount = p.reviewCount;
      if (p.correctCount !== undefined) updateFields.correctCount = p.correctCount;
      if (p.wrongCount !== undefined) updateFields.wrongCount = p.wrongCount;
      if (p.lastReviewed !== undefined) updateFields.lastReviewed = p.lastReviewed;

      return {
        updateOne: {
          filter: { userId, wordId: item.wordId },
          update: {
            $set: updateFields,
            $setOnInsert: {
              box: 1,
              isStarred: false,
              reviewCount: 0,
              correctCount: 0,
              wrongCount: 0,
              lastReviewed: null
            }
          },
          upsert: true
        }
      };
    });

    const result = await progressCol.bulkWrite(bulkOps, { ordered: false });
    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to batch save progress', details: err.message });
  }
});

// 14. Update User Streak
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

// 15. Reset to Starter HSK 1 Words (Bài 1, 2, 3)
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

    await wordsCol.insertMany(starterWords, { ordered: false });
    res.json({ success: true, count: starterWords.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset HSK1 words', details: err.message });
  }
});

// ==================== 16. SERVER-SIDE AI PROXY (MULTI-KEY & SECURE STREAMING) ====================

// AI Proxy Health Check
router.get('/ai/health', async (_req, res) => {
  const pool = getServerKeyPool();
  res.json({
    status: pool.length > 0 ? 'ready' : 'missing_key',
    keyCount: pool.length,
    activeKeyIndex: (serverActiveKeyIndex % Math.max(1, pool.length)) + 1,
    model: process.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite'
  });
});

// Realtime Server-Sent Events (SSE) AI Streaming Proxy
router.post('/ai/generate-stream', async (req, res) => {
  const { prompt, model, isJson, apiKey: clientApiKey } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt không được để trống' });
  }

  const pool = clientApiKey ? [clientApiKey.trim()] : getServerKeyPool();
  if (pool.length === 0) {
    return res.status(400).json({ error: 'Chưa cấu hình Google Gemini API Key trên server hoặc cài đặt.' });
  }

  const targetModel = (model || process.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite').replace(/^models\//, '');

  // Setup Server-Sent Events Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform, no-store');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  let success = false;
  let attempts = 0;
  const maxAttempts = pool.length;

  while (attempts < maxAttempts && !success) {
    const currentKey = pool[serverActiveKeyIndex % pool.length];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?key=${currentKey}&alt=sse`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            ...(isJson ? { responseMimeType: 'application/json' } : {})
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        if ((response.status === 429 || response.status === 403) && pool.length > 1) {
          console.warn(`[AI Stream Proxy] Key #${(serverActiveKeyIndex % pool.length) + 1} quá tải (${response.status}). Chuyển sang key tiếp theo...`);
          serverActiveKeyIndex++;
          attempts++;
          continue;
        }

        const errText = await response.text();
        res.write(`event: error\ndata: ${JSON.stringify({ error: `Gemini API Error: ${errText}` })}\n\n`);
        return res.end();
      }

      if (!response.body) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'Không nhận được dữ liệu stream' })}\n\n`);
        return res.end();
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
        if (typeof res.flush === 'function') {
          res.flush();
        }
      }

      res.write('\nevent: done\ndata: [DONE]\n\n');
      res.end();
      success = true;
      return;
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      serverActiveKeyIndex++;
      attempts++;
      if (attempts >= maxAttempts) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
        return res.end();
      }
    }
  }
});

// Non-streaming AI Proxy with Multi-Key Rotation and Auto-Timeout
router.post('/ai/generate', async (req, res) => {
  try {
    const { prompt, model, isJson, apiKey: clientApiKey } = req.body;
    const pool = clientApiKey ? [clientApiKey.trim()] : getServerKeyPool();

    if (pool.length === 0) {
      return res.status(400).json({ error: 'Chưa cấu hình Google Gemini API Key trên server hoặc cài đặt.' });
    }

    const targetModel = (model || process.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite').replace(/^models\//, '');
    let attempts = 0;
    const maxAttempts = pool.length;
    let lastError = null;

    while (attempts < maxAttempts) {
      const currentKey = pool[serverActiveKeyIndex % pool.length];
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${currentKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              ...(isJson ? { responseMimeType: 'application/json' } : {})
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          if ((response.status === 429 || response.status === 403) && pool.length > 1) {
            console.warn(`[AI Proxy] Key #${(serverActiveKeyIndex % pool.length) + 1} gặp lỗi ${response.status}. Thử key tiếp theo...`);
            serverActiveKeyIndex++;
            attempts++;
            continue;
          }
          const errText = await response.text();
          return res.status(response.status).json({ error: 'Gemini API Error', details: errText });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.json({ success: true, text });
      } catch (err) {
        lastError = err;
        serverActiveKeyIndex++;
        attempts++;
      }
    }

    return res.status(500).json({
      error: 'Tất cả API keys đều bị lỗi hoặc hết quota hôm nay',
      details: lastError?.message
    });
  } catch (err) {
    console.error('[AI Proxy Error]:', err);
    res.status(500).json({ error: 'Lỗi khi gọi AI Proxy từ server', details: err.message });
  }
});

// Mount router on both '/' and '/api'
apiRouter.use('/api', router);
apiRouter.use('/', router);
