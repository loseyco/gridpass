const fs = require('fs');
const path = require('path');

const ROUTES = [
    '/api/auth/logout',
    '/api/auth/refresh',
    '/api/auth/reset-password',
    '/api/profiles/me/avatar',
    '/api/resumes/me/verify',
    '/api/task-lists',
    '/api/wallet/shares',
    '/api/uploads/complete',
    '/api/v1/roles' // Just in case
];

const TEMPLATE = `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ 
        success: true, 
        message: "Scaffolded Endpoint",
        data: { 
            id: "scaffold-" + Date.now().toString(),
            mock: true 
        } 
    }, { status: 201 });
}

export async function GET(request: Request) {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
}
`;

// Specific template for logout/reset which might return just success
const SIMPLE_TEMPLATE = `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ success: true, message: "Operation Successful" }, { status: 200 });
}
`;

function run() {
    console.log("🏗️ Scaffolding Missing Routes...");
    const baseDir = path.join(__dirname, '../src/app');

    ROUTES.forEach(route => {
        const routePath = path.join(baseDir, route.replace(/\//g, '\\'), 'route.ts');
        const dir = path.dirname(routePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(routePath)) {
            console.log(`Creating ${route}...`);
            const content = (route.includes('auth')) ? SIMPLE_TEMPLATE : TEMPLATE;
            fs.writeFileSync(routePath, content);
        } else {
            console.log(`Skipping ${route} (Exists)`);
        }
    });

    console.log("✅ Scaffolding Complete.");
}

run();
