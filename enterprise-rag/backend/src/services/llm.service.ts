import OpenAI from 'openai';
import { Response } from 'express';
import { env } from '../config/env.js';
import { SearchResult, Citation } from '../types/index.js';

export class LlmService {
  private static hfClient = new OpenAI({
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: env.HF_TOKEN,
  });

  public static async streamAnswerWithContext(
    question: string,
    contextChunks: SearchResult[],
    res: Response
  ): Promise<{ fullText: string; citations: Citation[] }> {
    if (contextChunks.length === 0) {
      const fallback = "I could not find any relevant information in the uploaded enterprise documents to answer your question.";
      res.write(`data: ${JSON.stringify({ type: 'token', content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'citations', citations: [] })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return { fullText: fallback, citations: [] };
    }

    // Keep context concise: limit to top 3 chunks to conserve free inference tokens
    const contextFormatted = contextChunks
      .slice(0, 3)
      .map((c, idx) => `[Source ${idx + 1}] (${c.documentTitle}, Page ${c.pageNumber}):\n${c.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are an Enterprise Knowledge Assistant. Answer the question concisely using ONLY the excerpts provided below. If the excerpts do not contain the answer, say: "I am unable to find this information in the provided documentation." Do not invent facts. Excerpts: ${contextFormatted}`;

    const citations: Citation[] = contextChunks.slice(0, 3).map((c) => ({
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      pageNumber: c.pageNumber,
      snippet: c.content.slice(0, 160) + '...',
      similarityScore: Math.round(c.score * 100) / 100,
    }));

    try {
      const stream = await this.hfClient.chat.completions.create({
        model: env.CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        stream: true,
        max_tokens: 300,
        temperature: 0.1,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          fullText += token;
          res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`);
      res.write(`data: [DONE]\n\n`);

      return { fullText, citations };
    } catch (error: any) {
      console.error('[LLM Error]:', error?.response?.data || error);
      const errorMessage = "An error occurred during LLM inference. Please try again.";
      res.write(`data: ${JSON.stringify({ type: 'token', content: errorMessage })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return { fullText: errorMessage, citations };
    }
  }
}
