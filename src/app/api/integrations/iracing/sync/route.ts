import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'Missing UID' }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const refreshToken = userData?.iracing_stats?.refresh_token;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No iRacing refresh token found for user' }, { status: 400 });
    }

    const clientId = process.env.IRACING_CLIENT_ID || 'gridpass_app';
    const clientSecret = process.env.IRACING_CLIENT_SECRET || 'TRIMMER-SCOURED-THEORIZE-SKILLET-VENEERING-Simple';

    // 1. Refresh token
    const tokenRes = await fetch('https://oauth.iracing.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Failed to refresh token:', await tokenRes.text());
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token || refreshToken;

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

    const memberObj = Array.isArray(finalMemberInfo?.members) ? finalMemberInfo.members[0] : finalMemberInfo;
    const custId = memberObj?.cust_id || finalCareerStats?.stats?.[0]?.cust_id || finalCareerStats?.cust_id;

    // Update Firestore
    await db.collection('users').doc(uid).set({
      iracing_cust_id: custId ? String(custId) : userData?.iracing_cust_id,
      iracing_stats: {
        last_synced_at: new Date().toISOString(),
        cust_id: custId || userData?.iracing_stats?.cust_id,
        member_since: memberObj?.member_since || userData?.iracing_stats?.member_since,
        club_name: memberObj?.club_name || userData?.iracing_stats?.club_name,
        member_info: memberObj || null,
        career_stats: finalCareerStats || null,
        connection_status: 'connected',
        refresh_token: newRefreshToken
      }
    }, { merge: true });

    return NextResponse.json({ success: true, synced_at: new Date().toISOString() });

  } catch (err: any) {
    console.error('iRacing sync error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
