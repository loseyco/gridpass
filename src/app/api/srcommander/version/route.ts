import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const daemonPath = path.join(process.cwd(), "scripts", "gridpass_core_daemon.py");
    let sha256 = "";
    if (fs.existsSync(daemonPath)) {
      const fileBuffer = fs.readFileSync(daemonPath);
      sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    }

    const versionManifest = {
      version: "4.3.0",
      build_id: "2026-08-31-auto-update-engine",
      min_required_version: "1.0.0",
      release_date: "2026-08-31T18:55:00Z",
      release_notes: "Auto-Updater Engine, Paddock Attendance Radar, In-Ear Steward Radio, 60 FPS Filtered Physics",
      download_url: "/api/srcommander/download",
      sha256: sha256,
      required_packages: [
        "websockets",
        "sounddevice",
        "numpy",
        "opencv-python",
        "pyserial",
        "requests",
        "pywin32"
      ]
    };

    return NextResponse.json(versionManifest, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to read version manifest", details: error?.message },
      { status: 500 }
    );
  }
}
