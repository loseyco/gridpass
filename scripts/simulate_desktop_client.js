const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const os = require('os');

// Config
const API_URL = 'http://localhost:3001/api'; // Or your production URL
let DEVICE_ID = null;
let HW_ID = 'mock-mac-address-' + Math.floor(Math.random() * 1000);

async function main() {
    console.log('--- GridPass Mock Desktop Client ---');
    console.log(`Hardware ID: ${HW_ID}`);

    // 1. Handshake
    console.log('\n[1] Attempting Handshake...');
    try {
        const res = await fetch(`${API_URL}/connect/handshake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hardware_id: HW_ID,
                name: `MockSimRig-${os.hostname()}`,
                capabilities: { iracing: true, webcam: false }
            })
        });

        const data = await res.json();

        if (data.status === 'linked') {
            console.log('✅ Device already linked!');
            DEVICE_ID = data.device_id;
        } else if (data.status === 'setup') {
            console.log('⚠️ Device NOT linked.');
            console.log('==========================================');
            console.log(`👉 PAIRING CODE: ${data.code}`);
            console.log('==========================================');
            console.log('Go to /command-center and enter this code.');

            await waitForLink();
        } else {
            console.error('Unknown status:', data);
            process.exit(1);
        }

        // 2. Telemetry Loop
        console.log('\n[2] Starting Telemetry Stream & Command Polling...');
        setInterval(sendTelemetry, 2000);
        setInterval(pollCommands, 3000); // Check commands every 3s

    } catch (err) {
        console.error('Handshake failed:', err);
    }
}

async function pollCommands() {
    if (!DEVICE_ID) return;
    try {
        const res = await fetch(`${API_URL}/connect/command`, {
            headers: { 'x-device-id': DEVICE_ID }
        });
        const data = await res.json();

        if (data.commands && data.commands.length > 0) {
            data.commands.forEach(cmd => {
                console.log(`\n🔔 RECEIVED COMMAND: [${cmd.command}]`);
                if (cmd.payload && Object.keys(cmd.payload).length > 0) {
                    console.log(`   Payload:`, cmd.payload);
                }

                // Simulate Execution
                if (cmd.command === 'system_reboot') {
                    console.log('   🛑 REBOOTING SYSTEM (Simulated)...');
                }
            });
        }
    } catch (e) {
        // Silent fail on poll
    }
}

async function waitForLink() {
    return new Promise(resolve => {
        const checkInterval = setInterval(async () => {
            process.stdout.write('.');
            // Poll handshake again to see if status changed
            try {
                const res = await fetch(`${API_URL}/connect/handshake`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hardware_id: HW_ID })
                });
                const data = await res.json();

                if (data.status === 'linked') {
                    console.log('\n✅ Device Linked via Web!');
                    DEVICE_ID = data.device_id;
                    clearInterval(checkInterval);
                    resolve();
                }
            } catch (e) { }
        }, 2000);
    });
}

async function sendTelemetry() {
    if (!DEVICE_ID) return;

    const mockRPM = Math.floor(1000 + Math.random() * 6000);
    const mockSpeed = Math.floor(Math.random() * 200);

    try {
        await fetch(`${API_URL}/connect/telemetry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-device-id': DEVICE_ID
            },
            body: JSON.stringify({
                type: 'iracing',
                data: {
                    rpm: mockRPM,
                    speed: mockSpeed,
                    gear: Math.floor(Math.random() * 6),
                    track: 'Daytona'
                }
            })
        });
        console.log(`📡 Sent Telemetry: ${mockSpeed} kph / ${mockRPM} rpm`);
    } catch (err) {
        console.error('Telemetry failed:', err.message);
    }
}

main();
