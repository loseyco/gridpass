import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ 
        success: true, 
        message: "Scaffolded Endpoint",
        data: { 
            id: "scaffold-" + Date.now().toString(),
            mock: true 
        } 
    }, { status: 201 });
}

export async function GET(request: Request) {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
}
