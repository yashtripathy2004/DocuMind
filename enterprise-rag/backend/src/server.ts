import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { redis } from './config/redis.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, async () => {
  logger.info(`Enterprise RAG server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection healthy');
    
    await redis.connect().catch(() => {});
  } catch (err: any) {
    logger.error('Startup dependency check failure', { error: err.message });
  }
});

const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(async () => {
    await pool.end();
    redis.disconnect();
    logger.info('Connections closed. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
