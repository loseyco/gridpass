import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      version: 'v4.9.5',
      build_id: 'gridpass_release_20260809_v4_9_5',
      timestamp: new Date().toISOString()
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
}
