import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // TwiML Response
  const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thanks for calling GridPass. We are currently building the operating system for racing. Please leave a message.</Say>
    <Record maxLength="60" playBeep="true" />
</Response>
  `.trim();

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
