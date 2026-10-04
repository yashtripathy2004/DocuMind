import React from 'react';
import { Document } from '../types/index';
import { FileText, Trash2, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/api';

interface DocumentListProps {
  documents: Document[];
  onRefresh: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onRefresh }) => {
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" and delete all its vectors?`)) return;
    try {
      await ApiService.deleteDocument(id);
      onRefresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    return (kb / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Active Knowledge Base ({documents.length})
        </h3>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No enterprise documents indexed yet. Upload a document or run the seed script to start testing.
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="group p-2.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 rounded-lg flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 rounded bg-sky-500/10 text-sky-400 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-medium text-slate-200 truncate group-hover:text-sky-300 transition-colors">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{formatBytes(doc.file_size_bytes)}</span>
                    <span>•</span>
                    <span className="flex items-center text-emerald-400 gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />
                      {doc.chunk_count || 1} chunks
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(doc.id, doc.title)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all ml-2"
                title="Delete document and embeddings"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
