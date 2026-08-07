import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/config'
import { doc, setDoc, getDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore'

async function fetchIcyTrackTitle(url: string): Promise<string> {
  if (!url) return ''
  try {
    const parsedUrl = new URL(url)
    const statsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/status-json.xsl`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)
    
    const res = await fetch(statsUrl, { signal: controller.signal })
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      const source = data?.icestats?.source
      if (Array.isArray(source) && source[0]?.title) {
        return source[0].title
      } else if (source?.title) {
        return source.title
      }
    }
  } catch (e) {
    // Silently fall back
  }
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let { 
      slug = 'skinny-dip-inn', 
      regionName = '', 
      fps = '45.0', 
      timeDilation = '1.0', 
      agentCount = '0', 
      parcelName = '', 
      musicUrl = '', 
      visitorList = '',
      visitorJson = '',
      nowPlaying = '',
      ownerKey = '',
      ownerName = '',
      secret = ''
    } = body

    let parsedVisitorDetails: Array<any> = []
    try {
      if (visitorJson) {
        const rawArr = typeof visitorJson === 'string' ? JSON.parse(visitorJson) : visitorJson
        if (Array.isArray(rawArr)) {
          parsedVisitorDetails = rawArr.map((item: any) => {
            if (typeof item === 'string') {
              try { return JSON.parse(item) } catch (e) { return { name: item } }
            }
            return item
          })
        }
      }
    } catch (e) {
      // Fallback
    }

    const rawVisitors = visitorList ? visitorList.split(',').map((s: string) => s.trim()).filter(Boolean) : []
    const nowIso = new Date().toISOString()

    // Fetch existing telemetry document to retain visitor dwell timestamps
    const venueRef = doc(db, 'users', `venue_telemetry_${slug}`)
    const existingSnap = await getDoc(venueRef)
    const existingData = existingSnap.exists() ? existingSnap.data() : {}
    const prevVisitorsMap: Record<string, any> = existingData.visitorMap || {}

    const newVisitorMap: Record<string, any> = {}
    const visitorDetails: Array<{
      name: string
      slKey?: string
      isRegistered: boolean
      onlineSince: string
      dwellMinutes: number
      arc?: number
      posX?: number
      posY?: number
      posZ?: number
      isGroupMember?: boolean
      groupUuid?: string
      status: 'ONLINE' | 'OFFLINE'
      avatarImageUrl: string
    }> = []

    // Normalize prevVisitorsMap keys for case-insensitive matching
    const normalizedPrevMap: Record<string, any> = {}
    Object.keys(prevVisitorsMap).forEach((k) => {
      normalizedPrevMap[k.toLowerCase().trim()] = prevVisitorsMap[k]
    })

    for (let i = 0; i < rawVisitors.length; i++) {
      const cleanName = rawVisitors[i]
      const richData = parsedVisitorDetails.find((v: any) => v.name === cleanName) || parsedVisitorDetails[i] || {}
      const normKey = cleanName.toLowerCase().trim()
      const prev = normalizedPrevMap[normKey] || prevVisitorsMap[cleanName]
      const onlineSince = prev?.onlineSince || nowIso
      const sessionMs = new Date(nowIso).getTime() - new Date(onlineSince).getTime()
      const sessionMins = Math.max(1, Math.round(sessionMs / (1000 * 60)))
      const prevTotal = prev?.totalDwellMinutes || prev?.dwellMinutes || 0
      const totalDwellMinutes = Math.max(sessionMins, prevTotal + (sessionMins > (prev?.dwellMinutes || 0) ? (sessionMins - (prev?.dwellMinutes || 0)) : 0))

      // Check if avatar is registered in Gridpass
      const isRegistered = cleanName.toLowerCase().includes('losey') || cleanName.toLowerCase().includes('merf') || !!prev?.isRegistered
      const isGroupMember = richData.isGroupMember === '1' || richData.isGroupMember === 1 || richData.isGroupMember === true || !!prev?.isGroupMember

      const visitorObj = {
        name: cleanName,
        slKey: richData.key || prev?.slKey || '',
        isRegistered: isRegistered,
        onlineSince: onlineSince,
        dwellMinutes: totalDwellMinutes,
        totalDwellMinutes: totalDwellMinutes,
        arc: richData.arc ? parseInt(richData.arc) : prev?.arc,
        posX: richData.posX ? parseInt(richData.posX) : prev?.posX,
        posY: richData.posY ? parseInt(richData.posY) : prev?.posY,
        posZ: richData.posZ ? parseInt(richData.posZ) : prev?.posZ,
        isGroupMember: isGroupMember,
        status: 'ONLINE' as const,
        avatarImageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`
      }

      newVisitorMap[cleanName] = visitorObj
      visitorDetails.push(visitorObj)
    }

    // Identify departed avatars (went offline)
    Object.keys(prevVisitorsMap).forEach((name) => {
      if (!newVisitorMap[name]) {
        const prev = prevVisitorsMap[name]
        newVisitorMap[name] = {
          ...prev,
          status: 'OFFLINE',
          offlineAt: prev?.offlineAt || nowIso
        }
      }
    })

    // Determine Log Category
    const numericFps = typeof fps === 'number' ? fps : (parseFloat(fps) || 0)
    let logCategory: 'telemetry' | 'visitor_movement' | 'music_change' | 'timeclock' = 'telemetry'
    let logTitle = `⚡ Region Telemetry Sync`
    let logSummary = `${agentCount} active avatars in ${regionName} (${numericFps.toFixed(1)} FPS)`

    const prevCount = existingData.agentCount || 0
    const prevMusic = existingData.musicUrl || ''

    let activeShifts: Record<string, any> = existingData.activeShifts || {}
    let timeclockLogs: Array<any> = Array.isArray(existingData.timeclockLogs) ? existingData.timeclockLogs : []

    if (body.action === 'timeclock_touch' && body.toucherName) {
      logCategory = 'timeclock'
      const toucherName = body.toucherName
      const existingShift = activeShifts[toucherName]

      if (existingShift) {
        // Clock Out!
        const shiftStartMs = new Date(existingShift.clockIn).getTime()
        const durationMinutes = Math.max(1, Math.round((new Date(nowIso).getTime() - shiftStartMs) / (1000 * 60)))
        
        logTitle = `🔴 Staff Shift Ended`
        logSummary = `⏰ ${toucherName} CLOCKED OUT from shift (${durationMinutes} min total)`

        delete activeShifts[toucherName]

        timeclockLogs = [
          {
            id: `tc_${Date.now()}`,
            name: toucherName,
            slKey: body.toucherKey || '',
            clockIn: existingShift.clockIn,
            clockOut: nowIso,
            durationMinutes
          },
          ...timeclockLogs
        ].slice(0, 50)
      } else {
        // Clock In!
        logTitle = `⏰ Staff Shift Started`
        logSummary = `⏰ ${toucherName} CLOCKED IN for staff shift`

        activeShifts[toucherName] = {
          clockIn: nowIso,
          slKey: body.toucherKey || ''
        }
      }
    } else if ((musicUrl && musicUrl !== prevMusic) || (nowPlaying && nowPlaying !== (existingData.nowPlaying || ''))) {
      logCategory = 'music_change'
      logTitle = `🎵 Audio Stream & Track Change`
      logSummary = nowPlaying ? `Now Playing: ${nowPlaying}` : `Stream URL: ${musicUrl}`
    } else if (parseInt(agentCount) !== prevCount || rawVisitors.length !== (existingData.visitorList || []).length) {
      logCategory = 'visitor_movement'
      logTitle = `👤 Avatar Region Movement`
      logSummary = `Detected ${agentCount} avatars in ${regionName}`
    }

    let beaconPrims: Record<string, any> = existingData.beaconPrims || {}
    const primKey = body.primKey || 'prim_default'

    // Clean up LSL object name artifacts (e.g. 'Skinny Dip Inn ? GridPass.app - Message' -> 'Skinny Dip Inn via GridPass.app')
    let rawPrimName = (body.primName || 'Gridpass Beacon').trim()
    let cleanName = rawPrimName
      .replace(/\?/g, 'via')
      .replace(/\s*-\s*Message/gi, '')
      .replace(/\s*\|\s*/g, ' via ')
      .replace(/\s*~\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanName.toLowerCase().includes('gridpass')) {
      cleanName += ' via GridPass.app'
    }

    const primName = cleanName
    const primPos = body.primPos || '128,128,25'

    const posParts = primPos.split(',')
    const posX = posParts[0] || '128'
    const posY = posParts[1] || '128'
    const posZ = posParts[2] || '25'
    const slurl = `secondlife://${encodeURIComponent(regionName)}/${posX}/${posY}/${posZ}`

    beaconPrims[primKey] = {
      primKey,
      customTitle: beaconPrims[primKey]?.customTitle || primName,
      inGameName: primName,
      parcelName,
      pos: { x: posX, y: posY, z: posZ },
      teleportUrl: slurl,
      lastSeen: nowIso,
      totalTouches: (beaconPrims[primKey]?.totalTouches || 0) + (body.action === 'timeclock_touch' ? 1 : 0)
    }

    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      category: logCategory,
      title: logTitle,
      summary: logSummary,
      fps: parseFloat(fps) || 0,
      timeDilation: parseFloat(timeDilation) || 0,
      agentCount: parseInt(agentCount) || 0,
      regionName,
      parcelName,
      musicUrl,
      nowPlaying,
      primName,
      primPos,
      visitorCount: rawVisitors.length,
      visitorList: rawVisitors
    }

    const prevLogs = Array.isArray(existingData.recentLogs) ? existingData.recentLogs : []
    const updatedLogs = [logEntry, ...prevLogs].slice(0, 300)

    // Save log entry to permanent subcollections in both sl_venues and users
    try {
      await setDoc(doc(db, 'sl_venues', slug, 'telemetry_logs', logEntry.id), logEntry, { merge: true })
      await setDoc(doc(db, 'users', `venue_telemetry_${slug}`, 'logs', logEntry.id), logEntry, { merge: true })
    } catch (e) {
      console.warn("Subcollection log write error:", e)
    }

    // Notecard Delivery Versioning & Passive Auto-Delivery Logic
    const currentRulesVersion = existingData.rulesVersion || 1
    let notecardDeliveries: Record<string, any> = existingData.notecardDeliveries || {}
    let giveNotecard = false
    const passiveDeliverKeys: string[] = []

    // 1. Toucher Check
    const toucherIdentifier = body.toucherKey || body.toucherName
    if (toucherIdentifier) {
      const prevDelivery = notecardDeliveries[toucherIdentifier]
      const receivedVersion = prevDelivery?.receivedVersion || 0

      // Avatar gets notecard ONLY if they haven't received the current rulesVersion!
      if (receivedVersion < currentRulesVersion) {
        giveNotecard = true
        notecardDeliveries[toucherIdentifier] = {
          receivedVersion: currentRulesVersion,
          timestamp: nowIso,
          toucherName: body.toucherName || ''
        }
      }
    }

    // 2. Passive Region Scan Check with Master Test Mode Safety Guard
    const isTestMode = existingData.isTestMode !== false // Defaults to true (PJ Losey Only) for 100% safety!
    const venueStaffList = existingData.staffMembers || []
    
    const isStaffAvatar = (name: string, key: string) => {
      const lowerName = (name || '').toLowerCase()
      const lowerKey = (key || '').toLowerCase()
      if (lowerName.includes('losey') || lowerName.includes('merf')) return true
      if (lowerKey === '549d8555-43c5-46ed-8c65-33489c7ea2f0' || lowerKey === 'dd25fcaa-6081-4489-b589-31eebd6fbbbf') return true
      return venueStaffList.some((s: any) => 
        (s.name && s.name.toLowerCase() === lowerName) || 
        (s.slKey && s.slKey.toLowerCase() === lowerKey)
      )
    }

    if (Array.isArray(visitorDetails) && visitorDetails.length > 0) {
      for (const visitor of visitorDetails) {
        const vKey = visitor.slKey || visitor.name
        if (!vKey) continue

        const lowerName = (visitor.name || '').toLowerCase()
        const lowerKey = (visitor.slKey || '').toLowerCase()

        // 🛑 EXCLUDE STAFF & GROUP TAG HOLDERS FROM PASSIVE RULES IMS!
        // Staff and active group tag wearers already know sim rules — rules IMs target guests/visitors only.
        const excludedGroupUuid = (existingData.excludedGroupUuid || '77be7a67-1b4d-14b6-8cd3-baa441886f41').toLowerCase()
        const visitorGroupKey = (visitor.groupUuid || '').toLowerCase()

        const isStaff = isStaffAvatar(visitor.name || '', visitor.slKey || '') || 
                        visitor.isGroupMember === true ||
                        (excludedGroupUuid && visitorGroupKey === excludedGroupUuid)

        if (isStaff && !isTestMode) {
          continue // Staff & Excluded Group Tag wearers never get spammed with passive rules notices!
        }

        // 🧪 TEST MODE SAFETY GUARD: Redirect ALL delivery strictly to PJ Losey!
        if (isTestMode) {
          if (!lowerName.includes('losey') && lowerKey !== '549d8555-43c5-46ed-8c65-33489c7ea2f0') {
            continue // Skip all non-PJ Losey avatars in Test Mode!
          }
        }

        const prevDelivery = notecardDeliveries[vKey] || notecardDeliveries[visitor.name]
        const receivedVersion = prevDelivery?.receivedVersion || 0

        if (receivedVersion < currentRulesVersion) {
          if (visitor.slKey) {
            passiveDeliverKeys.push(visitor.slKey)
          } else {
            passiveDeliverKeys.push(visitor.name)
          }
          notecardDeliveries[vKey] = {
            receivedVersion: currentRulesVersion,
            timestamp: nowIso,
            toucherName: visitor.name || ''
          }
        }
      }
    }

    let autoFetchedTrack = ''
    if (!nowPlaying && musicUrl) {
      autoFetchedTrack = await fetchIcyTrackTitle(musicUrl)
    }

    const effectiveNowPlaying = nowPlaying || autoFetchedTrack || existingData.nowPlaying || ''

    const venueData = {
      id: `venue_telemetry_${slug}`,
      slug,
      rulesVersion: currentRulesVersion,
      notecardDeliveries: notecardDeliveries,
      regionName,
      fps: parseFloat(fps) || 0,
      timeDilation: parseFloat(timeDilation) || 0,
      agentCount: parseInt(agentCount) || 0,
      parcelName,
      musicUrl: musicUrl || existingData.musicUrl || '',
      nowPlaying: effectiveNowPlaying,
      visitorList: rawVisitors,
      visitorDetails: Object.values(newVisitorMap),
      visitorMap: newVisitorMap,
      recentLogs: updatedLogs,
      activeShifts: activeShifts,
      timeclockLogs: timeclockLogs,
      beaconPrims: beaconPrims,
      updatedAt: nowIso,
      isLive: true
    }

    await setDoc(venueRef, venueData, { merge: true })

    try {
      await setDoc(doc(db, 'sl_venues', slug), venueData, { merge: true })
    } catch (e) {
      // Silently handle if sl_venues rules pending deploy
    }

    const OFFICIAL_SDI_RULES = [
      'Adhere to dress code: No erections, no towels covering erections, no child avatars, no anime, no body fluids (cum, milk, etc). Staff enforce as needed.',
      'Respect our staff - they are here for your entertainment and to make your time at SDI enjoyable.',
      'Avoid gesture spamming and word repetition in local chat to keep communication clear for guests and staff.',
      'No advertising of any sort unless explicit permission is granted by Resort Owners.',
      'Harassment and drama of any type will NOT be tolerated. Violators will be warned and removed.',
      'Refrain from clicking other avatars without permission (e.g. spankers).',
      'No escorting, prostitution, or age play. Please remove any tags representing these roles.',
      'CHILD AVATARS ARE STRICTLY PROHIBITED. Anyone staff considers childlike will be asked to change and removed.',
      'Biting and/or hunting will not be tolerated.',
      'If any issues arise, please contact ~SDI~ staff for immediate assistance.'
    ]
    const guidelines = existingData.simGuidelines && existingData.simGuidelines.length > 0 ? existingData.simGuidelines : OFFICIAL_SDI_RULES
    const rulesSummary = guidelines.slice(0, 4).map((r: string, i: number) => `(${i + 1}) ${r}`).join(' ')

    return NextResponse.json({ 
      success: true, 
      giveNotecard: giveNotecard ? 'true' : 'false',
      deliverKeys: passiveDeliverKeys.join(','),
      rulesVersion: currentRulesVersion,
      rulesSummary: rulesSummary,
      excludedGroupUuid: existingData.excludedGroupUuid || '77be7a67-1b4d-14b6-8cd3-baa441886f41',
      portalUrl: `https://gridpass.app/secondlife/${slug}?tab=rules`,
      targetPrimTitle: beaconPrims[primKey]?.customTitle || '',
      message: 'Telemetry & Visitor Dwell Logs updated', 
      venue: slug,
      onlineVisitors: rawVisitors.length,
      totalTrackedVisitors: Object.keys(newVisitorMap).length
    })

  } catch (err: any) {
    console.error("[SL Telemetry API Error]", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
