import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { league_id, payload } = body;

    if (!league_id || !payload) {
      return NextResponse.json({ error: "Missing league_id or payload" }, { status: 400 });
    }

    // Write live snapshot to Cloud Firestore
    await setDoc(
      doc(db, "sr_league_live_sessions", league_id),
      {
        ...payload,
        updated_at: new Date().toISOString(),
        updated_timestamp: Date.now(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
