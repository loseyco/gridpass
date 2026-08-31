import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const launcherPath = path.join(process.cwd(), "scripts", "Launch_GridPass_Apex_Core.bat");
    if (!fs.existsSync(launcherPath)) {
      return NextResponse.json({ error: "Launcher file not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(launcherPath, "utf-8");

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/x-bat",
        "Content-Disposition": 'attachment; filename="Launch_GridPass_Apex_Core.bat"',
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to read launcher" }, { status: 500 });
  }
}
