export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  status: 'processing' | 'processed' | 'failed';
  created_at: Date;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  page_number: number;
  token_count: number;
  embedding: number[];
  created_at: Date;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  snippet: string;
  similarityScore: number;
}

export interface SearchResult {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageNumber: number;
  score: number;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  created_at: Date;
}

export interface ParsedDocumentResult {
  text: string;
  pages: { pageNumber: number; text: string }[];
}
