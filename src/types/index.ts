export interface Word {
  id: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  hanViet?: string;
  box: number; // 1 to 5 (Leitner SRS)
  isStarred: boolean;
  hskLevel?: number;
  lesson?: string;
  source?: 'hsk1' | 'custom' | 'ai';
  exampleSentence?: string;
  examplePinyin?: string;
  exampleVietnamese?: string;
  radicals?: string;
  mnemonic?: string;
  lastReviewed?: number;
  nextReview?: number;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string; // Emoji avatar e.g. 🐼, 🐉, 🐯, 🦊, 🐰, 🎋
  streakDays: number;
  lastActiveDate: string;
  createdAt: number;
}

export interface UserWordProgress {
  box: number; // 1 to 5
  isStarred: boolean;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  lastReviewed?: number | null;
}

export interface DatabaseSchema {
  words: Word[];
  users: UserProfile[];
  userProgress: Record<string, Record<string, UserWordProgress>>; // userId -> wordId -> progress
}

export type StudyDirection = 'hanzi-to-meaning' | 'meaning-to-hanzi' | 'audio-to-hanzi';
export type StudyFilter = 'unmastered' | 'all' | 'starred' | 'mastered';

export interface QuizQuestion {
  id: string;
  word: Word;
  type: 'hanzi-to-vi' | 'vi-to-hanzi' | 'audio-to-hanzi' | 'hanzi-to-pinyin';
  question: string;
  audioText?: string;
  correctAnswer: string;
  options: string[];
  explanation?: string;
}

export interface StoryToken {
  hanzi: string;
  pinyin: string;
  vietnamese?: string;
}

export interface StorySentence {
  chinese: string;
  pinyin: string;
  vietnamese: string;
  speaker?: string; // e.g. "A", "B", "David", "Li Yue" for dialogue
  tokens?: StoryToken[];
}

export interface DetectedNewWord {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  hanViet?: string;
  radicals?: string;
  mnemonic?: string;
  exampleSentence?: string;
  examplePinyin?: string;
  exampleVietnamese?: string;
  isAlreadyAdded?: boolean;
}

export interface StoryPassage {
  id: string;
  title: string;
  titlePinyin: string;
  titleVietnamese: string;
  chineseText: string;
  pinyinText: string;
  vietnameseTranslation: string;
  format: 'dialogue' | 'article';
  sentences: StorySentence[];
  newWordsDetected: DetectedNewWord[];
  topic: string;
  createdAt: number;
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  voicePitch: number;
  voiceRate: number;
  soundEffects: boolean;
  dailyTarget: number;
}

export interface HskLessonPackage {
  lessonNumber: number;
  title: string;
  hanziTitle: string;
  description: string;
  words: Omit<Word, 'box' | 'isStarred' | 'reviewCount' | 'correctCount' | 'wrongCount' | 'createdAt'>[];
}

export interface StudyStats {
  streakDays: number;
  lastActiveDate: string;
  totalReviewsToday: number;
  masteredCount: number;
}
