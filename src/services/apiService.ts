import { Word, UserProfile, DatabaseSchema, UserWordProgress } from '../types';

const API_BASE = '/api';

export class ApiService {
  public static async getFullData(): Promise<DatabaseSchema | null> {
    try {
      const res = await fetch(`${API_BASE}/data`);
      if (!res.ok) throw new Error('API request failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend MongoDB API error:', err);
      return null;
    }
  }

  public static async getWords(): Promise<Word[]> {
    try {
      const res = await fetch(`${API_BASE}/words`);
      if (!res.ok) throw new Error('Failed to fetch words');
      return await res.json();
    } catch (err) {
      console.error('getWords error:', err);
      return [];
    }
  }

  public static async addWord(word: Partial<Word>): Promise<Word | null> {
    try {
      const res = await fetch(`${API_BASE}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(word)
      });
      const data = await res.json();
      return data.word || null;
    } catch (err) {
      console.error('addWord error:', err);
      return null;
    }
  }

  public static async addBatchWords(newWords: Partial<Word>[]): Promise<Word[]> {
    try {
      const res = await fetch(`${API_BASE}/words/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: newWords })
      });
      const data = await res.json();
      return data.words || [];
    } catch (err) {
      console.error('addBatchWords error:', err);
      return [];
    }
  }

  public static async updateWord(id: string, updates: Partial<Word>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/words/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.ok;
    } catch (err) {
      console.error('updateWord error:', err);
      return false;
    }
  }

  public static async deleteWord(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/words/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.error('deleteWord error:', err);
      return false;
    }
  }

  public static async getUsers(): Promise<UserProfile[]> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    } catch (err) {
      console.error('getUsers error:', err);
      return [];
    }
  }

  public static async createOrLoginUser(name: string, avatar: string = '🐉'): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar })
      });
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      console.error('createOrLoginUser error:', err);
      return null;
    }
  }

  public static async updateUser(id: string, name: string, avatar?: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar })
      });
      const data = await res.json();
      return data.user || null;
    } catch (err) {
      console.error('updateUser error:', err);
      return null;
    }
  }

  public static async deleteUser(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.error('deleteUser error:', err);
      return false;
    }
  }

  public static async updateUserProgress(
    userId: string,
    payload: { wordId: string; box?: number; isStarred?: boolean; remembered?: boolean; lastReviewed?: number; progress?: any }
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          wordId: payload.wordId,
          progress: payload.progress || payload
        })
      });
      return res.ok;
    } catch (err) {
      console.error('updateUserProgress error:', err);
      return false;
    }
  }

  public static async updateUserStats(
    userId: string,
    stats: { streakDays?: number; lastActiveDate?: string }
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/streak`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats)
      });
      return res.ok;
    } catch (err) {
      console.error('updateUserStats error:', err);
      return false;
    }
  }

  public static async resetHsk1(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reset-hsk1`, {
        method: 'POST'
      });
      return res.ok;
    } catch (err) {
      console.error('resetHsk1 error:', err);
      return false;
    }
  }
}
