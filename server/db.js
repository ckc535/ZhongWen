import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HSK1_LESSON_WORDS } from '../src/data/hsk1StarterWords.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial DB template
function getInitialData() {
  return {
    words: HSK1_LESSON_WORDS.map(w => ({ ...w, source: 'hsk1' })),
    users: [
      {
        id: 'user-1',
        name: 'Người học 1',
        avatar: '🐼',
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        createdAt: Date.now()
      }
    ],
    userProgress: {}
  };
}

// Read database
export function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.words || !Array.isArray(parsed.words)) {
      parsed.words = HSK1_LESSON_WORDS.map(w => ({ ...w, source: 'hsk1' }));
    }
    if (!parsed.users || !Array.isArray(parsed.users)) {
      parsed.users = getInitialData().users;
    }
    if (!parsed.userProgress || typeof parsed.userProgress !== 'object') {
      parsed.userProgress = {};
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return getInitialData();
  }
}

// Write database
export function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}
