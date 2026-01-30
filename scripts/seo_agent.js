const fs = require('fs');
const path = require('path');

// Configuration
// If script is in gridpass/scripts/seo_agent.js, __dirname is gridpass/scripts
const PROJECT_ROOT = path.resolve(__dirname, '../src/app');
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3'; // or 'deepseek-r1:7b'
const DRY_RUN = process.argv.includes('--dry-run');

// Report Data
const REPORT_FILE = path.join(__dirname, '../local-ai/reports/seo_audit.json');
let reportData = {
    generatedAt: new Date().toISOString(),
    pagesScanned: 0,
    missingMetadata: 0,
    details: []
};

// Load AI Manager if available
let aiManager;
try {
    aiManager = require('../local-ai/ai-manager');
} catch (e) {
    console.warn('AI Manager not found, running standalone.');
    aiManager = {
        updateStatus: (state, name, msg) => console.log(`[${state.toUpperCase()}] ${name}: ${msg}`),
        ensureHud: () => { }
    };
}

console.log(`Starting Local SEO Agent (2026 Edition)...`);
console.log(`Target: ${PROJECT_ROOT}`);
console.log(`Dry Run: ${DRY_RUN}`);

/**
 * Recursive function to find all page.tsx files
 */
function findPageFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findPageFiles(filePath, fileList);
        } else {
            if (file === 'page.tsx' || file === 'page.js') {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

/**
 * Check if file has metadata
 */
function hasMetadata(content) {
    return content.includes('export const metadata') || content.includes('export async function generateMetadata');
}

/**
 * Load Expert Context
 */
function getExpertContext() {
    const expertPath = path.join(__dirname, '../local-ai/experts/seo.md');
    if (fs.existsSync(expertPath)) {
        return fs.readFileSync(expertPath, 'utf8');
    }
    return ''; // Fallback
}

/**
 * Call Ollama to generate metadata
 */
function generateMetadataWithOllama(filePath, content) {
    return new Promise(async (resolve, reject) => {
        const relativePath = path.relative(PROJECT_ROOT, filePath);

        const expertPrompt = getExpertContext();

        const prompt = `
${expertPrompt}

Task: Generate Next.js 14 metadata export for the following page.
File Path: src/app/${relativePath}

Existing Page Content:
\`\`\`typescript
${content.substring(0, 2000)} ...
\`\`\`

Instructions:
- **Return ONLY the TypeScript code block.**
- Follow the guidelines in your persona definition.
- If the page is dynamic, use generateMetadata.
`;

        // Update HUD
        aiManager.updateStatus('thinking', 'SEO Agent', `Optimizing ${relativePath}`);

        try {
            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL,
                    prompt: prompt,
                    stream: false,
                    options: { temperature: 0.3 }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API Error: ${response.statusText}`);
            }

            const data = await response.json();
            resolve(data.response);

        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Main execution loop
 */
async function main() {
    aiManager.ensureHud();
    aiManager.updateStatus('idle', 'SEO Agent', 'Scanning for 2026 Optimization...');

    let pages = [];

    // Check for specific file arg
    // Ignore this script itself if parsed
    const scriptName = path.basename(__filename);
    const specificFile = process.argv.slice(2).find(arg =>
        (arg.endsWith('.tsx') || arg.endsWith('.js')) && !arg.includes(scriptName)
    );

    if (specificFile) {
        // Resolve against CWD (where running from)
        const fullPath = path.resolve(process.cwd(), specificFile);
        if (fs.existsSync(fullPath)) {
            pages = [fullPath];
            console.log(`Targeting single file: ${fullPath}`);
        } else {
            console.error(`File not found: ${fullPath}`);
            process.exit(1);
        }
    } else {
        pages = findPageFiles(PROJECT_ROOT);
    }

    console.log(`Found ${pages.length} pages.`);
    reportData.pagesScanned = pages.length;

    for (const pagePath of pages) {
        console.log(`Processing: ${pagePath}`);
        const content = fs.readFileSync(pagePath, 'utf8');

        if (hasMetadata(content)) {
            console.log(`[SKIP] Has metadata: ${path.relative(PROJECT_ROOT, pagePath)}`);
            continue;
        }

        reportData.missingMetadata++;
        const relativePath = path.relative(PROJECT_ROOT, pagePath);
        console.log(`[MISSING] Generating metadata for: ${relativePath}`);

        try {
            const rawResponse = await generateMetadataWithOllama(pagePath, content);

            // Clean up code block
            let cleanCode = rawResponse.replace(/```typescript|```tsx|```/g, '').trim();
            cleanCode = cleanCode.replace(/<think>[\s\S]*?<\/think>/g, '');

            // Show in HUD
            const basename = path.basename(path.dirname(pagePath)) + '/' + path.basename(pagePath);
            aiManager.updateStatus('active', 'SEO Agent', `Generated: ${basename}`);

            // Add to report
            reportData.details.push({
                file: relativePath,
                status: 'generated',
                preview: cleanCode.substring(0, 100) + '...'
            });

            if (DRY_RUN) {
                console.log(`\n--- SUGGESTED CHANGE FOR ${relativePath} ---`);
                console.log(cleanCode);
                console.log('----------------------------------------------\n');

                await new Promise(r => setTimeout(r, 2000)); // HUD visibility delay

            } else {
                const lines = content.split('\n');
                let lastImportIndex = -1;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith('import ')) {
                        lastImportIndex = i;
                    }
                }

                let finalContent = content;
                // Add import if missing (naive check)
                if (!content.includes('Metadata } from \'next\'') && !content.includes('Metadata } from "next"')) {
                    // Check if generated code has import
                    if (!cleanCode.includes('import type { Metadata }')) {
                        finalContent = "import type { Metadata } from 'next';\n" + finalContent;
                    }
                }

                if (cleanCode.startsWith('import')) {
                    if (content.includes('Metadata } from') && cleanCode.includes('Metadata } from')) {
                        cleanCode = cleanCode.replace(/import .*?Metadata .*?from .next.;[\r\n]*/, '');
                    }
                }

                const defaultExportMatch = finalContent.match(/export default/);
                if (defaultExportMatch) {
                    finalContent = finalContent.substring(0, defaultExportMatch.index) +
                        "\n" + cleanCode + "\n\n" +
                        finalContent.substring(defaultExportMatch.index);
                } else {
                    finalContent += "\n\n" + cleanCode;
                }

                fs.writeFileSync(pagePath, finalContent);
                console.log(`[WROTE] Updated ${pagePath}`);
                aiManager.updateStatus('success', 'SEO Agent', `Wrote metadata for ${relativePath}`);
            }

        } catch (e) {
            console.error(`[ERROR] Failed to process ${pagePath}:`, e.message);
            aiManager.updateStatus('error', 'SEO Agent', `Failed on ${relativePath}: ${e.message}`);
            reportData.details.push({
                file: relativePath,
                status: 'error',
                error: e.message
            });
        }
    }

    // Save report
    try {
        if (!fs.existsSync(path.dirname(REPORT_FILE))) {
            fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
        }
        fs.writeFileSync(REPORT_FILE, JSON.stringify(reportData, null, 2));
        console.log(`[REPORT] Saved to ${REPORT_FILE}`);
    } catch (e) {
        console.error('[REPORT] Failed to save report:', e.message);
    }

    aiManager.updateStatus('idle', 'SEO Agent', 'Run complete.');
}

main().catch(console.error);
