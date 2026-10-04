import React from 'react';
import { ChatMessage as ChatMessageType } from '../types/index';
import { Bot, User, Sparkles } from 'lucide-react';
import { CitationCard } from './CitationCard';

export const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`py-4 px-4 rounded-xl flex space-x-3 transition-colors ${
        isAssistant ? 'bg-slate-900/60 border border-slate-800/80' : 'bg-transparent'
      }`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          isAssistant
            ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
            : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
        }`}
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div className="flex-1 overflow-hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            {isAssistant ? 'Enterprise Assistant' : 'You'}
          </span>
          {message.isStreaming && (
            <span className="text-[10px] text-sky-400 flex items-center gap-1 animate-pulse">
              <Sparkles className="h-3 w-3" /> Streaming...
            </span>
          )}
        </div>

        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {message.content || (message.isStreaming ? 'Searching & synthesising context...' : '')}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Verified Sources & Citations:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {message.citations.map((c, i) => (
                <CitationCard key={i} citation={c} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
