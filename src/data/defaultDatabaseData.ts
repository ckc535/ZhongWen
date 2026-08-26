import { Word, UserProfile, UserWordProgress } from '../types';
import databaseRaw from '../../server/data/database.json';

export const DEFAULT_DATABASE_WORDS: Word[] = databaseRaw.words as Word[];
export const DEFAULT_DATABASE_USERS: UserProfile[] = databaseRaw.users as UserProfile[];
export const DEFAULT_DATABASE_PROGRESS: Record<string, Record<string, UserWordProgress>> = databaseRaw.userProgress as Record<string, Record<string, UserWordProgress>>;
