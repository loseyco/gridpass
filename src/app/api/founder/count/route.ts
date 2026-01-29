import { NextResponse } from 'next/server';
import { getFounderCount } from '@/utils/founders';

export const dynamic = 'force-dynamic'; // Ensure we don't cache stale counts

export async function GET() {
    const data = await getFounderCount();
    return NextResponse.json(data);
}
