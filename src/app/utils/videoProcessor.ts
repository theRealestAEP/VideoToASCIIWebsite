import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

const detailedAsciiMap = [
  '-', '@', 'B', '%', '8', '&', 'W', 'M', '#', '*', 'C', 'J', 'U', 'Y', 'X', 'z', 'c', 'v', 'u', 'n', 'x', 'r', 'j', 'f', 't', '/', '\\', '|', '(', ')', '1', '{', '}', '[', ']', '?', '-', '_', '+', '~', '<', '>', 'i', '!', 'l', 'I', ';', ':', ',', '"', '^', '`', "'", '.', ' '
];

function getAsciiChar(brightness: number) {
  const mapIndex = Math.floor((brightness / 255) * (detailedAsciiMap.length - 1));
  return detailedAsciiMap[mapIndex];
}

// export async function getVideoFrameRate(ffmpeg: FFmpeg, videoFile: File): Promise<number> {
//   const inputFileName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
//   await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

//   await ffmpeg.exec(['-i', inputFileName, '-v', 'quiet', '-print_format', 'json', '-show_streams', '-select_streams', 'v:0', 'output.json']);
  
//   const outputData = await ffmpeg.readFile('output.json');
//   const outputJson = JSON.parse(new TextDecoder().decode(outputData as AllowSharedBufferSource));
  
//   const frameRate = outputJson.streams[0].avg_frame_rate;
//   const [numerator, denominator] = frameRate.split('/');
  
//   return Math.round(parseInt(numerator) / parseInt(denominator));
// }

export async function initFFmpeg(onLog: (message: string) => void): Promise<FFmpeg> {
  console.log('InitFFmpeg called');
  if (ffmpeg === null) {
      console.log('Creating new FFmpeg instance');
      ffmpeg = new FFmpeg();
      ffmpeg.on('log', ({ message }) => {
          console.log('FFmpeg internal log:', message);
          onLog(message);
      });
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      console.log('Loading FFmpeg...');
      await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      });
      console.log('FFmpeg loaded successfully');
  } else {
      console.log('Using existing FFmpeg instance');
  }
  return ffmpeg;
}
export async function processVideoToAscii(
  ffmpeg: FFmpeg,
  videoFile: File, 
  asciiWidth: number, 
  frameRate: number, 
  onProgress: (progress: number) => void
): Promise<string[]> {
  console.log('Starting video processing with FFmpeg...');
  if (!ffmpeg.loaded) {
    throw new Error('FFmpeg is not loaded. Please ensure it\'s initialized before processing.');
  }

  const inputFileName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
  console.log('Writing video file:', inputFileName);
  try {
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
    console.log('Video file written successfully');
  } catch (error:any) {
    console.error('Error writing file:', error);
    throw new Error('Failed to write video file: ' + error.message);
  }

  const outputFileName = 'output_%d.png';
  console.log('Executing FFmpeg command...');
  try {
    if(frameRate >= 20){
      frameRate = 20;
    }
    
    await ffmpeg.exec(['-i', inputFileName, '-vf', `fps=${frameRate},scale=${asciiWidth}:-1`, outputFileName]);
    console.log('FFmpeg command executed successfully');
  } catch (error: any) {
    console.error('Error executing FFmpeg command:', error);
    throw new Error('Failed to process video: ' + error.message);
  }
  
  const asciiFrames: string[] = [];
  let frameIndex = 1;

  console.log('Converting frames to ASCII...');
  while (true) {
    const frameName = `output_${frameIndex}.png`;
    let frameData;
    try {
      frameData = await ffmpeg.readFile(frameName);
    } catch (error) {
      console.log('No more frames to process or error reading frame:', error);
      break;
    }

    if (!frameData) {
      console.log('No more frames to process');
      break;
    }

    console.log(`Converting frame ${frameIndex} to ASCII...`);
    const asciiFrame = await imageDataToAscii(frameData as Uint8Array, asciiWidth);
    asciiFrames.push(asciiFrame);

    onProgress(frameIndex);
    frameIndex++;
  }

  console.log('ASCII conversion complete');
  return asciiFrames;
}

async function imageDataToAscii(imageData: Uint8Array, width: number): Promise<string> {
  const image = new Image();
  const blob = new Blob([imageData], { type: 'image/png' });
  const imageUrl = URL.createObjectURL(blob);

  await new Promise((resolve) => {
    image.onload = resolve;
    image.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = width;
  canvas.height = Math.round(image.height * (width / image.width));

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let asciiImage = '';
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      const r = pixelData.data[pixelIndex];
      const g = pixelData.data[pixelIndex + 1];
      const b = pixelData.data[pixelIndex + 2];
      const brightness = (r + g + b) / 3;
      asciiImage += getAsciiChar(brightness);
    }
    asciiImage += '\n';
  }

  URL.revokeObjectURL(imageUrl);
  return asciiImage;
}