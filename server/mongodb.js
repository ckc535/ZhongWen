import { MongoClient } from 'mongodb';
import { HSK1_ALL_LESSONS } from './hsk1StarterData.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = 'zhongwen';

let cachedClient = null;
let cachedDb = null;

/**
 * Connect to MongoDB Atlas with connection caching for Serverless and Node server
 */
export async function connectToDatabase() {
  if (cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    });

    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    console.log(`[MongoDB] Connected successfully to database: "${DB_NAME}"`);

    // Ensure database has default words if empty
    await seedWordsIfEmpty(db);

    return { client, db };
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
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
      console.log('[MongoDB] Seeding starter HSK 1 words (Bài 1, 2, 3)...');
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
      console.log(`[MongoDB] Successfully seeded ${starterWords.length} starter words.`);
    }
  } catch (err) {
    console.error('[MongoDB] Seeding error:', err);
  }
}
