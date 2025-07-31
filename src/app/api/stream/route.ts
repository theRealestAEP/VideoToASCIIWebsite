import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for ASCII video data
const videoStreams = new Map<string, {
  frames: string[],
  frameRate: number,
  title: string,
  createdAt: number
}>();

// Clean up old streams (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  videoStreams.forEach((stream, id) => {
    if (stream.createdAt < oneHourAgo) {
      videoStreams.delete(id);
    }
  });
}, 5 * 60 * 1000); // Check every 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { frames, frameRate, title } = await request.json();
    
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: 'Frames are required' }, { status: 400 });
    }

    const streamId = uuidv4();
    videoStreams.set(streamId, {
      frames,
      frameRate: frameRate || 24,
      title: title || 'ASCII Video',
      createdAt: Date.now()
    });

    const terminalUrl = `curl -s ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/terminal/${streamId}`;
    
    return NextResponse.json({
      streamId,
      terminalUrl,
      webUrl: `/stream/${streamId}`
    });

  } catch (error) {
    console.error('Stream creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamId = searchParams.get('id');
  
  if (!streamId) {
    return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
  }

  const stream = videoStreams.get(streamId);
  if (!stream) {
    return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  }

  return NextResponse.json({
    title: stream.title,
    frameCount: stream.frames.length,
    frameRate: stream.frameRate
  });
}