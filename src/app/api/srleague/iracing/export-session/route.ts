import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leagueId, leagueName, round, series } = body;

    const sessionPayload = {
      session_name: `${leagueName || "GridPass"} - Round ${round?.round_number || 1}: ${round?.title || "Race"}`,
      track_name: round?.track_name || "Sebring International Raceway",
      track_layout: round?.track_layout || "Full Course",
      sim_platform: series?.game || "iracing",
      scheduled_date: round?.scheduled_date || "TBD",
      practice_length_mins: 30,
      qualifying_length_mins: round?.qualifying_minutes || 15,
      race_length_type: round?.race_length_type || "minutes",
      race_length_value: round?.race_length_value || 45,
      weather: {
        temp_f: round?.weather_temp_f || 75,
        sky: round?.weather_sky || "clear",
        dynamic_weather: true,
      },
      rules: {
        incident_limit_drive_through: 12,
        incident_limit_disqualification: series?.incident_limit_dq || 17,
        fast_repairs: 1,
        restarts: "double_file",
      },
    };

    const safeTitle = (round?.title || "round_1").replace(/[^a-zA-Z0-9_\-]/g, "_");
    const userHome = os.homedir();
    const sessionsDir = path.join(userHome, "Documents", "iRacing", "sessions");
    const targetFilePath = path.join(sessionsDir, `${safeTitle}.json`);

    let writtenLocally = false;
    try {
      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
      }
      fs.writeFileSync(targetFilePath, JSON.stringify(sessionPayload, null, 2), "utf8");
      writtenLocally = true;
    } catch (writeErr) {
      console.warn("Could not write session to Documents folder:", writeErr);
    }

    return NextResponse.json({
      success: true,
      writtenLocally,
      filePath: targetFilePath,
      session: sessionPayload,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
