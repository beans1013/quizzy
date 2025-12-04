import React, { useCallback, useState } from 'react';
import { Upload, FileJson, AlertTriangle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndUpload = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('INVALID_FILE_TYPE: DETECTED_NON_JSON');
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full font-mono">
      <div 
        className={`relative group flex flex-col items-center justify-center w-full h-full min-h-[300px] border-2 border-dashed transition-all duration-150 ease-out
          ${dragActive ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-700 bg-zinc-900/50 hover:border-cyan-400 hover:bg-zinc-900'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Corner Decals */}
        <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 transition-colors ${dragActive ? 'border-yellow-400' : 'border-zinc-500 group-hover:border-cyan-400'}`}></div>
        <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 transition-colors ${dragActive ? 'border-yellow-400' : 'border-zinc-500 group-hover:border-cyan-400'}`}></div>
        <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 transition-colors ${dragActive ? 'border-yellow-400' : 'border-zinc-500 group-hover:border-cyan-400'}`}></div>
        <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 transition-colors ${dragActive ? 'border-yellow-400' : 'border-zinc-500 group-hover:border-cyan-400'}`}></div>

        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 z-10">
          <div className={`p-4 mb-4 transition-colors ${dragActive ? 'text-yellow-400' : 'text-zinc-500 group-hover:text-cyan-400'}`}>
            <Upload className="w-12 h-12" strokeWidth={1.5} />
          </div>
          <p className="mb-2 text-xl font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white">
            {isProcessing ? 'INITIALIZING UPLOAD...' : 'INSERT DATA SHARD'}
          </p>
          <p className="mb-6 text-xs text-zinc-500 font-mono tracking-wider">
            [ DROP JSON FILE TO UPLOAD ]
          </p>
          <label className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-bold text-black transition duration-300 ease-out bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 cursor-pointer clip-path-polygon">
            <span className="flex items-center space-x-2">
                <FileJson className="w-4 h-4" />
                <span>SELECT FILE</span>
            </span>
            <input 
              type="file" 
              className="hidden" 
              accept="application/json,.json" 
              onChange={handleChange}
              disabled={isProcessing}
            />
          </label>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-950/30 border border-red-500 flex items-center text-red-500 animate-pulse font-bold tracking-tight">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>ERROR :: {error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;