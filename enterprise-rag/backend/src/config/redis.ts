import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  connectTimeout: 8000,
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Connected to Upstash Redis cluster');
});

redis.on('error', (err) => {
  logger.warn('Upstash Redis offline or unreachable; bypassing cache gracefully', { error: err.message });
});
