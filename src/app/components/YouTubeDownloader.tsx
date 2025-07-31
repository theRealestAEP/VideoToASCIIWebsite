import React, { useState } from 'react';
import { Download, Youtube, Loader2 } from 'lucide-react';

interface YouTubeDownloaderProps {
  onVideoDownload: (file: File) => void;
  onError: (error: string) => void;
}

const YouTubeDownloader: React.FC<YouTubeDownloaderProps> = ({ onVideoDownload, onError }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!url.trim()) {
      onError('Please enter a YouTube URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to download video');
      }

      // Download the video file
      const videoResponse = await fetch(data.downloadUrl);
      if (!videoResponse.ok) {
        throw new Error('Failed to fetch video file');
      }

      const videoBlob = await videoResponse.blob();
      const videoFile = new File([videoBlob], `${data.title}.mp4`, { type: 'video/mp4' });
      
      onVideoDownload(videoFile);
      setUrl(''); // Clear the input
    } catch (error) {
      console.error('Download error:', error);
      onError(error instanceof Error ? error.message : 'Failed to download video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleDownload();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <Youtube className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Download from YouTube
        </h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Paste YouTube URL here..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-red-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400
                     transition-colors duration-200"
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={handleDownload}
          disabled={isLoading || !url.trim()}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3
                   bg-red-600 hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600
                   text-white font-medium rounded-lg transition-colors duration-200
                   disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Download Video</span>
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Downloads may take a moment depending on video length
        </p>
      </div>
    </div>
  );
};

export default YouTubeDownloader;