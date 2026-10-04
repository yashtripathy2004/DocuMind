import { Citation } from '../types/index';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onCitations: (citations: Citation[]) => void;
  onMeta: (meta: { conversationId: string }) => void;
  onError: (err: string) => void;
  onDone: () => void;
}

export async function consumeChatStream(
  question: string,
  conversationId: string | null,
  callbacks: StreamCallbacks,
  signal: AbortSignal
): Promise<void> {
  const token = localStorage.getItem('token');
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question, conversationId }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Streaming failed' }));
    throw new Error(err.message || 'Server error during stream');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body stream is unavailable');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const payload = trimmed.replace('data: ', '').trim();
      if (payload === '[DONE]') {
        callbacks.onDone();
        return;
      }

      try {
        const parsed = JSON.parse(payload);
        if (parsed.type === 'token') {
          callbacks.onToken(parsed.content);
        } else if (parsed.type === 'citations') {
          callbacks.onCitations(parsed.citations);
        } else if (parsed.type === 'meta') {
          callbacks.onMeta({ conversationId: parsed.conversationId });
        } else if (parsed.type === 'error') {
          callbacks.onError(parsed.message);
        }
      } catch (e) {
        // Ignore unparseable frames
      }
    }
  }
}
