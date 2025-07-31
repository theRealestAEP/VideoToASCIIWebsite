import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Use a different service - yt1s.com API
    const response = await fetch('https://yt1s.com/api/ajaxSearch/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        q: url,
        vt: 'home'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }

    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error('Invalid video URL');
    }

    // Get download link for mp4 format
    const videoId = data.vid;
    const downloadResponse = await fetch('https://yt1s.com/api/ajaxConvert/index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        vid: videoId,
        k: data.links.mp4.mp4[0].k
      })
    });

    const downloadData = await downloadResponse.json();
    
    if (downloadData.status !== 'ok') {
      throw new Error('Failed to get download link');
    }

    return NextResponse.json({
      title: data.title,
      downloadUrl: downloadData.dlink,
      duration: data.t
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download video. Please try a different URL or service.' },
      { status: 500 }
    );
  }
}