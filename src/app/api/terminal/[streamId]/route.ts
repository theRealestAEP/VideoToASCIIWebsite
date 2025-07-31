import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (same as in stream route)
const videoStreams = new Map<string, {
  frames: string[],
  frameRate: number,
  title: string,
  createdAt: number
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: { streamId: string } }
) {
  const streamId = params.streamId;
  const stream = videoStreams.get(streamId);
  
  if (!stream) {
    return new NextResponse('Stream not found', { status: 404 });
  }

  const { frames, frameRate, title } = stream;
  
  // Create a script that plays the ASCII video in terminal
  const script = `#!/bin/bash
clear
echo "Playing: ${title}"
echo "Frames: ${frames.length} | FPS: ${frameRate}"
echo "Press Ctrl+C to stop"
echo ""
sleep 2

frame_delay=$(echo "scale=3; 1/${frameRate}" | bc -l)

while true; do
${frames.map((frame, index) => `
  clear
  cat << 'EOF'
${frame}
EOF
  sleep $frame_delay`).join('')}
done
`;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="ascii_video_${streamId}.sh"`
    }
  });
}