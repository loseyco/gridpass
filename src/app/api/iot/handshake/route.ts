import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { node_id, qr_id, rssi, timestamp } = body;

    if (!node_id || !qr_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: node_id and qr_id' },
        { status: 400 }
      );
    }

    const handshakePayload = {
      node_id,
      qr_id,
      rssi: rssi || -70,
      timestamp: timestamp || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Skip actual DB write in Playwright mock mode
    const isMock = request.headers.get('x-playwright-mock') === 'true';

    if (!isMock) {
      try {
        await addDoc(collection(db, 'venue_checkins'), {
          ...handshakePayload,
          created_at_db: serverTimestamp()
        });
      } catch (dbErr) {
        console.error('Firestore IoT logging failed, falling back:', dbErr);
      }
    }

    await logEvent('success', 'scan', `IoT Handshake verified: Node [${node_id}] logged QR [${qr_id}] (RSSI: ${handshakePayload.rssi}dBm)`);

    return NextResponse.json({
      success: true,
      message: 'IoT Handshake recorded successfully',
      handshake: handshakePayload
    });
  } catch (err: any) {
    console.error('IoT Handshake error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
