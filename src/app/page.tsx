'use client'
import { useState, useRef } from 'react';
import AsciiPlayer from './components/AsciiPlayer';

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        if (file.size <= 100 * 1024 * 1024) { // 100MB limit
          setVideoFile(file);
        } else {
          setError('File size exceeds 100MB limit.');
        }
      } else {
        setError('Please select a valid video file.');
      }
    }
  };

  const handleYoutubeDownload = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          vCodec: 'h264',
          vQuality: '720',
          aFormat: 'mp3',
          filenamePattern: 'classic',
          isAudioOnly: false,
        }),
      });
      console.log('Response:', response);
      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      const data = await response.json();

      // Download the file
      console.log(data)
      const videoResponse = await fetch(data.url);
      const videoBlob = await videoResponse.blob();
      const videoFile = new File([videoBlob], 'youtube_video.mp4', { type: 'video/mp4' });
      console.log('Downloaded video:', videoFile);
      setVideoFile(videoFile);
    } catch (err) {
      setError('An error occurred while downloading the video');
      console.error(err);
    }

    setIsLoading(false);
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4">
      <h1 className="text-3xl font-bold mb-4">Video to ASCII Converter</h1>
      {videoFile && (
        <div className="w-full flex justify-center mt-4">
          <AsciiPlayer key={videoFile.name} videoFile={videoFile} />
        </div>
      )}
      <div className="w-full">
        <div className="flex flex-row justify-center text-center gap-4">

          <form className="mb-4">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="w-full p-2 border rounded mb-2"
            />
          </form>
          <div className="mb-4">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="w-full p-2 border rounded mb-2 text-black"
            />
            <button
              onClick={handleYoutubeDownload}
              disabled={isLoading}
              className="w-full mt-2 bg-red-500 text-white p-2 rounded"
            >
              {isLoading ? 'Downloading...' : 'Download YouTube Video'}
            </button>
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
        </div>
      </div>

    </div>
  );
}