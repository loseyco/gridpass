import * as fs from "fs";
import * as path from "path";

const rootDir = "c:\\_Projects";
const extensions = [".env", ".env.local", ".env.development.local", ".env.production", ".txt", ".json", ".py", ".ts", ".js", ".md"];
const patterns = [/client_secret/i, /iracing/i, /gridpass_app/i, /losey_co/i, /oauth\.iracing/i];

const results: Array<{ file: string; line: number; content: string }> = [];

function searchDir(dir: string, depth = 0) {
  if (depth > 6) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next" || entry.name === "dist" || entry.name === "build") {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        searchDir(fullPath, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const isEnv = entry.name.startsWith(".env");
        if (extensions.includes(ext) || isEnv) {
          try {
            const content = fs.readFileSync(fullPath, "utf8");
            const lines = content.split("\n");
            lines.forEach((line, idx) => {
              for (const p of patterns) {
                if (p.test(line)) {
                  results.push({ file: fullPath, line: idx + 1, content: line.trim() });
                  break;
                }
              }
            });
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

searchDir(rootDir);

console.log(`Found ${results.length} matches across C:\\_Projects:`);
results.slice(0, 100).forEach(r => {
  console.log(`[${r.file}:${r.line}] ${r.content.substring(0, 120)}`);
});
