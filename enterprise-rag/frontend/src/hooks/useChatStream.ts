import { useState, useRef, useCallback } from 'react';
import { ChatMessage, Citation } from '../types/index';
import { consumeChatStream } from '../services/sse';

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isStreaming) return;

      const userMsgId = crypto.randomUUID();
      const assistantMsgId = crypto.randomUUID();

      const userMsg: ChatMessage = { id: userMsgId, role: 'user', content: question };
      const assistantPlaceholder: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        citations: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await consumeChatStream(
          question,
          activeConversationId,
          {
            onMeta: ({ conversationId }) => {
              setActiveConversationId(conversationId);
            },
            onToken: (token: string) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, content: msg.content + token } : msg
                )
              );
            },
            onCitations: (citations: Citation[]) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, citations } : msg
                )
              );
            },
            onError: (errorText: string) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + `\n\n[Error: ${errorText}]` }
                    : msg
                )
              );
            },
            onDone: () => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
                )
              );
              setIsStreaming(false);
            },
          },
          controller.signal
        );
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: msg.content || 'An error occurred while communicating with the assistant.',
                    isStreaming: false,
                  }
                : msg
            )
          );
        }
        setIsStreaming(false);
      }
    },
    [activeConversationId, isStreaming]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const resetChat = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setActiveConversationId(null);
  }, [stopStreaming]);

  return { messages, isStreaming, sendMessage, stopStreaming, resetChat };
}
