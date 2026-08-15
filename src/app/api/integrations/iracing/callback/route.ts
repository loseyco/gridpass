import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  let stateObj: { redirect?: string; uid?: string } = {};
  try {
    stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
  } catch (e) {
    return NextResponse.json({ error: 'Invalid state format' }, { status: 400 });
  }

  const { redirect, uid } = stateObj;
  if (!uid) {
    return NextResponse.json({ error: 'Missing UID in state' }, { status: 400 });
  }

  const clientId = process.env.IRACING_CLIENT_ID || 'gridpass_app';
  const clientSecret = process.env.IRACING_CLIENT_SECRET || 'TRIMMER-SCOURED-THEORIZE-SKILLET-VENEERING-Simple';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/integrations/iracing/callback`;

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth.iracing.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Failed to get token:', await tokenRes.text());
      return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Member Info
    const memberUrl = 'https://members-ng.iracing.com/data/member/get';
    const memberRes = await fetch(memberUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    let finalMemberInfo: any = {};
    if (memberRes.ok) {
      const memberData = await memberRes.json();
      if (memberData.link) {
        const s3Res = await fetch(memberData.link);
        if (s3Res.ok) finalMemberInfo = await s3Res.json();
      } else {
        finalMemberInfo = memberData;
      }
    }

    // 3. Fetch Career Stats
    const careerUrl = 'https://members-ng.iracing.com/data/stats/member_career';
    const careerRes = await fetch(careerUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let finalCareerStats: any = null;
    if (careerRes.ok) {
      const careerData = await careerRes.json();
      if (careerData.link) {
        const s3Res = await fetch(careerData.link);
        if (s3Res.ok) finalCareerStats = await s3Res.json();
      } else {
        finalCareerStats = careerData;
      }
    }

    // iRacing member/get usually returns an array of members if requested, or a single object
    const memberObj = Array.isArray(finalMemberInfo?.members) ? finalMemberInfo.members[0] : finalMemberInfo;
    const custId = memberObj?.cust_id || finalCareerStats?.stats?.[0]?.cust_id || finalCareerStats?.cust_id;

    // Store in Firestore
    const db = getAdminDb();
    if (db) {
      await db.collection('users').doc(uid).set({
        iracing_cust_id: custId ? String(custId) : '',
        iracing_stats: {
          last_synced_at: new Date().toISOString(),
          cust_id: custId || null,
          member_since: memberObj?.member_since || null,
          club_name: memberObj?.club_name || null,
          member_info: memberObj || null,
          career_stats: finalCareerStats || null,
          connection_status: 'connected',
          refresh_token: tokenData.refresh_token || null
        }
      }, { merge: true });
    }

    const redirectUrl = redirect || '/dash/edit-profile';
    const finalUrl = `${baseUrl}${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}sync=success`;
    
    return NextResponse.redirect(finalUrl);

  } catch (err: any) {
    console.error('iRacing integration error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
