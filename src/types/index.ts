export interface Word {
  id: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  hanViet?: string;
  isMastered?: boolean; // true = Đã thuộc, false = Chưa thuộc
  box?: number; // Tương thích dữ liệu cũ
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
  lastActiveDate: string; // Định dạng YYYY-MM-DD (ngày hoạt động gần nhất)
  lastActiveTimestamp?: number; // Timestamp chính xác của lần học gần nhất
  activeDates?: string[]; // Danh sách các ngày đã học (lịch sử chuyên cần)
  totalActiveDays?: number; // Tổng số ngày đã học từ trước đến nay
  createdAt: number;
}

export interface UserWordProgress {
  isMastered?: boolean; // true = Đã thuộc, false = Chưa thuộc
  box?: number; // Tương thích dữ liệu cũ
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
  settings?: any;
  rules?: ChineseRule[];
  measureWords?: ChineseMeasureWord[];
}

export type StudyDirection = 'hanzi-to-meaning' | 'meaning-to-hanzi' | 'audio-to-hanzi';
export type StudyFilter = 'due' | 'unmastered' | 'all' | 'starred' | 'mastered';

export type QuizQuestionType = 'hanzi-to-vi' | 'vi-to-hanzi' | 'audio-to-hanzi' | 'hanzi-to-pinyin';

export interface QuizQuestion {
  id: string;
  word: Word;
  type: QuizQuestionType;
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
  voiceURI?: string;
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

export type RuleCategory =
  | 'pronunciation'
  | 'time_numbers'
  | 'grammar'
  | 'vocabulary'
  | 'writing'
  | 'other';

export interface RuleExample {
  id?: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
  note?: string;
}

export interface RulePracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type?: 'pronunciation' | 'grammar' | 'application';
}

export interface ChineseRule {
  id: string;
  title: string;
  category: RuleCategory;
  formula?: string;
  summary: string;
  detail: string;
  examples: RuleExample[];
  exceptions?: string;
  tags: string[];
  isBuiltIn?: boolean;
  isMastered?: boolean;
  reviewCount?: number;
  correctCount?: number;
  wrongCount?: number;
  createdAt: number;
  updatedAt?: number;
  practiceQuestions?: RulePracticeQuestion[];
}

export interface UserRuleProgress {
  isMastered: boolean;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  lastTested?: number;
}

// ==================== CHINESE MEASURE WORDS (LƯỢNG TỪ / 量词) ====================
export type MeasureWordCategory =
  | 'objects'         // Đồ vật & Dụng cụ: 把, 张, 件...
  | 'animals'         // Động vật: 只, 条, 匹, 头...
  | 'clothing'        // Trang phục: 件, 条, 顶, 双, 套...
  | 'vehicles'        // Xe cộ: 辆, 架, 艘, 列...
  | 'plants_food'     // Thực vật & Thức ăn: 棵, 朵, 碗, 盘, 瓶...
  | 'body_abstract'   // Cơ thể, sự việc & Trừu tượng: 门, 件, 场, 次...
  | 'general'         // Thông dụng: 个...
  | 'animal'          // Động vật (alias)
  | 'shape_long'      // Dài, sợi, dải: 条, 根, 支, 道...
  | 'shape_flat'      // Phẳng, mỏng, tấm: 张, 片, 面, 幅, 扇...
  | 'shape_round'     // Hạt tròn, nhỏ, viên, miếng: 颗, 粒, 块...
  | 'plant'           // Cây cối, thực vật: 棵, 株, 朵, 束...
  | 'vehicle'         // Xe cộ, phương tiện (alias)
  | 'tool_handle'     // Đồ vật có cán/tay cầm: 把...
  | 'book_paper'      // Sách báo, văn bản: 本, 份, 封, 册...
  | 'building'        // Công trình, nhà cửa: 座, 栋, 幢, 间, 门...
  | 'container'       // Đồ chứa & Đo lường: 杯, 瓶, 碗, 盘, 盒, 桶...
  | 'pair_group'      // Đôi, cặp, nhóm: 双, 对, 群, 帮, 批...
  | 'people'          // Con người & Tôn xưng: 位, 名, 口...
  | 'action_time';    // Động lượng từ: 次, 趟, 遍, 场, 顿, 声...

export interface MeasureWordNounPair {
  id?: string;
  hanzi?: string;                 // Danh từ Hán tự, VD: "猫", "雨伞", "书"
  nounHanzi?: string;             // Alias for hanzi
  pinyin?: string;                // Pinyin có dấu, VD: "māo", "yǔsǎn", "shū"
  nounPinyin?: string;            // Alias for pinyin
  vietnamese?: string;            // Nghĩa tiếng Việt, VD: "con mèo", "chiếc ô", "cuốn sách"
  nounVietnamese?: string;        // Alias for vietnamese
  emoji?: string;                 // Biểu tượng minh họa, VD: "🐱", "☂️", "📖"
  commonRank?: number;
  exampleSentence?: string;       // Câu ví dụ đầy đủ: "我家养了一只猫。"
  examplePinyin?: string;         // Pinyin câu ví dụ: "Wǒ jiā yǎng le yì zhī māo."
  exampleTranslation?: string;    // Dịch câu ví dụ: "Nhà tôi nuôi một con mèo."
  alternativeMeasureWords?: string[]; // Lượng từ khác có thể dùng
  note?: string;                  // Ghi chú ngữ cảnh
}

export interface MeasureWordCollocation {
  phrase?: string;                // Cụm lượng từ + danh từ, VD: "一把雨伞"
  phraseHanzi?: string;           // Alias for phrase
  pinyin?: string;                // "yī bǎ yǔsǎn"
  phrasePinyin?: string;          // Alias for pinyin
  vietnamese?: string;            // "một chiếc ô"
  phraseVietnamese?: string;      // Alias for vietnamese
  context?: string;
}

export interface MeasureWordPracticeQuestion {
  id: string;
  question: string;               // "Chọn lượng từ thích hợp: 我买了一____电脑。"
  noun?: string;                  // Danh từ đích: "电脑"
  options: string[];              // ["台", "把", "张", "条"]
  correctAnswer: string;          // "台"
  explanation: string;            // Lời giải thích chi tiết
}

export interface ChineseMeasureWord {
  id: string;
  measureWord?: string;           // Chữ Hán lượng từ, VD: "把", "张", "条", "本", "只"
  word?: string;                  // Alias for measureWord (VD: "把", "张")
  pinyin: string;                 // Pinyin, VD: "bǎ", "zhāng", "tiáo", "běn", "zhī"
  hanViet?: string;               // Âm Hán Việt, VD: "Bả", "Trương", "Điều"
  vietnameseMeaning?: string;     // Nghĩa tiếng Việt, VD: "cái, chiếc (có cán, tay cầm)"
  vietnamese?: string;            // Alias for vietnameseMeaning
  category: MeasureWordCategory;
  commonLevel?: 'essential' | 'intermediate' | 'advanced';
  explanation: string;            // Bản chất & quy tắc dùng
  commonNouns?: MeasureWordNounPair[]; // Danh sách danh từ thường đi kèm
  pairedNouns?: MeasureWordNounPair[]; // Alias for commonNouns
  collocations: MeasureWordCollocation[]; // Cụm từ thông dụng nhất
  notesOrTips?: string;           // Mẹo ghi nhớ & phân biệt
  tips?: string;                  // Alias for notesOrTips
  sealChar?: string;
  order?: number;
  tags?: string[];
  isBuiltIn?: boolean;
  isMastered?: boolean;
  reviewCount?: number;
  correctCount?: number;
  wrongCount?: number;
  createdAt: number;
  updatedAt?: number;
  practiceQuestions?: MeasureWordPracticeQuestion[];
}

export interface UserMeasureWordProgress {
  isMastered: boolean;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  lastTested?: number;
}


