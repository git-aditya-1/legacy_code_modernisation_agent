// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { modernizeStream } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { Save, Terminal, PenTool, Copy, Check, AlertCircle, ArrowUp, Upload, FileCode } from 'lucide-react';

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [originalCode, setOriginalCode] = useState("");
  const [modernizedCode, setModernizedCode] = useState("");
  const [errorLogs, setErrorLogs] = useState(null);
  const [status, setStatus] = useState("idle"); 
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const feedbackRef = useRef(null);

  // --- Auto-Scroll to Results ---
  useEffect(() => {
    if ((status === "success" || (errorLogs && status !== "success")) && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [status, errorLogs]);

  // --- Scroll-to-Top Visibility ---
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setOriginalCode(e.target.result);
      reader.readAsText(file);
      setStatus("idle");
      setModernizedCode("");
      setErrorLogs(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(modernizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // const handleDownload = () => {
  //   const element = document.createElement("a");
  //   const file = new Blob([modernizedCode], {type: 'text/plain'});
  //   element.href = URL.createObjectURL(file);
  //   element.download = `modernized_${selectedFile.name}`;
  //   document.body.appendChild(element);
  //   element.click();
  // };

  const startPipeline = () => {
    if (!originalCode) return;
    setStatus("processing");
    setErrorLogs(null);
    setActiveNode(null);

    modernizeStream(
      { code: originalCode, fileName: selectedFile.name },
      (update) => {
        setActiveNode(update.node);
        if (update.current_code) setModernizedCode(update.current_code);
        
        // Match Streamlit Success Criteria: No error OR Timeout
        if (update.node === 'tester') {
          const isTimeout = update.error_logs === "Execution timed out (possible infinite loop).";
          if (!update.error_logs || isTimeout) {
            setStatus("success");
            setErrorLogs(isTimeout ? update.error_logs : null);
          } else {
            setErrorLogs(update.error_logs);
          }
        }
      },
      (err) => {
        setStatus("fail");
        setErrorLogs(err);
      }
    );
  };

  return (
    <div className="max-w-[1280px] mx-auto p-8 font-sans text-slate-800 bg-white min-h-screen relative">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking mb-2 italic">ACMP : Agentic Code Modernization Pipeline
</h1>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-[0.1em] italic">Agentic Code Modernization : Get the modernized code files for the uploaded file</p>
      </div>

      {/* --- Aesthetic Control Bar --- */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center shadow-sm">
          {/* File Picker Group */}
          <label className="flex-1 cursor-pointer group px-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                <Upload className="text-[#FF4B4B]" size={18} />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold text-slate-700 truncate max-w-[250px]">
                  {selectedFile ? selectedFile.name : "Select legacy file"}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ".py / .txt"}
                </p>
              </div>
            </div>
            <input type="file" className="hidden" onChange={handleFileChange} accept=".py" />
          </label>

          <div className="h-8 w-[1px] bg-slate-100 mx-2" />

          {/* Action Button */}
          <button 
            onClick={startPipeline}
            disabled={!selectedFile || (status === "processing" && activeNode !== "tester")}
            className="bg-[#FF4B4B] hover:bg-[#e63939] text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-30 flex items-center gap-2 text-xs tracking-wider"
          >
            <PenTool size={16} />
            RUN PIPELINE
          </button>
        </div>
      </div>

      <ProgressBar activeNode={activeNode} />

      {/* Main Workbench */}
      <div className="grid grid-cols-2 gap-8 mb-16">
        {/* Legacy Pane */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2 mb-4 text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase">
            <Terminal size={14} /> Source
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 h-[600px] overflow-auto shadow-inner">
            <pre className="text-sm font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
              {originalCode || "Upload a file to begin..."}
            </pre>
          </div>
        </div>

        {/* Modernized Pane */}
        <div className="flex flex-col text-left">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-red-500 font-black text-[10px] tracking-[0.3em] uppercase">
              <FileCode size={14} /> Modernized
            </div>
            {modernizedCode && (
              <button onClick={handleCopy} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-bold border border-slate-200 shadow-sm transition-all active:scale-95">
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? "COPIED" : "COPY"}
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[600px] overflow-auto shadow-sm">
            {modernizedCode ? (
              <pre className="text-sm font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {modernizedCode}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-200 italic text-sm">
                Awaiting pipeline execution...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Feedback */}
      <div ref={feedbackRef} className="scroll-mt-24">
        {status === "success" && (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl flex justify-between items-center animate-in zoom-in-95 duration-500 text-left shadow-xl max-w-4xl mx-auto">
            <div>
              <p className="text-slate-900 font-black text-2xl tracking-tight mb-1">Modernization Complete</p>
              <p className="text-slate-400 text-sm font-medium">{errorLogs || "The code has been verified by the agent team."}</p>
            </div>
            {/* <button 
              onClick={handleDownload}
              className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-lg transition-all active:scale-95 text-sm"
            >
              <Save size={18} /> DOWNLOAD
            </button> */}
          </div>
        )}

        {errorLogs && status !== "success" && (
          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-left max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 text-red-600 mb-3 font-black text-[10px] tracking-widest uppercase">
              <AlertCircle size={14} /> Debug Logs
            </div>
            <pre className="bg-white p-4 border border-red-100 rounded-xl text-xs text-red-400 overflow-auto max-h-48 font-mono">
              {errorLogs}
            </pre>
          </div>
        )}
      </div>

      {/* Floating Scroll Top */}
      {showScrollTop && (
        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-red-500 transition-all z-50 animate-in fade-in zoom-in">
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}