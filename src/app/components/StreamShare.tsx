import React, { useState } from 'react';
import { Terminal, Copy, ExternalLink, Check, Share2 } from 'lucide-react';

interface StreamShareProps {
  frames: string[];
  frameRate: number;
  title: string;
}

const StreamShare: React.FC<StreamShareProps> = ({ frames, frameRate, title }) => {
  const [streamData, setStreamData] = useState<{
    streamId: string;
    terminalUrl: string;
    webUrl: string;
  } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const createStream = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frames,
          frameRate,
          title
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create stream');
      }

      const data = await response.json();
      setStreamData(data);
    } catch (error) {
      console.error('Error creating stream:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(type);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!streamData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Share2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share ASCII Video
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create a shareable link that others can view in their terminal or browser
        </p>
        
        <button
          onClick={createStream}
          disabled={isCreating}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3
                   bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600
                   text-white font-medium rounded-lg transition-colors duration-200
                   disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating Stream...</span>
            </>
          ) : (
            <>
              <Terminal className="w-5 h-5" />
              <span>Create Shareable Stream</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Terminal className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Stream Created!
        </h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Terminal Command (copy and paste in terminal):
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
              {streamData.terminalUrl}
            </code>
            <button
              onClick={() => copyToClipboard(streamData.terminalUrl, 'terminal')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {copiedUrl === 'terminal' ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Web URL:
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
              {window.location.origin}{streamData.webUrl}
            </code>
            <button
              onClick={() => copyToClipboard(`${window.location.origin}${streamData.webUrl}`, 'web')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {copiedUrl === 'web' ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
            <a
              href={streamData.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Terminal usage:</strong> Copy the terminal command and paste it in any Unix terminal (Linux/Mac). 
            The ASCII video will play automatically!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreamShare;