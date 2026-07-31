import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new NextResponse('Migration API endpoint removed. Please use client route /dash/migrate instead.', { status: 404 });
}
