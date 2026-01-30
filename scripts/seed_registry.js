
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to find all route.ts files
function findRoutes(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findRoutes(filePath, fileList);
        } else {
            if (file === 'route.ts' || file === 'route.js') {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

// Helper to extract methods from file content
function extractMethods(content) {
    const methods = [];
    if (content.match(/export (async )?function GET/)) methods.push('GET');
    if (content.match(/export (async )?function POST/)) methods.push('POST');
    if (content.match(/export (async )?function PUT/)) methods.push('PUT');
    if (content.match(/export (async )?function DELETE/)) methods.push('DELETE');
    if (content.match(/export (async )?function PATCH/)) methods.push('PATCH');
    return methods;
}

async function run() {
    // 1. Init Supabase
    // We need env vars. For now, assume user has them or we use local defaults?
    // User context says "running on localhost".
    // We will hardcode or require dotenv.

    // We'll assume the script is run with ENV vars or read .env.local
    let sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // Try to read .env.local if not set
    if (!sbUrl || !sbKey) {
        try {
            const env = fs.readFileSync('.env.local', 'utf-8');
            env.split('\n').forEach(line => {
                const [k, v] = line.split('=');
                if (k && v) {
                    if (k.trim() === 'NEXT_PUBLIC_SUPABASE_URL') sbUrl = v.trim();
                    if (k.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') sbKey = v.trim();
                }
            });
        } catch (e) {
            console.error("Could not read .env.local");
        }
    }

    if (!sbUrl || !sbKey) {
        console.error("Missing Supabase Credentials");
        process.exit(1);
    }

    const supabase = createClient(sbUrl, sbKey);

    // 2. Scan
    console.log("Scanning src/app/api...");
    const routes = findRoutes(path.join(process.cwd(), 'src/app/api'));
    const registry = [];

    for (const routePath of routes) {
        const content = fs.readFileSync(routePath, 'utf-8');
        const methods = extractMethods(content);

        // Convert file path to API path
        // c:\Users\..\src\app\api\v1\events\route.ts -> /api/v1/events
        let apiPath = routePath.replace(/\\/g, '/'); // Normalize slashes
        apiPath = apiPath.split('src/app/api')[1].replace('/route.ts', '').replace('/route.js', '');
        apiPath = '/api' + apiPath; // Ensure prefix
        // Handle [id] -> {id}
        apiPath = apiPath.replace(/\[([^\]]+)\]/g, '{$1}');

        if (apiPath === '/api') apiPath = '/api'; // root? likely not.

        for (const m of methods) {
            registry.push({
                path: apiPath,
                method: m,
                status: 'untested' // Reset status
            });
        }
    }

    console.log(`Found ${registry.length} endpoints.`);

    // 3. Upsert
    const { error } = await supabase.from('sys_api_registry').upsert(registry, { onConflict: 'path, method' });

    if (error) {
        console.error("Error seeding registry:", error);
    } else {
        console.log("Registry seeded successfully!");
    }
}

run();
