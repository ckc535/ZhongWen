import { MongoClient } from 'mongodb';
import { HSK1_ALL_LESSONS } from '../server/hsk1StarterData.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'zhongwen';

async function seed() {
  console.log(`[Seed] Connecting to MongoDB Atlas: ${DB_NAME}...`);
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('[Seed] Connected successfully.');

    // 1. Filter only Lessons 1 to 3
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

    // 2. Reset words collection with Lessons 1-3
    const wordsCol = db.collection('words');
    await wordsCol.deleteMany({});
    console.log('[Seed] Cleared existing words.');

    const insertResult = await wordsCol.insertMany(starterWords);
    console.log(`[Seed] Inserted ${insertResult.insertedCount} words (Bài 1, 2, 3) successfully.`);

    // 3. Clear users and progress so user adds fresh profile
    const usersCol = db.collection('users');
    await usersCol.deleteMany({});
    console.log('[Seed] Cleared all users (ready for user to add fresh profile).');

    const progressCol = db.collection('user_progress');
    await progressCol.deleteMany({});
    console.log('[Seed] Cleared all user progress.');

    console.log(`\n✅ SEEDING COMPLETE! Only Lessons 1, 2, 3 (${starterWords.length} words) are added to MongoDB Atlas.`);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();
