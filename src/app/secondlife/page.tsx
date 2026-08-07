'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Shield, Cpu, KeyRound, ExternalLink, Download, ArrowRight, Radio, Users, MapPin, Zap } from 'lucide-react'
import { useToast } from '@/components/ToastContext'

export default function SecondLifeSaaSPage() {
  const { showToast } = useToast()
  const [customSlug, setCustomSlug] = useState('')

  const handleCopyScriptLink = () => {
    const scriptUrl = `${window.location.origin}/sl_scripts/Gridpass_SL_Sim_Bridge.lsl`
    navigator.clipboard.writeText(scriptUrl)
    showToast({
      title: '✓ Script Link Copied',
      message: 'Gridpass LSL Bridge URL copied to clipboard. Download and place inside your Second Life prim!',
    })
  }

  const handleLaunchPortal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customSlug.trim()) {
      showToast({
        title: 'Enter Venue Slug',
        message: 'Please enter a valid sim or club URL slug (e.g. skinny-dip-inn).',
      })
      return
    }
    const clean = customSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    window.location.href = `/secondlife/${clean}`
  }

  return (
    <div className="min-h-screen bg-white text-[#1c1c1e] font-sans pb-24">
      {/* Hero Header */}
      <div className="bg-neutral-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b-4 border-[#ff3b30]">
        <div className="max-w-5xl mx-mx-auto max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff3b30]/20 text-[#ff3b30] border border-[#ff3b30]/30 text-xs font-bold uppercase tracking-wider mb-6">
            <Radio className="w-4 h-4 animate-pulse" />
            Gridpass Second Life Engine • In-World Prim SSO & Sim SaaS
          </div>

          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white mb-4">
            Universal Sim & Club Management
          </h1>

          <p className="text-lg sm:text-xl text-neutral-300 max-w-3xl mx-auto mb-8 leading-relaxed font-medium">
            Connect your Second Life region, night club, or virtual venue to <span className="text-[#ff3b30] font-bold">Gridpass.app</span>. Avatar SSO authentication, live region telemetry, visitor tracking, and digital passports—activated by touching a prim in-world.
          </p>

          {/* Quick Launch Box */}
          <form onSubmit={handleLaunchPortal} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3 p-2 bg-neutral-800 rounded-xl border border-neutral-700 shadow-2xl">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-neutral-900 rounded-lg border border-neutral-700">
              <span className="text-neutral-500 font-mono text-sm">gridpass.app/secondlife/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="your-club-slug"
                className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none placeholder:text-neutral-600"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black uppercase text-xs tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ff3b30]/30"
            >
              Launch Portal <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        
        {/* Core Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#ff3b30] mb-1">
              Virtual Real Estate Infrastructure
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#1c1c1e]">
              Built for Sims, Clubs, Racetracks & Destinations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-sm hover:border-[#ff3b30] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#ff3b30]/10 text-[#ff3b30] flex items-center justify-center mb-4 group-hover:bg-[#ff3b30] group-hover:text-white transition-all">
                <KeyRound className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black uppercase text-[#1c1c1e] mb-2">In-World Prim SSO Touch</h4>
              <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                Avatars click a prim in Second Life to instantly generate a secure, passwordless authentication link. Captures UUID, Display Name, Legacy Name, Region, and Parcel context.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-sm hover:border-[#ff3b30] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#ff3b30]/10 text-[#ff3b30] flex items-center justify-center mb-4 group-hover:bg-[#ff3b30] group-hover:text-white transition-all">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black uppercase text-[#1c1c1e] mb-2">Real-Time Sim Telemetry</h4>
              <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                Stream live sim metrics including Sim FPS, Time Dilation, active visitor counts via <code className="text-[#ff3b30] font-bold">llGetAgentList</code>, and music stream URLs directly to your web portal.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-sm hover:border-[#ff3b30] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#ff3b30]/10 text-[#ff3b30] flex items-center justify-center mb-4 group-hover:bg-[#ff3b30] group-hover:text-white transition-all">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black uppercase text-[#1c1c1e] mb-2">Universal Avatar Passports</h4>
              <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                Every avatar gets a Gridpass Digital Passport with 100 starting credits, visitor badges, event RSVPs, VIP status tiers, and staged virtual vehicle builds.
              </p>
            </div>
          </div>
        </div>

        {/* LSL Setup & Download Box */}
        <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-10 border border-neutral-800 shadow-xl mb-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#ff3b30] mb-2">
                <Cpu className="w-4 h-4" /> LSL Bridge Installation Kit
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-3">
                Drop Gridpass Script into any Second Life Prim
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed font-medium">
                Our lightweight, Mono-enabled LSL script runs inside Firestorm or Second Life viewer. Place it on your club entrance billboard, information kiosk, or racetrack starter line.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <a
                href="/sl_scripts/Gridpass_SL_Sim_Bridge.lsl"
                download="Gridpass_SL_Sim_Bridge.lsl"
                className="px-6 py-3.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ff3b30]/30"
              >
                <Download className="w-4 h-4" /> Download LSL Script
              </a>
              <button
                onClick={handleCopyScriptLink}
                className="px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold uppercase text-xs tracking-wider rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-2"
              >
                Copy URL Link
              </button>
            </div>
          </div>
        </div>

        {/* Sample Featured Venues Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-[#ff3b30]">Live Environments</h2>
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#1c1c1e]">Featured Second Life Portals</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Skinny Dip Inn Portal Card */}
            <Link
              href="/secondlife/skinny-dip-inn"
              className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 hover:border-[#ff3b30] transition-all group block shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md bg-[#ff3b30]/10 text-[#ff3b30] font-black text-xs uppercase tracking-wider">
                  Active Sim
                </span>
                <span className="text-xs font-mono text-neutral-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#ff3b30]" /> Skinny Dip Islands
                </span>
              </div>

              <h4 className="text-xl font-black uppercase text-[#1c1c1e] group-hover:text-[#ff3b30] transition-colors mb-1">
                Skinny Dip Inn
              </h4>
              <p className="text-xs text-neutral-600 font-medium mb-4">
                Resort, Beach Club & Entertainment Sim with In-World Prim Touch SSO & DJ Roster.
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 text-xs font-bold uppercase text-neutral-600">
                <span className="flex items-center gap-1.5 text-emerald-600 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Telemetry
                </span>
                <span className="text-[#ff3b30] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Enter Portal <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Gridpass SL Raceway Card */}
            <Link
              href="/secondlife/gridpass-raceway"
              className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 hover:border-[#ff3b30] transition-all group block shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-md bg-neutral-200 text-neutral-700 font-black text-xs uppercase tracking-wider">
                  Motorsports Sim
                </span>
                <span className="text-xs font-mono text-neutral-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#ff3b30]" /> SL Apex Circuit
                </span>
              </div>

              <h4 className="text-xl font-black uppercase text-[#1c1c1e] group-hover:text-[#ff3b30] transition-colors mb-1">
                Gridpass SL Raceway
              </h4>
              <p className="text-xs text-neutral-600 font-medium mb-4">
                High-speed virtual circuit with vehicle telemetry, transponder timing & pit manifests.
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 text-xs font-bold uppercase text-neutral-600">
                <span className="text-neutral-500 font-mono">
                  Ready to Sync
                </span>
                <span className="text-[#ff3b30] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Enter Portal <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
