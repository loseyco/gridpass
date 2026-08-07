import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const secret = searchParams.get('secret')

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })
  }

  try {
    const venueRef = doc(db, 'users', `venue_telemetry_${slug}`)
    const snap = await getDoc(venueRef)
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Venue telemetry document not found' }, { status: 404 })
    }

    const data = snap.data()
    const currentVersion = data.rulesVersion || 1
    const guidelines = data.simGuidelines || []
    const pendingJob = data.pendingBotNotecardJob || null

    const formattedNotecardText = `==================================================\n📜 ${slug.toUpperCase().replace(/-/g, ' ')} OFFICIAL SIM RULES (v${currentVersion}.0)\n==================================================\n\n` +
      (guidelines.length > 0 ? guidelines.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n\n') : '1. Respect all residents & staff.\n\n2. No griefing or script overload.') +
      `\n\n--------------------------------------------------\n🌐 Open Live Portal & Resident Passport:\nhttps://gridpass.app/secondlife/${slug}\n==================================================`

    return NextResponse.json({
      success: true,
      slug,
      rulesVersion: currentVersion,
      notecardName: `Gridpass Sim Rules v${currentVersion}.0`,
      notecardText: formattedNotecardText,
      pendingJob,
      botStatus: data.botStatus || 'ACTIVE',
      lastBotNotecardUpload: data.lastBotNotecardUpload || null
    })
  } catch (e) {
    console.error("Bot Hook GET error:", e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slug, action, notecardAssetId, botName, secret } = body

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })
    }

    const venueRef = doc(db, 'users', `venue_telemetry_${slug}`)
    const snap = await getDoc(venueRef)
    const existing = snap.exists() ? snap.data() : {}
    const currentVersion = existing.rulesVersion || 1
    const guidelines = existing.simGuidelines || []

    const formattedNotecardText = `==================================================\n📜 ${slug.toUpperCase().replace(/-/g, ' ')} OFFICIAL SIM RULES (v${currentVersion}.0)\n==================================================\n\n` +
      (guidelines.length > 0 ? guidelines.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n\n') : '1. Respect all residents & staff.\n\n2. No griefing or script overload.') +
      `\n\n--------------------------------------------------\n🌐 Open Live Portal & Resident Passport:\nhttps://gridpass.app/secondlife/${slug}\n==================================================`

    if (action === 'create_job') {
      const newJob = {
        id: `job_${Date.now()}`,
        rulesVersion: currentVersion,
        notecardName: `Gridpass Sim Rules v${currentVersion}.0`,
        notecardText: formattedNotecardText,
        queuedAt: new Date().toISOString(),
        status: 'QUEUED'
      }

      await setDoc(venueRef, {
        pendingBotNotecardJob: newJob,
        botStatus: 'JOB_QUEUED',
        updatedAt: new Date().toISOString()
      }, { merge: true })

      return NextResponse.json({
        success: true,
        message: `Gridpass SL Bot Notecard Job queued for v${currentVersion}.0`,
        job: newJob
      })
    }

    if (action === 'complete_job') {
      const nowIso = new Date().toISOString()
      await setDoc(venueRef, {
        pendingBotNotecardJob: null,
        botStatus: 'ACTIVE',
        lastBotNotecardUpload: {
          rulesVersion: currentVersion,
          notecardAssetId: notecardAssetId || 'sl_asset_' + Date.now(),
          botName: botName || 'Gridpass Official Bot',
          completedAt: nowIso
        },
        updatedAt: nowIso
      }, { merge: true })

      return NextResponse.json({
        success: true,
        message: `Gridpass SL Bot completed Notecard upload for v${currentVersion}.0`,
        completedAt: nowIso
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e) {
    console.error("Bot Hook POST error:", e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
