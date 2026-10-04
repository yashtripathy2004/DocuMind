import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getEnvOrThrow(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`CRITICAL: Environment variable ${key} is missing.`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: getEnvOrThrow('DATABASE_URL'),
  REDIS_URL: getEnvOrThrow('REDIS_URL'),
  JWT_SECRET: getEnvOrThrow('JWT_SECRET', 'super_secret_jwt_key_min_32_chars'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  HF_TOKEN: getEnvOrThrow('HF_TOKEN'),
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',
  EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION || '384', 10),
  CHAT_MODEL: process.env.CHAT_MODEL || 'meta-llama/Llama-3.1-8B-Instruct',
  SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.35'),
  TOP_K_RETRIEVAL: parseInt(process.env.TOP_K_RETRIEVAL || '8', 10),
  TOP_K_RERANKED: parseInt(process.env.TOP_K_RERANKED || '3', 10),
};
