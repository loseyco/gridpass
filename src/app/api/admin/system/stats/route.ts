import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();
    
    // Simple load average override for Windows (which doesn't support loadavg correctly usually)
    const loadRaw = os.loadavg(); 
    const cpuUsage = 0; // Placeholder, real calc requires delta

    return NextResponse.json({
        platform: os.platform(),
        arch: os.arch(),
        cpu: {
            model: cpus[0].model,
            cores: cpus.length,
            speed: cpus[0].speed
        },
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            percent: Math.round((usedMem / totalMem) * 100)
        },
        uptime: os.uptime()
    });
}
