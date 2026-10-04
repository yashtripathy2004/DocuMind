import crypto from 'crypto';
import { redis } from '../config/redis.js';
import { Citation } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface CachedResponse {
  answer: string;
  citations: Citation[];
}

export class CacheService {
  private static defaultTTL = 3600 * 24; // 24 hours

  private static hashQuery(query: string): string {
    return crypto.createHash('sha256').update(query.trim().toLowerCase()).digest('hex');
  }

  public static async get(query: string): Promise<CachedResponse | null> {
    try {
      if (redis.status !== 'ready') return null;
      
      const key = `rag:cache:${this.hashQuery(query)}`;
      const data = await redis.get(key);
      
      if (!data) return null;
      return JSON.parse(data) as CachedResponse;
    } catch (error) {
      logger.warn('Cache retrieval error', { error });
      return null;
    }
  }

  public static async set(query: string, data: CachedResponse): Promise<void> {
    try {
      if (redis.status !== 'ready') return;

      const key = `rag:cache:${this.hashQuery(query)}`;
      await redis.set(key, JSON.stringify(data), 'EX', this.defaultTTL);
    } catch (error) {
      logger.warn('Cache save error', { error });
    }
  }
}
