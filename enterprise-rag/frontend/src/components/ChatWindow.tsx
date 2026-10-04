import React, { useState, useRef, useEffect } from 'react';
import { useChatStream } from '../hooks/useChatStream';
import { ChatMessage } from './ChatMessage';
import { Send, StopCircle, RefreshCw } from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const { messages, isStreaming, sendMessage, stopStreaming, resetChat } = useChatStream();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Chat header */}
      <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/50">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Grounded Query Session
        </span>
        <button
          onClick={resetChat}
          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 p-1 rounded hover:bg-slate-800 transition-colors"
          title="Clear Conversation"
        >
          <RefreshCw className="h-3 w-3" />
          <span className="hidden sm:inline">New Thread</span>
        </button>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
              <Send className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Ask anything about your enterprise documents
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              Answers are synthesized using hybrid BM25 + cosine vector search and anchored strictly in citations.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {[
                'Can I use my personal laptop for production?',
                'What is the minimum password requirement?',
                'What is the international travel per diem?',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(suggestion)}
                  className="text-xs bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 py-1.5 px-3 rounded-full transition-all"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the uploaded documents..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={stopStreaming}
            className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all"
            title="Stop generating"
          >
            <StopCircle className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg transition-all shadow"
            title="Send query"
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
};
