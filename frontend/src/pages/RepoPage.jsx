// frontend/src/pages/RepoPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { cloneRepo, modernizeRepoStream, approveFile } from '../services/api';
import FileTree from '../components/FileTree';
import DiffViewer from '../components/DiffViewer';
import ProgressBar from '../components/ProgressBar';
import { 
  GitBranch, Play, CheckCircle, XCircle, Loader, 
  AlertCircle, ArrowUp, FolderGit2, Zap, Shield
} from 'lucide-react';

export default function RepoPage() {
  // ─── State ───────────────────────────────────────────────────────────────────
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [files, setFiles] = useState([]); // [{relative_path, size, status, diff, modernizedCode, originalCode, activeNode}]
  const [selectedFile, setSelectedFile] = useState(null);
  const [cloneStatus, setCloneStatus] = useState('idle'); // idle | cloning | cloned | error
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle | running | done
  const [cloneError, setCloneError] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const diffRef = useRef(null);

  // ─── Scroll ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Clone Repo ──────────────────────────────────────────────────────────────
  const handleClone = async () => {
    if (!repoUrl.trim()) return;
    setCloneStatus('cloning');
    setCloneError('');
    setFiles([]);
    setSelectedFile(null);
    setPipelineStatus('idle');

    try {
      const result = await cloneRepo(repoUrl);
      if (result.status === 'success') {
        setRepoName(result.repo_name);
        setFiles(
          result.files.map((f) => ({
            ...f,
            status: 'pending',
            diff: null,
            modernizedCode: null,
            originalCode: null,
            activeNode: null,
            errorLogs: null,
          }))
        );
        setCloneStatus('cloned');
      } else {
        setCloneError(result.message || 'Clone failed');
        setCloneStatus('error');
      }
    } catch (err) {
      setCloneError(err.message);
      setCloneStatus('error');
    }
  };

  // ─── Run Pipeline ────────────────────────────────────────────────────────────
  const handleRunPipeline = async () => {
    if (!repoName || files.length === 0) return;
    setPipelineStatus('running');

    // Reset all files to pending
    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'pending', diff: null, modernizedCode: null, activeNode: null, errorLogs: null }))
    );

    await modernizeRepoStream(
      repoName,
      (update) => {
        const { event, file_path, node, current_code, diff_output, error_logs, original_code } = update;

        setFiles((prev) =>
          prev.map((f) => {
            if (f.relative_path !== file_path) return f;

            if (event === 'file_start') {
              return { ...f, status: 'processing', activeNode: null };
            }

            if (event === 'node_update') {
              const updates = { activeNode: node };
              if (original_code) updates.originalCode = original_code;
              if (current_code) updates.modernizedCode = current_code;
              if (diff_output) updates.diff = diff_output;
              if (node === 'tester') {
                const isTimeout = error_logs === "Execution timed out (possible infinite loop).";
                if (!error_logs || isTimeout) {
                  updates.errorLogs = isTimeout ? error_logs : null;
                } else {
                  updates.errorLogs = error_logs;
                }
              }
              return { ...f, ...updates };
            }

            if (event === 'file_done') {
              return { ...f, status: 'done', activeNode: null };
            }

            if (event === 'file_error') {
              return { ...f, status: 'error', errorLogs: update.error, activeNode: null };
            }

            return f;
          })
        );

        if (event === 'stream_done') {
          setPipelineStatus('done');
        }
      },
      (err) => {
        console.error('Pipeline error:', err);
        setPipelineStatus('done');
      }
    );
  };

  // ─── Approve / Reject ────────────────────────────────────────────────────────
  const handleApprove = async (filePath) => {
    const file = files.find((f) => f.relative_path === filePath);
    if (!file || !file.modernizedCode) return;

    const result = await approveFile(repoName, filePath, true, file.modernizedCode);
    if (result.status === 'success') {
      setFiles((prev) =>
        prev.map((f) => (f.relative_path === filePath ? { ...f, status: 'approved' } : f))
      );
    }
  };

  const handleReject = async (filePath) => {
    const result = await approveFile(repoName, filePath, false);
    if (result.status === 'success') {
      setFiles((prev) =>
        prev.map((f) => (f.relative_path === filePath ? { ...f, status: 'rejected' } : f))
      );
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const selectedFileData = files.find((f) => f.relative_path === selectedFile);
  const approvedCount = files.filter((f) => f.status === 'approved').length;
  const rejectedCount = files.filter((f) => f.status === 'rejected').length;
  const doneCount = files.filter((f) => ['done', 'approved', 'rejected'].includes(f.status)).length;

  return (
    <div className="max-w-[1440px] mx-auto p-8 font-sans text-slate-800 bg-white min-h-screen relative">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking mb-2 italic">
          ACMP : Repo Modernization
        </h1>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-[0.1em] italic">
          Clone a GitHub repo · Modernize all files · Review & approve changes
        </p>
      </div>

      {/* ─── Clone Bar ──────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center shadow-sm gap-3">
          {/* GitHub icon */}
          <div className="p-2.5 bg-slate-900 rounded-xl">
            <FolderGit2 className="text-white" size={18} />
          </div>

          {/* URL Input */}
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleClone()}
            placeholder="https://github.com/user/repo.git"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-300 outline-none focus:border-slate-300 focus:bg-white transition-all"
          />

          {/* Clone Button */}
          <button
            onClick={handleClone}
            disabled={cloneStatus === 'cloning' || !repoUrl.trim()}
            className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-30 flex items-center gap-2 text-xs tracking-wider"
          >
            {cloneStatus === 'cloning' ? (
              <><Loader size={14} className="animate-spin" /> CLONING...</>
            ) : (
              <><GitBranch size={14} /> CLONE & SCAN</>
            )}
          </button>
        </div>

        {/* Clone Error */}
        {cloneError && (
          <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2 text-red-500 text-xs font-medium">
            <AlertCircle size={14} />
            {cloneError}
          </div>
        )}

        {/* Clone Success Info */}
        {cloneStatus === 'cloned' && (
          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
              <CheckCircle size={14} />
              Cloned "{repoName}" — {files.length} Python file{files.length !== 1 ? 's' : ''} found
            </div>
            <button
              onClick={handleRunPipeline}
              disabled={pipelineStatus === 'running'}
              className="bg-[#FF4B4B] hover:bg-[#e63939] text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 flex items-center gap-2 text-xs tracking-wider"
            >
              {pipelineStatus === 'running' ? (
                <><Loader size={14} className="animate-spin" /> RUNNING...</>
              ) : (
                <><Zap size={14} /> RUN PIPELINE</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ─── Summary Stats ──────────────────────────────────────────────────── */}
      {pipelineStatus !== 'idle' && (
        <div className="max-w-4xl mx-auto mb-8 grid grid-cols-4 gap-4">
          {[
            { label: 'Total Files', value: files.length, color: 'text-slate-700', bg: 'bg-slate-50' },
            { label: 'Processed', value: doneCount, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Approved', value: approvedCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Rejected', value: rejectedCount, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 text-center border border-slate-100`}>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Main Content: File Tree + Diff Viewer ──────────────────────────── */}
      {files.length > 0 && (
        <div className="grid grid-cols-[340px_1fr] gap-6 mb-16">
          {/* Left: File Tree */}
          <FileTree
            files={files}
            selectedFile={selectedFile}
            onSelectFile={(path) => {
              setSelectedFile(path);
              if (diffRef.current) {
                diffRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          />

          {/* Right: Diff View + Actions */}
          <div ref={diffRef}>
            {selectedFileData ? (
              <div className="space-y-4">
                {/* File Header */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{selectedFileData.relative_path}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                      {selectedFileData.status === 'processing' && selectedFileData.activeNode
                        ? `Agent: ${selectedFileData.activeNode}`
                        : selectedFileData.status}
                    </p>
                  </div>

                  {/* Progress for this file */}
                  {selectedFileData.status === 'processing' && selectedFileData.activeNode && (
                    <div className="scale-75 origin-right">
                      <ProgressBar activeNode={selectedFileData.activeNode} />
                    </div>
                  )}
                </div>

                {/* Diff Viewer */}
                <DiffViewer
                  diff={selectedFileData.diff}
                  originalCode={selectedFileData.originalCode}
                  modernizedCode={selectedFileData.modernizedCode}
                />

                {/* Error Logs */}
                {selectedFileData.errorLogs && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-red-600 mb-2 font-black text-[10px] tracking-widest uppercase">
                      <AlertCircle size={12} /> Error Logs
                    </div>
                    <pre className="bg-white p-3 border border-red-100 rounded-xl text-xs text-red-400 overflow-auto max-h-32 font-mono">
                      {selectedFileData.errorLogs}
                    </pre>
                  </div>
                )}

                {/* Approve / Reject Buttons */}
                {selectedFileData.status === 'done' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">Review Changes</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Approve to apply changes to the cloned repo, or reject to keep the original.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReject(selectedFileData.relative_path)}
                        className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-500 border border-red-200 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all active:scale-95"
                      >
                        <XCircle size={14} /> REJECT
                      </button>
                      <button
                        onClick={() => handleApprove(selectedFileData.relative_path)}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all shadow-md active:scale-95"
                      >
                        <Shield size={14} /> APPROVE
                      </button>
                    </div>
                  </div>
                )}

                {/* Approved / Rejected badge */}
                {selectedFileData.status === 'approved' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <div>
                      <p className="text-sm font-black text-emerald-700">Changes Approved</p>
                      <p className="text-xs text-emerald-500">Modernized code has been applied to the cloned repo.</p>
                    </div>
                  </div>
                )}

                {selectedFileData.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
                    <XCircle size={18} className="text-red-500" />
                    <div>
                      <p className="text-sm font-black text-red-700">Changes Rejected</p>
                      <p className="text-xs text-red-500">Original code preserved. No changes applied.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border border-slate-100 h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <FolderGit2 size={40} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm font-medium">Select a file to review changes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Floating Scroll Top ────────────────────────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-red-500 transition-all z-50"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
