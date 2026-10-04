import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';

export function rateLimiter(limit = 60, windowSeconds = 60) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const key = `ratelimit:${clientIp}:${req.baseUrl}`;

      // Gracefully bypass if Redis is offline
      if (redis.status !== 'ready') {
        return next();
      }

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > limit) {
        return next(ApiError.badRequest('Rate limit exceeded. Please wait before making more requests.'));
      }

      next();
    } catch (error) {
      logger.warn('Rate limiter check error, bypassing', { error });
      next();
    }
  };
}
