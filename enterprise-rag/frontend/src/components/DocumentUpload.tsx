import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';

interface DocumentUploadProps {
  onUploadSuccess: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Supported extensions
    const validExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setFeedback({ type: 'error', message: 'Only PDF, DOCX, TXT, and MD files are supported.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      await ApiService.uploadDocument(file);
      setFeedback({ type: 'success', message: `Indexed "${file.name}" into pgvector.` });
      onUploadSuccess();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Document ingestion failed.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl mb-6">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Ingest Documents</h3>
      
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-sky-500 bg-sky-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-sky-400 animate-spin mb-2" />
            <p className="text-xs text-slate-300 font-medium">Parsing, chunking, and embedding...</p>
            <p className="text-[11px] text-slate-500">Creating pgvector HNSW embeddings</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className="h-8 w-8 text-slate-500 mb-2" />
            <p className="text-xs font-medium text-slate-300">
              Drag & drop document or <span className="text-sky-400">browse</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">PDF, DOCX, TXT, MD up to 15MB</p>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
};
