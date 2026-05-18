// frontend/src/components/FileTree.jsx
import React from 'react';
import { FileCode, CheckCircle, XCircle, Loader, Clock, ChevronDown, ChevronRight } from 'lucide-react';

const statusConfig = {
  pending:    { color: 'text-slate-400', bg: 'bg-slate-50', icon: Clock, label: 'Pending' },
  processing: { color: 'text-amber-500', bg: 'bg-amber-50', icon: Loader, label: 'Processing' },
  done:       { color: 'text-blue-500', bg: 'bg-blue-50', icon: FileCode, label: 'Review' },
  approved:   { color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle, label: 'Approved' },
  rejected:   { color: 'text-red-500', bg: 'bg-red-50', icon: XCircle, label: 'Rejected' },
  error:      { color: 'text-red-500', bg: 'bg-red-50', icon: XCircle, label: 'Error' },
};

export default function FileTree({ files, selectedFile, onSelectFile }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Repository Files
          </span>
          <span className="text-[10px] font-bold text-slate-300">
            {files.length} files
          </span>
        </div>
      </div>

      {/* File List */}
      <div className="max-h-[600px] overflow-y-auto">
        {files.map((file) => {
          const status = statusConfig[file.status] || statusConfig.pending;
          const StatusIcon = status.icon;
          const isSelected = selectedFile === file.relative_path;
          const isProcessing = file.status === 'processing';

          return (
            <button
              key={file.relative_path}
              onClick={() => onSelectFile(file.relative_path)}
              className={`w-full text-left px-5 py-3 border-b border-slate-50 transition-all duration-200 flex items-center gap-3 group
                ${isSelected 
                  ? 'bg-slate-900 text-white' 
                  : 'hover:bg-slate-50 text-slate-700'}`}
            >
              {/* Expand indicator */}
              <div className={`transition-transform ${isSelected ? 'rotate-0' : '-rotate-90'}`}>
                {isSelected 
                  ? <ChevronDown size={12} className={isSelected ? 'text-slate-400' : 'text-slate-300'} />
                  : <ChevronRight size={12} className="text-slate-300" />
                }
              </div>

              {/* File icon */}
              <FileCode size={14} className={isSelected ? 'text-red-400' : 'text-slate-400'} />

              {/* File name */}
              <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-white' : ''}`}>
                {file.relative_path}
              </span>

              {/* Status badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider
                ${isSelected ? 'bg-white/10 text-white/70' : `${status.bg} ${status.color}`}`}>
                <StatusIcon size={10} className={isProcessing ? 'animate-spin' : ''} />
                {status.label}
              </span>

              {/* File size */}
              <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                {(file.size / 1024).toFixed(1)}KB
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
