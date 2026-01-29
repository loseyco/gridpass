
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { model = 'deepseek-r1:7b', prompt, stream = false } = body;

        // GridPass AI Manager Hook (Manual Implementation for Web)
        const fs = require('fs');
        const path = require('path');
        const statusFile = path.resolve(process.cwd(), 'local-ai', 'agent_status.json');

        try {
            const status = {
                state: 'active',
                stage: 'web-request',
                target: 'API Proxy',
                log: `Prompt: ${prompt.substring(0, 50)}...`,
                updatedAt: new Date().toISOString()
            };
            fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
        } catch (e) { }

        // Forward to Ollama running on host
        const ollamaRes = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false // Force non-streaming for simple proxying initially
            })
        });

        if (!ollamaRes.ok) {
            return NextResponse.json({ success: false, error: `Ollama Error: ${ollamaRes.statusText}` }, { status: 502 });
        }

        const data = await ollamaRes.json();

        return NextResponse.json({
            success: true,
            data: {
                response: data.response,
                model: data.model,
                duration: data.total_duration
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: `Proxy Error: ${error.message}` }, { status: 500 });
    }
}
