// hooks/useFFmpeg.ts
import { useState, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export function useFFmpeg() {
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpegInstance = new FFmpeg();
        ffmpegInstance.on('log', ({ message }) => {
          console.log('FFmpeg log:', message);
        });

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpegInstance.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        });

        setFFmpeg(ffmpegInstance);
        setLoaded(true);
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        setError('Failed to load FFmpeg: ' + (err as Error).message);
      }
    };

    loadFFmpeg();
  }, []);

  return { ffmpeg, loaded, error };
}