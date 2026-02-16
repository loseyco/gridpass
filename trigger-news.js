const https = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/cron/daily-news',
    method: 'GET',
    timeout: 60000 // 60s timeout
};

console.log('Triggering /api/cron/daily-news...');

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('--- RESPONSE START ---');
            console.log(JSON.stringify(json, null, 2));
            console.log('--- RESPONSE END ---');
        } catch (e) {
            console.log('Raw output:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.on('timeout', () => {
    req.destroy();
    console.error('Request Timed Out');
});

req.end();
