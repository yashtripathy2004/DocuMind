import { pool, query } from '../config/db.js';
import { RawChunk } from './chunking.service.js';
import { SearchResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class VectorStoreService {
  public static async storeChunks(
    documentId: string,
    chunks: RawChunk[],
    embeddings: number[][]
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO document_chunks (document_id, chunk_index, content, page_number, token_count, embedding)
        VALUES ($1, $2, $3, $4, $5, $6::vector)
      `;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vectorString = `[${embeddings[i].join(',')}]`;

        await client.query(insertQuery, [
          documentId,
          i,
          chunk.content,
          chunk.pageNumber,
          chunk.tokenCount,
          vectorString,
        ]);
      }

      await client.query('COMMIT');
      logger.info('Stored chunks with embeddings', { documentId, count: chunks.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Hybrid search: Executes cosine distance vector search and tsvector BM25 keyword search
  public static async hybridSearch(
    queryEmbedding: number[],
    searchQuery: string,
    limit: number
  ): Promise<{ denseResults: SearchResult[]; sparseResults: SearchResult[] }> {
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // 1. Dense Semantic Retrieval via Cosine Distance
    const denseSql = `
      SELECT c.id, c.document_id AS "documentId", d.title AS "documentTitle",
             c.content, c.page_number AS "pageNumber",
             1 - (c.embedding <=> $1::vector) AS score
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      ORDER BY c.embedding <=> $1::vector ASC
      LIMIT $2;
    `;

    // 2. Sparse Lexical Retrieval via PostgreSQL Full-Text Search (English TSVector)
    const sparseSql = `
      SELECT c.id, c.document_id AS "documentId", d.title AS "documentTitle",
             c.content, c.page_number AS "pageNumber",
             ts_rank_cd(c.tsv_content, plainto_tsquery('english', $1)) AS score
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.tsv_content @@ plainto_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $2;
    `;

    const [denseRows, sparseRows] = await Promise.all([
      query<SearchResult>(denseSql, [vectorString, limit]),
      query<SearchResult>(sparseSql, [searchQuery, limit]),
    ]);

    return { denseResults: denseRows, sparseResults: sparseRows };
  }

  public static async deleteDocumentChunks(documentId: string): Promise<void> {
    await query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);
  }
}
