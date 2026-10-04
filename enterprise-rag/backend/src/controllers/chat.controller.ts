import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { QueryRewriterService } from '../services/query-rewriter.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { VectorStoreService } from '../services/vector-store.service.js';
import { RerankService } from '../services/rerank.service.js';
import { LlmService } from '../services/llm.service.js';
import { CacheService } from '../services/cache.service.js';
import { ApiError } from '../utils/api-error.js';
import { Conversation, Message } from '../types/index.js';

export class ChatController {
  public static async streamChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { question, conversationId } = req.body;
      const userId = req.user!.id;

      if (!question || typeof question !== 'string') {
        throw ApiError.badRequest("Property 'question' is required.");
      }

      // 1. Establish or resolve conversation
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const [newConv] = await query<Conversation>(
          `INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id`,
          [userId, question.slice(0, 50)]
        );
        activeConversationId = newConv.id;
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx)
      res.flushHeaders();

      // Emit conversation ID metadata
      res.write(`data: ${JSON.stringify({ type: 'meta', conversationId: activeConversationId })}\n\n`);

      // 2. Fetch conversation history for query rewriting
      const history = await query<Message>(
        `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 6`,
        [activeConversationId]
      );

      // Save user question to DB
      await query(
        `INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2)`,
        [activeConversationId, question]
      );

      // 3. Response Cache Check
      const cached = await CacheService.get(question);
      if (cached && history.length === 0) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: cached.answer })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'citations', citations: cached.citations })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        
        await query(
          `INSERT INTO messages (conversation_id, role, content, citations) VALUES ($1, 'assistant', $2, $3)`,
          [activeConversationId, cached.answer, JSON.stringify(cached.citations)]
        );
        res.end();
        return;
      }

      // 4. Query Rewriting (Contextual standalone query)
      const standaloneQuery = await QueryRewriterService.rewrite(question, history);

      // 5. Query Embedding
      const queryVector = await EmbeddingService.generateEmbedding(standaloneQuery);

      // 6. Hybrid Search (Dense vector + TSVector Full-Text)
      const { denseResults, sparseResults } = await VectorStoreService.hybridSearch(
        queryVector,
        standaloneQuery,
        env.TOP_K_RETRIEVAL
      );

      // 7. Reciprocal Rank Fusion & Reranking
      const reranked = RerankService.reciprocalRankFusion(denseResults, sparseResults);
      const topContexts = reranked.slice(0, env.TOP_K_RERANKED);

      // 8. Stream Response via LLM
      const { fullText, citations } = await LlmService.streamAnswerWithContext(
        standaloneQuery,
        topContexts,
        res
      );

      // 9. Persist Assistant Message & Cache Response
      await query(
        `INSERT INTO messages (conversation_id, role, content, citations) VALUES ($1, 'assistant', $2, $3)`,
        [activeConversationId, fullText, JSON.stringify(citations)]
      );

      if (citations.length > 0) {
        await CacheService.set(question, { answer: fullText, citations });
      }

      res.end();
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`);
        res.end();
      }
    }
  }

  public static async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const convs = await query<Conversation>(
        `SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC`,
        [userId]
      );
      res.status(200).json({ success: true, data: { conversations: convs } });
    } catch (error) {
      next(error);
    }
  }

  public static async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const msgs = await query<Message>(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [id]
      );
      res.status(200).json({ success: true, data: { messages: msgs } });
    } catch (error) {
      next(error);
    }
  }
}
