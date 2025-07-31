import React, { useState, useEffect, useRef } from 'react';
import { processVideoToAscii, processVideoInChunks } from '../utils/videoProcessor';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';


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
    const [detailLevel, setDetailLevel] = useState<'low' | 'medium' | 'high' | 'ultra'>('medium');
    const [showSettings, setShowSettings] = useState(false);
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
                const frames = await processVideoInChunks(
                    ffmpeg,
                    videoFile,
                    asciiWidth,
                    detectedFrameRate,
                    detailLevel,
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
    }, [ffmpegLoaded, ffmpeg, videoFile, detailLevel]);

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
    }, [currentFrame, asciiFrames, asciiHeight]);

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

    const resetVideo = () => {
        setCurrentFrame(0);
        setIsPlaying(false);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleZoom = (event: React.ChangeEvent<HTMLInputElement>) => {
        setZoom(Number(event.target.value));
    };

    const handleDetailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const levels: ('low' | 'medium' | 'high' | 'ultra')[] = ['low', 'medium', 'high', 'ultra'];
        setDetailLevel(levels[Number(event.target.value)]);
    };

    const getDetailDescription = (level: 'low' | 'medium' | 'high' | 'ultra') => {
        switch (level) {
            case 'low': return 'Simple (10 chars) - Fast processing';
            case 'medium': return 'Balanced (17 chars) - Good quality';
            case 'high': return 'Detailed (69 chars) - High quality';
            case 'ultra': return 'Ultra (100+ chars) - Maximum detail';
        }
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
        <div className="space-y-6">
            {/* Settings Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    <span>ASCII Settings</span>
                </button>
                
                {showSettings && (
                    <div className="mt-4 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Detail Level: {detailLevel.charAt(0).toUpperCase() + detailLevel.slice(1)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="3"
                                value={['low', 'medium', 'high', 'ultra'].indexOf(detailLevel)}
                                onChange={handleDetailChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>Low</span>
                                <span>Medium</span>
                                <span>High</span>
                                <span>Ultra</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                {getDetailDescription(detailLevel)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center">
            <canvas
                ref={canvasRef}
                style={{
                    width: `${asciiWidth * zoom}px`,
                    height: `${asciiHeight * zoom}px`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
            />
            </div>
            
            {asciiFrames.length > 0 && (
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={togglePlayPause}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    
                    <button
                        onClick={resetVideo}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Reset</span>
                    </button>
                </div>
            )}
            
        </div>
    );
};

export default AsciiPlayer;
