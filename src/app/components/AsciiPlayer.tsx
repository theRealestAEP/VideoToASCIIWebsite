import React, { useState, useEffect, useRef } from 'react';
import { processVideoToAscii } from '../utils/videoProcessor';
import { useFFmpeg } from '../hooks/useFFmpeg';


interface AsciiPlayerProps {
    videoFile: File;
}

const AsciiPlayer: React.FC<AsciiPlayerProps> = ({ videoFile }) => {
    const [asciiFrames, setAsciiFrames] = useState<string[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(1);
    const [frameRate, setFrameRate] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(3);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const asciiWidth = 200;
    const asciiHeight = Math.round(asciiWidth * (3 / 4));
    const scaleFactor = 25;
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { ffmpeg, loaded: ffmpegLoaded, error: ffmpegError } = useFFmpeg();

    useEffect(() => {
        if (!ffmpegLoaded || !ffmpeg || !videoFile) {
            return;
        }

        const processVideo = async () => {
            setIsLoading(true);
            try {
                console.log('Starting video processing...');

                // Get video metadata using react-mediainfo
                const mediaInfo = require('react-mediainfo')
                const videoTrack = await mediaInfo.getInfo(videoFile);
                console.log('Video track:', videoTrack);
                const detectedFrameRate = parseFloat(videoTrack.media.track.find((track: any) => track['@type'] === 'Video').FrameRate);
                setFrameRate(detectedFrameRate);
                console.log('Detected frame rate:', detectedFrameRate);

                // Process video to ASCII
                const frames = await processVideoToAscii(
                    ffmpeg,
                    videoFile,
                    asciiWidth,
                    detectedFrameRate,
                    (progress) => {
                        console.log('Processing progress:', progress);
                        setProgress(progress);
                    }
                );
                console.log('Video processing complete, got', frames.length, 'frames');
                setAsciiFrames(frames);
            } catch (error: any) {
                console.error('Error processing video:', error);
                setError('Failed to process video: ' + error.message);
            } finally {
                setIsLoading(false);

                setIsPlaying(true)
            }
        };

        processVideo();
    }, [ffmpegLoaded, ffmpeg, videoFile]);

    useEffect(() => {
        if (canvasRef.current && asciiFrames.length > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const asciiFrame = asciiFrames[currentFrame];
                const lines = asciiFrame.split('\n');
                const charWidth = (asciiWidth * scaleFactor) / lines[0].length;
                const charHeight = (asciiHeight * scaleFactor) / lines.length;

                canvas.width = asciiWidth * scaleFactor;
                canvas.height = asciiHeight * scaleFactor;
                ctx.fillStyle = '#343638';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.font = `${charHeight}px monospace`;
                ctx.fillStyle = 'white';
                ctx.textBaseline = 'top';

                lines.forEach((line, y) => {
                    for (let x = 0; x < line.length; x++) {
                        ctx.fillText(line[x], x * charWidth, y * charHeight);
                    }
                });

            }
        }
    }, [currentFrame, asciiFrames]);

    // useEffect(() => { //fix playback
    //     if (isPlaying && asciiFrames.length > 0 && frameRate) {
    //         const interval = 1000/frameRate;
    //         intervalRef.current = setInterval(() => {
    //             setCurrentFrame((prevFrame) => (prevFrame + 1) % asciiFrames.length);
    //         }, interval);

    //         return () => {
    //             if (intervalRef.current) {
    //                 clearInterval(intervalRef.current);
    //             }
    //         };
    //     }
    // }, [isPlaying, frameRate, asciiFrames]);
    useEffect(() => {
        let animationId: number;

        const animate = () => {
            setCurrentFrame((prevFrame) => (prevFrame + 1) % asciiFrames.length);
            animationId = requestAnimationFrame(animate);
        };

        if (isPlaying && asciiFrames.length > 0) {
            animate();
        }

        return () => cancelAnimationFrame(animationId);
    }, [isPlaying, asciiFrames]);


    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleZoom = (event: React.ChangeEvent<HTMLInputElement>) => {
        setZoom(Number(event.target.value));
    };

    if (ffmpegError) {
        return <div className="text-red-500">Error: {ffmpegError}</div>;
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    if (!ffmpegLoaded || isLoading) {
        return <div>Loading... {isLoading ? `Processing video... Frame ${progress}` : 'Initializing FFmpeg'}</div>;
    }



    return (
        <div>
            <canvas

                ref={canvasRef}
                style={{
                    width: `${asciiWidth * zoom}px`,
                    height: `${asciiHeight * zoom}px`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                }}
            />

        </div>

    );
};

export default AsciiPlayer;
