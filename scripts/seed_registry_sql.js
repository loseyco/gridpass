
const fs = require('fs');
const path = require('path');

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

function run() {
    console.log("Scanning src/app/api...");
    const routes = findRoutes(path.join(process.cwd(), 'src/app/api'));

    let sqlValues = [];

    for (const routePath of routes) {
        const content = fs.readFileSync(routePath, 'utf-8');
        const methods = extractMethods(content);

        let apiPath = routePath.replace(/\\/g, '/');
        // Robust split in case path varies
        if (apiPath.includes('src/app/api')) {
            apiPath = apiPath.split('src/app/api')[1].replace('/route.ts', '').replace('/route.js', '');
        } else {
            // Fallback just in case
            continue;
        }

        apiPath = '/api' + apiPath;
        apiPath = apiPath.replace(/\[([^\]]+)\]/g, '{$1}');
        if (apiPath === '/api') apiPath = '/api';

        for (const m of methods) {
            sqlValues.push(`('${apiPath}', '${m}', 'untested')`);
        }
    }

    if (sqlValues.length > 0) {
        const sql = `
INSERT INTO public.sys_api_registry (path, method, status)
VALUES
${sqlValues.join(',\n')}
ON CONFLICT (path, method) DO UPDATE SET status = 'untested';
        `;
        fs.writeFileSync('registry_seed.sql', sql);
        console.log(`Generated registry_seed.sql with ${sqlValues.length} endpoints.`);
    } else {
        console.log("No endpoints found.");
    }
}

run();
