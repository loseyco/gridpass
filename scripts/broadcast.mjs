import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// CONFIGURATION
const STREAM_KEY = process.env.YOUTUBE_STREAM_KEY || 'YOUR_STREAM_KEY_HERE';
const RTMP_URL = 'rtmp://a.rtmp.youtube.com/live2';
const VIEWPORT = { width: 1280, height: 720 }; // Downscaled to 720p for performance

async function startBroadcast() {
    if (STREAM_KEY === 'YOUR_STREAM_KEY_HERE') {
        console.error('❌ ERROR: You must set your YouTube Stream Key in the script or environment variable.');
        console.log('Usage: set YOUTUBE_STREAM_KEY=xxxx-xxxx && npm run broadcast');
        process.exit(1);
    }

    console.log('🚀 Starting GridPass Broadcast Engine (720p Performance Mode)...');

    const browser = await puppeteer.launch({
        headless: false, // Visible as requested
        args: [
            '--window-size=1280,720',
            '--autoplay-policy=no-user-gesture-required',
            '--hide-scrollbars',
        ],
        defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    // Navigate to the visual engine
    const studioUrl = 'http://localhost:3000/live-studio';
    console.log(`🔗 navigating to ${studioUrl}...`);
    await page.goto(studioUrl, { waitUntil: 'networkidle2' });

    console.log('🎥 Integrating FFmpeg stream...');

    // Start FFmpeg process
    const ffmpeg = spawn(pathToFfmpeg, [
        '-f', 'image2pipe',       // Input format for video stream
        '-i', '-',                // Video from stdin (0)
        '-f', 'lavfi',            // New input format: lavfi (filter)
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', // Silent audio (1)
        '-r', '10',               // Lower framerate to 10fps for maximum stability

        // Video Settings
        '-map', '0:v',            // Map first input (video)
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-b:v', '2000k',          // Lower bitrate to ensure consistent delivery
        '-maxrate', '2000k',
        '-bufsize', '4000k',
        '-pix_fmt', 'yuv420p',
        '-g', '20',               // Keyframe every 2 seconds (10fps * 2s) - Critical for YouTube

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
