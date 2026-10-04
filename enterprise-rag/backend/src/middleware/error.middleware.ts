import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details || null,
    });
    return;
  }

  logger.error('Unhandled Server Exception', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
  });
}
