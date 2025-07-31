import React, { useCallback, useState } from 'react';
import { Upload, Film, AlertCircle } from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileSelect, onError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('video/')) {
      onError('Please select a valid video file.');
      return false;
    }
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      onError('File size exceeds 100MB limit.');
      return false;
    }
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setIsProcessing(true);
      onFileSelect(file);
      setTimeout(() => setIsProcessing(false), 1000);
    }
  }, [onFileSelect, onError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-300 ease-in-out
        ${isDragOver 
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }
        ${isProcessing ? 'animate-pulse' : ''}
        bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="video/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <div className="flex flex-col items-center space-y-4">
        <div className={`
          p-4 rounded-full transition-colors duration-300
          ${isDragOver 
            ? 'bg-blue-100 dark:bg-blue-800' 
            : 'bg-gray-100 dark:bg-gray-700'
          }
        `}>
          {isProcessing ? (
            <div className="animate-spin">
              <Film className="w-8 h-8 text-blue-500" />
            </div>
          ) : (
            <Upload className={`
              w-8 h-8 transition-colors duration-300
              ${isDragOver ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}
            `} />
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isProcessing ? 'Processing...' : 'Drop your video here'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            or click to browse files
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Supports MP4, AVI, MOV, WebM (max 100MB)
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-4 h-4" />
          <span>Processing happens in your browser</span>
        </div>
      </div>
    </div>
  );
};

export default FileDropZone;