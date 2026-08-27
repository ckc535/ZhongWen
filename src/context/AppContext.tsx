import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Word, UserProfile, UserWordProgress, AppSettings, StudyStats } from '../types';
import { soundEffects } from '../services/soundEffects';
import { ApiService } from '../services/apiService';
import { GeminiService } from '../services/geminiService';
import { tts } from '../services/ttsService';

interface AppContextType {
  // Word & Study
  words: Word[];
  dueWordsCount: number;
  masteredWordsCount: number;
  totalWordsCount: number;
  starredWordsCount: number;
  hsk1WordsCount: number;
  customWordsCount: number;

  // User management
  currentUser: UserProfile | null;
  users: UserProfile[];
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
  recordReview: (id: string, remembered: boolean) => void;
  recordActivity: (targetUser?: UserProfile | null) => Promise<void>;
  resetToHsk1Starter: () => Promise<void>;

  // Settings & Navigation
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  stats: StudyStats;
  activeTab: 'study' | 'words' | 'stories' | 'quiz' | 'writer';
  setActiveTab: (tab: 'study' | 'words' | 'stories' | 'quiz' | 'writer') => void;

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
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  if (isNaN(y1) || isNaN(y2)) return -1;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'zhongwen_current_user_id',
  FALLBACK_WORDS: 'zhongwen_fallback_words',
  FALLBACK_USERS: 'zhongwen_fallback_users',
  FALLBACK_PROGRESS: 'zhongwen_fallback_progress',
  SETTINGS: 'zhongwen_settings'
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getTabFromHash = (): 'study' | 'words' | 'stories' | 'quiz' | 'writer' => {
    const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const validTabs: Array<'study' | 'words' | 'stories' | 'quiz' | 'writer'> = ['study', 'words', 'stories', 'quiz', 'writer'];
    if (validTabs.includes(raw as any)) {
      return raw as any;
    }
    return 'study';
  };

  // Navigation Hash State
  const [activeTab, setActiveTabState] = useState<'study' | 'words' | 'stories' | 'quiz' | 'writer'>(() => {
    return getTabFromHash();
  });

  const setActiveTab = useCallback((tab: 'study' | 'words' | 'stories' | 'quiz' | 'writer') => {
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
        return {
          ...word,
          box: prog?.box !== undefined ? prog.box : 1,
          isStarred: prog?.isStarred !== undefined ? prog.isStarred : false,
          reviewCount: prog?.reviewCount || 0,
          correctCount: prog?.correctCount || 0,
          wrongCount: prog?.wrongCount || 0,
          lastReviewed: prog?.lastReviewed || undefined
        };
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [sharedWords, currentUserProgressMap]);

  // Counts
  const totalWordsCount = words.length;
  const masteredWordsCount = words.filter(w => w.box >= 5).length;
  const starredWordsCount = words.filter(w => w.isStarred).length;
  const hsk1WordsCount = words.filter(w => w.source === 'hsk1' || (w.lesson && w.lesson.toLowerCase().includes('hsk'))).length;
  const customWordsCount = words.filter(w => !(w.source === 'hsk1' || (w.lesson && w.lesson.toLowerCase().includes('hsk')))).length;

  const now = Date.now();
  const dueWordsCount = words.filter(w => {
    if (!w.lastReviewed) return true;
    const boxDays = [0, 1, 2, 4, 7, 14][w.box] || 1;
    return now - w.lastReviewed >= boxDays * 24 * 60 * 60 * 1000;
  }).length;

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

    setAllUserProgress(prev => ({
      ...prev,
      [activeUserId]: {
        ...(prev[activeUserId] || {}),
        [wordId]: {
          ...currentProg,
          isStarred: newStarred
        }
      }
    }));

    ApiService.updateUserProgress(activeUserId, { wordId, isStarred: newStarred });
  }, [activeUserId, currentUserProgressMap]);

  // Record learning activity & automatically calculate/update consecutive day streak
  const recordActivity = useCallback(async (userToUpdate?: UserProfile | null) => {
    const user = userToUpdate || currentUser;
    if (!user) return;

    const todayStr = getLocalDateString();
    const lastActive = user.lastActiveDate || '';

    // If already recorded activity today, streak is already counted
    if (lastActive === todayStr) {
      return;
    }

    let newStreak = 1;
    if (lastActive) {
      const diff = getDaysDifference(lastActive, todayStr);
      if (diff === 1) {
        // Consecutive day! Increment streak by 1
        newStreak = (user.streakDays || 1) + 1;
      } else if (diff === 0) {
        newStreak = user.streakDays || 1;
      } else {
        // Missed one or more days -> restart at 1
        newStreak = 1;
      }
    }

    const updatedUser: UserProfile = {
      ...user,
      streakDays: newStreak,
      lastActiveDate: todayStr
    };

    setCurrentUserState(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

    // Update in backend MongoDB
    ApiService.updateUserStats(user.id, {
      streakDays: newStreak,
      lastActiveDate: todayStr
    });
  }, [currentUser]);

  // Record Review Result (Specific to Current User)
  const recordReview = useCallback((wordId: string, remembered: boolean) => {
    const currentProg = currentUserProgressMap[wordId] || {
      box: 1,
      isStarred: false,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      lastReviewed: null
    };

    const newBox = remembered ? Math.min(5, (currentProg.box || 1) + 1) : 1;
    const newProg: UserWordProgress = {
      ...currentProg,
      box: newBox,
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

    ApiService.updateUserProgress(activeUserId, { wordId, remembered });

    // Automatically check and record daily streak
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

  // Update Settings
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Export JSON
  const exportData = useCallback(() => {
    return JSON.stringify({ sharedWords, users, allUserProgress, settings }, null, 2);
  }, [sharedWords, users, allUserProgress, settings]);

  // Import JSON
  const importData = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.sharedWords) setSharedWords(parsed.sharedWords);
      if (parsed.words) setSharedWords(parsed.words);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.allUserProgress) setAllUserProgress(parsed.allUserProgress);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Study Stats for Header
  const stats: StudyStats = useMemo(() => ({
    streakDays: currentUser?.streakDays || 1,
    lastActiveDate: currentUser?.lastActiveDate || new Date().toISOString().split('T')[0],
    totalReviewsToday: 0,
    masteredCount: masteredWordsCount
  }), [currentUser, masteredWordsCount]);

  return (
    <AppContext.Provider
      value={{
        words,
        dueWordsCount,
        masteredWordsCount,
        totalWordsCount,
        starredWordsCount,
        hsk1WordsCount,
        customWordsCount,

        currentUser,
        users,
        setCurrentUser,
        createNewUser,
        renameCurrentUser,
        deleteUserProfile,

        addWord,
        addBatchWords,
        updateWord,
        deleteWord,
        toggleStar,
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
