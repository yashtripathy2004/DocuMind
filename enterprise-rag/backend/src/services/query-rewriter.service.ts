import OpenAI from 'openai';
import { env } from '../config/env.js';

export class QueryRewriterService {
  private static openai = new OpenAI({
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: env.HF_TOKEN,
  });

  public static async rewrite(
    question: string,
    history: { role: string; content: string }[]
  ): Promise<string> {
    if (history.length === 0) {
      return question;
    }

    const recentHistory = history.slice(-4);
    const historyPrompt = recentHistory
      .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
      .join('\n');

    const prompt = `
Given the following conversation history and a follow-up question, rewrite the follow-up question into a standalone query that contains all necessary context for document retrieval.
DO NOT answer the question. Only return the rewritten search query. If no rewrite is needed, return the exact question.

Conversation History:
${historyPrompt}

Follow-up Question: ${question}
Standalone Query:`;

    const response = await this.openai.chat.completions.create({
      model: env.CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content?.trim() || question;
  }
}
