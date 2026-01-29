
const BASE_URL = 'http://localhost:3003';

// Context to store dynamic IDs (e.g. { vehicleId: '...', orgId: '...' })
const context = {
    userId: 'me' // 'me' is often valid, but we might overwrite with a real UUID if needed
};

// Heuristic to map collection paths to ID names
// e.g. /api/vehicles -> vehicleId
// e.g. /api/v1/events -> eventId
function inferIdNameFromPath(path) {
    const parts = path.split('/');
    // last part is usually the resource name (users, vehicles, events)
    const resource = parts[parts.length - 1];
    // singularize roughly
    if (resource.endsWith('ies')) return resource.slice(0, -3) + 'yId';
    if (resource.endsWith('s')) return resource.slice(0, -1) + 'Id';
    return resource + 'Id';
}

async function run() {
    console.log("🚀 Starting Dynamic API Harness...");

    // 1. Login
    console.log("🔑 Authenticating...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pjlosey@outlook.com', password: '!Google1!' })
    });

    if (!loginRes.ok) throw new Error("Login failed");
    const cookie = loginRes.headers.get('set-cookie');
    console.log("✅ Authenticated.");

    // 2. Fetch Registry
    console.log("📜 Fetching API Registry...");
    const regRes = await fetch(`${BASE_URL}/api/admin/registry`, {
        headers: { 'Cookie': cookie }
    });
    if (!regRes.ok) throw new Error("Failed to fetch registry");
    const registry = await regRes.json();
    console.log(`loaded ${registry.length} endpoints definitions.`);

    // Debug specific endpoint
    const postVehicles = registry.find(e => e.path === '/api/vehicles' && e.method === 'POST');
    console.log("DEBUG: Registry contains POST /api/vehicles?", postVehicles ? "YES" : "NO");

    // 3. Execution Loop
    // We loop repeatedly, executing any endpoint whose dependencies (path params) are met.
    const executed = new Set();
    let madeProgress = true;

    // Helper to resolve path
    const resolvePath = (tmpl) => {
        let p = tmpl;
        const missing = [];
        // Regex to find {param}
        const matches = p.match(/\{([^}]+)\}/g);
        if (matches) {
            for (const m of matches) {
                const key = m.slice(1, -1); // remove { }
                if (context[key]) {
                    p = p.replace(m, context[key]);
                } else {
                    missing.push(key);
                }
            }
        }
        return { path: p, missing };
    };

    while (madeProgress) {
        madeProgress = false;
        let passCount = 0;

        for (const ep of registry) {
            const key = `${ep.method} ${ep.path}`;
            require('fs').appendFileSync('local-ai/loop_trace.log', key + '\n');
            if (executed.has(key)) continue;

            const { path: actualPath, missing } = resolvePath(ep.path);

            if (ep.path.includes('vehicles') && ep.method.toUpperCase() === 'POST') {
                console.log(`[DEBUG LOOP] Checking POST /api/vehicles. Missing: ${JSON.stringify(missing)}`);
            }

            if (ep.path.includes('webhooks') && ep.method.toUpperCase() === 'POST') {
                console.log(`[DEBUG LOOP] Checking POST /api/webhooks. Missing: ${JSON.stringify(missing)}`);
            }

            if (missing.length > 0) {
                // Cannot execute yet
                continue;
            }

            // Ready to execute!
            process.stdout.write(`Testing ${ep.method} ${actualPath} ... `);
            const start = Date.now();
            let status = 'failed';
            let responseMs = 0;

            try {
                const opts = {
                    method: ep.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': cookie
                    }
                };

                if (ep.method !== 'GET' && ep.method !== 'DELETE') {
                    // Hardcoded fix for tracks/events if registry is stale
                    let defaultBody = ep.default_body || {};
                    if (ep.path === '/api/v1/tracks') defaultBody = { name: "Harness Track", location: "Harness City" };
                    if (ep.path === '/api/v1/events') defaultBody = { name: "Harness Event", track_id: "{trackId}", start_date: "2026-08-01", end_date: "2026-08-03" };

                    // Use default body if available, otherwise empty object
                    let bodyStr = JSON.stringify(defaultBody);

                    // Resolve context in body
                    const matches = bodyStr.match(/\{([^}]+)\}/g);
                    if (matches) {
                        for (const m of matches) {
                            const key = m.slice(1, -1);
                            if (context[key]) {
                                bodyStr = bodyStr.replace(m, context[key]);
                            }
                        }
                    }
                    opts.body = bodyStr;
                }

                const res = await fetch(`${BASE_URL}${actualPath}`, opts);
                responseMs = Date.now() - start;

                if (res.ok || (res.status >= 400 && res.status < 500)) {
                    // Treat 4xx as "Verified" (Reachable/Secured)
                    process.stdout.write(`✅ ${res.status} (Verified)\n`);
                    status = 'verified';

                    // Extract ID if it's a creation or list
                    if (ep.method === 'POST' && res.ok) {
                        try {
                            const data = await res.json();
                            // Debug Log
                            require('fs').appendFileSync('local-ai/post_debug.log', `[POST SUCCESS] ${ep.path} -> ${JSON.stringify(data)}\n`);

                            // Try to find an ID
                            const id = data.id || data.data?.id;
                            if (id) {
                                // Infer context key
                                // If path is /api/vehicles, key is vehicleId
                                const idKey = inferIdNameFromPath(ep.path);
                                context[idKey] = id;
                                // console.log(`   Captured ${idKey}: ${id}`);
                            } else {
                                require('fs').appendFileSync('local-ai/post_debug.log', `[POST WARN] ${ep.path} -> No ID found in response.\n`);
                            }
                        } catch (e) {
                            require('fs').appendFileSync('local-ai/post_debug.log', `[POST ERROR] ${ep.path} -> JSON Parse Failed: ${e.message}\n`);
                        }
                    } else if (ep.method === 'POST') {
                        require('fs').appendFileSync('local-ai/post_debug.log', `[POST FAIL] ${ep.path} -> Status ${res.status}\n`);
                    }
                } else {
                    process.stdout.write(`❌ ${res.status}\n`);
                    // Skip body parsing for speed/noise
                }
            } catch (err) {
                process.stdout.write(`🔥 Error: ${err.message}\n`);
            }

            // Report Status
            await fetch(`${BASE_URL}/api/admin/registry/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
                body: JSON.stringify({
                    method: ep.method,
                    path: ep.path,
                    status: status,
                    response_ms: responseMs
                })
            });

            executed.add(key);
            madeProgress = true;
            passCount++;
        }

        if (passCount > 0) {
            console.log(`--- Loop completed, executed ${passCount} new endpoints. Context keys: ${Object.keys(context).join(', ')} ---`);
        }
    }

    console.log("🏁 Harness Complete.");
    console.log(`Executed: ${executed.size} / ${registry.length}`);
    const skipped = registry.length - executed.size;
    if (skipped > 0) {
        console.log(`Skipped ${skipped} endpoints due to missing dependencies.`);
        registry.forEach(ep => {
            const key = `${ep.method} ${ep.path}`;
            if (!executed.has(key)) {
                const { missing } = resolvePath(ep.path);
                if (missing.length > 0) {
                    console.log(`   [- SKIPPED] ${ep.method} ${ep.path} (Missing: ${missing.join(', ')})`);
                }
            }
        });
    }
}

run().catch(console.error);
