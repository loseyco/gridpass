const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../src/app');
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const OLLAMA_MODEL = 'llama3'; // or 'deepseek-r1:7b' based on availability
const DRY_RUN = process.argv.includes('--dry-run');

console.log(`Starting Local SEO Agent...`);
console.log(`Target: ${PROJECT_ROOT}`);
console.log(`Dry Run: ${DRY_RUN}`);

/**
 * Recursive function to find all page.tsx files
 */
function findPageFiles(dir, fileList = []) {
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
 * Simple regex check for now. Robust AST passing could be added later if needed.
 */
function hasMetadata(content) {
    return content.includes('export const metadata') || content.includes('export async function generateMetadata');
}

/**
 * Call Ollama to generate metadata
 */
function generateMetadataWithOllama(filePath, content) {
    return new Promise((resolve, reject) => {
        const relativePath = path.relative(PROJECT_ROOT, filePath);
        const prompt = `
You are an expert SEO engineer for a Next.js application called "GridPass" (a business operating system for racing teams).
Generate a Next.js 14 metadata export for the following page.
File Path: src/app/${relativePath}

Existing Page Content:
\`\`\`typescript
${content.substring(0, 2000)} ... (truncated)
\`\`\`

Rules:
1. Return ONLY the TypeScript code block for the metadata.
2. Title must be < 60 chars.
3. Description must be < 110 chars.
4. Use standard Metadata type.
5. If the page seems to be a dynamic profile or requires data fetching, generate a 'generateMetadata' function instead of a constant.
6. Always include a placeholder openGraph image if specific one isn't obvious ('/images/og-default.jpg').

Output format:
export const metadata: Metadata = {
  title: "...",
  description: "...",
  // ...
};
`;

        const postData = JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false
        });

        const options = {
            hostname: OLLAMA_HOST,
            port: OLLAMA_PORT,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response.response);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Main execution loop
 */
async function main() {
    const pages = findPageFiles(PROJECT_ROOT);
    console.log(`Found ${pages.length} pages.`);

    for (const pagePath of pages) {
        const content = fs.readFileSync(pagePath, 'utf8');
        
        if (hasMetadata(content)) {
            // console.log(`[SKIP] Has metadata: ${path.relative(PROJECT_ROOT, pagePath)}`);
            continue;
        }

        console.log(`[MISSING] Generating metadata for: ${path.relative(PROJECT_ROOT, pagePath)}`);
        
        try {
            const rawResponse = await generateMetadataWithOllama(pagePath, content);
            
            // Clean up code block
            const cleanCode = rawResponse.replace(/```typescript|```/g, '').trim();
            
            if (DRY_RUN) {
                console.log(`\n--- SUGGESTED CHANGE FOR ${path.basename(pagePath)} ---`);
                console.log(cleanCode);
                console.log('----------------------------------------------\n');
            } else {
                // Determine where to insert. Usually after imports.
                // Naive insertion: Find last import or top of file.
                const lines = content.split('\n');
                let lastImportIndex = -1;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].startsWith('import ')) {
                        lastImportIndex = i;
                    }
                }

                // If no Metadata import, we might need to add it, but for now let's hope it's not strictly typed or user fixes it.
                // Actually, let's verify if 'Metadata' is imported.
                let newContent = content;
                if (!content.includes('import { Metadata }') && !content.includes('import type { Metadata }')) {
                     // Add import if missing (this is tricky with naive regex, but best effort)
                     // better to just let the generated code assume it or user fix imports.
                     // The prompt asks for 'Metadata' type, so we should probably add the import.
                     if (lastImportIndex !== -1) {
                         lines.splice(lastImportIndex + 1, 0, "import type { Metadata } from 'next';");
                     } else {
                         lines.unshift("import type { Metadata } from 'next';");
                     }
                }

                // Re-calculate split since we might have modified lines array
                // For simplicity, just append to bottom if we can't find a good spot, 
                // BUT metadata usually goes near top. 
                // Let's just append at the end of imports.
                
                const insertionPoint = lastImportIndex !== -1 ? lastImportIndex + 2 : 0; // +2 to account for possible added import line + 1
                
                // Let's reload lines to be safe if we modified it
                // Actually, let's just do a simple append for now or simple replace.
                
                // Better strategy:
                // 1. Add import 'Metadata' from 'next' at top if missing.
                // 2. Insert the generated code after the imports.
                
                let finalContent = content;
                if (!finalContent.includes('Metadata } from \'next\'')) {
                     finalContent = "import type { Metadata } from 'next';\n" + finalContent;
                }
                
                // Find end of imports
                const importsEndMatch = finalContent.match(/import .*?;(\r?\n)+/g);
                // This is getting complicated for regex.
                // Let's just append the export metadata before the default export.
                
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
            }

        } catch (e) {
            console.error(`[ERROR] Failed to process ${pagePath}:`, e.message);
        }
    }
}

main().catch(console.error);
