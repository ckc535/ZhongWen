import { Word, UserProfile, DatabaseSchema, UserWordProgress } from '../types';

const API_BASE = '/api';

interface CachedRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

export class ApiService {
  private static fullDataCache: CachedRequest<DatabaseSchema | null> | null = null;
  private static wordsCache: CachedRequest<Word[]> | null = null;
  private static CACHE_TTL_MS = 3000; // 3 seconds deduplication window

  // Batch Progress Queue for ultra-smooth 0ms UI with background sync
  private static progressQueue: Map<string, { userId: string; wordId: string; progress: Partial<UserWordProgress> }> = new Map();
  private static flushTimeout: any = null;
  private static isInitializedListeners = false;

  private static initWindowListeners() {
    if (ApiService.isInitializedListeners || typeof window === 'undefined') return;
    ApiService.isInitializedListeners = true;

    window.addEventListener('beforeunload', () => {
      ApiService.flushProgressQueue();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        ApiService.flushProgressQueue();
      }
    });
  }

  /**
   * Resilient Fetch with automatic retry and exponential backoff
   */
  private static async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 2,
    baseDelayMs: number = 250
  ): Promise<Response> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        // Retry on 502, 503, 504 serverless cold boot
        if ([502, 503, 504].includes(res.status) && attempt < maxRetries) {
          attempt++;
          await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
          continue;
        }

        return res;
      } catch (err: unknown) {
        if (attempt >= maxRetries) throw err;
        attempt++;
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
    throw new Error(`Failed to fetch ${url} after ${maxRetries} retries.`);
  }

  /**
   * Fetch full state with in-flight deduplication
   */
  public static async getFullData(): Promise<DatabaseSchema | null> {
    const now = Date.now();
    if (ApiService.fullDataCache && now - ApiService.fullDataCache.timestamp < ApiService.CACHE_TTL_MS) {
      return ApiService.fullDataCache.promise;
    }

    const fetchPromise = (async () => {
      try {
        const res = await ApiService.fetchWithRetry(`${API_BASE}/data`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn('[ApiService] MongoDB API offline or cold booting:', err);
        return null;
      }
    })();

    ApiService.fullDataCache = { promise: fetchPromise, timestamp: now };
    return fetchPromise;
  }

  /**
   * Fetch shared words list with in-flight deduplication
   */
  public static async getWords(): Promise<Word[]> {
    const now = Date.now();
    if (ApiService.wordsCache && now - ApiService.wordsCache.timestamp < ApiService.CACHE_TTL_MS) {
      return ApiService.wordsCache.promise;
    }

    const fetchPromise = (async () => {
      try {
        const res = await ApiService.fetchWithRetry(`${API_BASE}/words`);
        if (!res.ok) throw new Error('Failed to fetch words');
        return await res.json();
      } catch (err) {
        console.error('[ApiService] getWords error:', err);
        return [];
      }
    })();

    ApiService.wordsCache = { promise: fetchPromise, timestamp: now };
    return fetchPromise;
  }

  /**
   * Add a single word
   */
  public static async addWord(word: Partial<Word>): Promise<Word | null> {
    ApiService.wordsCache = null;
    ApiService.fullDataCache = null;

    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(word)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi thêm từ');
      }
      return data.word || null;
    } catch (err) {
      console.error('[ApiService] addWord error:', err);
      throw err;
    }
  }

  /**
   * Add batch words
   */
  public static async addBatchWords(newWords: Partial<Word>[]): Promise<Word[]> {
    ApiService.wordsCache = null;
    ApiService.fullDataCache = null;

    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/words/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: newWords })
      });
      const data = await res.json();
      return data.words || [];
    } catch (err) {
      console.error('[ApiService] addBatchWords error:', err);
      return [];
    }
  }

  /**
   * Update word details
   */
  public static async updateWord(id: string, updates: Partial<Word>): Promise<boolean> {
    ApiService.wordsCache = null;
    ApiService.fullDataCache = null;

    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/words/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.ok;
    } catch (err) {
      console.error('[ApiService] updateWord error:', err);
      return false;
    }
  }

  /**
   * Delete word
   */
  public static async deleteWord(id: string): Promise<boolean> {
    ApiService.wordsCache = null;
    ApiService.fullDataCache = null;

    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/words/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.error('[ApiService] deleteWord error:', err);
      return false;
    }
  }

  /**
   * Get users
   */
  public static async getUsers(): Promise<UserProfile[]> {
    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    } catch (err) {
      console.error('[ApiService] getUsers error:', err);
      return [];
    }
  }

  /**
   * Create or login user
   */
  public static async createOrLoginUser(name: string, avatar: string = '🐉'): Promise<UserProfile | null> {
    ApiService.fullDataCache = null;

    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar })
      });
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      console.error('[ApiService] createOrLoginUser error:', err);
      return null;
    }
  }

  /**
   * Update user
   */
  public static async updateUser(id: string, name: string, avatar?: string): Promise<UserProfile | null> {
    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar })
      });
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      console.error('[ApiService] updateUser error:', err);
      return null;
    }
  }

  /**
   * Delete user
   */
  public static async deleteUser(id: string): Promise<boolean> {
    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/users/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.error('[ApiService] deleteUser error:', err);
      return false;
    }
  }

  // ==================== BATCH PROGRESS QUEUE (SMOOTH 0ms SRS SYNC) ====================

  /**
   * Queue user word progress update with automatic 200ms debounce flush
   */
  public static queueProgressUpdate(
    userId: string,
    wordId: string,
    progress: Partial<UserWordProgress>
  ): void {
    ApiService.initWindowListeners();
    const queueKey = `${userId}:${wordId}`;

    const existing = ApiService.progressQueue.get(queueKey);
    ApiService.progressQueue.set(queueKey, {
      userId,
      wordId,
      progress: {
        ...(existing?.progress || {}),
        ...progress
      }
    });

    if (ApiService.flushTimeout) {
      clearTimeout(ApiService.flushTimeout);
    }
    ApiService.flushTimeout = setTimeout(() => {
      ApiService.flushProgressQueue();
    }, 200);
  }

  /**
   * Flush pending progress queue to backend using /progress/batch
   */
  public static async flushProgressQueue(): Promise<boolean> {
    if (ApiService.flushTimeout) {
      clearTimeout(ApiService.flushTimeout);
      ApiService.flushTimeout = null;
    }

    if (ApiService.progressQueue.size === 0) return true;

    const items = Array.from(ApiService.progressQueue.values());
    ApiService.progressQueue.clear();

    // Group by userId
    const byUser: Record<string, Array<{ wordId: string; progress: Partial<UserWordProgress> }>> = {};
    for (const item of items) {
      if (!byUser[item.userId]) byUser[item.userId] = [];
      byUser[item.userId].push({ wordId: item.wordId, progress: item.progress });
    }

    let allSuccess = true;
    for (const [userId, updates] of Object.entries(byUser)) {
      try {
        const res = await ApiService.fetchWithRetry(`${API_BASE}/progress/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, updates })
        });
        if (!res.ok) allSuccess = false;
      } catch (err) {
        console.warn('[ApiService] Failed to batch flush progress:', err);
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  /**
   * Update user progress directly (also updates queue)
   */
  public static async updateUserProgress(
    userId: string,
    payload: {
      wordId: string;
      isMastered?: boolean;
      box?: number;
      isStarred?: boolean;
      reviewCount?: number;
      correctCount?: number;
      wrongCount?: number;
      lastReviewed?: number | null;
      progress?: Partial<UserWordProgress>;
    }
  ): Promise<boolean> {
    const rawProg = payload.progress || payload;
    const cleanProgress: Partial<UserWordProgress> = {};

    if (rawProg.isMastered !== undefined) cleanProgress.isMastered = rawProg.isMastered;
    if (rawProg.box !== undefined) cleanProgress.box = rawProg.box;
    if (rawProg.isStarred !== undefined) cleanProgress.isStarred = rawProg.isStarred;
    if (rawProg.reviewCount !== undefined) cleanProgress.reviewCount = rawProg.reviewCount;
    if (rawProg.correctCount !== undefined) cleanProgress.correctCount = rawProg.correctCount;
    if (rawProg.wrongCount !== undefined) cleanProgress.wrongCount = rawProg.wrongCount;
    if (rawProg.lastReviewed !== undefined) cleanProgress.lastReviewed = rawProg.lastReviewed;

    // Direct immediate save to API to guarantee instant persistence even if user refreshes immediately
    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          wordId: payload.wordId,
          progress: cleanProgress
        })
      });
      return res.ok;
    } catch (err) {
      console.warn('[ApiService] Failed direct save, queuing update:', err);
      ApiService.queueProgressUpdate(userId, payload.wordId, cleanProgress);
      return false;
    }
  }

  /**
   * Update streak stats & activity date
   */
  public static async updateUserStats(
    userId: string,
    stats: {
      streakDays?: number;
      lastActiveDate?: string;
      lastActiveTimestamp?: number;
      activeDates?: string[];
      totalActiveDays?: number;
    }
  ): Promise<boolean> {
    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/users/${userId}/streak`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats)
      });
      return res.ok;
    } catch (err) {
      console.error('[ApiService] updateUserStats error:', err);
      return false;
    }
  }

  /**
   * Reset database to HSK 1 Starter
   */
  public static async resetHsk1(): Promise<boolean> {
    ApiService.wordsCache = null;
    ApiService.fullDataCache = null;

    try {
      const res = await ApiService.fetchWithRetry(`${API_BASE}/reset-hsk1`, {
        method: 'POST'
      });
      return res.ok;
    } catch (err) {
      console.error('[ApiService] resetHsk1 error:', err);
      return false;
    }
  }
}
