import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Word, UserProfile, UserWordProgress, AppSettings, StudyStats, ChineseRule, ChineseMeasureWord } from '../types';
import { CHINESE_RULES_STARTER_DATA } from '../data/chineseRulesStarterData';
import { CHINESE_MEASURE_WORDS_STARTER_DATA } from '../data/chineseMeasureWordsStarterData';
import { soundEffects } from '../services/soundEffects';
import { ApiService } from '../services/apiService';
import { GeminiService } from '../services/geminiService';
import { tts } from '../services/ttsService';

export type AppTabType = 'study' | 'words' | 'rules' | 'measure_words' | 'stories' | 'quiz' | 'writer';

interface AppContextType {
  // Word & Study
  words: Word[];
  dueWordsCount: number;
  unmasteredWordsCount: number;
  masteredWordsCount: number;
  totalWordsCount: number;
  starredWordsCount: number;
  hsk1WordsCount: number;
  customWordsCount: number;

  // Chinese Rules (Quy tắc tiếng Trung)
  rules: ChineseRule[];
  rulesCount: number;
  masteredRulesCount: number;
  addRule: (rule: Partial<ChineseRule>) => Promise<ChineseRule>;
  updateRule: (id: string, updates: Partial<ChineseRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRuleMastered: (id: string) => Promise<void>;
  recordRuleTest: (ruleId: string, isCorrect: boolean) => Promise<void>;
  resetRulesToDefault: () => Promise<void>;

  // Chinese Measure Words (Lượng từ tiếng Trung)
  measureWords: ChineseMeasureWord[];
  measureWordsCount: number;
  masteredMeasureWordsCount: number;
  addMeasureWord: (mw: Partial<ChineseMeasureWord>) => Promise<ChineseMeasureWord>;
  updateMeasureWord: (id: string, updates: Partial<ChineseMeasureWord>) => Promise<void>;
  deleteMeasureWord: (id: string) => Promise<void>;
  toggleMeasureWordMastered: (id: string) => Promise<void>;
  recordMeasureWordQuiz: (id: string, isCorrect: boolean) => Promise<void>;
  resetMeasureWordsToDefault: () => Promise<void>;

  // User management
  currentUser: UserProfile | null;
  users: UserProfile[];
  effectiveStreak: number;
  isStudiedToday: boolean;
  setCurrentUser: (user: UserProfile | null) => void;
  createNewUser: (name: string, avatar?: string) => Promise<UserProfile | null>;
  renameCurrentUser: (newName: string, avatar?: string) => Promise<UserProfile | null>;
  deleteUserProfile: (id: string) => Promise<boolean>;

  // Word actions (Shared Database)
  addWord: (word: Partial<Word>) => Promise<Word>;
  addBatchWords: (newWords: Partial<Word>[]) => Promise<void>;
  updateWord: (id: string, updates: Partial<Word>) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  toggleStar: (id: string) => void;
  toggleWordMastered: (id: string) => Promise<void>;
  recordReview: (id: string, remembered: boolean) => void;
  recordActivity: (targetUser?: UserProfile | null) => Promise<void>;
  resetToHsk1Starter: () => Promise<void>;

  // Settings & Navigation
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  stats: StudyStats;
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;

  // Backup
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const ENV_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';

const DEFAULT_SETTINGS: AppSettings = {
  voiceRate: 0.75,
  voicePitch: 1.0,
  geminiApiKey: ENV_API_KEY,
  geminiModel: ENV_MODEL,
  soundEffects: true,
  dailyTarget: 20
};

export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
  if (!dateStr1 || !dateStr2) return -1;
  const clean1 = dateStr1.split('T')[0];
  const clean2 = dateStr2.split('T')[0];
  const [y1, m1, d1] = clean1.split('-').map(Number);
  const [y2, m2, d2] = clean2.split('-').map(Number);
  if (isNaN(y1) || isNaN(y2)) return -1;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

export const getEffectiveStreak = (user: UserProfile | null): number => {
  if (!user || !user.lastActiveDate) return 0;
  const todayStr = getLocalDateString();
  const diff = getDaysDifference(user.lastActiveDate, todayStr);
  if (diff <= 1 && diff >= 0) {
    return user.streakDays || 1;
  }
  return 0;
};

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'zhongwen_current_user_id',
  FALLBACK_WORDS: 'zhongwen_fallback_words',
  FALLBACK_RULES: 'zhongwen_fallback_rules',
  FALLBACK_MEASURE_WORDS: 'zhongwen_fallback_measure_words',
  FALLBACK_USERS: 'zhongwen_fallback_users',
  FALLBACK_PROGRESS: 'zhongwen_fallback_progress',
  SETTINGS: 'zhongwen_settings'
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getTabFromHash = (): AppTabType => {
    const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const validTabs: AppTabType[] = ['study', 'words', 'rules', 'measure_words', 'stories', 'quiz', 'writer'];
    if (validTabs.includes(raw as any)) {
      return raw as AppTabType;
    }
    return 'study';
  };

  // Navigation Hash State
  const [activeTab, setActiveTabState] = useState<AppTabType>(() => {
    return getTabFromHash();
  });

  const setActiveTab = useCallback((tab: AppTabType) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  }, []);


  // Listen for browser Back/Forward hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getTabFromHash();
      setActiveTabState(newTab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Shared words pool (raw definitions from MongoDB Atlas)
  const [sharedWords, setSharedWords] = useState<Word[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FALLBACK_WORDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Chinese Rules (Quy tắc tiếng Trung)
  const [rules, setRules] = useState<ChineseRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FALLBACK_RULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return CHINESE_RULES_STARTER_DATA;
  });

  // Chinese Measure Words (Lượng từ tiếng Trung)
  const [measureWords, setMeasureWords] = useState<ChineseMeasureWord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FALLBACK_MEASURE_WORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return CHINESE_MEASURE_WORDS_STARTER_DATA;
  });

  // Users list (purely from MongoDB)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FALLBACK_USERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Active current user (Starts as null if user has not selected yet)
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (savedId) {
      try {
        const savedUsers = localStorage.getItem(STORAGE_KEYS.FALLBACK_USERS);
        if (savedUsers) {
          const parsedUsers: UserProfile[] = JSON.parse(savedUsers);
          const found = parsedUsers.find(u => u.id === savedId);
          if (found) return found;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  // User progress: record<userId, record<wordId, progress>>
  const [allUserProgress, setAllUserProgress] = useState<Record<string, Record<string, UserWordProgress>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FALLBACK_PROGRESS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          geminiApiKey: parsed.geminiApiKey || ENV_API_KEY
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Initial Sync with Backend API
  useEffect(() => {
    async function loadDataFromApi() {
      const dbData = await ApiService.getFullData();
      if (dbData) {
        if (dbData.words && Array.isArray(dbData.words)) {
          setSharedWords(dbData.words);
        }
        if (dbData.rules && Array.isArray(dbData.rules) && dbData.rules.length > 0) {
          setRules(dbData.rules);
        }
        if (dbData.measureWords && Array.isArray(dbData.measureWords) && dbData.measureWords.length > 0) {
          setMeasureWords(dbData.measureWords);
        }
        if (dbData.users && Array.isArray(dbData.users) && dbData.users.length > 0) {
          setUsers(dbData.users);
          const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
          if (savedId) {
            const found = dbData.users.find(u => u.id === savedId);
            if (found) {
              setCurrentUserState(found);
            }
          }
        }
        if (dbData.userProgress) {
          setAllUserProgress(dbData.userProgress);
        }
      }
    }
    loadDataFromApi();
  }, []);

  // Save to LocalStorage fallbacks
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FALLBACK_WORDS, JSON.stringify(sharedWords));
  }, [sharedWords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FALLBACK_RULES, JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FALLBACK_MEASURE_WORDS, JSON.stringify(measureWords));
  }, [measureWords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FALLBACK_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FALLBACK_PROGRESS, JSON.stringify(allUserProgress));
  }, [allUserProgress]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    soundEffects.setEnabled(settings.soundEffects);
    if (settings.geminiApiKey) {
      GeminiService.prewarmConnection(settings.geminiApiKey, settings.geminiModel);
    }
  }, [settings]);

  // Set Current User handler
  const setCurrentUser = useCallback((user: UserProfile) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
  }, []);

  // Create new user profile
  const createNewUser = useCallback(async (name: string, avatar: string = '🐼'): Promise<UserProfile | null> => {
    const apiResult = await ApiService.createOrLoginUser(name, avatar);
    const newUser: UserProfile = apiResult || {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      avatar,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };

    setUsers(prev => {
      if (prev.some(u => u.id === newUser.id)) return prev;
      return [...prev, newUser];
    });
    setCurrentUser(newUser);
    return newUser;
  }, [setCurrentUser]);

  // Rename current user
  const renameCurrentUser = useCallback(async (newName: string, avatar?: string): Promise<UserProfile | null> => {
    if (!currentUser) return null;
    const trimmed = newName.trim();
    if (!trimmed) return null;

    const updatedUser: UserProfile = {
      ...currentUser,
      name: trimmed,
      avatar: avatar || currentUser.avatar || '🐼'
    };

    // Update in backend
    ApiService.updateUser(currentUser.id, trimmed, avatar);

    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    return updatedUser;
  }, [currentUser, setCurrentUser]);

  // Delete user profile
  const deleteUserProfile = useCallback(async (id: string): Promise<boolean> => {
    ApiService.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser?.id === id) {
      const remaining = users.filter(u => u.id !== id);
      if (remaining.length > 0) {
        setCurrentUser(remaining[0]);
      } else {
        setCurrentUserState(null);
      }
    }
    return true;
  }, [currentUser, users, setCurrentUser]);

  // Derived user progress for active user
  const activeUserId = currentUser?.id || 'user-1';
  const currentUserProgressMap = useMemo(() => {
    return allUserProgress[activeUserId] || {};
  }, [allUserProgress, activeUserId]);

  // Combined words (Shared word definitions + active user's box, star, review counts)
  // ALWAYS sorted by createdAt DESC (newest added words first)
  const words: Word[] = useMemo(() => {
    return sharedWords
      .map(word => {
        const prog = currentUserProgressMap[word.id];
        const isMastered = prog?.isMastered !== undefined
          ? prog.isMastered
          : ((prog?.box ?? 1) >= 5);
        return {
          ...word,
          isMastered,
          box: isMastered ? 5 : 1,
          isStarred: prog?.isStarred !== undefined ? prog.isStarred : false,
          reviewCount: prog?.reviewCount || 0,
          correctCount: prog?.correctCount || 0,
          wrongCount: prog?.wrongCount || 0,
          lastReviewed: prog?.lastReviewed || undefined
        };
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [sharedWords, currentUserProgressMap]);

  // Counts (Chỉ 2 mức: Chưa thuộc và Đã thuộc)
  const totalWordsCount = words.length;
  const masteredWordsCount = words.filter(w => w.isMastered).length;
  const unmasteredWordsCount = words.filter(w => !w.isMastered).length;
  const starredWordsCount = words.filter(w => w.isStarred).length;
  const hsk1WordsCount = words.filter(w => w.source === 'hsk1' || (w.lesson && w.lesson.toLowerCase().includes('hsk'))).length;
  const customWordsCount = words.filter(w => !(w.source === 'hsk1' || (w.lesson && w.lesson.toLowerCase().includes('hsk')))).length;

  // Cần ôn = các từ Chưa thuộc
  const dueWordsCount = unmasteredWordsCount;

  // Rules Counts
  const rulesCount = rules.length;
  const masteredRulesCount = rules.filter(r => r.isMastered).length;

  // Measure Words Counts
  const measureWordsCount = measureWords.length;
  const masteredMeasureWordsCount = measureWords.filter(mw => mw.isMastered).length;


  // Add Word (Shared for all users - Prevent Duplicate Hanzis)
  const addWord = useCallback(async (newWord: Partial<Word>): Promise<Word> => {
    const hanzi = newWord.hanzi?.trim() || '';
    if (!hanzi) {
      throw new Error('Chữ Hán không được để trống');
    }

    const wordData: Partial<Word> = {
      hanzi,
      pinyin: newWord.pinyin?.trim() || '',
      vietnamese: newWord.vietnamese?.trim() || '',
      hanViet: newWord.hanViet?.trim() || '',
      hskLevel: newWord.hskLevel || 1,
      lesson: newWord.lesson || 'Từ tự thêm',
      source: (newWord.source as any) || 'custom',
      exampleSentence: newWord.exampleSentence || '',
      examplePinyin: newWord.examplePinyin || '',
      exampleVietnamese: newWord.exampleVietnamese || '',
      radicals: newWord.radicals || '',
      mnemonic: newWord.mnemonic || ''
    };

    const savedWord = await ApiService.addWord(wordData);
    const resultWord: Word = {
      id: savedWord?.id || `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      hanzi: savedWord?.hanzi || wordData.hanzi || '',
      pinyin: savedWord?.pinyin || wordData.pinyin || '',
      vietnamese: savedWord?.vietnamese || wordData.vietnamese || '',
      hanViet: savedWord?.hanViet || wordData.hanViet || '',
      radicals: savedWord?.radicals || wordData.radicals || '',
      mnemonic: savedWord?.mnemonic || wordData.mnemonic || '',
      exampleSentence: savedWord?.exampleSentence || wordData.exampleSentence || '',
      examplePinyin: savedWord?.examplePinyin || wordData.examplePinyin || '',
      exampleVietnamese: savedWord?.exampleVietnamese || wordData.exampleVietnamese || '',
      box: 1,
      isStarred: false,
      hskLevel: wordData.hskLevel || 1,
      lesson: wordData.lesson,
      source: (newWord.source as any) || 'custom',
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      createdAt: Date.now()
    };

    setSharedWords(prev => {
      if (prev.some(w => w.hanzi === resultWord.hanzi)) {
        return prev;
      }
      return [resultWord, ...prev];
    });

    return resultWord;
  }, []);

  // Add Batch Words (Prevent Duplicate Hanzis)
  const addBatchWords = useCallback(async (newWordsList: Partial<Word>[]) => {
    const saved = await ApiService.addBatchWords(newWordsList);
    if (saved && saved.length > 0) {
      setSharedWords(prev => {
        const existingMap = new Map(prev.map(w => [w.hanzi, w]));
        saved.forEach(w => {
          if (w.hanzi) {
            existingMap.set(w.hanzi, { ...existingMap.get(w.hanzi), ...w });
          }
        });
        return Array.from(existingMap.values());
      });
    } else {
      setSharedWords(prev => {
        const existingMap = new Map(prev.map(w => [w.hanzi, w]));
        newWordsList.forEach((item, idx) => {
          const hanzi = item.hanzi?.trim();
          if (hanzi && !existingMap.has(hanzi)) {
            const fallback: Word = {
              id: `batch-${Date.now()}-${idx}`,
              hanzi,
              pinyin: item.pinyin?.trim() || '',
              vietnamese: item.vietnamese?.trim() || '',
              hanViet: item.hanViet?.trim() || '',
              box: 1,
              isStarred: false,
              hskLevel: item.hskLevel || 1,
              lesson: item.lesson || 'Thêm hàng loạt AI',
              source: (item.source as any) || 'ai',
              exampleSentence: item.exampleSentence || '',
              examplePinyin: item.examplePinyin || '',
              exampleVietnamese: item.exampleVietnamese || '',
              radicals: item.radicals || '',
              mnemonic: item.mnemonic || '',
              reviewCount: 0,
              correctCount: 0,
              wrongCount: 0,
              createdAt: Date.now()
            };
            existingMap.set(hanzi, fallback);
          }
        });
        return Array.from(existingMap.values());
      });
    }
  }, []);

  // Update Word (Shared & User-Specific Progress)
  const updateWord = useCallback(async (id: string, updates: Partial<Word>) => {
    // 1. If updating user-specific learning status (box, isStarred), update user progress state immediately
    if (updates.box !== undefined || updates.isStarred !== undefined) {
      setAllUserProgress(prev => {
        const userMap = prev[activeUserId] || {};
        const oldProg = userMap[id] || {
          box: 1,
          isStarred: false,
          reviewCount: 0,
          correctCount: 0,
          wrongCount: 0,
          lastReviewed: null
        };
        return {
          ...prev,
          [activeUserId]: {
            ...userMap,
            [id]: {
              ...oldProg,
              box: updates.box !== undefined ? updates.box : oldProg.box,
              isStarred: updates.isStarred !== undefined ? updates.isStarred : oldProg.isStarred
            }
          }
        };
      });

      ApiService.updateUserProgress(activeUserId, {
        wordId: id,
        box: updates.box,
        isStarred: updates.isStarred
      });
    }

    // 2. Update shared words definition
    ApiService.updateWord(id, updates);
    setSharedWords(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, [activeUserId]);

  // Delete Word (Shared)
  const deleteWord = useCallback(async (id: string) => {
    ApiService.deleteWord(id);
    setSharedWords(prev => prev.filter(w => w.id !== id));
    setAllUserProgress(prev => {
      const next = { ...prev };
      for (const uid in next) {
        if (next[uid] && next[uid][id]) {
          const userCopy = { ...next[uid] };
          delete userCopy[id];
          next[uid] = userCopy;
        }
      }
      return next;
    });
  }, []);

  // Toggle Star (Specific to Current User)
  const toggleStar = useCallback((wordId: string) => {
    const currentProg = currentUserProgressMap[wordId] || {
      box: 1,
      isStarred: false,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      lastReviewed: null
    };

    const newStarred = !currentProg.isStarred;
    const newProg: UserWordProgress = {
      ...currentProg,
      isStarred: newStarred
    };

    setAllUserProgress(prev => ({
      ...prev,
      [activeUserId]: {
        ...(prev[activeUserId] || {}),
        [wordId]: newProg
      }
    }));

    if (newStarred) {
      soundEffects.playSuccess();
    } else {
      soundEffects.playClick();
    }

    ApiService.updateUserProgress(activeUserId, { wordId, isStarred: newStarred });
  }, [activeUserId, currentUserProgressMap]);

  // Record learning activity & automatically calculate/update consecutive day streak
  const recordActivity = useCallback(async (userToUpdate?: UserProfile | null) => {
    const user = userToUpdate || currentUser;
    if (!user) return;

    const todayStr = getLocalDateString();
    const lastActive = user.lastActiveDate || '';
    const nowSeconds = Math.floor(Date.now() / 1000);

    // If already recorded activity today, make sure timestamp is updated in DB
    if (lastActive === todayStr) {
      ApiService.updateUserStats(user.id, {
        lastActiveDate: todayStr,
        lastActiveTimestamp: nowSeconds
      });
      return;
    }

    let newStreak = 1;
    if (lastActive) {
      const diff = getDaysDifference(lastActive, todayStr);
      if (diff === 1) {
        // Consecutive day! Increment streak by 1
        newStreak = (user.streakDays || 0) + 1;
      } else if (diff === 0) {
        newStreak = user.streakDays || 1;
      } else {
        // Missed one or more days -> restart at 1
        newStreak = 1;
      }
    }

    const currentDates = Array.isArray(user.activeDates) ? user.activeDates : (user.lastActiveDate ? [user.lastActiveDate] : []);
    const newActiveDates = Array.from(new Set([...currentDates, todayStr]));

    const updatedUser: UserProfile = {
      ...user,
      streakDays: newStreak,
      lastActiveDate: todayStr,
      lastActiveTimestamp: nowSeconds,
      activeDates: newActiveDates,
      totalActiveDays: newActiveDates.length
    };

    setCurrentUserState(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

    // Update in backend MongoDB
    await ApiService.updateUserStats(user.id, {
      streakDays: newStreak,
      lastActiveDate: todayStr,
      lastActiveTimestamp: nowSeconds,
      activeDates: newActiveDates,
      totalActiveDays: newActiveDates.length
    });
  }, [currentUser]);

  // Toggle Word Mastered (Đã thuộc <-> Chưa thuộc) specifically for current user
  const toggleWordMastered = useCallback(async (wordId: string) => {
    const currentProg = currentUserProgressMap[wordId];
    const isCurrentlyMastered = currentProg?.isMastered !== undefined
      ? currentProg.isMastered
      : ((currentProg?.box ?? 1) >= 5);
    const newMastered = !isCurrentlyMastered;

    const newProg: UserWordProgress = {
      ...(currentProg || {
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        lastReviewed: null
      }),
      isMastered: newMastered,
      box: newMastered ? 5 : 1,
      isStarred: currentProg?.isStarred || false
    };

    // 1. Optimistic UI update (0ms latency)
    setAllUserProgress(prev => ({
      ...prev,
      [activeUserId]: {
        ...(prev[activeUserId] || {}),
        [wordId]: newProg
      }
    }));

    // 2. Play sound feedback
    if (newMastered) {
      soundEffects.playSuccess();
    } else {
      soundEffects.playClick();
    }

    // 3. Persist to MongoDB backend under active user's progress
    await ApiService.updateUserProgress(activeUserId, {
      wordId,
      isMastered: newMastered,
      box: newMastered ? 5 : 1
    });

    // 4. Ghi nhận hoạt động học tập & cập nhật chuỗi ngày học streak
    recordActivity();
  }, [activeUserId, currentUserProgressMap, recordActivity]);

  // Record Review Result (Đã nhớ -> Đã thuộc, Chưa nhớ -> Chưa thuộc)
  const recordReview = useCallback((wordId: string, remembered: boolean) => {
    const currentProg = currentUserProgressMap[wordId] || {
      isMastered: false,
      box: 1,
      isStarred: false,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      lastReviewed: null
    };

    const newProg: UserWordProgress = {
      ...currentProg,
      isMastered: remembered,
      box: remembered ? 5 : 1,
      reviewCount: (currentProg.reviewCount || 0) + 1,
      correctCount: remembered ? (currentProg.correctCount || 0) + 1 : (currentProg.correctCount || 0),
      wrongCount: remembered ? (currentProg.wrongCount || 0) : (currentProg.wrongCount || 0) + 1,
      lastReviewed: Date.now()
    };

    setAllUserProgress(prev => ({
      ...prev,
      [activeUserId]: {
        ...(prev[activeUserId] || {}),
        [wordId]: newProg
      }
    }));

    // Truyền đầy đủ newProg vào ApiService để hàng đợi batch đồng bộ chính xác lên MongoDB Atlas
    ApiService.updateUserProgress(activeUserId, { wordId, progress: newProg });

    // Tự động kiểm tra và ghi nhận chuỗi ngày học nếu chưa ghi nhận hôm nay
    recordActivity();
  }, [activeUserId, currentUserProgressMap, recordActivity]);

  // Reset to Starter HSK 1 (Lessons 1-3)
  const resetToHsk1Starter = useCallback(async () => {
    await ApiService.resetHsk1();
    const data = await ApiService.getFullData();
    if (data && data.words) {
      setSharedWords(data.words);
    }
  }, []);

  // ==================== CHINESE RULES ACTION HANDLERS ====================

  // Add new rule
  const addRule = useCallback(async (ruleData: Partial<ChineseRule>): Promise<ChineseRule> => {
    const now = Date.now();
    const newRule: ChineseRule = {
      id: ruleData.id || `rule-${now}-${Math.random().toString(36).substring(2, 6)}`,
      title: ruleData.title?.trim() || 'Quy tắc mới',
      category: ruleData.category || 'grammar',
      formula: ruleData.formula?.trim() || '',
      summary: ruleData.summary?.trim() || '',
      detail: ruleData.detail?.trim() || '',
      examples: Array.isArray(ruleData.examples) ? ruleData.examples : [],
      exceptions: ruleData.exceptions?.trim() || '',
      tags: Array.isArray(ruleData.tags) ? ruleData.tags : [],
      isBuiltIn: false,
      isMastered: false,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      practiceQuestions: Array.isArray(ruleData.practiceQuestions) ? ruleData.practiceQuestions : [],
      createdAt: now,
      updatedAt: now
    };

    // Optimistic UI update
    setRules(prev => [newRule, ...prev]);

    // Background sync to server API
    try {
      const serverRule = await ApiService.addRule(newRule);
      if (serverRule) {
        setRules(prev => prev.map(r => r.id === newRule.id ? serverRule : r));
      }
    } catch (err) {
      console.warn('[AppContext] Failed to sync rule to API, preserved locally:', err);
    }

    return newRule;
  }, []);

  // Update rule
  const updateRule = useCallback(async (id: string, updates: Partial<ChineseRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r));
    try {
      await ApiService.updateRule(id, updates);
    } catch (err) {
      console.warn('[AppContext] Failed to update rule on API:', err);
    }
  }, []);

  // Delete rule
  const deleteRule = useCallback(async (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    try {
      await ApiService.deleteRule(id);
    } catch (err) {
      console.warn('[AppContext] Failed to delete rule on API:', err);
    }
  }, []);

  // Toggle rule mastered status
  const toggleRuleMastered = useCallback(async (id: string) => {
    let targetMastered = false;
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        targetMastered = !r.isMastered;
        return { ...r, isMastered: targetMastered, updatedAt: Date.now() };
      }
      return r;
    }));

    try {
      await ApiService.updateRuleProgress(id, targetMastered);
    } catch (err) {
      console.warn('[AppContext] Failed to sync rule progress to API:', err);
    }
  }, []);

  // Record test practice result for a rule
  const recordRuleTest = useCallback(async (ruleId: string, isCorrect: boolean) => {
    setRules(prev => prev.map(r => {
      if (r.id === ruleId) {
        const revCount = (r.reviewCount || 0) + 1;
        const corCount = (r.correctCount || 0) + (isCorrect ? 1 : 0);
        const wrgCount = (r.wrongCount || 0) + (isCorrect ? 0 : 1);
        const isMastered = r.isMastered || (corCount >= 3 && corCount / revCount >= 0.7);
        return {
          ...r,
          reviewCount: revCount,
          correctCount: corCount,
          wrongCount: wrgCount,
          isMastered,
          updatedAt: Date.now()
        };
      }
      return r;
    }));

    try {
      await ApiService.updateRuleProgress(ruleId, undefined, isCorrect);
    } catch (err) {
      console.warn('[AppContext] Failed to record rule test to API:', err);
    }
  }, []);

  // Reset rules to starter defaults
  const resetRulesToDefault = useCallback(async () => {
    setRules(CHINESE_RULES_STARTER_DATA);
    try {
      const serverRules = await ApiService.resetRules();
      if (serverRules && serverRules.length > 0) {
        setRules(serverRules);
      }
    } catch (err) {
      console.warn('[AppContext] Failed to reset rules via API:', err);
    }
  }, []);

  // ==================== CHINESE MEASURE WORDS ACTION HANDLERS ====================

  // Add new measure word
  const addMeasureWord = useCallback(async (mwData: Partial<ChineseMeasureWord>): Promise<ChineseMeasureWord> => {
    const now = Date.now();
    const newMw: ChineseMeasureWord = {
      id: mwData.id || `mw-${now}-${Math.random().toString(36).substring(2, 6)}`,
      word: mwData.word?.trim() || '',
      pinyin: mwData.pinyin?.trim() || '',
      vietnamese: mwData.vietnamese?.trim() || '',
      category: mwData.category || 'objects',
      commonLevel: mwData.commonLevel || 'essential',
      explanation: mwData.explanation?.trim() || '',
      pairedNouns: Array.isArray(mwData.pairedNouns) ? mwData.pairedNouns : [],
      collocations: Array.isArray(mwData.collocations) ? mwData.collocations : [],
      practiceQuestions: Array.isArray(mwData.practiceQuestions) ? mwData.practiceQuestions : [],
      tips: mwData.tips?.trim() || '',
      sealChar: mwData.sealChar?.trim() || mwData.word?.[0] || '量',
      order: Number(mwData.order) || 99,
      isBuiltIn: false,
      isMastered: false,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      createdAt: now,
      updatedAt: now
    };

    setMeasureWords(prev => [newMw, ...prev]);

    try {
      const serverMw = await ApiService.addMeasureWord(newMw);
      if (serverMw) {
        setMeasureWords(prev => prev.map(m => m.id === newMw.id ? serverMw : m));
      }
    } catch (err) {
      console.warn('[AppContext] Failed to sync measure word to API:', err);
    }

    return newMw;
  }, []);

  // Update measure word
  const updateMeasureWord = useCallback(async (id: string, updates: Partial<ChineseMeasureWord>) => {
    setMeasureWords(prev => prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m));
    try {
      await ApiService.updateMeasureWord(id, updates);
    } catch (err) {
      console.warn('[AppContext] Failed to update measure word on API:', err);
    }
  }, []);

  // Delete measure word
  const deleteMeasureWord = useCallback(async (id: string) => {
    setMeasureWords(prev => prev.filter(m => m.id !== id));
    try {
      await ApiService.deleteMeasureWord(id);
    } catch (err) {
      console.warn('[AppContext] Failed to delete measure word on API:', err);
    }
  }, []);

  // Toggle measure word mastered status
  const toggleMeasureWordMastered = useCallback(async (id: string) => {
    let targetMastered = false;
    setMeasureWords(prev => prev.map(m => {
      if (m.id === id) {
        targetMastered = !m.isMastered;
        return { ...m, isMastered: targetMastered, updatedAt: Date.now() };
      }
      return m;
    }));

    try {
      await ApiService.updateMeasureWordProgress(id, targetMastered);
    } catch (err) {
      console.warn('[AppContext] Failed to sync measure word progress to API:', err);
    }
  }, []);

  // Record quiz practice result for a measure word
  const recordMeasureWordQuiz = useCallback(async (id: string, isCorrect: boolean) => {
    setMeasureWords(prev => prev.map(m => {
      if (m.id === id) {
        const revCount = (m.reviewCount || 0) + 1;
        const corCount = (m.correctCount || 0) + (isCorrect ? 1 : 0);
        const wrgCount = (m.wrongCount || 0) + (isCorrect ? 0 : 1);
        const isMastered = m.isMastered || (corCount >= 3 && corCount / revCount >= 0.7);
        return {
          ...m,
          reviewCount: revCount,
          correctCount: corCount,
          wrongCount: wrgCount,
          isMastered,
          updatedAt: Date.now()
        };
      }
      return m;
    }));

    try {
      await ApiService.updateMeasureWordProgress(id, undefined, isCorrect);
    } catch (err) {
      console.warn('[AppContext] Failed to record measure word quiz to API:', err);
    }
  }, []);

  // Reset measure words to starter defaults
  const resetMeasureWordsToDefault = useCallback(async () => {
    setMeasureWords(CHINESE_MEASURE_WORDS_STARTER_DATA);
    try {
      const serverMws = await ApiService.resetMeasureWords();
      if (serverMws && serverMws.length > 0) {
        setMeasureWords(serverMws);
      }
    } catch (err) {
      console.warn('[AppContext] Failed to reset measure words via API:', err);
    }
  }, []);

  // Update Settings
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Export JSON
  const exportData = useCallback(() => {
    return JSON.stringify(
      {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        sharedWords,
        rules,
        measureWords,
        users,
        allUserProgress,
        settings
      },
      null,
      2
    );
  }, [sharedWords, rules, measureWords, users, allUserProgress, settings]);

  // Import JSON with automatic database sync
  const importData = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      const incomingWords = parsed.sharedWords || parsed.words;
      if (Array.isArray(incomingWords) && incomingWords.length > 0) {
        setSharedWords(incomingWords);
        ApiService.addBatchWords(incomingWords).catch(() => {});
      }
      if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
        setRules(parsed.rules);
      }
      if (Array.isArray(parsed.measureWords) && parsed.measureWords.length > 0) {
        setMeasureWords(parsed.measureWords);
      }
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        setUsers(parsed.users);
      }
      if (parsed.allUserProgress && typeof parsed.allUserProgress === 'object') {
        setAllUserProgress(parsed.allUserProgress);
        for (const [uid, userProgMap] of Object.entries(parsed.allUserProgress)) {
          for (const [wId, p] of Object.entries(userProgMap as Record<string, any>)) {
            ApiService.queueProgressUpdate(uid, wId, p);
          }
        }
        ApiService.flushProgressQueue().catch(() => {});
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        setSettings(prev => ({ ...prev, ...parsed.settings }));
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const todayStr = getLocalDateString();
  const isStudiedToday = useMemo(() => {
    return currentUser?.lastActiveDate === todayStr;
  }, [currentUser?.lastActiveDate, todayStr]);

  const effectiveStreak = useMemo(() => {
    return getEffectiveStreak(currentUser);
  }, [currentUser]);

  // Study Stats for Header
  const stats: StudyStats = useMemo(() => ({
    streakDays: effectiveStreak,
    lastActiveDate: currentUser?.lastActiveDate || todayStr,
    totalReviewsToday: 0,
    masteredCount: masteredWordsCount
  }), [effectiveStreak, currentUser?.lastActiveDate, todayStr, masteredWordsCount]);

  return (
    <AppContext.Provider
      value={{
        words,
        dueWordsCount,
        unmasteredWordsCount,
        masteredWordsCount,
        totalWordsCount,
        starredWordsCount,
        hsk1WordsCount,
        customWordsCount,

        rules,
        rulesCount,
        masteredRulesCount,
        addRule,
        updateRule,
        deleteRule,
        toggleRuleMastered,
        recordRuleTest,
        resetRulesToDefault,

        measureWords,
        measureWordsCount,
        masteredMeasureWordsCount,
        addMeasureWord,
        updateMeasureWord,
        deleteMeasureWord,
        toggleMeasureWordMastered,
        recordMeasureWordQuiz,
        resetMeasureWordsToDefault,

        currentUser,
        users,
        effectiveStreak,
        isStudiedToday,
        setCurrentUser,
        createNewUser,
        renameCurrentUser,
        deleteUserProfile,

        addWord,
        addBatchWords,
        updateWord,
        deleteWord,
        toggleStar,
        toggleWordMastered,
        recordReview,
        recordActivity,
        resetToHsk1Starter,

        settings,
        updateSettings,
        stats,
        activeTab,
        setActiveTab,

        exportData,
        importData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
