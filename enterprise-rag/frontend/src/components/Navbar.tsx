import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, LogOut, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-slate-100 flex items-center gap-2 text-sm tracking-wide">
            ENTERPRISE RAG
            <span className="bg-sky-950 text-sky-400 text-xs px-2 py-0.5 rounded border border-sky-800">Production</span>
          </h1>
          <p className="text-xs text-slate-400">Hybrid Search • pgvector • Citations</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {user.email}
            </span>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800 flex items-center gap-1.5 text-xs font-medium"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
};
