const { createClient } = require('@supabase/supabase-js');
// const fetch = require('node-fetch'); // Global in Node 18+
const path = require('path');
const fs = require('fs');

// Usage: node scripts/verify_single_endpoint.js "/api/orgs" "POST" ["/api/orgs/actual-id"]

async function run() {
    const registryPath = process.argv[2];
    const targetMethod = process.argv[3] || 'GET';
    const actualPath = process.argv[4] || registryPath;

    if (!registryPath) {
        console.error("Please provide a path (e.g. /api/orgs)");
        process.exit(1);
    }

    console.log(`🎯 Targeting Registry: ${targetMethod} ${registryPath}`);
    if (actualPath !== registryPath) {
        console.log(`🔗 Actual URL: ${actualPath}`);
    }

    const cookie = await login();

    // Fetch Registry using simple fetch
    const regRes = await fetch('http://localhost:3003/api/admin/registry', {
        headers: { Cookie: cookie }
    });

    if (!regRes.ok) throw new Error("Failed to fetch registry");
    const registry = await regRes.json();

    // Find Target using REGISTRY path
    const ep = registry.find(e => e.path === registryPath && e.method === targetMethod);

    if (!ep) {
        console.error("❌ Endpoint not found in registry!");
        const partial = registry.find(e => e.path.includes(registryPath));
        if (partial) console.log(`Did you mean: ${partial.method} ${partial.path}?`);
        process.exit(1);
    }

    console.log(`Found Endpoint ID: ${ep.id}`);

    let body = ep.default_body;
    if (body && typeof body === 'string') {
        try { body = JSON.parse(body); } catch { }
    }
    if (body && body.name) {
        body.name = body.name + " " + Math.floor(Math.random() * 1000);
    }

    console.log("Payload:", JSON.stringify(body));

    // Execute using ACTUAL path
    const start = Date.now();
    const res = await fetch(`http://localhost:3003${actualPath}`, {
        method: ep.method,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie
        },
        body: ep.method !== 'GET' && ep.method !== 'DELETE' ? JSON.stringify(body) : undefined
    });

    const duration = Date.now() - start;
    console.log(`Status: ${res.status}`);

    let responseData;
    try {
        const clone = res.clone();
        responseData = await clone.json();
        console.log("Response:", JSON.stringify(responseData, null, 2));
    } catch (e) {
        const text = await res.text();
        console.log("Response Text:", text);
    }

    if (res.status >= 200 && res.status < 500) {
        console.log("✅ VERIFIED (Success/Handled Error)");
    } else {
        console.log("❌ FAILED (Server Error)");
    }
}

async function login() {
    console.log("🔑 Authenticating...");
    const res = await fetch('http://localhost:3003/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pjlosey@outlook.com', password: '!Google1!' })
    });

    if (res.ok) {
        console.log("✅ Authenticated.");
        return res.headers.get('set-cookie');
    } else {
        console.error("❌ Auth Failed");
        process.exit(1);
    }
}

run();
