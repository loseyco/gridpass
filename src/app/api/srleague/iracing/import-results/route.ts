import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET(req: NextRequest) {
  try {
    const userHome = os.homedir();
    const resultsDir = path.join(userHome, "Documents", "iRacing", "results");

    if (!fs.existsSync(resultsDir)) {
      return NextResponse.json({ success: true, files: [] });
    }

    const allFiles = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".json"));
    
    // Read the most recent 10 result files
    const recentFiles = allFiles
      .map((f) => {
        const fullPath = path.join(resultsDir, f);
        const stats = fs.statSync(fullPath);
        return { name: f, mtime: stats.mtimeMs, size: stats.size };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 10);

    const summaries = recentFiles.map((f) => {
      try {
        const raw = fs.readFileSync(path.join(resultsDir, f.name), "utf8");
        const parsed = JSON.parse(raw);
        const raceSession = parsed.session_results?.find((s: any) => s.simsession_name === "RACE" || s.simsession_type_name === "Race");
        const resultsCount = raceSession?.results?.length || 0;
        const winner = raceSession?.results?.[0]?.display_name || "Winner";

        return {
          filename: f.name,
          subsessionId: parsed.subsession_id,
          startTime: parsed.start_time,
          fileDate: new Date(f.mtime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
          trackName: parsed.track?.track_name,
          configName: parsed.track?.track_config_name,
          driversCount: resultsCount,
          winner: winner,
          rawSummary: parsed,
        };
      } catch {
        return {
          filename: f.name,
          subsessionId: 0,
          fileDate: new Date(f.mtime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          trackName: "Unknown",
          driversCount: 0,
        };
      }
    });

    return NextResponse.json({ success: true, files: summaries });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
