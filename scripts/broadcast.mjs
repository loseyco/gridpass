import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// CONFIGURATION
const STREAM_KEY = process.env.YOUTUBE_STREAM_KEY || 'YOUR_STREAM_KEY_HERE';
const RTMP_URL = 'rtmp://a.rtmp.youtube.com/live2';

// Mode Definition
const MODES = {
    hd: {
        name: '720p HD Mode',
        width: 1280,
        height: 720,
        zoom: 0.67,
        fps: 10,
        bitrate: '2000k',
        bufsize: '4000k',
        gop: 20
    },
    laptop: {
        name: 'qHD Laptop Mode',
        width: 960,
        height: 540,
        zoom: 0.5,
        fps: 10,
        bitrate: '1500k',
        bufsize: '3000k',
        gop: 20
    },
    potato: {
        name: '360p Potato Mode (Low CPU)',
        width: 640,
        height: 360,
        zoom: 0.33,
        fps: 10,
        bitrate: '1000k',
        bufsize: '2000k',
        gop: 20
    }
};

// Parse command line arguments for mode
const args = process.argv.slice(2);
const modeArg = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'hd';
const CURRENT_MODE = MODES[modeArg] || MODES.hd;

async function startBroadcast() {
    if (STREAM_KEY === 'YOUR_STREAM_KEY_HERE') {
        process.exit(1);
    }

    console.log(`🚀 Starting GridPass Broadcast Engine (${CURRENT_MODE.name})...`);

    const browser = await puppeteer.launch({
        headless: 'new', // Use new Headless mode for background stability
        args: [
            `--window-size=${CURRENT_MODE.width},${CURRENT_MODE.height}`,
            '--autoplay-policy=no-user-gesture-required',
            '--hide-scrollbars',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
        ],
        defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: CURRENT_MODE.width, height: CURRENT_MODE.height });

    // Navigate to local studio
    const studioUrl = `http://localhost:3000/live-studio?zoom=${CURRENT_MODE.zoom}`;
    console.log(`🔗 navigating to ${studioUrl}...`);
    await page.goto(studioUrl, { waitUntil: 'networkidle2' });

    console.log('🎥 Integrating FFmpeg stream...');

    // Start FFmpeg process
    const ffmpeg = spawn(pathToFfmpeg, [
        '-f', 'image2pipe',       // Input format for video stream
        '-i', '-',                // Video from stdin (0)
        '-f', 'lavfi',            // New input format: lavfi (filter)
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', // Silent audio (1)
        '-r', `${CURRENT_MODE.fps}`,               // Lower framerate to 10fps for maximum stability

        // Video Settings
        '-map', '0:v',            // Map first input (video)
        '-c:v', 'h264_nvenc',     // NVIDIA Hardware Encoder
        '-preset', 'p1',          // Fastest (p1) to Slowest (p7)
        '-tune', 'ull',           // Ultra Low Latency
        '-b:v', CURRENT_MODE.bitrate,
        '-maxrate', CURRENT_MODE.bitrate,
        '-bufsize', CURRENT_MODE.bufsize,
        '-pix_fmt', 'yuv420p',
        '-g', `${CURRENT_MODE.gop}`,               // Keyframe every 2 seconds (10fps * 2s)

        // Audio Settings
        '-map', '1:a',            // Map second input (audio)
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-f', 'flv',              // Output format for RTMP
        `${RTMP_URL}/${STREAM_KEY}`
    ]);

    ffmpeg.stderr.on('data', (data) => {
        // Uncomment to debug FFmpeg output
        console.log(`ffmpeg: ${data}`);
    });

    ffmpeg.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        browser.close();
    });

    // Use CDP to capture frames
    const client = await page.target().createCDPSession();
    await client.send('Page.startScreencast', {
        format: 'png',
        everyNthFrame: 1,
    });

    client.on('Page.screencastFrame', async (frameObj) => {
        const { data, sessionId } = frameObj;
        await client.send('Page.screencastFrameAck', { sessionId });

        const buffer = Buffer.from(data, 'base64');
        // Write frame to FFmpeg stdin
        if (ffmpeg.stdin.writable) {
            ffmpeg.stdin.write(buffer);
        }
    });

    console.log('✅ Broadcast is LIVE! Press Ctrl+C to stop.');

    // Keep alive
    process.on('SIGINT', async () => {
        console.log('🛑 Stopping broadcast...');
        await browser.close();
        ffmpeg.kill();
        process.exit();
    });
}

startBroadcast().catch(console.error);
