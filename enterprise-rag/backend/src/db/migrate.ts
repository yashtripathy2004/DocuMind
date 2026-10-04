import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import { logger } from '../utils/logger.js';

async function runMigrations() {
  const client = await pool.connect();
  try {
    logger.info('Running database migrations...');
    const migrationPath = path.resolve(process.cwd(), 'src/db/migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    logger.info('Database migrations applied successfully.');
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error('Failed to run database migrations', { error: error.message });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
