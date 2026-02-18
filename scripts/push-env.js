
const { spawn } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const keysToPush = [
    'GOOGLE_API_KEY',
    'FACEBOOK_PAGE_ID',
    'FACEBOOK_PAGE_ACCESS_TOKEN',
    'YOUTUBE_CLIENT_ID',
    'YOUTUBE_CLIENT_SECRET',
    'YOUTUBE_REDIRECT_URI',
    'YOUTUBE_STREAM_KEY',
    'LEAGUE_INGEST_TOKEN'
];

async function pushKey(key) {
    const value = process.env[key];
    if (!value) {
        console.log(`Skipping ${key} (not found in .env.local)`);
        return;
    }

    console.log(`Pushing ${key}...`);

    return new Promise((resolve, reject) => {
        // npx vercel env add KEY production
        const child = spawn('npx', ['vercel', 'env', 'add', key, 'production'], {
            shell: true,
            stdio: ['pipe', 'inherit', 'inherit'] // pipe stdin
        });

        // Write value to stdin
        child.stdin.write(value);
        child.stdin.end();

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Pushed ${key}`);
                resolve();
            } else {
                console.error(`❌ Failed to push ${key} (Exit Code: ${code})`);
                // Assume failure might be because it exists? Vercel CLI prompts "replace?".
                // If interactive, this might hang.
                // We should assume it doesn't exist or we can't overwrite easily without --force?
                // `vercel env add` prompts.
                // If it exists, it asks "Already exists... Overwrite? [y/N]".
                // We should probably just pass 'y\n' just in case? Or rely on user input?
                // We can't interact.
                // If it exists, we can try `vercel env rm` first?
                // Or try to handle the prompt?
                // Let's assume they are MISSING as per my check.
                resolve(); // resolve anyway to continue
            }
        });
    });
}

(async () => {
    for (const key of keysToPush) {
        await pushKey(key);
    }
})();
