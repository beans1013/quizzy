import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

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
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
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
    <div className="w-full max-w-xl mx-auto">
      <div 
        className={`relative group flex flex-col items-center justify-center w-full h-80 rounded-2xl border-4 border-dashed transition-all duration-300 ease-in-out
          ${dragActive ? 'border-indigo-500 bg-indigo-50 scale-102' : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className={`p-4 rounded-full mb-4 transition-colors ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
            <Upload className="w-10 h-10" />
          </div>
          <p className="mb-2 text-xl font-semibold text-slate-700">
            {isProcessing ? 'Processing Exam...' : 'Upload Exam PDF'}
          </p>
          <p className="mb-4 text-sm text-slate-500">
            Drag and drop your Math or Chemistry exam here
          </p>
          <label className="relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2 border-indigo-600 rounded-lg shadow-md group cursor-pointer hover:bg-indigo-600 hover:text-white">
            <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-indigo-600 group-hover:translate-x-0 ease">
              <FileText className="w-5 h-5" />
            </span>
            <span className="absolute flex items-center justify-center w-full h-full text-indigo-600 transition-all duration-300 transform group-hover:translate-x-full ease">Choose File</span>
            <span className="relative invisible">Choose File</span>
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf" 
              onChange={handleChange}
              disabled={isProcessing}
            />
          </label>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isProcessing && (
         <div className="mt-6 text-center animate-pulse">
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
              <div className="bg-indigo-600 h-2.5 rounded-full w-2/3 animate-[progress_1.5s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-sm font-medium text-indigo-600">AI is generating your quiz (this may take 10-20 seconds)...</p>
         </div>
      )}
    </div>
  );
};

export default FileUpload;
