'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useToast } from '@/components/ToastContext'
import { KeyRound, ShieldCheck, Loader2, User, Coins } from 'lucide-react'

function SLAuthGatewayContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()

  const slKey = searchParams.get('slKey') || ''
  const legacyName = searchParams.get('legacyName') || ''
  const displayName = searchParams.get('displayName') || legacyName || 'SL Resident'
  const region = searchParams.get('region') || ''
  const parcel = searchParams.get('parcel') || ''
  const venueSlug = searchParams.get('slug') || 'skinny-dip-inn'

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('Verifying Second Life Prim Touch Credentials...')
  const [credits, setCredits] = useState<number>(100)

  useEffect(() => {
    if (!slKey && !legacyName) {
      setStatus('error')
      setMessage('Missing Second Life avatar authentication token.')
      return
    }

    authenticateAvatar()
  }, [slKey, legacyName])

  const authenticateAvatar = async () => {
    try {
      setStatus('loading')
      setMessage(`Authenticating ${displayName} (${legacyName})...`)

      const cleanKey = slKey.trim()
      const cleanLegacy = legacyName.trim() || 'resident'
      const cleanDisplay = displayName.trim() || cleanLegacy

      const avatarRef = doc(db, 'sl_avatars', cleanKey || `sl_${cleanLegacy}`)
      const avatarSnap = await getDoc(avatarRef)

      let currentCredits = 100
      let role = 'member'

      if (
        cleanLegacy.toLowerCase().includes('plosey') || 
        cleanLegacy.toLowerCase().includes('merf') || 
        cleanKey === '549d8555-43c5-46ed-8c65-33489c7ea2f0' ||
        cleanKey === 'dd25fcaa-6081-4489-b589-31eebd6fbbbf'
      ) {
        role = 'superadmin'
      }

      if (!avatarSnap.exists()) {
        await setDoc(avatarRef, {
          slKey: cleanKey,
          slLegacyName: cleanLegacy,
          slDisplayName: cleanDisplay,
          displayName: cleanDisplay,
          credits: 100,
          role: role,
          homeVenue: venueSlug,
          lastRegion: region,
          lastParcel: parcel,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        })

        const userRef = doc(db, 'users', `sl_${cleanKey}`)
        await setDoc(userRef, {
          id: `sl_${cleanKey}`,
          slKey: cleanKey,
          displayName: cleanDisplay,
          slLegacyName: cleanLegacy,
          credits: 100,
          role: role,
          source: 'secondlife_prim_touch',
          lastRegion: region,
          lastParcel: parcel,
          updatedAt: serverTimestamp(),
        }, { merge: true })

        currentCredits = 100
        setMessage(`✨ Welcome to Gridpass! Account created with 100 Starting Credits.`)
      } else {
        const existingData = avatarSnap.data()
        currentCredits = existingData.credits !== undefined ? existingData.credits : 100
        if (existingData.role) role = existingData.role

        await setDoc(avatarRef, {
          slDisplayName: cleanDisplay,
          lastRegion: region,
          lastParcel: parcel,
          lastLogin: serverTimestamp(),
        }, { merge: true })

        setMessage(`👋 Welcome back, ${cleanDisplay}! Loading your Second Life Portal...`)
      }

      setCredits(currentCredits)
      setStatus('success')

      const sessionData = {
        slKey: cleanKey,
        legacyName: cleanLegacy,
        displayName: cleanDisplay,
        region,
        parcel,
        credits: currentCredits,
        role,
        authenticatedAt: new Date().toISOString(),
      }

      localStorage.setItem('gridpass_sl_session', JSON.stringify(sessionData))

      setTimeout(() => {
        router.push(`/secondlife/${venueSlug}`)
      }, 1500)

    } catch (err: any) {
      console.error("[SL Auth Gateway Error]", err)
      setStatus('error')
      setMessage('Security verification error. Please touch the in-world prim again.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 text-white rounded-3xl p-8 border border-neutral-800 shadow-2xl text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff3b30]/20 text-[#ff3b30] border border-[#ff3b30]/30 text-xs font-black uppercase tracking-wider mb-6">
          <KeyRound className="w-4 h-4" /> Second Life Prim SSO
        </div>

        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-6">
          Avatar Credentials Verification
        </h1>

        {status === 'loading' && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-[#ff3b30] animate-spin mx-auto" />
            <p className="text-sm font-medium text-neutral-300">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black uppercase text-white">Authenticated</h2>
            <p className="text-xs text-neutral-300 font-medium">{message}</p>

            <div className="p-4 bg-neutral-800 rounded-xl border border-neutral-700 flex items-center justify-between text-xs mt-4">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <User className="w-4 h-4 text-[#ff3b30]" /> {displayName}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Coins className="w-4 h-4" /> {credits} Credits
              </span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4">
            <p className="text-xs text-[#ff3b30] font-bold bg-[#ff3b30]/10 p-3 rounded-lg border border-[#ff3b30]/30">
              {message}
            </p>
            <a
              href="/secondlife"
              className="inline-block mt-4 px-6 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase rounded-lg transition-all"
            >
              Return to Second Life Directory
            </a>
          </div>
        )}

      </div>
    </div>
  )
}

export default function SecondLifeAuthGatewayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 text-white rounded-3xl p-8 border border-neutral-800 shadow-2xl text-center">
          <Loader2 className="w-10 h-10 text-[#ff3b30] animate-spin mx-auto mb-4" />
          <p className="text-sm font-black uppercase text-neutral-300">Loading Auth Gateway...</p>
        </div>
      </div>
    }>
      <SLAuthGatewayContent />
    </Suspense>
  )
}
