import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentList } from './components/DocumentList';
import { ChatWindow } from './components/ChatWindow';
import { ApiService } from './services/api';
import { Document } from './types/index';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      return;
    }
    try {
      const docs = await ApiService.listDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Initializing secure environment...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {user ? (
          <>
            <div className="lg:col-span-4 flex flex-col space-y-4">
              <DocumentUpload onUploadSuccess={fetchDocuments} />
              <DocumentList documents={documents} onRefresh={fetchDocuments} />
            </div>
            <div className="lg:col-span-8">
              <ChatWindow />
            </div>
          </>
        ) : (
          <div className="col-span-12 flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="max-w-md space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Enterprise Knowledge Assistant
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                A production-grade Retrieval-Augmented Generation (RAG) system with PostgreSQL pgvector hybrid search, Reciprocal Rank Fusion, query rewriting, and strict citation tracking.
              </p>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 font-semibold text-white rounded-lg shadow-lg text-sm transition-all"
              >
                Sign In or Create Account
              </button>
            </div>
          </div>
        )}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
