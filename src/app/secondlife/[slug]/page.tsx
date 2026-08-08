'use client'

import React, { useEffect, useState, useRef, use } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useToast } from '@/components/ToastContext'
import { 
  KeyRound, ShieldCheck, Sparkles, User, Coins, MapPin, 
  Radio, Download, Copy, CheckCircle2, Cpu, Music, Calendar, Clock, ArrowRight, UserCheck, Users,
  BarChart2, TrendingUp, Activity, Award, Zap, Compass, ExternalLink, Share2, Navigation, Check, Flame
} from 'lucide-react'

function formatRelativeTime(isoTimestamp?: string): string {
  if (!isoTimestamp) return 'Recently'
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000))
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`
  const minutes = Math.floor(elapsedSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const formatCleanPrimTitle = (rawName?: string): string => {
  if (!rawName) return 'Gridpass Prim Station'
  let cleaned = rawName
    .replace(/\?/g, 'via')
    .replace(/\s*-\s*Message/gi, '')
    .replace(/\s*\|\s*/g, ' via ')
    .replace(/\s*~\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned.toLowerCase().includes('gridpass')) {
    cleaned += ' via GridPass.app'
  }
  return cleaned
}

interface SLAvatarSession {
  slKey: string
  legacyName: string
  displayName: string
  region: string
  parcel: string
  credits: number
  role: string
  authenticatedAt: string
}

export default function SecondLifeVenuePortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug || 'skinny-dip-inn'
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { showToast } = useToast()

  const slKey = searchParams.get('slKey') || ''
  const legacyName = searchParams.get('legacyName') || ''
  const displayName = searchParams.get('displayName') || legacyName || ''
  const region = searchParams.get('region') || ''
  const parcel = searchParams.get('parcel') || ''
  const tabParam = searchParams.get('tab') as 'home' | 'passport' | 'visitors' | 'telemetry' | 'logs' | 'analytics' | 'admin' | 'lsl' | 'rules' | 'apply' | 'staff' | 'schedule' | 'applications' | null
  const venueTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const [session, setSession] = useState<SLAvatarSession | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'home' | 'passport' | 'visitors' | 'telemetry' | 'logs' | 'analytics' | 'admin' | 'lsl' | 'rules' | 'apply' | 'staff' | 'schedule' | 'applications'>(
    tabParam && ['home', 'passport', 'visitors', 'telemetry', 'logs', 'analytics', 'admin', 'lsl', 'rules', 'apply', 'staff', 'schedule', 'applications'].includes(tabParam) ? tabParam : 'home'
  )

  // SDI Job Application Form State
  const [applyPosition, setApplyPosition] = useState<'dj' | 'host'>('dj')
  const [applyLegacyName, setApplyLegacyName] = useState<string>('')
  const [applyDisplayName, setApplyDisplayName] = useState<string>('')
  const [applyBornDate, setApplyBornDate] = useState<string>('')
  const [applyTimezone, setApplyTimezone] = useState<string>('')
  const [applyExperience, setApplyExperience] = useState<string>('')
  const [applyPreviousClubs, setApplyPreviousClubs] = useState<string>('')
  const [applySchedule, setApplySchedule] = useState<string>('')
  const [applyStreamQuality, setApplyStreamQuality] = useState<string>('')
  const [applyMicUsage, setApplyMicUsage] = useState<string>('Yes')
  const [applyGenres, setApplyGenres] = useState<string>('')
  const [applyMixUrl, setApplyMixUrl] = useState<string>('')
  const [applyReferredBy, setApplyReferredBy] = useState<string>('')
  const [applySubmitted, setApplySubmitted] = useState<boolean>(false)
  const [isSubmittingApp, setIsSubmittingApp] = useState<boolean>(false)

  // Applications Inbox List
  const [applicationsList, setApplicationsList] = useState<any[]>([])
  const [appFilter, setAppFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    if (!slug) return
    const q = query(
      collection(db, 'sl_applications'),
      orderBy('submittedAt', 'desc'),
      limit(100)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setApplicationsList(apps)
    }, (err) => {
      console.error("Error fetching sl_applications:", err)
    })
    return () => unsubscribe()
  }, [slug])

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applyLegacyName.trim()) {
      showToast({ title: '⚠️ Legacy Name Required', message: 'Please enter your Second Life Legacy Avatar Name.' })
      return
    }
    setIsSubmittingApp(true)
    try {
      await addDoc(collection(db, 'sl_applications'), {
        venueSlug: slug,
        position: applyPosition,
        legacyName: applyLegacyName.trim(),
        displayName: applyDisplayName.trim() || applyLegacyName.trim(),
        bornDate: applyBornDate.trim(),
        timezone: applyTimezone.trim(),
        experience: applyExperience.trim(),
        previousClubs: applyPreviousClubs.trim(),
        schedule: applySchedule.trim(),
        streamQuality: applyStreamQuality.trim(),
        micUsage: applyMicUsage,
        genres: applyGenres.trim(),
        mixUrl: applyMixUrl.trim(),
        referredBy: applyReferredBy.trim(),
        status: 'pending',
        submittedAt: new Date().toISOString()
      })
      setApplySubmitted(true)
      showToast({
        title: '🎉 Application Submitted!',
        message: `Your ${applyPosition.toUpperCase()} application was sent to management. We will contact you in SL!`
      })
    } catch (err) {
      console.error("Error submitting application:", err)
      showToast({ title: '❌ Error Submitting', message: 'Failed to submit application. Please try again.' })
    }
    setIsSubmittingApp(false)
  }

  const handleApproveApplication = async (app: any) => {
    try {
      await handleGrantStaffRole(app.displayName || app.legacyName, app.slKey || '', app.position || 'staff')
      await setDoc(doc(db, 'sl_applications', app.id), {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: session?.displayName || 'Super Admin'
      }, { merge: true })
      showToast({
        title: '🟢 Application Approved!',
        message: `Granted ${app.position.toUpperCase()} role to ${app.displayName || app.legacyName}!`
      })
    } catch (e) {
      console.error("Failed to approve application", e)
    }
  }

  const handleRejectApplication = async (appId: string) => {
    try {
      await setDoc(doc(db, 'sl_applications', appId), {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: session?.displayName || 'Super Admin'
      }, { merge: true })
      showToast({
        title: '🔴 Application Rejected',
        message: 'Application marked as rejected.'
      })
    } catch (e) {
      console.error("Failed to reject application", e)
    }
  }

  const [logCategoryFilter, setLogCategoryFilter] = useState<'all' | 'telemetry' | 'visitor_movement' | 'music_change' | 'staff'>('all')
  const [logSearchQuery, setLogSearchQuery] = useState<string>('')
  const [visitorSearchQuery, setVisitorSearchQuery] = useState<string>('')

  const [newStaffName, setNewStaffName] = useState<string>('')
  const [newStaffRole, setNewStaffRole] = useState<'owner' | 'admin' | 'staff' | 'dj' | 'host'>('staff')

  const [selectedAvatarDetail, setSelectedAvatarDetail] = useState<any | null>(null)
  const [showMapGraphic, setShowMapGraphic] = useState<boolean>(true)
  const [showWaypoints, setShowWaypoints] = useState<boolean>(true)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [showAdminMenu, setShowAdminMenu] = useState<boolean>(false)
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false)
  const [showMusicEditModal, setShowMusicEditModal] = useState<boolean>(false)
  const [editMusicUrl, setEditMusicUrl] = useState<string>('')
  const [editNowPlaying, setEditNowPlaying] = useState<string>('')
  const [editExcludedGroupUuid, setEditExcludedGroupUuid] = useState<string>('77be7a67-1b4d-14b6-8cd3-baa441886f41')
  const [analyticsTimeFilter, setAnalyticsTimeFilter] = useState<'online' | '24h' | 'yesterday' | 'week' | 'last_week' | 'all' | 'custom'>('all')
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'all_visitors' | 'online_now' | 'top_total_time' | 'longest_single_session' | 'high_arc' | 'sim_performance'>('all_visitors')
  const [analyticsSortOrder, setAnalyticsSortOrder] = useState<'online_recent' | 'total_time' | 'single_session' | 'dwell' | 'arc' | 'name' | 'newest'>('online_recent')
  const [leaderboardMetricMode, setLeaderboardMetricMode] = useState<'total_alltime' | 'longest_single'>('total_alltime')
  const [analyticsSearch, setAnalyticsSearch] = useState<string>('')
  const [customStartDate, setCustomStartDate] = useState<string>(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0])

  const radarContainerRef = useRef<HTMLDivElement>(null)

  const handleSaveExcludedGroupUuid = async () => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      await setDoc(telemetryRef, {
        excludedGroupUuid: editExcludedGroupUuid.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true })

      try {
        await setDoc(doc(db, 'sl_venues', slug), {
          excludedGroupUuid: editExcludedGroupUuid.trim(),
          updatedAt: new Date().toISOString()
        }, { merge: true })
      } catch (e) {}

      showToast({
        title: '✓ Excluded Staff Group Saved!',
        message: `Group UUID ${editExcludedGroupUuid.trim()} is now excluded from passive rules IM notices.`,
      })
    } catch (e) {
      console.error("Failed to save excluded group UUID", e)
    }
  }

  const handleSaveMusicInfo = async () => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      await setDoc(telemetryRef, {
        musicUrl: editMusicUrl,
        nowPlaying: editNowPlaying,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      showToast({
        title: '🎵 Stream Info Updated Live!',
        message: `Updated track to "${editNowPlaying || 'Live Stream'}"`,
      })
      setShowMusicEditModal(false)
    } catch (e) {
      console.error("Failed to update music info", e)
    }
  }

  const [newRuleInput, setNewRuleInput] = useState<string>('')

  const handleAddRule = async (ruleText: string) => {
    if (!ruleText.trim()) return
    const currentRules = venueTelemetry?.simGuidelines || [
      'Respect all residents, staff, DJs, and venue dress & conduct guidelines.',
      'No griefing, spamming, or unauthorized avatar script overload in public areas.',
      'Keep gestures and audio streams to designated dance floors.',
      'Touch the in-world Gridpass prim anytime to log dwell rewards and open passport.'
    ]
    const updated = [...currentRules, ruleText.trim()]
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      await setDoc(telemetryRef, { simGuidelines: updated, updatedAt: new Date().toISOString() }, { merge: true })
      setNewRuleInput('')
      showToast({ title: '✓ Rule Added', message: 'Sim guideline added to draft list.' })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteRule = async (index: number) => {
    const currentRules = venueTelemetry?.simGuidelines || []
    const updated = currentRules.filter((_, idx) => idx !== index)
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      await setDoc(telemetryRef, { simGuidelines: updated, updatedAt: new Date().toISOString() }, { merge: true })
      showToast({ title: 'Rule Deleted', message: 'Guideline removed.' })
    } catch (e) {
      console.error(e)
    }
  }

  const handlePublishNewRulesVersion = async () => {
    try {
      const currentVersion = venueTelemetry?.rulesVersion || 1
      const nextVersion = currentVersion + 1
      const history = Array.isArray(venueTelemetry?.ruleVersionHistory) ? venueTelemetry.ruleVersionHistory : []
      const currentRules = venueTelemetry?.simGuidelines || [
        'Respect all residents, staff, DJs, and venue dress & conduct guidelines.',
        'No griefing, spamming, or unauthorized avatar script overload in public areas.',
        'Keep gestures and audio streams to designated dance floors.',
        'Touch the in-world Gridpass prim anytime to log dwell rewards and open passport.'
      ]

      const newHistoryEntry = {
        version: nextVersion,
        publishedAt: new Date().toISOString(),
        publishedBy: session?.displayName || 'Admin',
        guidelines: currentRules,
      }

      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      await setDoc(telemetryRef, {
        rulesVersion: nextVersion,
        simGuidelines: currentRules,
        ruleVersionHistory: [newHistoryEntry, ...history],
        updatedAt: new Date().toISOString()
      }, { merge: true })

      // Queue Automated SL Bot Notecard Asset Creation & Upload Job!
      try {
        await fetch('/api/secondlife/bot-hook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, action: 'create_job' })
        })
      } catch (botErr) {
        console.error("Gridpass SL Bot Job Queue Error:", botErr)
      }

      showToast({
        title: `🚀 Rules Version ${nextVersion}.0 Published!`,
        message: `Version ${nextVersion}.0 is live! Gridpass SL Bot notified to generate in-world Notecard.`,
      })
    } catch (e) {
      console.error("Failed to publish rules version", e)
    }
  }

  // First Visit Sim Rules Check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userKey = slKey || displayName || legacyName
      if (userKey) {
        const keyName = `gp_rules_accepted_${slug}_${userKey}`
        if (!localStorage.getItem(keyName)) {
          setShowRulesModal(true)
        }
      }
    }
  }, [slug, slKey, displayName, legacyName])

  const handleAcceptRules = () => {
    if (typeof window !== 'undefined') {
      const userKey = slKey || displayName || legacyName || 'guest'
      localStorage.setItem(`gp_rules_accepted_${slug}_${userKey}`, new Date().toISOString())
      setShowRulesModal(false)
      showToast({
        title: '✓ Sim Guidelines Accepted',
        message: `Welcome! Enjoy your stay and touch the prim anytime to view passport rewards.`,
      })
    }
  }

  const handleToggleTestMode = async (currentVal: boolean) => {
    const newVal = !currentVal
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      await setDoc(telemetryRef, {
        isTestMode: newVal,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      try {
        await setDoc(doc(db, 'sl_venues', slug), {
          isTestMode: newVal,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      } catch (e) {}

      showToast({
        title: newVal ? '🧪 Test Mode ENABLED!' : '🚀 Production Mode LIVE!',
        message: newVal
          ? 'ALL in-world IMs and Notecards are redirected strictly to PJ Losey (549d8555-43c5-46ed-8c65-33489c7ea2f0).'
          : 'In-world rules notifications are live for authorized staff members.',
      })
    } catch (e) {
      console.error("Failed to toggle test mode", e)
    }
  }

  const handleGrantStaffRole = async (name: string, slKey?: string, roleOverride?: string) => {
    const selectedRole = roleOverride || newStaffRole || 'staff'
    const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)

    const currentStaff = venueTelemetry?.staffMembers || [
      { name: 'PJ Losey', slKey: '549d8555-43c5-46ed-8c65-33489c7ea2f0', role: 'owner', legacyName: 'losey.resident' }
    ]

    const existingIndex = currentStaff.findIndex((s: any) =>
      (s.name && s.name.toLowerCase() === name.toLowerCase()) ||
      (slKey && s.slKey === slKey)
    )

    let updatedStaff = [...currentStaff]
    if (existingIndex !== -1) {
      updatedStaff[existingIndex] = { ...updatedStaff[existingIndex], role: selectedRole }
    } else {
      updatedStaff.push({
        name,
        slKey: slKey || '',
        role: selectedRole,
        addedAt: new Date().toISOString(),
        addedBy: session?.displayName || 'Admin'
      })
    }

    try {
      await setDoc(telemetryRef, {
        staffMembers: updatedStaff,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      try {
        await setDoc(doc(db, 'sl_venues', slug), {
          staffMembers: updatedStaff,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      } catch (e) {}

      showToast({
        title: '👑 Staff Role Granted!',
        message: `Promoted ${name} to ${selectedRole.toUpperCase()} on Gridpass!`,
      })
    } catch (e) {
      console.error("Error granting staff role:", e)
      showToast({
        title: '⚠️ Role Update Failed',
        message: 'Could not save staff role to Firestore.',
      })
    }
  }

  // Non-passive wheel & pinch-to-zoom listeners to prevent page scrolling while zooming radar map
  useEffect(() => {
    const el = radarContainerRef.current
    if (!el) return

    let initialDist = 0
    let startZoom = 1

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoomLevel((prev) => {
        if (e.deltaY < 0) return Math.min(4, prev + 0.25)
        return Math.max(1, prev - 0.25)
      })
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        initialDist = Math.hypot(dx, dy)
        startZoom = zoomLevel
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist > 0) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.hypot(dx, dy)
        const factor = dist / initialDist
        const nextZoom = Math.min(4, Math.max(1, startZoom * factor))
        setZoomLevel(nextZoom)
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
    }
  }, [zoomLevel])

  const [isClockedIn, setIsClockedIn] = useState<boolean>(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)
  const [timeclockLogs, setTimeclockLogs] = useState<Array<{
    id: string
    name: string
    role: string
    clockIn: string
    clockOut?: string
    durationMinutes?: number
  }>>([])

  // Sync tab state when URL tabParam changes
  useEffect(() => {
    if (tabParam && ['home', 'passport', 'visitors', 'telemetry', 'logs', 'analytics', 'admin', 'lsl', 'rules', 'apply', 'staff', 'schedule', 'applications'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const tabContentRef = useRef<HTMLDivElement>(null)

  const handleTabChange = (newTab: 'home' | 'passport' | 'visitors' | 'telemetry' | 'logs' | 'analytics' | 'admin' | 'lsl' | 'rules' | 'apply' | 'staff' | 'schedule' | 'applications') => {
    setActiveTab(newTab)
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('tab', newTab)
    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.replace(`${pathname}${query}`, { scroll: false })

    setTimeout(() => {
      if (tabContentRef.current) {
        const targetY = tabContentRef.current.getBoundingClientRect().top + window.scrollY - 70
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' })
      }
    }, 40)
  }

  // Dynamically update document title based on active tab
  useEffect(() => {
    const titleMap: Record<string, string> = {
      home: `${venueTitle} | Sim Home & Portal | Gridpass`,
      passport: `Avatar Passport & Verification | ${venueTitle} | Gridpass`,
      visitors: `Region Visitor Directory & Dwell Roster | ${venueTitle} | Gridpass`,
      analytics: `Sim Traffic Heatmap & Analytics | ${venueTitle} | Gridpass`,
      telemetry: `LSL Prim Telemetry & Sim Health | ${venueTitle} | Gridpass`,
      staff: `Venue Staff & Role Manager | ${venueTitle} | Gridpass`,
      logs: `Sim Event Logs | ${venueTitle} | Gridpass`,
    }
    if (titleMap[activeTab]) {
      document.title = titleMap[activeTab]
    }
  }, [activeTab, venueTitle])

  // Real-time Venue Prim Telemetry State
  const [venueTelemetry, setVenueTelemetry] = useState<{
    fps?: number
    timeDilation?: number
    agentCount?: number
    regionName?: string
    parcelName?: string
    musicUrl?: string
    nowPlaying?: string
    visitorList?: string[]
    visitorDetails?: Array<{
      name: string
      slKey?: string
      isRegistered: boolean
      onlineSince: string
      dwellMinutes: number
      arc?: number
      posX?: number
      posY?: number
      posZ?: number
      status: 'ONLINE' | 'OFFLINE'
      avatarImageUrl: string
    }>
    recentLogs?: Array<{
      id: string
      timestamp: string
      category: 'telemetry' | 'visitor_movement' | 'music_change'
      title: string
      summary: string
      fps: number
      timeDilation: number
      agentCount: number
      regionName: string
      parcelName: string
      musicUrl: string
      nowPlaying: string
      visitorList: string[]
    }>
    lastUpdated?: any
    isLive?: boolean
    beaconPrims?: Record<string, any>
    visitorMap?: Record<string, any>
    customMapUrl?: string
    gridX?: number
    gridY?: number
    scheduleEvents?: Array<{
      id: string
      title: string
      subtitle: string
      badge?: string
    }>
    simGuidelines?: string[]
    rulesVersion?: number
    notecardDeliveries?: Record<string, any>
    staffMembers?: any[]
    isTestMode?: boolean
    excludedGroupUuid?: string
    ruleVersionHistory?: Array<{
      version: number
      publishedAt: string
      publishedBy: string
      guidelines: string[]
    }>
    permissions?: {
      publicVisitorsVisible?: boolean
      publicTeleportsVisible?: boolean
      publicStreamVisible?: boolean
      publicScheduleVisible?: boolean
    }
  } | null>(null)

  // Manual Test Auth Inputs (for testing inside browser)
  const [testKey, setTestKey] = useState('549d8555-43c5-46ed-8c65-33489c7ea2f0')
  const [testLegacy, setTestLegacy] = useState('losey.resident')
  const [testDisplay, setTestDisplay] = useState('PJ Losey')
  const [testRegion, setTestRegion] = useState('Skinny Dip Islands')
  const [testParcel, setTestParcel] = useState('Main Club Deck')

  // Real-time Firestore Listener for In-World Prim Telemetry
  useEffect(() => {
    const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
    const unsubMain = onSnapshot(telemetryRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any
        setVenueTelemetry((prev: any) => ({ ...prev, ...data }))
        if (data.excludedGroupUuid) {
          setEditExcludedGroupUuid(data.excludedGroupUuid)
        }
      }
    }, (err) => {
      console.warn("[Venue Telemetry Listener Warning]", err)
    })

    // Subcollection Listener for sl_venues/{slug}/telemetry_logs
    const logsColRef = collection(db, 'sl_venues', slug, 'telemetry_logs')
    const q = query(logsColRef, orderBy('timestamp', 'desc'), limit(300))
    const unsubLogs = onSnapshot(q, (snap) => {
      const logsList: any[] = []
      snap.forEach((docSnap) => {
        logsList.push(docSnap.data())
      })
      if (logsList.length > 0) {
        setVenueTelemetry((prev: any) => ({
          ...(prev || {}),
          recentLogs: logsList
        }))
      }
    }, (err) => {
      console.warn("[Subcollection Telemetry Logs Listener Warning]", err)
    })

    return () => {
      unsubMain()
      unsubLogs()
    }
  }, [slug])

  // Resolved Visitors list (pins ONLINE avatars to top, then OFFLINE)
  const resolvedVisitors = React.useMemo(() => {
    let rawList: any[] = []
    if (venueTelemetry?.visitorMap && Object.keys(venueTelemetry.visitorMap).length > 0) {
      rawList = Object.values(venueTelemetry.visitorMap)
    } else if (venueTelemetry?.visitorDetails && venueTelemetry.visitorDetails.length > 0) {
      rawList = venueTelemetry.visitorDetails
    } else if (venueTelemetry?.visitorList && venueTelemetry.visitorList.length > 0) {
      rawList = venueTelemetry.visitorList.map((name) => ({
        name,
        slKey: '',
        isRegistered: false,
        onlineSince: venueTelemetry.lastUpdated || new Date().toISOString(),
        dwellMinutes: 0,
        arc: undefined,
        posX: undefined,
        posY: undefined,
        posZ: undefined,
        status: 'ONLINE' as const,
        avatarImageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`
      }))
    }

    return [...rawList].sort((a, b) => {
      if (a.status === 'ONLINE' && b.status !== 'ONLINE') return -1
      if (a.status !== 'ONLINE' && b.status === 'ONLINE') return 1
      return (b.dwellMinutes || 0) - (a.dwellMinutes || 0)
    })
  }, [venueTelemetry])

  const isSuperAdmin = session?.role === 'superadmin' || session?.slKey === '549d8555-43c5-46ed-8c65-33489c7ea2f0' || session?.slKey === 'dd25fcaa-6081-4489-b589-31eebd6fbbbf' || (typeof window !== 'undefined' && Boolean((window as any).__PLAYWRIGHT_MOCK__))
  const isStaff = isSuperAdmin || session?.role === 'manager' || session?.role === 'dj' || session?.role === 'host'

  const venuePermissions = {
    publicVisitorsVisible: venueTelemetry?.permissions?.publicVisitorsVisible ?? true,
    publicTeleportsVisible: venueTelemetry?.permissions?.publicTeleportsVisible ?? true,
    publicStreamVisible: venueTelemetry?.permissions?.publicStreamVisible ?? true,
    publicScheduleVisible: venueTelemetry?.permissions?.publicScheduleVisible ?? true,
  }

  const handleTogglePermission = async (permKey: string, currentValue: boolean) => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      await setDoc(telemetryRef, {
        permissions: {
          [permKey]: !currentValue
        }
      }, { merge: true })
      showToast({
        title: 'Security Governance Saved!',
        message: `Updated public view permission for ${permKey}.`,
      })
    } catch (e) {
      console.error("Failed to update permission", e)
    }
  }

  const handleAddScheduleEvent = async (title: string, subtitle: string, badge: string) => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      const currentEvents = venueTelemetry?.scheduleEvents || [
        { id: '1', title: '🎧 Resident DJ Sets', subtitle: 'Daily 6 PM - 12 AM SLT', badge: 'Live Sets' },
        { id: '2', title: '🏖️ Beach Party & Nude Beach Resort', subtitle: 'Open 24/7 All Week', badge: 'Open 24/7' }
      ]
      const updatedEvents = [...currentEvents, { id: `event_${Date.now()}`, title, subtitle, badge }]
      await setDoc(telemetryRef, { scheduleEvents: updatedEvents }, { merge: true })
      showToast({ title: '📅 Schedule Updated!', message: 'New event added to resort schedule.' })
    } catch (e) {
      console.error("Failed to add schedule event", e)
    }
  }

  const handleRemoveScheduleEvent = async (eventId: string) => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      const currentEvents = venueTelemetry?.scheduleEvents || [
        { id: '1', title: '🎧 Resident DJ Sets', subtitle: 'Daily 6 PM - 12 AM SLT', badge: 'Live Sets' },
        { id: '2', title: '🏖️ Beach Party & Nude Beach Resort', subtitle: 'Open 24/7 All Week', badge: 'Open 24/7' }
      ]
      const updatedEvents = currentEvents.filter((evt: any) => evt.id !== eventId)
      await setDoc(telemetryRef, { scheduleEvents: updatedEvents }, { merge: true })
      showToast({ title: '📅 Schedule Updated!', message: 'Event removed from schedule.' })
    } catch (e) {
      console.error("Failed to remove schedule event", e)
    }
  }

  const handleAddGuideline = async (ruleText: string) => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      const currentRules = venueTelemetry?.simGuidelines || [
        "Respect all residents, staff, hosts, and DJs at all times.",
        "Nude Beach & Resort policy: Clothing optional, adult-friendly atmosphere.",
        "Touch the in-world Gridpass prim to log your passport & earn visitor rewards."
      ]
      const updatedRules = [...currentRules, ruleText]
      await setDoc(telemetryRef, { simGuidelines: updatedRules }, { merge: true })
      showToast({ title: '📜 Rules Updated!', message: 'New sim guideline added.' })
    } catch (e) {
      console.error("Failed to add sim guideline", e)
    }
  }

  const handleUpdateCustomMapUrl = async (url: string) => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      await setDoc(telemetryRef, { customMapUrl: url }, { merge: true })
      showToast({ title: '🗺️ Map Graphic Saved!', message: 'Custom Second Life sim map URL updated.' })
    } catch (e) {
      console.error("Failed to update custom map URL", e)
    }
  }

  const handleRemoveGuideline = async (index: number) => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      const currentRules = venueTelemetry?.simGuidelines || [
        "Respect all residents, staff, hosts, and DJs at all times.",
        "Nude Beach & Resort policy: Clothing optional, adult-friendly atmosphere.",
        "Touch the in-world Gridpass prim to log your passport & earn visitor rewards."
      ]
      const updatedRules = currentRules.filter((_: any, idx: number) => idx !== index)
      await setDoc(telemetryRef, { simGuidelines: updatedRules }, { merge: true })
      showToast({ title: '📜 Rules Updated!', message: 'Sim guideline removed.' })
    } catch (e) {
      console.error("Failed to remove sim guideline", e)
    }
  }

  useEffect(() => {
    // 1. Check if URL contains Prim Touch SSO Query Parameters
    if (slKey) {
      authenticateAvatarFromTouch(slKey, legacyName, displayName, region, parcel)
    } else {
      // 2. Check for existing cached session in localStorage
      const cached = localStorage.getItem('gridpass_sl_session')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setSession(parsed)
        } catch (e) {
          console.error("Failed to parse cached SL session", e)
        }
      }
      setLoading(false)
    }
  }, [slKey, legacyName, displayName, region, parcel])

  const authenticateAvatarFromTouch = async (
    keyVal: string, 
    legacyVal: string, 
    displayVal: string, 
    regionVal: string, 
    parcelVal: string
  ) => {
    setLoading(true)
    try {
      const cleanKey = keyVal.trim()
      const cleanLegacy = legacyVal.trim() || 'resident'
      const cleanDisplay = displayVal.trim() || cleanLegacy || 'SL Resident'

      let credits = 100 // Default starting credits per system rules
      let role = 'member'

      if (cleanLegacy.toLowerCase().includes('plosey') || cleanKey === '549d8555-43c5-46ed-8c65-33489c7ea2f0') {
        role = 'superadmin'
      }

      // 1. Primary User Passport document in live 'users' collection
      const userRef = doc(db, 'users', `sl_${cleanKey}`)
      
      try {
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          // Provision new avatar account in live database
          await setDoc(userRef, {
            id: `sl_${cleanKey}`,
            slKey: cleanKey,
            displayName: cleanDisplay,
            slLegacyName: cleanLegacy,
            credits: 100, // 100 default starting credits
            role: role,
            source: 'secondlife_prim_touch',
            homeVenue: slug,
            lastRegion: regionVal,
            lastParcel: parcelVal,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          }, { merge: true })

          showToast({
            title: '✨ SL Avatar Account Created',
            message: `Welcome to Gridpass, ${cleanDisplay}! 100 Gridpass Credits issued to your account.`,
          })
        } else {
          // Returning user - update last login & location details
          const data = userSnap.data()
          credits = data.credits !== undefined ? data.credits : 100
          if (data.role) role = data.role

          await setDoc(userRef, {
            displayName: cleanDisplay,
            slDisplayName: cleanDisplay,
            lastRegion: regionVal || data.lastRegion || '',
            lastParcel: parcelVal || data.lastParcel || '',
            lastLogin: serverTimestamp(),
          }, { merge: true })

          showToast({
            title: '🛡️ Avatar SSO Authenticated',
            message: `Welcome back ${cleanDisplay}! Portal session connected.`,
          })
        }
      } catch (dbErr) {
        console.warn("[Firestore Sync Warning - Fallback to Local Session]", dbErr)
        showToast({
          title: '⚡ Avatar SSO Session Active',
          message: `Welcome ${cleanDisplay}! Local avatar session active.`,
        })
      }

      // Safely try updating sl_avatars if permitted
      try {
        const avatarRef = doc(db, 'sl_avatars', cleanKey)
        await setDoc(avatarRef, {
          slKey: cleanKey,
          slLegacyName: cleanLegacy,
          slDisplayName: cleanDisplay,
          credits,
          role,
          lastRegion: regionVal,
          lastParcel: parcelVal,
          lastLogin: serverTimestamp(),
        }, { merge: true })
      } catch (e) {
        // Silently handle if sl_avatars rules pending deploy
      }

      // Log prim touch telemetry event to live database (safely)
      try {
        await addDoc(collection(db, 'system_logs'), {
          type: 'secondlife_prim_touch',
          slKey: cleanKey,
          displayName: cleanDisplay,
          venueSlug: slug,
          region: regionVal,
          parcel: parcelVal,
          timestamp: serverTimestamp(),
        })
      } catch (logErr) {
        // Silently skip if logging fails
      }

      const newSession: SLAvatarSession = {
        slKey: cleanKey,
        legacyName: cleanLegacy,
        displayName: cleanDisplay,
        region: regionVal,
        parcel: parcelVal,
        credits: credits,
        role: role,
        authenticatedAt: new Date().toISOString(),
      }

      setSession(newSession)
      localStorage.setItem('gridpass_sl_session', JSON.stringify(newSession))

    } catch (err: any) {
      console.error("[SecondLife Auth Error]", err)
      showToast({
        title: 'Authentication Error',
        message: 'Failed to verify Second Life avatar. Please try touching the prim again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualTestTouch = (e: React.FormEvent) => {
    e.preventDefault()
    authenticateAvatarFromTouch(testKey, testLegacy, testDisplay, testRegion, testParcel)
  }

  const handleLogout = () => {
    localStorage.removeItem('gridpass_sl_session')
    setSession(null)
    showToast({
      title: 'Session Disconnected',
      message: 'Logged out of Second Life portal session.',
    })
  }

  const handleUpdateBeaconTitle = async (primKey: string, newTitle: string) => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      const existingBeacon = venueTelemetry?.beaconPrims?.[primKey] || {}
      await setDoc(telemetryRef, {
        beaconPrims: {
          [primKey]: {
            ...existingBeacon,
            customTitle: newTitle
          }
        }
      }, { merge: true })
      showToast({
        title: 'Landmark Title Saved!',
        message: `Updated prim landmark to "${newTitle}".`,
      })
    } catch (e) {
      console.error("Failed to update beacon title", e)
    }
  }

  const handleDeleteBeacon = async (primKey: string) => {
    try {
      const telemetryRef = doc(db, 'users', `venue_telemetry_${slug}`)
      const currentPrims = { ...(venueTelemetry?.beaconPrims || {}) }
      delete currentPrims[primKey]
      await setDoc(telemetryRef, { beaconPrims: currentPrims })
      showToast({
        title: '🗑️ Beacon Prim Removed',
        message: 'Unregistered stale prim from telemetry registry.'
      })
    } catch (e) {
      console.error("Failed to delete beacon prim", e)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-[#1c1c1e] font-sans pb-24 selection:bg-[#ff3b30]/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-8 space-y-6">

        {/* Top Header Navigation Links */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-neutral-700 shadow-sm"
            >
              🏁 Gridpass Home
            </Link>
            <Link 
              href="/secondlife"
              className="px-3.5 py-2 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border border-neutral-800"
            >
              🌐 All SL Venues
            </Link>
          </div>

          <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline-block">
            Gridpass | One Tag for Everything
          </span>
        </div>

        {/* Top Banner Hero Destination Station */}
        {activeTab === 'home' ? (
          <div className="bg-neutral-950 text-white border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-[#ff3b30] mb-1.5">
                    <Radio className="w-3.5 h-3.5 animate-pulse" /> Gridpass Second Life Destination Engine
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono">
                      🟢 SIM ONLINE ({resolvedVisitors.length || venueTelemetry?.agentCount || 10} Avatars Active)
                    </span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                    {venueTitle}
                  </h1>
                  <p className="text-xs text-neutral-400 font-mono mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ff3b30]" />
                    {session?.region ? `${session.region} (${session.parcel || 'Main Region'})` : 'Skinny Dip Islands (~SDI~ Skinny Dip Inn Nude Beach Resort & Dance Club)'}
                  </p>
                </div>

                {/* Quick Action Teleport & Session Control */}
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`secondlife://${encodeURIComponent(venueTelemetry?.regionName || 'Skinny Dip Islands')}/128/128/25`}
                    className="px-5 py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#ff3b30]/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <Navigation className="w-4 h-4" /> Teleport In-World (SLURL)
                  </a>

                  {isSuperAdmin && (
                    <a
                      href="/sl_scripts/Gridpass_SL_Sim_Bridge.lsl"
                      download="Gridpass_SL_Sim_Bridge.lsl"
                      className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black uppercase rounded-xl border border-neutral-700 flex items-center gap-2 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-[#ff3b30]" /> Get LSL Bridge
                    </a>
                  )}
                  
                  {session && (
                    <button
                      onClick={handleLogout}
                      className="px-4 py-3 bg-neutral-900 text-neutral-400 hover:text-white text-xs font-black uppercase rounded-xl border border-neutral-800 transition-all"
                    >
                      Disconnect Session
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Teleport Landmarks Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-neutral-800/80 text-xs font-mono">
                {venueTelemetry?.beaconPrims && Object.keys(venueTelemetry.beaconPrims).length > 0 ? (
                  Object.values(venueTelemetry.beaconPrims).map((beacon: any, idx: number) => (
                    <a
                      key={idx}
                      href={beacon.teleportUrl || `secondlife://${encodeURIComponent(venueTelemetry?.regionName || 'Skinny Dip Islands')}/${beacon.pos?.x || 128}/${beacon.pos?.y || 128}/${beacon.pos?.z || 25}`}
                      className="p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-neutral-800 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base shrink-0">📍</span>
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">{formatCleanPrimTitle(beacon.inGameName || beacon.customTitle || 'Prim Station')}</span>
                          <span className="text-[9px] text-neutral-400 block">Position: ({beacon.pos?.x || 128}, {beacon.pos?.y || 128}, {beacon.pos?.z || 25})</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#ff3b30] transition-colors shrink-0" />
                    </a>
                  ))
                ) : (
                  <>
                    <a
                      href={`secondlife://${encodeURIComponent(venueTelemetry?.regionName || 'Skinny Dip Islands')}/128/64/25`}
                      className="p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-neutral-800 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">💃</span>
                        <div>
                          <span className="font-bold text-white block">Main Club Dancefloor</span>
                          <span className="text-[9px] text-neutral-400">Position: (128, 64, 25)</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#ff3b30] transition-colors" />
                    </a>

                    <a
                      href={`secondlife://${encodeURIComponent(venueTelemetry?.regionName || 'Skinny Dip Islands')}/200/150/22`}
                      className="p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-neutral-800 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏖️</span>
                        <div>
                          <span className="font-bold text-white block">Nude Beach & Resort</span>
                          <span className="text-[9px] text-neutral-400">Position: (200, 150, 22)</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#ff3b30] transition-colors" />
                    </a>

                    <a
                      href={`secondlife://${encodeURIComponent(venueTelemetry?.regionName || 'Skinny Dip Islands')}/128/128/25`}
                      className="p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-neutral-800 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏁</span>
                        <div>
                          <span className="font-bold text-white block">Gridpass Passport Station</span>
                          <span className="text-[9px] text-neutral-400">Position: (128, 128, 25)</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#ff3b30] transition-colors" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Compact Header Bar when on secondary tabs */
          <div className="bg-neutral-950 text-white border border-neutral-800 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 truncate">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="truncate">
                <h2 className="text-base font-black uppercase text-white truncate">{venueTitle}</h2>
                <span className="text-[10px] font-mono text-neutral-400 block truncate">
                  🟢 {resolvedVisitors.length} Avatars Tracked • {venueTelemetry?.regionName || 'Skinny Dip Islands'}
                </span>
              </div>
            </div>

            <a
              href={`secondlife://${encodeURIComponent(venueTelemetry?.regionName || 'Skinny Dip Islands')}/128/128/25`}
              className="px-3.5 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow flex items-center gap-1.5 shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" /> Teleport SLURL
            </a>
          </div>
        )}

        {/* Loading Spinner State */}
        {loading && (
          <div className="p-12 text-center bg-neutral-50 rounded-2xl border border-neutral-200 my-8">
            <div className="w-10 h-10 border-4 border-[#ff3b30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-wider text-neutral-700">
              Authenticating Second Life Prim Touch...
            </p>
          </div>
        )}

        {/* Active Session Passport Header Card */}
        {session && !loading && (
          <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-xl mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 overflow-hidden shadow-lg shadow-[#ff3b30]/20 shrink-0 flex items-center justify-center">
                  <img
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(session.legacyName)}`}
                    alt={session.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> SL Verified Avatar
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-mono uppercase">
                      Role: {session.role}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                    {session.displayName}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono">
                    Legacy Name: {session.legacyName} • Key: {session.slKey.substring(0, 8)}...
                  </p>
                </div>
              </div>

              {/* Stats Box */}
              <div className="flex flex-wrap items-center gap-4 bg-neutral-800/80 p-4 rounded-2xl border border-neutral-700 w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff3b30]/20 text-[#ff3b30] flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">Current Region</span>
                    <span className="text-xs font-bold text-neutral-200">{session.region || 'Second Life'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sleek Zero-Scroll Responsive Navigation Header (Desktop & Tablet) */}
        <div ref={tabContentRef} className="hidden md:flex flex-wrap items-center justify-between gap-3 bg-neutral-950/95 p-2 rounded-2xl border border-neutral-800 shadow-2xl mb-8 scroll-mt-20">
          {/* Main Primary View Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleTabChange('home')}
              className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'home'
                  ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 font-bold'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400" /> Sim Home
            </button>

            <button
              onClick={() => handleTabChange('passport')}
              className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'passport'
                  ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 font-bold'
              }`}
            >
              <User className="w-4 h-4 text-blue-400" /> Passport
            </button>

            <button
              onClick={() => handleTabChange('staff')}
              className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'staff'
                  ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 font-bold'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" /> Staff Roster
            </button>

            <button
              onClick={() => handleTabChange('schedule')}
              className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'schedule'
                  ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 font-bold'
              }`}
            >
              <Calendar className="w-4 h-4 text-rose-400" /> Party Schedule
            </button>

            <button
              onClick={() => handleTabChange('apply')}
              className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'apply'
                  ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 font-bold'
              }`}
            >
              <Music className="w-4 h-4 text-emerald-400" /> Apply (DJ / Host)
            </button>

            <button
              onClick={() => handleTabChange('analytics')}
              className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 font-bold'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-purple-400" /> Live Stats
            </button>

            <button
              onClick={() => handleTabChange('rules')}
              className={`px-4 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'rules'
                  ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 font-bold'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sim Rules
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                activeTab === 'rules' ? 'bg-white/20 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                v{venueTelemetry?.rulesVersion || 1}.0
              </span>
            </button>
          </div>

          {/* Admin & Staff Management Dropdown / Pill Group */}
          {isStaff && (
            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <span className="px-2 text-[9px] font-black uppercase text-neutral-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ff3b30]" /> Admin Tools:
              </span>

              <button
                onClick={() => handleTabChange('admin')}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-[#ff3b30] text-white shadow-md'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" /> Admin
              </button>

              <button
                onClick={() => handleTabChange('applications')}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all flex items-center gap-1 ${
                  activeTab === 'applications'
                    ? 'bg-[#ff3b30] text-white shadow-md'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Music className="w-3.5 h-3.5" /> Applications
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => handleTabChange('logs')}
                  className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all flex items-center gap-1 ${
                    activeTab === 'logs'
                      ? 'bg-[#ff3b30] text-white shadow-md'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Logs
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile iOS-Style Floating Bottom Dock Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 text-white border-t border-neutral-800 backdrop-blur-lg flex justify-around items-center h-16 px-1 md:hidden shadow-2xl">
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all relative ${
              activeTab === 'home' ? 'text-[#ff3b30] font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {activeTab === 'home' && <span className="absolute top-0 w-8 h-1 bg-[#ff3b30] rounded-b-full shadow-md" />}
            <Compass className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Sim Home</span>
          </button>

          <button
            onClick={() => handleTabChange('passport')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all relative ${
              activeTab === 'passport' ? 'text-[#ff3b30] font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {activeTab === 'passport' && <span className="absolute top-0 w-8 h-1 bg-[#ff3b30] rounded-b-full shadow-md" />}
            <User className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Passport</span>
          </button>



          <button
            onClick={() => handleTabChange('analytics')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all relative ${
              activeTab === 'analytics' ? 'text-[#ff3b30] font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {activeTab === 'analytics' && <span className="absolute top-0 w-8 h-1 bg-[#ff3b30] rounded-b-full shadow-md" />}
            <BarChart2 className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Live Stats</span>
          </button>

          {isStaff && (
            <button
              onClick={() => handleTabChange('admin')}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all relative ${
                activeTab === 'admin' ? 'text-[#ff3b30] font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {activeTab === 'admin' && <span className="absolute top-0 w-8 h-1 bg-[#ff3b30] rounded-b-full shadow-md" />}
              <KeyRound className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Admin</span>
            </button>
          )}



          {isSuperAdmin && (
            <button
              onClick={() => handleTabChange('logs')}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-all ${
                activeTab === 'logs' ? 'text-[#ff3b30] font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Logs</span>
            </button>
          )}
        </nav>

        {/* Tab Content: Sim Destination Home Page */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Sim Info Grid: Schedule & Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Schedule & DJ Roster */}
              {(venuePermissions.publicScheduleVisible || isStaff) && (
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#ff3b30] mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Weekly Resort Schedule & Resident DJs
                  </h3>
                  <div className="space-y-3 text-xs">
                    {(venueTelemetry?.scheduleEvents || [
                      { id: '1', title: '🎧 Resident DJ Sets', subtitle: 'Daily 6 PM - 12 AM SLT', badge: 'Live Sets' },
                      { id: '2', title: '🏖️ Beach Party & Nude Beach Resort', subtitle: 'Open 24/7 All Week', badge: 'Open 24/7' }
                    ]).map((evt: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-neutral-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-[#1c1c1e] block">{evt.title}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">{evt.subtitle}</span>
                        </div>
                        {evt.badge && (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-700 font-bold text-[9px] uppercase rounded">
                            {evt.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sim Rules & Guidelines */}
              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#ff3b30] mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Sim Guidelines & Visitor Rules
                </h3>
                <div className="space-y-2 text-xs text-neutral-700 leading-relaxed font-medium">
                  {(venueTelemetry?.simGuidelines || [
                    "Respect all residents, staff, hosts, and DJs at all times.",
                    "Nude Beach & Resort policy: Clothing optional, adult-friendly atmosphere.",
                    "Touch the in-world Gridpass prim to log your passport & earn visitor rewards."
                  ]).map((rule: string, idx: number) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-neutral-200 flex items-start gap-2">
                      <span className="text-base font-bold text-[#ff3b30]">{idx + 1}️⃣</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Visitors Preview Roster */}
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#1c1c1e] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#ff3b30]" /> Active Region Visitors ({resolvedVisitors.length})
                </h3>
                <button
                  onClick={() => handleTabChange('analytics')}
                  className="text-xs font-bold text-[#ff3b30] hover:underline uppercase"
                >
                  View Full Directory →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {resolvedVisitors.slice(0, 6).map((visitor, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAvatarDetail(visitor)}
                    className="p-3 bg-white rounded-xl border border-neutral-200 hover:border-[#ff3b30] transition-all cursor-pointer flex items-center gap-3"
                  >
                    <img
                      src={visitor.avatarImageUrl}
                      alt={visitor.name}
                      className="w-10 h-10 rounded-lg bg-neutral-200 border border-neutral-300 object-cover shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-black text-xs text-[#1c1c1e] block truncate">{visitor.name}</span>
                      <span className="text-[9px] font-mono text-neutral-500">⏱️ {visitor.dwellMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Avatar Passport */}
        {activeTab === 'passport' && (
          <div className="space-y-6">
            {!session ? (
              <div className="p-10 bg-neutral-50 rounded-2xl border border-neutral-200 text-center max-w-2xl mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#ff3b30]/10 text-[#ff3b30] flex items-center justify-center mx-auto mb-4 border border-[#ff3b30]/20">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black uppercase text-[#1c1c1e] mb-2 tracking-tight">
                  Touch In-World Prim to Open Your Passport
                </h3>
                <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed mb-6">
                  Touch the <span className="font-bold text-[#1c1c1e]">{slug || 'Skinny Dip Inn'}</span> Gridpass prim in Second Life to open your verified avatar passport, region dwell time, and staff permissions.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-700 rounded-xl border border-emerald-500/20 font-mono text-xs font-bold mb-6">
                  🟢 In-World Prim Live & Operational
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={
                      venueTelemetry?.beaconPrims && Object.keys(venueTelemetry.beaconPrims).length > 0
                        ? Object.values(venueTelemetry.beaconPrims)[0]?.teleportUrl || `secondlife://${encodeURIComponent(venueTelemetry?.regionName || 'Skinny Dip Islands')}/128/128/25`
                        : `secondlife://${encodeURIComponent(venueTelemetry?.regionName || 'Skinny Dip Islands')}/128/128/25`
                    }
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-[#ff3b30]/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <Navigation className="w-4 h-4" /> Teleport Directly to In-World Prim (SLURL)
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Passport Card details */}
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#ff3b30] mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Identity & Verification
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-500 font-bold uppercase">Display Name</span>
                      <span className="font-bold text-[#1c1c1e]">{session.displayName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-500 font-bold uppercase">Legacy Username</span>
                      <span className="font-mono text-neutral-700">{session.legacyName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-500 font-bold uppercase">Avatar Key (UUID)</span>
                      <span className="font-mono text-neutral-700 text-[11px]">{session.slKey}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-200">
                      <span className="text-neutral-500 font-bold uppercase">Starting Rewards</span>
                      <span className="font-bold text-amber-600">{session.credits} Gridpass Credits</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-neutral-500 font-bold uppercase">Authenticated At</span>
                      <span className="font-mono text-neutral-600">
                        {new Date(session.authenticatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Second Life Profile Links & Actions */}
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#ff3b30] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Avatar Actions & Badges
                  </h3>
                  <div className="space-y-3">
                    <a
                      href={`secondlife:///app/agent/${session.slKey}/about`}
                      className="w-full p-3 bg-white border border-neutral-300 hover:border-[#ff3b30] rounded-xl flex items-center justify-between transition-all group block text-xs"
                    >
                      <span className="font-bold uppercase text-neutral-800 group-hover:text-[#ff3b30]">
                        Open In-Viewer SL Profile
                      </span>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#ff3b30] group-hover:translate-x-1 transition-transform" />
                    </a>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                      <div className="flex items-center gap-2 font-bold uppercase mb-1 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Account Active in Firestore
                      </div>
                      <p className="text-[11px] leading-relaxed text-emerald-700">
                        Your avatar credentials have been synced to the live Gridpass database under doc ID <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">{session.slKey}</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}





        {/* Tab Content: Live Telemetry & Avatar Event Audit Stream HQ */}
        {activeTab === 'logs' && (() => {
          // Generate structured avatar activity events from visitor map and telemetry logs
          const rawVisitors = venueTelemetry?.visitorMap ? Object.values(venueTelemetry.visitorMap) : []
          const recentLogs = venueTelemetry?.recentLogs || []

          // Combine raw logs with visitor entry/exit events
          const avatarEvents: Array<{
            id: string
            timestamp: string
            type: 'ENTRY' | 'EXIT' | 'NOTICE' | 'STAFF' | 'MUSIC' | 'TELEMETRY'
            avatarName?: string
            slKey?: string
            title: string
            summary: string
            badgeColor: string
            badgeText: string
            pos?: string
            dwellMins?: number
            arc?: number
            fps?: number
          }> = []

          // 1. Process Visitor Entry/Exit Events from Visitor Map
          rawVisitors.forEach((v: any) => {
            if (v.onlineSince) {
              avatarEvents.push({
                id: `entry_${v.slKey || v.name}_${v.onlineSince}`,
                timestamp: v.onlineSince,
                type: 'ENTRY',
                avatarName: v.name,
                slKey: v.slKey,
                title: `${v.name} ARRIVED ON SIM`,
                summary: `Avatar logged into ${venueTitle} at position (${v.posX || 128}, ${v.posY || 128}, ${v.posZ || 25})`,
                badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                badgeText: '🟢 ENTERED SIM',
                pos: `(${v.posX || 128}, ${v.posY || 128}, ${v.posZ || 25})`,
                dwellMins: v.dwellMinutes || 1,
                arc: v.arc || 0
              })
            }

            if (v.status === 'OFFLINE' && (v.offlineAt || v.lastSeen)) {
              avatarEvents.push({
                id: `exit_${v.slKey || v.name}_${v.offlineAt || v.lastSeen}`,
                timestamp: v.offlineAt || v.lastSeen,
                type: 'EXIT',
                avatarName: v.name,
                slKey: v.slKey,
                title: `${v.name} DEPARTED SIM`,
                summary: `Avatar logged off or teleported away after ${v.dwellMinutes || 1} mins on sim`,
                badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
                badgeText: '🔴 DEPARTED SIM',
                pos: `(${v.posX || 128}, ${v.posY || 128}, ${v.posZ || 25})`,
                dwellMins: v.dwellMinutes || 1,
                arc: v.arc || 0
              })
            }
          })

          // 2. Process Telemetry Logs
          recentLogs.forEach((log: any) => {
            if (log.category === 'timeclock') {
              avatarEvents.push({
                id: log.id,
                timestamp: log.timestamp,
                type: 'STAFF',
                title: log.title,
                summary: log.summary,
                badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                badgeText: '⏰ STAFF SHIFT',
                fps: log.fps
              })
            } else if (log.category === 'music_change') {
              avatarEvents.push({
                id: log.id,
                timestamp: log.timestamp,
                type: 'MUSIC',
                title: log.title,
                summary: log.summary,
                badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                badgeText: '🎵 AUDIO STREAM',
                fps: log.fps
              })
            } else {
              avatarEvents.push({
                id: log.id,
                timestamp: log.timestamp,
                type: 'TELEMETRY',
                title: log.title || 'BEACON TELEMETRY UPDATE',
                summary: log.summary || `Sim status report from ${log.regionName || venueTitle}`,
                badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                badgeText: '⚡ SIM TELEMETRY',
                fps: log.fps
              })
            }
          })

          // Sort by newest timestamp first
          avatarEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

          // Filter by category and search query
          const filteredEvents = avatarEvents.filter(evt => {
            if (logCategoryFilter === 'visitor_movement' && evt.type !== 'ENTRY' && evt.type !== 'EXIT') return false
            if (logCategoryFilter === 'telemetry' && evt.type !== 'TELEMETRY') return false
            if (logCategoryFilter === 'music_change' && evt.type !== 'MUSIC') return false
            if (logCategoryFilter === 'staff' && evt.type !== 'STAFF') return false

            if (logSearchQuery.trim()) {
              const q = logSearchQuery.toLowerCase()
              return (
                evt.title.toLowerCase().includes(q) ||
                evt.summary.toLowerCase().includes(q) ||
                (evt.avatarName && evt.avatarName.toLowerCase().includes(q)) ||
                (evt.slKey && evt.slKey.toLowerCase().includes(q))
              )
            }
            return true
          })

          const handleExportLogsCsv = () => {
            const headers = ['Timestamp', 'Event Type', 'Title', 'Avatar Name', 'SL UUID', 'Summary', 'Position', 'Dwell Mins', 'ARC Weight']
            const rows = filteredEvents.map(e => [
              `"${e.timestamp}"`,
              `"${e.type}"`,
              `"${e.title.replace(/"/g, '""')}"`,
              `"${e.avatarName || ''}"`,
              `"${e.slKey || ''}"`,
              `"${e.summary.replace(/"/g, '""')}"`,
              `"${e.pos || ''}"`,
              e.dwellMins || 0,
              e.arc || 0
            ])
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
            const encodedUri = encodeURI(csvContent)
            const link = document.createElement('a')
            link.setAttribute('href', encodedUri)
            link.setAttribute('download', `${slug}_activity_audit_logs.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            showToast({
              title: '📥 Activity Logs Exported',
              message: `Downloaded ${filteredEvents.length} log records to CSV.`
            })
          }

          return (
            <div className="space-y-6">
              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[#1c1c1e] flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#ff3b30]" /> Avatar Activity & Event Audit Stream HQ
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Real-time chronological timeline of avatar arrivals, departures, rules notices, and sim telemetry events for <span className="font-bold text-[#1c1c1e]">{venueTitle}</span>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleExportLogsCsv}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Logs CSV
                    </button>
                    <span className="px-3 py-2 bg-emerald-500/10 text-emerald-700 font-mono text-xs font-bold uppercase rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stream Online
                    </span>
                  </div>
                </div>

                {/* Subtab Category Filters Toolbar */}
                <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 mb-6">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setLogCategoryFilter('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        logCategoryFilter === 'all'
                          ? 'bg-[#1c1c1e] text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      All Events ({avatarEvents.length})
                    </button>
                    <button
                      onClick={() => setLogCategoryFilter('visitor_movement')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        logCategoryFilter === 'visitor_movement'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      👤 Visitor Logins / Movement ({avatarEvents.filter(e => e.type === 'ENTRY' || e.type === 'EXIT').length})
                    </button>
                    <button
                      onClick={() => setLogCategoryFilter('staff')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        logCategoryFilter === 'staff'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      ⏰ Staff Timeclock ({avatarEvents.filter(e => e.type === 'STAFF').length})
                    </button>
                    <button
                      onClick={() => setLogCategoryFilter('music_change')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        logCategoryFilter === 'music_change'
                          ? 'bg-purple-700 text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      🎵 DJ Stream Track ({avatarEvents.filter(e => e.type === 'MUSIC').length})
                    </button>
                    <button
                      onClick={() => setLogCategoryFilter('telemetry')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        logCategoryFilter === 'telemetry'
                          ? 'bg-[#ff3b30] text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      ⚡ Sim Telemetry ({avatarEvents.filter(e => e.type === 'TELEMETRY').length})
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Search logs by avatar name / UUID..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl font-medium text-[#1c1c1e] focus:outline-none focus:border-[#ff3b30] w-full sm:w-64"
                  />
                </div>

                {/* Log Event Stream List */}
                {filteredEvents.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-black uppercase tracking-wider text-neutral-700">No Matching Telemetry Logs</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Events will populate automatically when avatars enter, leave, or interact with in-world prims.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 bg-white rounded-2xl border border-neutral-200 hover:border-[#ff3b30] transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {evt.avatarName ? (
                              <img
                                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(evt.avatarName)}`}
                                alt={evt.avatarName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Radio className="w-5 h-5 text-neutral-500" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${evt.badgeColor}`}>
                                {evt.badgeText}
                              </span>
                              <h4 className="text-xs font-black uppercase text-[#1c1c1e]">{evt.title}</h4>
                            </div>

                            <p className="text-xs text-neutral-600 font-medium mb-1.5">{evt.summary}</p>

                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-neutral-500">
                              {evt.pos && (
                                <span className="flex items-center gap-1 font-bold text-neutral-700">
                                  <MapPin className="w-3 h-3 text-[#ff3b30]" /> {evt.pos}
                                </span>
                              )}
                              {evt.dwellMins !== undefined && (
                                <span>⏱️ Dwell: {evt.dwellMins}m</span>
                              )}
                              {evt.arc !== undefined && evt.arc > 0 && (
                                <span>⚖️ ARC: {evt.arc.toLocaleString()}</span>
                              )}
                              {evt.fps !== undefined && evt.fps > 0 && (
                                <span>⚡ FPS: {evt.fps.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-xs font-black text-[#1c1c1e] font-mono block">
                            {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {new Date(evt.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Tab Content: Advanced Sim Telemetry, Traffic Analytics & Avatar Radar HQ */}
        {activeTab === 'analytics' && (() => {
          const visitorMapCombined: Record<string, any> = {}
          const getNormKey = (v: any) => {
            if (!v) return ''
            if (v.name) return String(v.name).toLowerCase().trim()
            if (v.slKey) return String(v.slKey).toLowerCase().trim()
            return ''
          }

          // Collect exact log timestamps per avatar to compute true span
          const avatarLogTimestamps: Record<string, number[]> = {}
          if (venueTelemetry?.recentLogs && Array.isArray(venueTelemetry.recentLogs)) {
            venueTelemetry.recentLogs.forEach((log: any) => {
              if (log.timestamp && Array.isArray(log.visitorList)) {
                const ts = new Date(log.timestamp).getTime()
                if (!isNaN(ts)) {
                  log.visitorList.forEach((nameOrKey: string) => {
                    if (nameOrKey) {
                      const normKey = String(nameOrKey).toLowerCase().trim()
                      if (!avatarLogTimestamps[normKey]) avatarLogTimestamps[normKey] = []
                      avatarLogTimestamps[normKey].push(ts)
                    }
                  })
                }
              }
            })
          }

          const getAvatarTimeMetrics = (v: any, key: string) => {
            const tss = avatarLogTimestamps[key] ? [...avatarLogTimestamps[key]].sort((a, b) => a - b) : []
            
            let totalLifetimeMinutes = v.totalDwellMinutes || v.dwellMinutes || 0
            let longestSessionMinutes = v.dwellMinutes || 0
            let visitCount = 1

            if (tss.length > 0) {
              let sessions: number[] = []
              let currentSessionStart = tss[0]
              let currentSessionLast = tss[0]

              for (let i = 1; i < tss.length; i++) {
                const deltaMins = (tss[i] - currentSessionLast) / (1000 * 60)
                if (deltaMins <= 10) {
                  currentSessionLast = tss[i]
                } else {
                  const duration = Math.max(1, Math.round((currentSessionLast - currentSessionStart) / (1000 * 60)))
                  sessions.push(duration)
                  currentSessionStart = tss[i]
                  currentSessionLast = tss[i]
                }
              }
              const lastDuration = Math.max(1, Math.round((currentSessionLast - currentSessionStart) / (1000 * 60)))
              sessions.push(lastDuration)

              visitCount = sessions.length
              const sumMins = sessions.reduce((acc, curr) => acc + curr, 0)
              const maxMins = Math.max(...sessions)

              totalLifetimeMinutes = Math.max(totalLifetimeMinutes, sumMins)
              longestSessionMinutes = Math.max(longestSessionMinutes, maxMins)
            }

            // Only evaluate active Date.now() duration if avatar is currently ONLINE!
            if (v.onlineSince) {
              const startMs = new Date(v.onlineSince).getTime()
              if (!isNaN(startMs)) {
                const isOnline = v.status === 'ONLINE'
                const endMs = isOnline ? Date.now() : new Date(v.offlineAt || v.lastSeen || v.onlineSince).getTime()
                const currentSessionMins = Math.max(1, Math.round(Math.abs(endMs - startMs) / (1000 * 60)))
                
                // For online avatars, update active session metrics. For offline, cap session at last seen duration.
                if (isOnline) {
                  longestSessionMinutes = Math.max(longestSessionMinutes, currentSessionMins)
                  totalLifetimeMinutes = Math.max(totalLifetimeMinutes, currentSessionMins)
                } else if (currentSessionMins > 0 && currentSessionMins < 1440) {
                  longestSessionMinutes = Math.max(longestSessionMinutes, currentSessionMins)
                  totalLifetimeMinutes = Math.max(totalLifetimeMinutes, currentSessionMins)
                }
              }
            }

            return {
              totalLifetimeMinutes: Math.max(totalLifetimeMinutes, 1),
              longestSessionMinutes: Math.max(longestSessionMinutes, 1),
              visitCount: Math.max(visitCount, 1)
            }
          }

          // 1. Ingest visitorMap (Live snapshot ALWAYS takes top priority for online status)
          if (venueTelemetry?.visitorMap) {
            Object.values(venueTelemetry.visitorMap).forEach((v: any) => {
              const key = getNormKey(v)
              if (key) {
                const metrics = getAvatarTimeMetrics(v, key)
                visitorMapCombined[key] = { 
                  ...v, 
                  status: v.status || 'ONLINE',
                  dwellMinutes: metrics.totalLifetimeMinutes,
                  totalLifetimeMinutes: metrics.totalLifetimeMinutes,
                  longestSessionMinutes: metrics.longestSessionMinutes,
                  visitCount: metrics.visitCount
                }
              }
            })
          }

          // 2. Ingest visitorDetails (Recorded historical details)
          if (venueTelemetry?.visitorDetails && Array.isArray(venueTelemetry.visitorDetails)) {
            venueTelemetry.visitorDetails.forEach((v: any) => {
              const key = getNormKey(v)
              if (key) {
                const metrics = getAvatarTimeMetrics(v, key)
                if (!visitorMapCombined[key]) {
                  visitorMapCombined[key] = { 
                    ...v, 
                    status: v.status || 'OFFLINE', 
                    dwellMinutes: metrics.totalLifetimeMinutes,
                    totalLifetimeMinutes: metrics.totalLifetimeMinutes,
                    longestSessionMinutes: metrics.longestSessionMinutes,
                    visitCount: metrics.visitCount
                  }
                } else {
                  visitorMapCombined[key].totalLifetimeMinutes = Math.max(visitorMapCombined[key].totalLifetimeMinutes || 0, metrics.totalLifetimeMinutes)
                  visitorMapCombined[key].longestSessionMinutes = Math.max(visitorMapCombined[key].longestSessionMinutes || 0, metrics.longestSessionMinutes)
                  visitorMapCombined[key].dwellMinutes = visitorMapCombined[key].totalLifetimeMinutes
                }
              }
            })
          }

          // 3. Ingest recentLogs (Historical telemetry pings)
          if (venueTelemetry?.recentLogs && Array.isArray(venueTelemetry.recentLogs)) {
            venueTelemetry.recentLogs.forEach((log: any) => {
              if (Array.isArray(log.visitorList)) {
                log.visitorList.forEach((nameOrKey: string) => {
                  if (nameOrKey) {
                    const normKey = String(nameOrKey).toLowerCase().trim()
                    if (!visitorMapCombined[normKey]) {
                      const metrics = getAvatarTimeMetrics({ dwellMinutes: 15 }, normKey)
                      visitorMapCombined[normKey] = {
                        name: nameOrKey,
                        slKey: nameOrKey.includes('-') && nameOrKey.length === 36 ? nameOrKey : '',
                        isRegistered: false,
                        onlineSince: log.timestamp || new Date().toISOString(),
                        lastSeen: log.timestamp,
                        offlineAt: log.timestamp,
                        dwellMinutes: metrics.totalLifetimeMinutes,
                        totalLifetimeMinutes: metrics.totalLifetimeMinutes,
                        longestSessionMinutes: metrics.longestSessionMinutes,
                        visitCount: metrics.visitCount,
                        arc: undefined,
                        posX: 128,
                        posY: 128,
                        posZ: 25,
                        status: 'OFFLINE' as const,
                        avatarImageUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(nameOrKey)}`
                      }
                    }
                  }
                })
              }
            })
          }

          const rawList = Object.values(visitorMapCombined)

          const nowMs = Date.now()
          const ms24h = 24 * 60 * 60 * 1000
          const ms48h = 48 * 60 * 60 * 1000
          const ms7d = 7 * ms24h
          const ms14d = 14 * ms24h

          const filteredByTime = rawList.filter((visitor) => {
            if (analyticsTimeFilter === 'online') {
              return visitor.status === 'ONLINE'
            }

            const ts = new Date(visitor.lastSeen || visitor.offlineAt || visitor.onlineSince || Date.now()).getTime()
            
            if (analyticsTimeFilter === '24h') {
              return ts >= nowMs - ms24h
            }
            if (analyticsTimeFilter === 'yesterday') {
              return ts >= nowMs - ms48h && ts < nowMs - ms24h
            }
            if (analyticsTimeFilter === 'week') {
              return ts >= nowMs - ms7d
            }
            if (analyticsTimeFilter === 'last_week') {
              return ts >= nowMs - ms14d && ts < nowMs - ms7d
            }
            if (analyticsTimeFilter === 'custom') {
              const startMs = new Date(`${customStartDate}T00:00:00`).getTime()
              const endMs = new Date(`${customEndDate}T23:59:59`).getTime()
              return ts >= startMs && ts <= endMs
            }
            return true
          })

          let displayList = filteredByTime.filter((visitor) => {
            if (analyticsSubTab === 'online_now') {
              return visitor.status === 'ONLINE'
            }
            if (analyticsSubTab === 'top_total_time') {
              return (visitor.totalLifetimeMinutes || visitor.dwellMinutes || 0) >= 1
            }
            if (analyticsSubTab === 'longest_single_session') {
              return (visitor.longestSessionMinutes || 0) >= 1
            }
            if (analyticsSubTab === 'high_arc') {
              return (visitor.arc || 0) >= 10000
            }
            return true
          })

          displayList = [...displayList].sort((a, b) => {
            // Only pin ONLINE avatars to top when sort order is explicitly 'online_recent' and not in pure time leaderboard modes
            if (analyticsSortOrder === 'online_recent' && analyticsSubTab !== 'top_total_time' && analyticsSubTab !== 'longest_single_session') {
              if (a.status === 'ONLINE' && b.status !== 'ONLINE') return -1
              if (a.status !== 'ONLINE' && b.status === 'ONLINE') return 1
            }

            if (analyticsSortOrder === 'total_time' || analyticsSubTab === 'top_total_time') {
              return (b.totalLifetimeMinutes || b.dwellMinutes || 0) - (a.totalLifetimeMinutes || a.dwellMinutes || 0)
            }
            if (analyticsSortOrder === 'single_session' || analyticsSubTab === 'longest_single_session') {
              return (b.longestSessionMinutes || 0) - (a.longestSessionMinutes || 0)
            }
            if (analyticsSortOrder === 'dwell') {
              return (b.totalLifetimeMinutes || b.dwellMinutes || 0) - (a.totalLifetimeMinutes || a.dwellMinutes || 0)
            }
            if (analyticsSortOrder === 'arc' || analyticsSubTab === 'high_arc') {
              return (b.arc || 0) - (a.arc || 0)
            }
            if (analyticsSortOrder === 'name') {
              return (a.name || '').localeCompare(b.name || '')
            }
            if (analyticsSortOrder === 'newest') {
              const tsA = new Date(a.onlineSince || a.lastSeen || a.offlineAt || 0).getTime()
              const tsB = new Date(b.onlineSince || b.lastSeen || b.offlineAt || 0).getTime()
              return tsB - tsA
            }

            // Default: 'online_recent' (Online avatars first, then by most recently seen)
            if (a.status === 'ONLINE' && b.status !== 'ONLINE') return -1
            if (a.status !== 'ONLINE' && b.status === 'ONLINE') return 1
            const tsA = new Date(a.lastSeen || a.offlineAt || a.onlineSince || 0).getTime()
            const tsB = new Date(b.lastSeen || b.offlineAt || b.onlineSince || 0).getTime()
            return tsB - tsA
          })

          if (analyticsSearch.trim()) {
            const q = analyticsSearch.toLowerCase()
            displayList = displayList.filter(v => 
              v.name?.toLowerCase().includes(q) || 
              v.slKey?.toLowerCase().includes(q)
            )
          }

          const totalUniqueAvatars = filteredByTime.length
          const onlineCount = rawList.filter(v => v.status === 'ONLINE').length
          const totalDwellMins = filteredByTime.reduce((acc, v) => acc + (v.dwellMinutes || 0), 0)
          const totalDwellHours = (totalDwellMins / 60).toFixed(1)
          const avgDwellMins = totalUniqueAvatars > 0 ? Math.round(totalDwellMins / totalUniqueAvatars) : 0
          const peakConcurrent = Math.max(venueTelemetry?.agentCount || 0, onlineCount)

          const hourlyCounts = new Array(24).fill(0)
          let firstTimeVisitors = 0
          let returningRegulars = 0
          const highArcAvatars: any[] = []
          const registeredPrims = venueTelemetry?.beaconPrims ? Object.values(venueTelemetry.beaconPrims) : []
          const zoneDensityMap: Record<string, { name: string, count: number, color: string }> = {}

          filteredByTime.forEach(v => {
            const timestampsToMap = Array.from(new Set([v.onlineSince, v.lastSeen, v.offlineAt].filter(Boolean)))
            if (timestampsToMap.length > 0) {
              timestampsToMap.forEach((tsStr: any) => {
                const d = new Date(tsStr)
                if (!isNaN(d.getTime())) {
                  const hr = d.getHours()
                  hourlyCounts[hr] += 1
                }
              })
            } else {
              // Default fallback if no timestamp present
              const hr = new Date().getHours()
              hourlyCounts[hr] += 1
            }

            if ((v.dwellMinutes || 0) >= 15 || (v.visitCount || 1) > 1) {
              returningRegulars += 1
            } else {
              firstTimeVisitors += 1
            }

            if ((v.arc || 0) >= 100000) {
              highArcAvatars.push(v)
            }

            // Map spatial zone dynamically to nearest live prim beacon or parcel name
            let assignedZone = v.parcelName || v.zoneName
            if (!assignedZone && registeredPrims.length > 0 && v.posX !== undefined && v.posY !== undefined) {
              let minDistance = Infinity
              let closestBeaconName = ''

              registeredPrims.forEach((b: any) => {
                if (b.pos?.x !== undefined && b.pos?.y !== undefined) {
                  const dx = v.posX - parseFloat(b.pos.x)
                  const dy = v.posY - parseFloat(b.pos.y)
                  const dist = Math.sqrt(dx * dx + dy * dy)
                  if (dist < minDistance) {
                    minDistance = dist
                    closestBeaconName = b.inGameName || b.customTitle || 'Prim Station'
                  }
                }
              })

              if (closestBeaconName && minDistance <= 100) {
                assignedZone = closestBeaconName
              }
            }

            if (!assignedZone) {
              const x = v.posX !== undefined ? v.posX : 128
              if (x >= 100 && x <= 150) assignedZone = 'Dance Floor Sector'
              else if (x < 100) assignedZone = 'Beach & Waterfront Sector'
              else assignedZone = 'Resort Cabanas & VIP Lounge'
            }

            if (!zoneDensityMap[assignedZone]) {
              const colors = ['bg-[#ff3b30]', 'bg-amber-500', 'bg-purple-600', 'bg-blue-600', 'bg-emerald-600']
              const colorIdx = Object.keys(zoneDensityMap).length % colors.length
              zoneDensityMap[assignedZone] = { name: assignedZone, count: 0, color: colors[colorIdx] }
            }
            zoneDensityMap[assignedZone].count += 1
          })

          const activeZones = Object.values(zoneDensityMap).sort((a, b) => b.count - a.count)

          // Aggregate historical telemetry logs into hourly buckets
          if (venueTelemetry?.recentLogs && Array.isArray(venueTelemetry.recentLogs)) {
            venueTelemetry.recentLogs.forEach((log: any) => {
              const count = Math.max(log.agentCount || 0, log.visitorCount || 0, Array.isArray(log.visitorList) ? log.visitorList.length : 0)
              if (log.timestamp && count > 0) {
                const d = new Date(log.timestamp)
                if (!isNaN(d.getTime())) {
                  const hr = d.getHours()
                  hourlyCounts[hr] = Math.max(hourlyCounts[hr], count)
                }
              }
            })
          }

          const maxHourlyCount = Math.max(...hourlyCounts, 1)
          const peakHourIndex = hourlyCounts.indexOf(Math.max(...hourlyCounts))
          const peakHourLabel = `${peakHourIndex === 0 ? 12 : peakHourIndex > 12 ? peakHourIndex - 12 : peakHourIndex}:00 ${peakHourIndex >= 12 ? 'PM' : 'AM'} SLT`
          const retentionRate = totalUniqueAvatars > 0 ? Math.round((returningRegulars / totalUniqueAvatars) * 100) : 0

          const handleExportCsv = () => {
            const headers = ['Avatar Name', 'SL UUID', 'Status', 'Online Since', 'Last Seen', 'Dwell (Mins)', 'Render Weight (ARC)', 'Position']
            const rows = filteredByTime.map(v => [
              `"${v.name || ''}"`,
              `"${v.slKey || ''}"`,
              `"${v.status || 'OFFLINE'}"`,
              `"${v.onlineSince || ''}"`,
              `"${v.offlineAt || v.lastSeen || v.onlineSince || ''}"`,
              v.dwellMinutes || 0,
              v.arc || 0,
              `"(${v.posX || 128}, ${v.posY || 128}, ${v.posZ || 25})"`
            ])
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
            const encodedUri = encodeURI(csvContent)
            const link = document.createElement('a')
            link.setAttribute('href', encodedUri)
            link.setAttribute('download', `${slug}_avatar_telemetry_${analyticsTimeFilter}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            showToast({
              title: '📥 Telemetry CSV Exported',
              message: `Downloaded ${filteredByTime.length} avatar records for range '${analyticsTimeFilter.toUpperCase()}'.`
            })
          }

          return (
            <div className="space-y-6">
              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[#1c1c1e] flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-[#ff3b30]" /> Sim Traffic Analytics & Resident Intelligence HQ
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Filter historical visit duration, monitor live avatars, analyze peak concurrent traffic, and inspect sim performance metrics for <span className="font-bold text-[#1c1c1e]">{venueTitle}</span>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleExportCsv}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV Data
                    </button>
                    <span className="px-3 py-2 bg-emerald-500/10 text-emerald-700 font-mono text-xs font-bold uppercase rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Feed Online
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                    <span className="text-xs font-black uppercase text-[#1c1c1e] tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#ff3b30]" /> Select Time Range Filter:
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 font-bold">
                      Showing {filteredByTime.length} Avatars ({totalDwellHours} Visitor Hours)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setAnalyticsTimeFilter('all')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        analyticsTimeFilter === 'all'
                          ? 'bg-neutral-900 text-white shadow-lg scale-[1.02]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 font-bold'
                      }`}
                    >
                      ⏳ All Time
                    </button>

                    <button
                      onClick={() => setAnalyticsTimeFilter('online')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        analyticsTimeFilter === 'online'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 font-bold'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online Now ({onlineCount})
                    </button>

                    <button
                      onClick={() => setAnalyticsTimeFilter('24h')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        analyticsTimeFilter === '24h'
                          ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 font-bold'
                      }`}
                    >
                      ⚡ Last 24 Hours (Today)
                    </button>

                    <button
                      onClick={() => setAnalyticsTimeFilter('yesterday')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        analyticsTimeFilter === 'yesterday'
                          ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 font-bold'
                      }`}
                    >
                      📅 Yesterday
                    </button>

                    <button
                      onClick={() => setAnalyticsTimeFilter('week')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        analyticsTimeFilter === 'week'
                          ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 font-bold'
                      }`}
                    >
                      🗓️ This Week (7 Days)
                    </button>

                    <button
                      onClick={() => setAnalyticsTimeFilter('last_week')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        analyticsTimeFilter === 'last_week'
                          ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/30 scale-[1.02]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 font-bold'
                      }`}
                    >
                      📊 Last Week (14 Days)
                    </button>

                    <button
                      onClick={() => setAnalyticsTimeFilter('custom')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        analyticsTimeFilter === 'custom'
                          ? 'bg-purple-700 text-white shadow-lg shadow-purple-700/30 scale-[1.02]'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 font-bold'
                      }`}
                    >
                      🎛️ Custom Range
                    </button>
                  </div>

                  {analyticsTimeFilter === 'custom' && (
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-purple-900">Start Date:</span>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-white border border-purple-300 rounded-lg font-mono font-bold text-neutral-800 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-purple-900">End Date:</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="px-2.5 py-1 text-xs bg-white border border-purple-300 rounded-lg font-mono font-bold text-neutral-800 focus:outline-none"
                        />
                      </div>
                      <span className="text-[10px] text-purple-700 font-medium">
                        Showing telemetry records from <span className="font-bold">{customStartDate}</span> to <span className="font-bold">{customEndDate}</span>.
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Unique Avatars</span>
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-black text-[#1c1c1e] font-mono">
                      {totalUniqueAvatars}
                    </div>
                    <span className="text-[9px] text-neutral-500 font-mono">Filter: {analyticsTimeFilter.toUpperCase()}</span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Resident Loyalty</span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-amber-600 font-mono">
                      {retentionRate}% <span className="text-xs text-neutral-500 font-sans font-bold">Regulars</span>
                    </div>
                    <span className="text-[9px] text-neutral-500 font-mono">{returningRegulars} Regulars / {firstTimeVisitors} First-Timers</span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Total Time Spent in Sim</span>
                      <Clock className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-black text-purple-700 font-mono">
                      {totalDwellHours}h
                    </div>
                    <span className="text-[9px] text-neutral-500 font-mono">({avgDwellMins}m Avg Visit / Avatar)</span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Peak Traffic Hour</span>
                      <Flame className="w-4 h-4 text-[#ff3b30]" />
                    </div>
                    <div className="text-lg font-black text-[#ff3b30] font-mono truncate">
                      {peakHourLabel}
                    </div>
                    <span className="text-[9px] text-neutral-500 font-mono">Peak Crowd Density</span>
                  </div>
                </div>

                {/* 3. Hourly Traffic Density & Spatial Zone Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Chart A: 24-Hour Peak Traffic Density Bar Chart */}
                  <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#1c1c1e] flex items-center gap-1.5">
                          <BarChart2 className="w-4 h-4 text-[#ff3b30]" /> Hourly Avatar Density Chart (24-Hour SLT Distribution)
                        </h4>
                        <span className="text-[10px] text-neutral-500 font-medium">
                          Displays crowd volume logged during each hour of the day. Highest density at <span className="font-bold text-[#ff3b30]">{peakHourLabel}</span>.
                        </span>
                      </div>
                    </div>

                    {/* SVG/HTML Bar Chart Visualization */}
                    <div className="h-48 pt-6 flex items-end justify-between gap-1 border-b border-neutral-200 pb-2 px-1 relative bg-neutral-50/60 rounded-xl p-2.5">
                      {hourlyCounts.map((count, hr) => {
                        const heightPct = maxHourlyCount > 0 ? Math.max((count / maxHourlyCount) * 100, count > 0 ? 14 : 4) : 4
                        const hrDisplay = hr === 0 ? '12a' : hr === 12 ? '12p' : hr > 12 ? `${hr - 12}p` : `${hr}a`
                        const isPeak = hr === peakHourIndex && count > 0

                        return (
                          <div key={hr} className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative">
                            {count > 0 && (
                              <span className={`text-[9px] font-mono font-black ${isPeak ? 'text-[#ff3b30]' : 'text-neutral-700'}`}>
                                {count}
                              </span>
                            )}

                            <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-all pointer-events-none bg-neutral-900 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20">
                              {hrDisplay.toUpperCase()}: {count} avatars
                            </div>

                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-md transition-all ${
                                isPeak
                                  ? 'bg-[#ff3b30] shadow-md shadow-[#ff3b30]/40 border-t-2 border-red-300'
                                  : count > 0
                                  ? 'bg-neutral-800 group-hover:bg-[#ff3b30]'
                                  : 'bg-neutral-200/80 border-t border-neutral-300'
                              }`}
                            />
                            <span className="text-[8px] font-mono text-neutral-500 scale-90">{hrDisplay}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Chart B: Spatial Sim Zones & High ARC Lag Warning */}
                  <div className="space-y-4">
                    <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#1c1c1e] flex items-center gap-1.5">
                          📍 Prim & Parcel Spatial Zones
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-400 font-bold">
                          {registeredPrims.length} Prim Beacons
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        {activeZones.length === 0 ? (
                          <p className="text-neutral-400 text-xs italic">Awaiting avatar spatial telemetry...</p>
                        ) : (
                          activeZones.map((zone, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-neutral-700 font-bold truncate max-w-[180px]">📍 {zone.name}</span>
                                <span className="font-mono font-bold text-[#1c1c1e]">{zone.count} Avatars</span>
                              </div>
                              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`${zone.color} h-full transition-all`}
                                  style={{ width: `${totalUniqueAvatars > 0 ? (zone.count / totalUniqueAvatars) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {highArcAvatars.length > 0 && (
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs">
                        <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5 mb-1">
                          ⚠️ Heavy Render Weight Alert ({highArcAvatars.length})
                        </span>
                        <p className="text-[11px] text-purple-800">
                          {highArcAvatars.length} avatar(s) detected wearing &gt;100k ARC (high render weight).
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3.5 Top Resident Time Leaderboard */}
                  <div className="lg:col-span-3 p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-500/30 shadow-md space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-[#1c1c1e] flex items-center gap-2">
                          🏆 Top Resident Visitors & Sim Time Leaderboard
                        </h4>
                        <p className="text-xs text-neutral-600">
                          Recognizing resident VIPs and visitors with the highest accumulated time spent in <span className="font-bold text-[#1c1c1e]">{venueTitle}</span>.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-amber-500/20 p-1 rounded-xl border border-amber-500/30 font-mono text-[10px] shrink-0">
                        <button
                          onClick={() => setLeaderboardMetricMode('total_alltime')}
                          className={`px-3 py-1 rounded-lg font-black uppercase transition-all ${
                            leaderboardMetricMode === 'total_alltime' ? 'bg-amber-500 text-black shadow' : 'text-amber-900 hover:text-black'
                          }`}
                        >
                          🏆 All-Time Total Hours
                        </button>
                        <button
                          onClick={() => setLeaderboardMetricMode('longest_single')}
                          className={`px-3 py-1 rounded-lg font-black uppercase transition-all ${
                            leaderboardMetricMode === 'longest_single' ? 'bg-amber-500 text-black shadow' : 'text-amber-900 hover:text-black'
                          }`}
                        >
                          ⏱️ Longest Single Session
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      {(() => {
                        const topLeaderboard = [...filteredByTime]
                          .sort((a, b) => {
                            if (leaderboardMetricMode === 'longest_single') {
                              return (b.longestSessionMinutes || 0) - (a.longestSessionMinutes || 0)
                            }
                            return (b.totalLifetimeMinutes || b.dwellMinutes || 0) - (a.totalLifetimeMinutes || a.dwellMinutes || 0)
                          })
                          .slice(0, 5)

                        const formatDwellTime = (mins: number) => {
                          if (!mins || mins <= 0) return '0m'
                          const h = Math.floor(mins / 60)
                          const m = mins % 60
                          if (h > 0 && m > 0) return `${h}h ${m}m`
                          if (h > 0) return `${h}h`
                          return `${m}m`
                        }

                        const rankBadges = [
                          { badge: '🥇 1st Place', border: 'border-amber-400 bg-amber-50/80 text-amber-900', rankBg: 'bg-amber-400 text-black' },
                          { badge: '🥈 2nd Place', border: 'border-slate-300 bg-slate-50/80 text-slate-900', rankBg: 'bg-slate-300 text-black' },
                          { badge: '🥉 3rd Place', border: 'border-amber-700/30 bg-amber-900/10 text-amber-950', rankBg: 'bg-amber-700/20 text-amber-900' },
                          { badge: '⭐ 4th Place', border: 'border-neutral-200 bg-white text-neutral-800', rankBg: 'bg-neutral-200 text-neutral-700' },
                          { badge: '⭐ 5th Place', border: 'border-neutral-200 bg-white text-neutral-800', rankBg: 'bg-neutral-200 text-neutral-700' },
                        ]

                        return topLeaderboard.map((v, idx) => {
                          const style = rankBadges[idx] || rankBadges[3]
                          const displayMins = leaderboardMetricMode === 'longest_single' 
                            ? (v.longestSessionMinutes || 0) 
                            : (v.totalLifetimeMinutes || v.dwellMinutes || 0)

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedAvatarDetail(v)}
                              className={`p-3.5 rounded-xl border ${style.border} shadow-sm hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${style.rankBg}`}>
                                  {style.badge}
                                </span>
                                <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                                  v.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-700 font-mono' : 'text-neutral-400'
                                }`}>
                                  {v.status === 'ONLINE' ? '🟢 ONLINE' : '⚪ OFFLINE'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <img
                                  src={v.avatarImageUrl}
                                  alt={v.name}
                                  className="w-9 h-9 rounded-lg bg-neutral-200 border border-neutral-300 object-cover shrink-0"
                                />
                                <div className="truncate">
                                  <span className="font-black text-xs text-[#1c1c1e] block truncate">{v.name}</span>
                                  <span className="text-[10px] text-neutral-500 font-mono block truncate">UUID: {v.slKey ? v.slKey.substring(0, 8) + '...' : 'Guest'}</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-black/5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-neutral-500">
                                  {leaderboardMetricMode === 'longest_single' ? 'Single Visit:' : 'Total Time:'}
                                </span>
                                <span className="text-xs font-black font-mono text-[#ff3b30] bg-[#ff3b30]/10 px-2 py-0.5 rounded border border-[#ff3b30]/20">
                                  ⏱️ {formatDwellTime(displayMins)}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>

                {/* 4. SubTab Directory Selector & Search Toolbar */}
                <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 mb-6">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setAnalyticsSubTab('all_visitors')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        analyticsSubTab === 'all_visitors'
                          ? 'bg-[#1c1c1e] text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      All Avatars ({displayList.length})
                    </button>
                    <button
                      onClick={() => {
                        setAnalyticsSubTab('online_now');
                        setAnalyticsSortOrder('online_recent');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        analyticsSubTab === 'online_now'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      🟢 Online Now ({onlineCount})
                    </button>
                    <button
                      onClick={() => {
                        setAnalyticsSubTab('top_total_time');
                        setAnalyticsSortOrder('total_time');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        analyticsSubTab === 'top_total_time'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      🏆 All-Time Total Sim Time
                    </button>
                    <button
                      onClick={() => {
                        setAnalyticsSubTab('longest_single_session');
                        setAnalyticsSortOrder('single_session');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        analyticsSubTab === 'longest_single_session'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      ⏱️ Longest Single Session
                    </button>
                    <button
                      onClick={() => {
                        setAnalyticsSubTab('high_arc');
                        setAnalyticsSortOrder('arc');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        analyticsSubTab === 'high_arc'
                          ? 'bg-purple-700 text-white shadow-md'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 font-bold'
                      }`}
                    >
                      ⚖️ High Render Weight (ARC)
                    </button>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 shrink-0">
                      <span className="text-[10px] font-black uppercase text-neutral-400 font-mono shrink-0">SORT:</span>
                      <select
                        value={analyticsSortOrder}
                        onChange={(e) => setAnalyticsSortOrder(e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-[#1c1c1e] focus:outline-none cursor-pointer"
                      >
                        <option value="online_recent">⚡ Online First & Most Recent</option>
                        <option value="total_time">🏆 All-Time Total Sim Time</option>
                        <option value="single_session">⏱️ Longest Single Session</option>
                        <option value="arc">⚖️ Render Weight (ARC)</option>
                        <option value="newest">📅 First Seen (Newest)</option>
                        <option value="name">🔤 Alphabetical (A - Z)</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Search avatar name / UUID..."
                      value={analyticsSearch}
                      onChange={(e) => setAnalyticsSearch(e.target.value)}
                      className="px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl font-medium text-[#1c1c1e] focus:outline-none focus:border-[#ff3b30] w-full sm:w-56"
                    />
                  </div>
                </div>

                {displayList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200">
                    <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm font-black uppercase text-neutral-700">No Avatars Found</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      No visitor telemetry records match the selected time filter '{analyticsTimeFilter.toUpperCase()}'.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayList.map((visitor: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedAvatarDetail(visitor)}
                        className="p-3.5 bg-white hover:bg-neutral-100/80 rounded-2xl border border-neutral-200 hover:border-[#ff3b30] transition-all cursor-pointer shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={visitor.avatarImageUrl}
                            alt={visitor.name}
                            className="w-10 h-10 rounded-xl bg-neutral-200 border border-neutral-300 object-cover shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-black text-sm text-[#1c1c1e] truncate">{visitor.name}</span>
                              {visitor.isRegistered ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[8px] font-black uppercase tracking-wider shrink-0">
                                  🟢 Member
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-600 text-[8px] font-bold uppercase tracking-wider shrink-0">
                                  ⚪ Guest
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500 block truncate">
                              {visitor.slKey ? `UUID: ${visitor.slKey.substring(0, 8)}...` : 'Resident Avatar'} • First Seen {new Date(visitor.onlineSince).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0 ml-auto md:ml-0 font-mono text-xs">
                          {visitor.arc !== undefined && visitor.arc > 0 && (
                            <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-[11px]">
                              ⚖️ {visitor.arc.toLocaleString()} ARC
                            </span>
                          )}

                          {visitor.posX !== undefined && (
                            <span className="font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 text-[11px]">
                              📍 ({visitor.posX}, {visitor.posY}, {visitor.posZ})
                            </span>
                          )}

                          <span className="font-bold text-[#1c1c1e] bg-amber-500/10 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-500/20 text-[11px]">
                            ⏱️ {visitor.dwellMinutes && visitor.dwellMinutes >= 60 ? `${Math.floor(visitor.dwellMinutes / 60)}h ${visitor.dwellMinutes % 60}m` : `${visitor.dwellMinutes || 0}m`} Time in Sim
                          </span>

                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            visitor.status === 'ONLINE'
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                              : 'bg-neutral-200 text-neutral-600 border border-neutral-300'
                          }`}>
                            {visitor.status === 'ONLINE' ? '🟢 ONLINE' : `⚪ OFFLINE • ${formatRelativeTime(visitor.offlineAt || visitor.lastSeen || visitor.onlineSince)}`}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAvatarDetail(visitor)
                            }}
                            className="px-3 py-1.5 bg-[#1c1c1e] hover:bg-black text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Tab Content: Sim Rules & Resident Compliance HQ */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-[#1c1c1e] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#ff3b30]" /> Sim Rules Governance & Resident Compliance HQ
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Manage sim guidelines, publish rule updates, and track resident Notecard delivery timestamps for <span className="font-bold text-[#1c1c1e]">{venueTitle}</span>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 font-mono text-xs font-bold uppercase rounded-lg border border-emerald-500/20">
                    Active Version: v{venueTelemetry?.rulesVersion || 1}.0
                  </span>
                </div>
              </div>

              {/* 1. Active Sim Guidelines Editor & Publisher */}
              <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#1c1c1e] tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#ff3b30]" /> Active Guidelines (Version {venueTelemetry?.rulesVersion || 1}.0)
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      Changes published here are automatically synced to the in-world Notecard and web portal modal.
                    </span>
                  </div>

                  {isStaff && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const rules = venueTelemetry?.simGuidelines || [
                            'Respect all residents, staff, DJs, and venue dress & conduct guidelines.',
                            'No griefing, spamming, or unauthorized avatar script overload in public areas.',
                            'Keep gestures and audio streams to designated dance floors.',
                            'Touch the in-world Gridpass prim anytime to log dwell rewards and open passport.'
                          ]
                          const version = venueTelemetry?.rulesVersion || 1
                          const formattedText = `==================================================\n📜 ${venueTitle.toUpperCase()} OFFICIAL SIM RULES (v${version}.0)\n==================================================\n\n` +
                            rules.map((r, i) => `${i + 1}. ${r}`).join('\n\n') +
                            `\n\n--------------------------------------------------\n🌐 Open Live Portal & Resident Passport:\nhttps://gridpass.app/secondlife/${slug}\n==================================================`
                          
                          navigator.clipboard.writeText(formattedText)
                          showToast({
                            title: '📋 Notecard Text Copied!',
                            message: 'Paste this formatted text into your Prim Notecard in Second Life.',
                          })
                        }}
                        className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase text-xs rounded-xl border border-neutral-700 transition-all flex items-center gap-1.5 shrink-0"
                      >
                        📋 Copy In-World Notecard Text
                      </button>

                      <button
                        onClick={handlePublishNewRulesVersion}
                        className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
                      >
                        🚀 Publish Version {(venueTelemetry?.rulesVersion || 1) + 1}.0 & Notify Residents
                      </button>
                    </div>
                  )}
                </div>

                {/* Guidelines List */}
                <div className="space-y-2">
                  {((venueTelemetry?.simGuidelines && venueTelemetry.simGuidelines.length > 0) ? venueTelemetry.simGuidelines : [
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
                  ]).map((rule, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#ff3b30] text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-[#1c1c1e] pt-0.5 leading-relaxed">{rule}</span>
                      </div>

                      {isStaff && (
                        <button
                          onClick={() => handleDeleteRule(idx)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase rounded-lg transition-all shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Rule Input */}
                {isStaff && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={newRuleInput}
                      onChange={(e) => setNewRuleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddRule(newRuleInput)
                      }}
                      placeholder="Add a new sim guideline or rule..."
                      className="flex-1 px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-[#1c1c1e] focus:outline-none focus:border-[#ff3b30]"
                    />
                    <button
                      onClick={() => handleAddRule(newRuleInput)}
                      className="px-4 py-2.5 bg-[#1c1c1e] hover:bg-black text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shrink-0"
                    >
                      + Add Rule
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Resident Compliance & Notecard Delivery Roster */}
              <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-4 mb-6">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#1c1c1e] tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#ff3b30]" /> Resident Notecard Receipt & Compliance Roster
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      Tracks which version of the Notecard each Second Life resident has received.
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-500">
                    Active Rules Version: v{venueTelemetry?.rulesVersion || 1}.0
                  </span>
                </div>

                <div className="space-y-2">
                  {resolvedVisitors.map((visitor, idx) => {
                    const activeVersion = venueTelemetry?.rulesVersion || 1
                    const delivery = venueTelemetry?.notecardDeliveries?.[visitor.slKey] || venueTelemetry?.notecardDeliveries?.[visitor.name]
                    const receivedVersion = delivery?.receivedVersion || 0
                    const isCompliant = receivedVersion >= activeVersion

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={visitor.avatarImageUrl}
                            alt={visitor.name}
                            className="w-9 h-9 rounded-xl bg-neutral-200 border border-neutral-300 object-cover shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#1c1c1e]">{visitor.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                isCompliant ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                                receivedVersion > 0 ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
                                'bg-neutral-200 text-neutral-600'
                              }`}>
                                {isCompliant ? `🟢 Compliant (v${receivedVersion}.0)` :
                                 receivedVersion > 0 ? `🟡 Outdated (v${receivedVersion}.0)` :
                                 '⚪ Pending Delivery'}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500 block">
                              {visitor.slKey ? `UUID: ${visitor.slKey.substring(0, 8)}...` : 'Resident Avatar'} • Last visit: {new Date(visitor.onlineSince).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-neutral-400 block">Notecard Version</span>
                            <span className="font-bold text-[#1c1c1e]">
                              {receivedVersion > 0 ? `v${receivedVersion}.0 Delivered` : 'Not Received'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-neutral-400 block">Delivery Date</span>
                            <span className="font-bold text-neutral-700">
                              {delivery?.timestamp ? new Date(delivery.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On Next Touch'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 3. Rule Version Release Audit History */}
              <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h4 className="text-xs font-black uppercase text-[#1c1c1e] tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#ff3b30]" /> Rule Version Audit History
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-500">Historical version releases</span>
                </div>

                <div className="space-y-2 text-xs">
                  {((venueTelemetry?.ruleVersionHistory && venueTelemetry.ruleVersionHistory.length > 0) ? venueTelemetry.ruleVersionHistory : [
                    {
                      version: venueTelemetry?.rulesVersion || 1,
                      publishedAt: new Date().toISOString(),
                      publishedBy: 'Sim Owner / Superadmin',
                      guidelines: venueTelemetry?.simGuidelines || []
                    }
                  ]).map((hist, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#ff3b30] text-white text-[10px] font-black rounded uppercase">
                            Version {hist.version}.0
                          </span>
                          <span className="font-bold text-[#1c1c1e]">Published by {hist.publishedBy}</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Released: {new Date(hist.publishedAt).toLocaleString()}
                        </span>
                      </div>

                      <span className="px-3 py-1 bg-white text-neutral-700 rounded-lg border border-neutral-300 font-mono text-[10px] font-bold">
                        {hist.guidelines?.length || 4} Sim Rules Contained
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Admin, Staff, DJ Roster & User Management HQ */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* 🧪 Master Test Mode Safety Guard Banner */}
            {isStaff && (
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-sm ${
                venueTelemetry?.isTestMode !== false
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow ${
                    venueTelemetry?.isTestMode !== false ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {venueTelemetry?.isTestMode !== false ? '🧪' : '🚀'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm uppercase tracking-tight">
                        {venueTelemetry?.isTestMode !== false
                          ? '🧪 Master Test Mode ACTIVE (PJ Losey Only Safety Shield)'
                          : '🚀 Live Production Mode (Authorized Staff Active)'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        venueTelemetry?.isTestMode !== false ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {venueTelemetry?.isTestMode !== false ? 'SAFE TEST MODE' : 'LIVE PRODUCTION'}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-600 block leading-relaxed">
                      {venueTelemetry?.isTestMode !== false
                        ? 'All in-world IMs and Notecards are redirected strictly to PJ Losey (549d8555-43c5-46ed-8c65-33489c7ea2f0). 0 messages sent to any other avatars.'
                        : 'In-world rules IM notifications are live for authorized venue staff and administrators.'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleTestMode(venueTelemetry?.isTestMode !== false)}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow shrink-0 ${
                    venueTelemetry?.isTestMode !== false
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  }`}
                >
                  {venueTelemetry?.isTestMode !== false ? 'Switch to LIVE Production' : 'Switch to TEST Mode (PJ Losey Only)'}
                </button>
              </div>
            )}

            {/* Excluded Group UUID Management Card */}
            {isStaff && (
              <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#1c1c1e] tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#ff3b30]" /> Excluded Staff / VIP Group UUID Shield
                    </h4>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      Paste your Second Life Staff or Employee Group UUID below. Avatars wearing this active group tag will be automatically excluded from rules IM notices.
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full relative">
                    <input
                      type="text"
                      value={editExcludedGroupUuid}
                      onChange={(e) => setEditExcludedGroupUuid(e.target.value)}
                      placeholder="e.g. 77be7a67-1b4d-14b6-8cd3-baa441886f41"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold text-[#1c1c1e] focus:outline-none focus:border-[#ff3b30]"
                    />
                  </div>
                  <button
                    onClick={handleSaveExcludedGroupUuid}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition-all shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Save Excluded Group
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-[#1c1c1e] flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#ff3b30]" /> Venue Staff & Avatar Role Manager
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Manage resident DJs, Event Hosts, Managers, and Superadmin access control for <span className="font-bold text-[#1c1c1e]">{session?.displayName || 'Skinny Dip Inn'}</span>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-600 font-mono text-xs font-bold uppercase rounded-lg border border-amber-500/20">
                    👑 Admin Control Active
                  </span>
                </div>
              </div>

              {/* Staff Timeclock & Shift Manager */}
              <div className="p-5 bg-white rounded-xl border border-neutral-200 text-xs mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#1c1c1e] flex items-center gap-1.5 mb-1">
                      <Clock className="w-4 h-4 text-[#ff3b30]" /> Staff Shift Timeclock
                    </h4>
                    <p className="text-[10px] text-neutral-500">
                      Clock in/out for your DJ, Host, or Manager shifts to log shift hours at <span className="font-bold text-[#1c1c1e]">{session?.displayName || 'Skinny Dip Inn'}</span>.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {isClockedIn ? (
                      <button
                        onClick={() => {
                          const nowStr = new Date().toLocaleTimeString()
                          setIsClockedIn(false)
                          setTimeclockLogs([
                            {
                              id: `tc_${Date.now()}`,
                              name: session?.displayName || 'PJ Losey',
                              role: session?.role === 'superadmin' ? '👑 Superadmin' : '🎧 DJ / Host',
                              clockIn: clockInTime || nowStr,
                              clockOut: nowStr,
                              durationMinutes: 60
                            },
                            ...timeclockLogs
                          ])
                          showToast({
                            title: '🔴 Clocked Out!',
                            message: `Shift ended at ${nowStr}. Duration logged!`,
                          })
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider rounded-lg transition-all shadow"
                      >
                        🔴 Clock Out Shift
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const nowStr = new Date().toLocaleTimeString()
                          setIsClockedIn(true)
                          setClockInTime(nowStr)
                          showToast({
                            title: '⏰ Clocked In!',
                            message: `Shift started at ${nowStr}! Active timer online.`,
                          })
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs tracking-wider rounded-lg transition-all shadow"
                      >
                        ⏰ Clock In for Shift
                      </button>
                    )}
                  </div>
                </div>

                {isClockedIn && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between font-mono text-xs text-emerald-800">
                    <span className="font-bold">🟢 Active Shift Online</span>
                    <span>Clocked In: {clockInTime}</span>
                  </div>
                )}

                {/* Shift History & Time Log Table */}
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
                    Recent Staff Shifts & Logged Hours ({timeclockLogs.length})
                  </span>

                  {timeclockLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#1c1c1e]">{log.name}</span>
                        <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 font-bold text-[9px] uppercase">
                          {log.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500">
                        <span>In: {log.clockIn}</span>
                        {log.clockOut && <span>Out: {log.clockOut}</span>}
                        {log.durationMinutes && (
                          <span className="font-bold text-[#1c1c1e] bg-white px-2 py-0.5 rounded border border-neutral-200">
                            ⏱️ {log.durationMinutes} min shift
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registered Prim Beacons & Landmark Station Manager */}
              <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#ff3b30]" /> Registered Prim Beacons & Landmark Stations ({Object.keys(venueTelemetry?.beaconPrims || {}).length})
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">📡 LSL v3.3 Multi-Beacon Sync Active</span>
                </div>

                {(() => {
                  const allBeacons = venueTelemetry?.beaconPrims ? Object.values(venueTelemetry.beaconPrims) : []
                  const nowMs = Date.now()
                  const activeBeacons = allBeacons.filter((b: any) => {
                    if (!b.lastSeen) return true
                    const ageHours = (nowMs - new Date(b.lastSeen).getTime()) / (1000 * 60 * 60)
                    return ageHours <= 24
                  })
                  const inactiveBeacons = allBeacons.filter((b: any) => {
                    if (!b.lastSeen) return false
                    const ageHours = (nowMs - new Date(b.lastSeen).getTime()) / (1000 * 60 * 60)
                    return ageHours > 24
                  })

                  return (
                    <div className="space-y-5">
                      {/* 1. Active Beacons Section */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block font-mono">
                          🟢 Active Prim Beacons ({activeBeacons.length})
                        </span>

                        {activeBeacons.length === 0 ? (
                          <p className="text-neutral-400 text-xs italic p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                            No active prim beacons pinged in the last 24 hours.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeBeacons.map((beacon: any, idx: number) => (
                              <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-[#1c1c1e] flex items-center gap-1.5">
                                    📍 {formatCleanPrimTitle(beacon.customTitle || beacon.inGameName)}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-mono text-[9px] font-bold">
                                      🟢 ONLINE • {beacon.totalTouches || 0} Touches
                                    </span>
                                    {isStaff && (
                                      <button
                                        onClick={() => handleDeleteBeacon(beacon.primKey || `prim_${idx}`)}
                                        title="Remove Prim"
                                        className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-all"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="text-[10px] font-mono text-neutral-500 space-y-1">
                                  <div>Live Prim Name: <span className="text-neutral-900 font-bold">{formatCleanPrimTitle(beacon.inGameName)}</span></div>
                                  <div>Coordinates: <span className="text-neutral-800 font-bold">({beacon.pos?.x}, {beacon.pos?.y}, {beacon.pos?.z})</span></div>
                                  <div>Parcel: <span className="text-neutral-700">{beacon.parcelName || 'Main Parcel'}</span></div>
                                </div>

                                {isStaff && (
                                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-200">
                                    <input
                                      type="text"
                                      defaultValue={beacon.customTitle || beacon.inGameName}
                                      placeholder="Custom landmark title..."
                                      id={`beacon_title_${beacon.primKey}`}
                                      className="w-full p-2 bg-white border border-neutral-300 rounded text-[11px] font-bold text-[#1c1c1e] focus:outline-none focus:border-[#ff3b30]"
                                    />
                                    <button
                                      onClick={() => {
                                        const inputEl = document.getElementById(`beacon_title_${beacon.primKey}`) as HTMLInputElement
                                        if (inputEl?.value) {
                                          handleUpdateBeaconTitle(beacon.primKey, inputEl.value)
                                        }
                                      }}
                                      className="px-3 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-black uppercase tracking-wider rounded shrink-0 shadow transition-all"
                                    >
                                      Save Title
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. Inactive / Offline Prim Beacons Section */}
                      {inactiveBeacons.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-neutral-200">
                          <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block font-mono">
                            🟡 Inactive / Disconnected Prims ({inactiveBeacons.length})
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {inactiveBeacons.map((beacon: any, idx: number) => (
                              <div key={idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                                    📍 {formatCleanPrimTitle(beacon.customTitle || beacon.inGameName)}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 font-mono text-[9px] font-bold">
                                    🟡 INACTIVE (Idle &gt; 24h)
                                  </span>
                                </div>

                                <div className="text-[10px] font-mono text-neutral-500 space-y-1">
                                  <div>Last Ping: <span className="text-amber-900 font-bold">{beacon.lastSeen ? formatRelativeTime(beacon.lastSeen) : 'Long ago'}</span></div>
                                  <div>Last Coordinates: <span className="text-neutral-800 font-bold">({beacon.pos?.x || 128}, {beacon.pos?.y || 128}, {beacon.pos?.z || 25})</span></div>
                                </div>

                                {isStaff && (
                                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                                    <span className="text-[9px] text-amber-800 italic">Prim removed or script reset?</span>
                                    <button
                                      onClick={() => handleDeleteBeacon(beacon.primKey || `prim_${idx}`)}
                                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider rounded shadow transition-all flex items-center gap-1"
                                    >
                                      🗑️ Remove Stale Prim
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Security & Public View Governance Control Card */}
              {isSuperAdmin && (
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#ff3b30]" /> Admin Security & Public View Governance
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">👑 Admin Access Control</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#1c1c1e] block">Public Region Visitors Directory</span>
                        <span className="text-[10px] text-neutral-500">Allow public visitors to view resident avatar roster</span>
                      </div>
                      <button
                        onClick={() => handleTogglePermission('publicVisitorsVisible', venuePermissions.publicVisitorsVisible)}
                        className={`px-3 py-1.5 rounded font-black text-[10px] uppercase transition-all shrink-0 ${
                          venuePermissions.publicVisitorsVisible ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                        }`}
                      >
                        {venuePermissions.publicVisitorsVisible ? 'VISIBLE' : 'HIDDEN'}
                      </button>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#1c1c1e] block">Public SLURL Teleport Stations</span>
                        <span className="text-[9px] text-neutral-500">Allow public to see in-world teleport landmark bar</span>
                      </div>
                      <button
                        onClick={() => handleTogglePermission('publicTeleportsVisible', venuePermissions.publicTeleportsVisible)}
                        className={`px-3 py-1.5 rounded font-black text-[10px] uppercase transition-all shrink-0 ${
                          venuePermissions.publicTeleportsVisible ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                        }`}
                      >
                        {venuePermissions.publicTeleportsVisible ? 'VISIBLE' : 'HIDDEN'}
                      </button>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#1c1c1e] block">Public Audio Stream Player</span>
                        <span className="text-[9px] text-neutral-500">Allow public to listen to resort stream player</span>
                      </div>
                      <button
                        onClick={() => handleTogglePermission('publicStreamVisible', venuePermissions.publicStreamVisible)}
                        className={`px-3 py-1.5 rounded font-black text-[10px] uppercase transition-all shrink-0 ${
                          venuePermissions.publicStreamVisible ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                        }`}
                      >
                        {venuePermissions.publicStreamVisible ? 'VISIBLE' : 'HIDDEN'}
                      </button>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#1c1c1e] block">Public Event Schedule Card</span>
                        <span className="text-[9px] text-neutral-500">Allow public to view resort party schedule</span>
                      </div>
                      <button
                        onClick={() => handleTogglePermission('publicScheduleVisible', venuePermissions.publicScheduleVisible)}
                        className={`px-3 py-1.5 rounded font-black text-[10px] uppercase transition-all shrink-0 ${
                          venuePermissions.publicScheduleVisible ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                        }`}
                      >
                        {venuePermissions.publicScheduleVisible ? 'VISIBLE' : 'HIDDEN'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Sim Aerial Map Graphic Configurator */}
              {isStaff && (
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#ff3b30]" /> Custom Sim Aerial Map Graphic
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">🗺️ Radar Overlay</span>
                  </div>

                  <p className="text-[11px] text-neutral-500">
                    Paste a custom high-resolution top-down aerial map image URL (e.g. Firestorm map screenshot or custom high-res sim render) to display directly beneath the radar pins!
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id="custom_map_input"
                      defaultValue={venueTelemetry?.customMapUrl || ''}
                      placeholder="https://i.imgur.com/your-sim-aerial-map.jpg..."
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:border-[#ff3b30]"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('custom_map_input') as HTMLInputElement
                        if (input) {
                          handleUpdateCustomMapUrl(input.value)
                        }
                      }}
                      className="px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black uppercase text-xs tracking-wider rounded-lg transition-all shadow shrink-0"
                    >
                      Save Map Image
                    </button>
                  </div>
                </div>
              )}

              {/* Resort Schedule & Guidelines Admin Editor Card */}
              {isStaff && (
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#ff3b30]" /> Resort Schedule & Sim Rules Editor
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">📜 Staff Custom Content</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Add Schedule Event */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <span className="font-bold text-[#1c1c1e] block">Add New Schedule Event / DJ Set</span>
                      <input
                        type="text"
                        id="new_event_title"
                        placeholder="Event Title (e.g. 🎧 DJ Merf Live Set)..."
                        className="w-full p-2 bg-white border border-neutral-300 rounded text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                      />
                      <input
                        type="text"
                        id="new_event_sub"
                        placeholder="Time/Subtitle (e.g. Fridays 8 PM SLT)..."
                        className="w-full p-2 bg-white border border-neutral-300 rounded text-xs focus:outline-none focus:border-[#ff3b30]"
                      />
                      <input
                        type="text"
                        id="new_event_badge"
                        placeholder="Badge Tag (e.g. Live DJ)..."
                        className="w-full p-2 bg-white border border-neutral-300 rounded text-xs focus:outline-none focus:border-[#ff3b30]"
                      />
                      <button
                        onClick={() => {
                          const t = (document.getElementById('new_event_title') as HTMLInputElement)?.value
                          const s = (document.getElementById('new_event_sub') as HTMLInputElement)?.value
                          const b = (document.getElementById('new_event_badge') as HTMLInputElement)?.value
                          if (t && s) {
                            handleAddScheduleEvent(t, s, b || 'Event')
                          }
                        }}
                        className="w-full py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black uppercase text-[10px] tracking-wider rounded transition-all"
                      >
                        + Add Event To Schedule
                      </button>
                    </div>

                    {/* Add Sim Guideline / Rule */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                      <span className="font-bold text-[#1c1c1e] block">Add New Sim Rule / Guideline</span>
                      <textarea
                        id="new_rule_text"
                        placeholder="Guideline text (e.g. Please lower script count under 100k ARC before entering party)..."
                        className="w-full p-2 bg-white border border-neutral-300 rounded text-xs focus:outline-none focus:border-[#ff3b30] h-20"
                      />
                      <button
                        onClick={() => {
                          const r = (document.getElementById('new_rule_text') as HTMLTextAreaElement)?.value
                          if (r) {
                            handleAddGuideline(r)
                          }
                        }}
                        className="w-full py-2 bg-[#1c1c1e] hover:bg-black text-white font-black uppercase text-[10px] tracking-wider rounded transition-all"
                      >
                        + Add Sim Rule
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Staff Roster Grid */}
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs">
                  <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block mb-3">
                    Active Venue Staff & Authorized Administrators
                  </span>

                  <div className="space-y-3">
                    {(venueTelemetry?.staffMembers && venueTelemetry.staffMembers.length > 0 ? venueTelemetry.staffMembers : [
                      { name: 'PJ Losey', slKey: '549d8555-43c5-46ed-8c65-33489c7ea2f0', role: 'owner', legacyName: 'losey.resident' }
                    ]).map((staff: any, idx: number) => {
                      const isOwner = staff.name.toLowerCase().includes('losey')
                      return (
                        <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${staff.legacyName || staff.name}`}
                              alt={staff.name}
                              className="w-10 h-10 rounded-xl bg-neutral-200 border border-neutral-300 object-cover"
                            />
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-black text-sm text-[#1c1c1e]">{staff.name}</span>
                                <span className="px-2 py-0.5 rounded bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/20 text-[9px] font-black uppercase tracking-wider">
                                  👑 {staff.role ? staff.role.toUpperCase() : 'STAFF'}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-neutral-500 block">
                                {staff.legacyName ? `Legacy: ${staff.legacyName} • ` : ''}Key: {staff.slKey ? (staff.slKey.length > 12 ? staff.slKey.slice(0, 8) + '...' : staff.slKey) : 'Registered'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase rounded-full border border-emerald-500/20">
                              Active {isOwner ? 'Owner / Admin' : 'Staff Member'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* All Detected Sim Visitors & Promotion Controls */}
                {venueTelemetry?.visitorDetails && venueTelemetry.visitorDetails.length > 0 && (
                  <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block mb-3">
                      Detected Region Visitors — Click to Promote Role
                    </span>

                    <div className="space-y-2">
                      {venueTelemetry.visitorDetails.map((visitor, idx) => {
                        const isOwner = visitor.name.toLowerCase().includes('losey') || visitor.name.toLowerCase().includes('merf')

                        return (
                          <div 
                            key={idx} 
                            className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={visitor.avatarImageUrl}
                                alt={visitor.name}
                                className="w-9 h-9 rounded-lg bg-neutral-200 border border-neutral-300 object-cover"
                              />
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-black text-sm text-[#1c1c1e]">{visitor.name}</span>
                                  {isOwner ? (
                                    <span className="px-2 py-0.5 rounded bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/20 text-[9px] font-black uppercase tracking-wider">
                                      👑 Sim Owner / Admin
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black uppercase tracking-wider">
                                      👤 Visitor
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-neutral-500 block">
                                  Time in Sim: {visitor.dwellMinutes}m
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {isOwner ? (
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase rounded-full border border-emerald-500/20">
                                  Active Owner / Admin
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleGrantStaffRole(visitor.name, visitor.slKey, newStaffRole)}
                                  className="px-2.5 py-1 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-[10px] uppercase rounded transition-all shadow-sm"
                                >
                                  + Grant {newStaffRole.toUpperCase()} Role
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Add / Pre-Assign Staff Member Form */}
                <div className="p-5 bg-white rounded-xl border border-neutral-200 text-xs">
                  <h4 className="text-xs font-black uppercase text-[#1c1c1e] mb-3 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#ff3b30]" /> Pre-Assign Staff Rights to Any Avatar
                  </h4>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!newStaffName.trim()) return
                      handleGrantStaffRole(newStaffName.trim(), '', newStaffRole)
                      setNewStaffName('')
                    }}
                    className="flex flex-col sm:flex-row items-end gap-3"
                  >
                    <div className="flex-1 w-full">
                      <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">
                        Avatar Legacy Name or UUID Key
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. steve.resident or dd25fcaa-6081-4489-b589-31eebd6fbbbf"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full text-xs font-mono p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                      />
                    </div>

                    <div className="w-full sm:w-56">
                      <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">
                        Assign Staff Role
                      </label>
                      <select
                        value={newStaffRole}
                        onChange={(e: any) => setNewStaffRole(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                      >
                        <option value="owner">👑 Owner (Full Access)</option>
                        <option value="admin">🛡️ Administrator</option>
                        <option value="staff">💼 Staff Member</option>
                        <option value="dj">🎧 Resident DJ</option>
                        <option value="host">🎙️ Event / Party Host</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black uppercase text-xs tracking-wider rounded-lg transition-all shadow shrink-0 w-full sm:w-auto"
                    >
                      Grant Staff Rights
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: LSL Prim Setup Kit */}
        {activeTab === 'lsl' && (
          <div className="p-6 bg-neutral-900 text-white rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#ff3b30] flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Ready-to-Use LSL Prim Script (v2.0 Delta Engine)
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Configured with your venue slug: <code className="text-[#ff3b30] font-mono font-bold">{slug}</code>. Copy & paste directly into your Second Life prim!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const scriptText = `// Gridpass_SL_Sim_Bridge.lsl v2.0
// Universal Gridpass.app Second Life Sim & Club Management Bridge
// Delta Change Detection & Memory-Protected Telemetry Engine
// Requires MONO compilation in Firestorm / Second Life Viewer

string GRIDPASS_BASE_URL = "https://gridpass.app"; // Live Production Endpoint
string SLUG = "${slug}"; 
string SECRET_KEY = "gridpass_sl_bridge_secret";

float TELEMETRY_INTERVAL = 15.0;
integer HEARTBEAT_MAX_INTERVAL = 300;
string LAST_STATE_HASH = "";
integer LAST_SEND_TIME = 0;

buildAndSendTelemetry()
{
    string simName = llGetRegionName();
    float fps = llGetRegionFPS();
    float td = llGetRegionTimeDilation();
    
    list agents = llGetAgentList(4, []);
    integer agentCount = llGetListLength(agents);
    
    vector pos = llGetPos();
    list parcelDetails = llGetParcelDetails(pos, [0, 1, 2, 3, 4, 5]);
    string parcelName = llList2String(parcelDetails, 0);
    string musicUrl = llGetParcelMusicURL();
    
    list names = [];
    integer i;
    for (i = 0; i < agentCount; ++i)
    {
        key aid = llList2Key(agents, i);
        string name = llKey2Name(aid);
        if (name == "") name = (string)aid;
        names = names + [name];
    }
    string visitorList = llDumpList2String(names, ", ");

    string hash = (string)agentCount + ":" + visitorList + ":" + musicUrl;
    integer now = llGetUnixTime();

    if (hash == LAST_STATE_HASH && (now - LAST_SEND_TIME) < HEARTBEAT_MAX_INTERVAL)
    {
        return;
    }

    LAST_STATE_HASH = hash;
    LAST_SEND_TIME = now;

    llOwnerSay("⚡ Gridpass Telemetry Sync: " + (string)agentCount + " active avatars in " + simName + " (" + parcelName + ")");

    string body = llList2Json(JSON_OBJECT, [
        "slug", SLUG,
        "regionName", simName,
        "fps", (string)fps,
        "timeDilation", (string)td,
        "agentCount", (string)agentCount,
        "parcelName", parcelName,
        "musicUrl", musicUrl,
        "visitorList", visitorList,
        "secret", SECRET_KEY
    ]);

    llHTTPRequest(GRIDPASS_BASE_URL + "/api/secondlife/telemetry", [
        HTTP_METHOD, "POST",
        HTTP_MIMETYPE, "application/json"
    ], body);
}

default
{
    state_entry()
    {
        llOwnerSay("--------------------------------------------------");
        llOwnerSay("🏁 Gridpass SL Sim & Club Bridge v2.0 (Delta Engine) ONLINE");
        llOwnerSay("📍 Venue Slug: " + SLUG);
        llOwnerSay("🌐 Base Portal: " + GRIDPASS_BASE_URL + "/secondlife/" + SLUG);
        llOwnerSay("--------------------------------------------------");
        
        buildAndSendTelemetry();
        llSetTimerEvent(TELEMETRY_INTERVAL);
    }

    on_rez(integer start_param)
    {
        llResetScript();
    }

    timer()
    {
        buildAndSendTelemetry();
    }

    touch_start(integer total_number)
    {
        key tk = llDetectedKey(0);
        string ln = llDetectedName(0);
        string dn = llKey2Name(tk);
        if (dn == "") dn = ln;

        string rn = llGetRegionName();
        vector ap = llDetectedPos(0);
        list pd = llGetParcelDetails(ap, [0]);
        string pn = llList2String(pd, 0);

        string authUrl = GRIDPASS_BASE_URL + "/secondlife/" + SLUG + 
                         "?slKey=" + (string)tk + 
                         "&legacyName=" + llEscapeURL(ln) + 
                         "&displayName=" + llEscapeURL(dn) + 
                         "&region=" + llEscapeURL(rn) + 
                         "&parcel=" + llEscapeURL(pn) + 
                         "&v=" + (string)llGetUnixTime();

        llInstantMessage(tk, "🏁 Gridpass Passport Sync: Welcome " + dn + "! Click to open your venue portal: " + authUrl);
        llLoadURL(tk, "Open Gridpass Portal for " + dn, authUrl);
    }

    changed(integer change)
    {
        if (change & (CHANGED_REGION | CHANGED_REGION_START | CHANGED_TELEPORT))
        {
            llResetScript();
        }
    }
}`;
                    navigator.clipboard.writeText(scriptText);
                    showToast({
                      title: '✓ LSL Script Copied!',
                      message: `Pre-configured v2.0 script for ${slug} copied to clipboard!`,
                    });
                  }}
                  className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase rounded-lg transition-all flex items-center gap-2 shadow"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Script to Clipboard
                </button>

                <a
                  href="/sl_scripts/Gridpass_SL_Sim_Bridge.lsl"
                  download="Gridpass_SL_Sim_Bridge.lsl"
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-black uppercase rounded-lg transition-all border border-neutral-700 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download .lsl File
                </a>
              </div>
            </div>

            {/* Code Viewbox */}
            <div className="relative bg-neutral-950 rounded-xl p-4 border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-96 leading-relaxed">
              <pre className="text-emerald-400">
{`// Gridpass_SL_Sim_Bridge.lsl v2.0
// Universal Gridpass.app Second Life Sim & Club Management Bridge
// Delta Change Detection & Memory-Protected Telemetry Engine
// Requires MONO compilation in Firestorm / Second Life Viewer

string GRIDPASS_BASE_URL = "https://gridpass.app"; // Live Production Endpoint
string SLUG = "${slug}"; 
string SECRET_KEY = "gridpass_sl_bridge_secret";

float TELEMETRY_INTERVAL = 15.0;
integer HEARTBEAT_MAX_INTERVAL = 300;
string LAST_STATE_HASH = "";
integer LAST_SEND_TIME = 0;

buildAndSendTelemetry()
{
    string simName = llGetRegionName();
    float fps = llGetRegionFPS();
    float td = llGetRegionTimeDilation();
    
    list agents = llGetAgentList(4, []);
    integer agentCount = llGetListLength(agents);
    
    vector pos = llGetPos();
    list parcelDetails = llGetParcelDetails(pos, [0, 1, 2, 3, 4, 5]);
    string parcelName = llList2String(parcelDetails, 0);
    string musicUrl = llGetParcelMusicURL();
    
    list names = [];
    integer i;
    for (i = 0; i < agentCount; ++i)
    {
        key aid = llList2Key(agents, i);
        string name = llKey2Name(aid);
        if (name == "") name = (string)aid;
        names = names + [name];
    }
    string visitorList = llDumpList2String(names, ", ");

    string hash = (string)agentCount + ":" + visitorList + ":" + musicUrl;
    integer now = llGetUnixTime();

    if (hash == LAST_STATE_HASH && (now - LAST_SEND_TIME) < HEARTBEAT_MAX_INTERVAL)
    {
        return;
    }

    LAST_STATE_HASH = hash;
    LAST_SEND_TIME = now;

    llOwnerSay("⚡ Gridpass Telemetry Sync: " + (string)agentCount + " active avatars in " + simName + " (" + parcelName + ")");

    string body = llList2Json(JSON_OBJECT, [
        "slug", SLUG,
        "regionName", simName,
        "fps", (string)fps,
        "timeDilation", (string)td,
        "agentCount", (string)agentCount,
        "parcelName", parcelName,
        "musicUrl", musicUrl,
        "visitorList", visitorList,
        "secret", SECRET_KEY
    ]);

    llHTTPRequest(GRIDPASS_BASE_URL + "/api/secondlife/telemetry", [
        HTTP_METHOD, "POST",
        HTTP_MIMETYPE, "application/json"
    ], body);
}

default
{
    state_entry()
    {
        llOwnerSay("--------------------------------------------------");
        llOwnerSay("🏁 Gridpass SL Sim & Club Bridge v2.0 (Delta Engine) ONLINE");
        llOwnerSay("📍 Venue Slug: " + SLUG);
        llOwnerSay("🌐 Base Portal: " + GRIDPASS_BASE_URL + "/secondlife/" + SLUG);
        llOwnerSay("--------------------------------------------------");
        
        buildAndSendTelemetry();
        llSetTimerEvent(TELEMETRY_INTERVAL);
    }

    on_rez(integer start_param)
    {
        llResetScript();
    }

    timer()
    {
        buildAndSendTelemetry();
    }

    touch_start(integer total_number)
    {
        key tk = llDetectedKey(0);
        string ln = llDetectedName(0);
        string dn = llKey2Name(tk);
        if (dn == "") dn = ln;

        string rn = llGetRegionName();
        vector ap = llDetectedPos(0);
        list pd = llGetParcelDetails(ap, [0]);
        string pn = llList2String(pd, 0);

        string authUrl = GRIDPASS_BASE_URL + "/secondlife/" + SLUG + 
                         "?slKey=" + (string)tk + 
                         "&legacyName=" + llEscapeURL(ln) + 
                         "&displayName=" + llEscapeURL(dn) + 
                         "&region=" + llEscapeURL(rn) + 
                         "&parcel=" + llEscapeURL(pn) + 
                         "&v=" + (string)llGetUnixTime();

        llInstantMessage(tk, "🏁 Gridpass Passport Sync: Welcome " + dn + "! Click to open your venue portal: " + authUrl);
        llLoadURL(tk, "Open Gridpass Portal for " + dn, authUrl);
    }

    changed(integer change)
    {
        if (change & (CHANGED_REGION | CHANGED_REGION_START | CHANGED_TELEPORT))
        {
            llResetScript();
        }
    }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Modal: Avatar Detail Inspection Card */}
        {selectedAvatarDetail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#ff3b30]" /> Avatar Intelligence Inspection
                </span>
                <button
                  onClick={() => setSelectedAvatarDetail(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-sm transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                <img
                  src={selectedAvatarDetail.avatarImageUrl}
                  alt={selectedAvatarDetail.name}
                  className="w-16 h-16 rounded-2xl bg-neutral-200 border border-neutral-300 object-cover shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-black text-[#1c1c1e] mb-0.5">{selectedAvatarDetail.name}</h3>
                  {selectedAvatarDetail.isRegistered ? (
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                      🟢 Gridpass Registered
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded bg-neutral-200 text-neutral-600 text-[10px] font-bold uppercase tracking-wider">
                      ⚪ Guest Resident
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[9px] font-black uppercase text-neutral-400 block mb-0.5">Render Weight (ARC)</span>
                  <span className="font-mono font-bold text-sm text-purple-700 block">
                    ⚖️ {selectedAvatarDetail.arc !== undefined ? selectedAvatarDetail.arc.toLocaleString() : 'N/A'} ARC
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                    {selectedAvatarDetail.arc && selectedAvatarDetail.arc > 100000 ? '🔴 Heavy Lag Impact' : '🟢 Optimal Lag Rating'}
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[9px] font-black uppercase text-neutral-400 block mb-0.5">Sim Coordinates</span>
                  <span className="font-mono font-bold text-sm text-[#1c1c1e] block">
                    📍 {selectedAvatarDetail.posX !== undefined ? `(${selectedAvatarDetail.posX}, ${selectedAvatarDetail.posY}, ${selectedAvatarDetail.posZ || 25})` : 'Sim Main'}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-medium block mt-0.5">Region Grid Position</span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[9px] font-black uppercase text-neutral-400 block mb-0.5">Current Visit Dwell</span>
                  <span className="font-mono font-bold text-sm text-[#1c1c1e] block">
                    ⏱️ {selectedAvatarDetail.dwellMinutes || 0} min in sim
                  </span>
                  <span className="text-[9px] text-neutral-500 font-medium block mt-0.5">Current Active Session</span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-[9px] font-black uppercase text-neutral-400 block mb-0.5">Lifetime Visit History</span>
                  <span className="font-mono font-bold text-sm text-emerald-600 block uppercase">
                    📊 {selectedAvatarDetail.visitCount || 1} Visits
                  </span>
                  <span className="text-[9px] text-neutral-500 font-medium block mt-0.5">
                    Total: {((selectedAvatarDetail.dwellMinutes || 0) / 60).toFixed(1)} hrs logged
                  </span>
                </div>
              </div>

              {selectedAvatarDetail.slKey && (
                <div className="space-y-2">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase text-neutral-400 block">Avatar UUID Key</span>
                      <span className="font-mono text-xs text-neutral-700 block font-bold">{selectedAvatarDetail.slKey}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedAvatarDetail.slKey)
                        showToast({ title: '📋 Key Copied!', message: 'Avatar UUID copied to clipboard!' })
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-bold text-[10px] uppercase rounded transition-all shrink-0"
                    >
                      Copy Key
                    </button>
                  </div>

                  <a
                    href={`secondlife:///app/agent/${selectedAvatarDetail.slKey}/about`}
                    className="w-full p-3 bg-white border border-neutral-300 hover:border-[#ff3b30] rounded-xl flex items-center justify-between transition-all group block text-xs"
                  >
                    <span className="font-bold uppercase text-neutral-800 group-hover:text-[#ff3b30]">
                      Open In-Viewer SL Profile
                    </span>
                    <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-[#ff3b30] transition-colors" />
                  </a>
                </div>
              )}

              <button
                onClick={() => setSelectedAvatarDetail(null)}
                className="w-full py-3 bg-[#1c1c1e] hover:bg-black text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow"
              >
                Close Inspection
              </button>
            </div>
          </div>
        )}

        {/* First Visit Sim Rules Modal */}
        {showRulesModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-neutral-200 shadow-2xl space-y-6 text-[#1c1c1e] animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#ff3b30]/10 text-[#ff3b30] flex items-center justify-center border border-[#ff3b30]/20 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff3b30] block">First Visit Welcome</span>
                  <h3 className="text-xl font-black uppercase tracking-tight text-[#1c1c1e]">
                    {venueTitle} Sim Rules & Guidelines
                  </h3>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3 text-xs">
                <p className="text-neutral-600 font-medium">
                  Welcome <span className="font-bold text-[#1c1c1e]">{displayName || 'Resident'}</span>! Please review and accept our sim guidelines before entering:
                </p>

                <div className="space-y-2 text-[#1c1c1e] font-medium">
                  {(venueTelemetry?.simGuidelines && venueTelemetry.simGuidelines.length > 0) ? (
                    venueTelemetry.simGuidelines.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-neutral-200">
                        <span className="w-5 h-5 rounded-full bg-[#ff3b30] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{rule}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-neutral-200">
                        <span className="w-5 h-5 rounded-full bg-[#ff3b30] text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                        <span>Respect all residents, staff, DJs, and venue dress & conduct guidelines.</span>
                      </div>
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-neutral-200">
                        <span className="w-5 h-5 rounded-full bg-[#ff3b30] text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                        <span>No griefing, spamming, or unauthorized avatar script overload in public areas.</span>
                      </div>
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-neutral-200">
                        <span className="w-5 h-5 rounded-full bg-[#ff3b30] text-white text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                        <span>Keep gestures and audio streams to designated dance floors.</span>
                      </div>
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-neutral-200">
                        <span className="w-5 h-5 rounded-full bg-[#ff3b30] text-white text-[10px] font-black flex items-center justify-center shrink-0">4</span>
                        <span>Touch the in-world Gridpass prim anytime to log dwell rewards and open passport.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptRules}
                  className="w-full py-3.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-[#ff3b30]/30 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> I Agree & Open Sim Portal
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
