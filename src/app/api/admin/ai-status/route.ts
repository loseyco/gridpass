import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const statusFile = path.join(process.cwd(), 'local-ai', 'agent_status.json');
    const planFile = path.join(process.cwd(), 'repair_plan.sql');

    let status = { state: 'offline' };
    let hasPlan = false;

    try {
        if (fs.existsSync(statusFile)) {
            const data = fs.readFileSync(statusFile, 'utf-8');
            status = JSON.parse(data);
        }
        if (fs.existsSync(planFile)) {
            hasPlan = true;
        }
    } catch (e) { }

    return NextResponse.json({
        ...status,
        hasPlan
    });
}
