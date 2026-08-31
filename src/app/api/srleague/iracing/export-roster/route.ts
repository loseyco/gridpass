import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leagueId, leagueName, drivers } = body;

    const safeName = (leagueName || "GridPass_League").replace(/[^a-zA-Z0-9_\-]/g, "_");

    // Convert GridPass drivers to standard iRacing AI Roster Schema
    const iracingDrivers = (drivers || []).map((d: any, index: number) => {
      const iRating = Number(d.i_rating) || 2500;
      const skill = Math.min(100, Math.max(30, Math.round(30 + (iRating / 6000) * 70)));
      const isClean = String(d.safety_rating || "").startsWith("A") || String(d.safety_rating || "").startsWith("B");
      const aggression = isClean ? 50 : 80;

      return {
        driverName: d.driver_name || `Driver ${index + 1}`,
        carNumber: String(d.car_number || index + 1),
        carPath: (d.car_model || "porsche992cup").toLowerCase().replace(/[^a-z0-9]/g, ""),
        carClassId: 1,
        skill: skill,
        aggression: aggression,
        optimism: 65,
        smoothness: 80,
        age: 28,
        pitStrategyRisk: 50,
        carId: index + 100,
        livery: {
          carNumber: String(d.car_number || index + 1),
          sponsor1: 0,
          sponsor2: 0,
          pattern: 1,
          color1: "E02020",
          color2: "111111",
          color3: "FFFFFF",
        },
      };
    });

    const rosterPayload = {
      name: `${leagueName || "GridPass"} AI Roster`,
      drivers: iracingDrivers,
    };

    // Determine target local iRacing directory
    const userHome = os.homedir();
    const iRacingAirDir = path.join(userHome, "Documents", "iRacing", "airosters", safeName);
    const targetFilePath = path.join(iRacingAirDir, "roster.json");

    let writtenLocally = false;
    try {
      if (!fs.existsSync(iRacingAirDir)) {
        fs.mkdirSync(iRacingAirDir, { recursive: true });
      }
      fs.writeFileSync(targetFilePath, JSON.stringify(rosterPayload, null, 2), "utf8");
      writtenLocally = true;
    } catch (writeErr) {
      console.warn("Could not write to local iRacing Documents folder:", writeErr);
    }

    return NextResponse.json({
      success: true,
      writtenLocally,
      filePath: targetFilePath,
      roster: rosterPayload,
      driverCount: iracingDrivers.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
