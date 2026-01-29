const { createClient } = require('@supabase/supabase-js');

async function run() {
    console.log("🚀 Verifying Final 3 Credential Endpoints...");
    const cookie = await login();
    const credId = '04f06cfe-a21e-4976-9fb2-6fc56fb20ffd';

    const endpoints = [
        `/api/v1/credentials/${credId}/verify`
    ];

    for (const path of endpoints) {
        console.log(`Testing POST ${path}`);
        try {
            const res = await fetch(`http://localhost:3003${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
                body: JSON.stringify({ note: "Test Verification" })
            });
            console.log(`Result: ${res.status}`);
            const text = await res.text();
            console.log("Body:", text.substring(0, 100));
        } catch (e) { console.log(e.message); }
    }
}

async function login() {
    const res = await fetch('http://localhost:3003/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pjlosey@outlook.com', password: '!Google1!' })
    });
    await res.text();
    return res.headers.get('set-cookie');
}

run();
