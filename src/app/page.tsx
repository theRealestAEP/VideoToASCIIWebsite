'use client'
import { useState, useRef } from 'react';
import AsciiPlayer from './components/AsciiPlayer';
import FileDropZone from './components/FileDropZone';
import YouTubeDownloader from './components/YouTubeDownloader';

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    setVideoFile(file);
  };

  const handleVideoDownload = (file: File) => {
    setError(null);
    setVideoFile(file);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ASCII<span className="text-blue-600">Tube</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Convert videos to ASCII art and share them in terminals
          </p>
        </div>

      {videoFile && (
        <div className="mb-8">
          <AsciiPlayer key={videoFile.name} videoFile={videoFile} />
        </div>
      )}

        {!videoFile && (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FileDropZone 
              onFileSelect={handleFileSelect}
              onError={handleError}
            />
            
            <YouTubeDownloader 
              onVideoDownload={handleVideoDownload}
              onError={handleError}
            />
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mt-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-center">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}