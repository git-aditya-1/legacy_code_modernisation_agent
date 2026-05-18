import React, { useState } from 'react';
import Dashboard from "./pages/dashboard";
import RepoPage from "./pages/RepoPage";
import './Styles.css';
import { FileCode, FolderGit2 } from 'lucide-react';

function App() {
  const [mode, setMode] = useState('file'); // 'file' | 'repo'

  return (
    <div>
      {/* ─── Mode Tabs ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-8 pt-6">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mx-auto">
          <button
            onClick={() => setMode('file')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300
              ${mode === 'file'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <FileCode size={14} />
            FILE MODE
          </button>
          <button
            onClick={() => setMode('repo')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-300
              ${mode === 'repo'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <FolderGit2 size={14} />
            REPO MODE
          </button>
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────────────────────── */}
      {mode === 'file' ? <Dashboard /> : <RepoPage />}
    </div>
  );
}

export default App;
