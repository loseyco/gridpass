import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const daemonPath = path.join(process.cwd(), "scripts", "gridpass_core_daemon.py");
    if (!fs.existsSync(daemonPath)) {
      return NextResponse.json({ error: "Daemon script not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(daemonPath, "utf-8");

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/x-python; charset=utf-8",
        "Content-Disposition": 'attachment; filename="gridpass_core_daemon.py"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to serve daemon script", details: error?.message },
      { status: 500 }
    );
  }
}
