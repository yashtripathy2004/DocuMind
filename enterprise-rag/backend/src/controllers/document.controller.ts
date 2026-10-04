import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { query } from '../config/db.js';
import { ParserService } from '../services/parser.service.js';
import { ChunkingService } from '../services/chunking.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { VectorStoreService } from '../services/vector-store.service.js';
import { ApiError } from '../utils/api-error.js';
import { Document } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class DocumentController {
  public static async uploadDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No document uploaded. Please attach a PDF, DOCX, TXT, or MD file.');
      }

      const userId = req.user!.id;
      const { originalname, mimetype, size, buffer } = req.file;

      // 1. Register document in database
      const [doc] = await query<Document>(
        `INSERT INTO documents (user_id, title, file_name, file_type, file_size_bytes, status)
         VALUES ($1, $2, $3, $4, $5, 'processing') RETURNING *`,
        [userId, originalname, originalname, mimetype, size]
      );

      try {
        // 2. Parse text & extract pages
        const parsed = await ParserService.parse(buffer, mimetype, originalname);

        // 3. Chunk text recursively with overlap
        const chunks = ChunkingService.chunkDocument(parsed.pages);

        if (chunks.length === 0) {
          throw new Error('Extracted document contains no readable text');
        }

        // 4. Batch vector embedding generation
        const chunkTexts = chunks.map((c) => c.content);
        const embeddings = await EmbeddingService.generateEmbeddings(chunkTexts);

        // 5. Store chunks & vectors in pgvector
        await VectorStoreService.storeChunks(doc.id, chunks, embeddings);

        // 6. Update document status
        await query('UPDATE documents SET status = $1 WHERE id = $2', ['processed', doc.id]);

        logger.info('Document successfully indexed', {
          documentId: doc.id,
          title: doc.title,
          chunks: chunks.length,
        });

        res.status(201).json({
          success: true,
          data: {
            document: { ...doc, status: 'processed' },
            totalChunks: chunks.length,
          },
        });
      } catch (ingestionError: any) {
        await query('UPDATE documents SET status = $1 WHERE id = $2', ['failed', doc.id]);
        throw ingestionError;
      }
    } catch (error) {
      next(error);
    }
  }

  public static async listDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const docs = await query<Document>(
        `SELECT d.*, COUNT(c.id)::int AS chunk_count 
         FROM documents d 
         LEFT JOIN document_chunks c ON d.id = c.document_id 
         WHERE d.user_id = $1 
         GROUP BY d.id 
         ORDER BY d.created_at DESC`,
        [userId]
      );

      res.status(200).json({ success: true, data: { documents: docs } });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const docs = await query<Document>('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [
        id,
        userId,
      ]);

      if (docs.length === 0) {
        throw ApiError.notFound('Document not found or unauthorized');
      }

      await query('DELETE FROM documents WHERE id = $1', [id]);

      res.status(200).json({ success: true, message: 'Document and vector embeddings deleted' });
    } catch (error) {
      next(error);
    }
  }
}
