// frontend/src/components/DiffViewer.jsx
import React from 'react';

/**
 * Renders a unified diff with syntax-highlighted additions/removals.
 * Shows only the changed portions with context lines.
 */
export default function DiffViewer({ diff, originalCode, modernizedCode }) {
  // If we have a unified diff string, render it
  if (diff) {
    const lines = diff.split('\n');
    return (
      <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono ml-2 uppercase tracking-wider">Changes</span>
        </div>

        {/* Diff Content */}
        <div className="p-4 overflow-auto max-h-[500px]">
          <pre className="text-xs font-mono leading-relaxed">
            {lines.map((line, i) => {
              let className = 'text-slate-400'; // default context lines
              let bgClass = '';

              if (line.startsWith('+++') || line.startsWith('---')) {
                className = 'text-slate-500 font-bold';
                bgClass = 'bg-slate-900/50';
              } else if (line.startsWith('@@')) {
                className = 'text-cyan-400';
                bgClass = 'bg-cyan-950/30';
              } else if (line.startsWith('+')) {
                className = 'text-emerald-400';
                bgClass = 'bg-emerald-950/20';
              } else if (line.startsWith('-')) {
                className = 'text-red-400';
                bgClass = 'bg-red-950/20';
              }

              return (
                <div key={i} className={`${bgClass} px-2 py-0.5 rounded-sm`}>
                  <span className={className}>{line}</span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    );
  }

  // Fallback: side-by-side if no diff but we have both codes
  if (originalCode && modernizedCode) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Original</div>
          <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap overflow-auto max-h-[400px]">
            {originalCode}
          </pre>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Modernized</div>
          <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap overflow-auto max-h-[400px]">
            {modernizedCode}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-300 text-sm italic text-center py-8">
      No diff available yet...
    </div>
  );
}
