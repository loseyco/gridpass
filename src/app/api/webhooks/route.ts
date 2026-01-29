import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({
        success: true,
        message: "Webhook Created (Mock)",
        data: {
            id: "swh-" + Date.now().toString(),
            url: "https://mock.url",
            events: ["all"]
        }
    }, { status: 201 });
}

export async function GET(request: Request) {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
}
