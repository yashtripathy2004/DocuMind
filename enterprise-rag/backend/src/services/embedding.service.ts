import { pipeline } from '@xenova/transformers';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class EmbeddingService {
  private static extractor: any = null;

  private static async getExtractor() {
    if (!this.extractor) {
      logger.info('Initializing local embedding model...', { model: env.EMBEDDING_MODEL });
      this.extractor = await pipeline('feature-extraction', env.EMBEDDING_MODEL);
    }
    return this.extractor;
  }

  public static async generateEmbedding(text: string): Promise<number[]> {
    const pipe = await this.getExtractor();
    const cleanText = text.replace(/\n/g, ' ').trim();
    const output = await pipe(cleanText, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }

  public static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const pipe = await this.getExtractor();
    const embeddings: number[][] = [];
    for (const text of texts) {
      const cleanText = text.replace(/\n/g, ' ').trim();
      const output = await pipe(cleanText, {
        pooling: 'mean',
        normalize: true,
      });
      embeddings.push(Array.from(output.data));
    }
    return embeddings;
  }
}
