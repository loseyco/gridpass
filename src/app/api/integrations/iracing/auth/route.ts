import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/dash/edit-profile';
  const uid = searchParams.get('uid') || '';
  
  const clientId = process.env.IRACING_CLIENT_ID || 'gridpass_app';
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/integrations/iracing/callback`;
  
  const stateObj = { redirect, uid };
  const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
  
  const iracingAuthUrl = `https://oauth.iracing.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=iracing.auth&state=${encodedState}`;
  
  return NextResponse.redirect(iracingAuthUrl);
}
