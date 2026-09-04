import { MongoClient } from 'mongodb';
import { HSK1_ALL_LESSONS } from './hsk1StarterData.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = 'zhongwen';

let cachedClient = null;
let cachedDb = null;
let indexesEnsured = false;

/**
 * Ensures optimal MongoDB Indexes for O(1) lookups and data integrity
 */
export async function ensureIndexes(db) {
  if (indexesEnsured) return;
  try {
    const wordsCol = db.collection('words');
    const progressCol = db.collection('user_progress');
    const usersCol = db.collection('users');

    await Promise.allSettled([
      // Words collection indexes
      wordsCol.createIndex({ hanzi: 1 }, { unique: true, sparse: true, background: true }),
      wordsCol.createIndex({ id: 1 }, { unique: true, background: true }),
      wordsCol.createIndex({ createdAt: -1 }, { background: true }),
      wordsCol.createIndex({ box: 1 }, { background: true }),
      wordsCol.createIndex({ hskLevel: 1 }, { background: true }),

      // User Progress collection indexes
      progressCol.createIndex({ userId: 1, wordId: 1 }, { unique: true, background: true }),
      progressCol.createIndex({ userId: 1 }, { background: true }),
      progressCol.createIndex({ wordId: 1 }, { background: true }),

      // Users collection indexes
      usersCol.createIndex({ name: 1 }, { unique: true, background: true }),
      usersCol.createIndex({ id: 1 }, { unique: true, background: true })
    ]);

    indexesEnsured = true;
    console.log('[MongoDB] ✅ Tất cả Database Indexes đã được cấu hình tối ưu.');
  } catch (err) {
    console.warn('[MongoDB] Cảnh báo khi khởi tạo indexes:', err.message);
  }
}

/**
 * Connect to MongoDB Atlas with connection caching & auto-reconnection for Serverless and Node server
 */
export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI chưa được cấu hình trong biến môi trường (.env).');
  }

  // If already cached, check health with ping
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.command({ ping: 1 });
      return { client: cachedClient, db: cachedDb };
    } catch {
      console.warn('[MongoDB] Kết nối cache bị gián đoạn, đang tái tạo kết nối mới...');
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000
    });

    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    console.log(`[MongoDB] 🟢 Kết nối thành công tới database: "${DB_NAME}"`);

    // Ensure starter words and indexes
    seedWordsIfEmpty(db).catch(err => console.error('[MongoDB Seeding Error]:', err));
    ensureIndexes(db).catch(err => console.error('[MongoDB Index Error]:', err));

    return { client, db };
  } catch (error) {
    console.error('[MongoDB] 🔴 Lỗi kết nối MongoDB Atlas:', error.message);
    throw error;
  }
}

/**
 * Seed initial starter HSK1 words (Bài 1 - 3) if collection is empty
 */
export async function seedWordsIfEmpty(db) {
  try {
    const wordsCol = db.collection('words');
    const wordsCount = await wordsCol.countDocuments();

    if (wordsCount === 0) {
      console.log('[MongoDB] Đang nạp từ vựng khởi đầu HSK 1 (Bài 1, 2, 3)...');
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

      if (starterWords.length > 0) {
        await wordsCol.insertMany(starterWords, { ordered: false });
        console.log(`[MongoDB] ✅ Nạp thành công ${starterWords.length} từ vựng ban đầu.`);
      }
    }
  } catch (err) {
    console.error('[MongoDB] Lỗi trong quá trình nạp dữ liệu ban đầu:', err);
  }
}
