// frontend/src/components/ProgressBar.jsx
import React from 'react';

const steps = ["auditor", "engineer", "tester", "optimizer"];

export default function ProgressBar({ activeNode }) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex justify-between items-center relative">
        {/* Connecting Line Background */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-100 -z-10" />
        
        {steps.map((step, index) => {
          const isActive = activeNode === step;
          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-500 bg-white
                  ${isActive 
                    ? 'border-red-500 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-105' 
                    : 'border-slate-200 text-slate-300'}`}
              >
                {step}
              </div>
              {/* Optional: Tiny pulse dot for active state */}
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}