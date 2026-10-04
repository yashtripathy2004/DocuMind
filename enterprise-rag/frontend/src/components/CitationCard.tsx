import React, { useState } from 'react';
import { Citation } from '../types/index';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export const CitationCard: React.FC<{ citation: Citation; index: number }> = ({ citation, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-700/60 bg-slate-800/40 rounded-lg p-2.5 text-xs transition-all hover:border-slate-600">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2 overflow-hidden pr-2">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-semibold">
            {index + 1}
          </span>
          <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-200 truncate">{citation.documentTitle}</span>
          <span className="text-[10px] text-slate-500 shrink-0">(p. {citation.pageNumber})</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-sky-400/80 font-mono">
            {Math.round(citation.similarityScore * 100)}% match
          </span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-slate-700/40 text-[11px] text-slate-300 italic font-serif leading-relaxed bg-slate-900/50 p-2 rounded">
          "{citation.snippet}"
        </div>
      )}
    </div>
  );
};
