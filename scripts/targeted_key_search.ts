import * as fs from "fs";
import * as path from "path";

const rootDir = "c:\\_Projects";
const patterns = [/gridpass_app/i, /losey_co/i, /Tableware/i, /TRIMMER/i, /iracing.*secret/i, /secret.*iracing/i];
const results: Array<{ file: string; line: number; content: string }> = [];

function search(dir: string, depth = 0) {
  if (depth > 6) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        search(fullPath, depth + 1);
      } else if (entry.isFile() && !entry.name.endsWith(".log") && !entry.name.endsWith(".mp3") && !entry.name.endsWith(".zip")) {
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
  } catch (e) {}
}

search(rootDir);

console.log(`Found ${results.length} specific key/client matches:`);
results.forEach(r => {
  console.log(`[${r.file}:${r.line}] ${r.content}`);
});
