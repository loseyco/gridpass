'use client';

import React, { useState } from 'react';
import { 
  Car, Compass, QrCode, User, ArrowRight, CheckCircle2, AlertTriangle, 
  HelpCircle, ChevronRight, Star, Heart, Key, Power, Printer, Info, Wrench
} from 'lucide-react';
import Link from 'next/link';

export default function StyleguidePage() {
  const [inputText, setInputText] = useState('');
  const [toggleActive, setToggleActive] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 space-y-12">
      
      {/* Page Header */}
      <div className="border-b border-[#2c2c2e] pb-6 space-y-2 max-w-4xl mx-auto">
        <span className="text-[10px] font-mono font-bold text-[#007aff] uppercase tracking-widest">DEVELOPER SANDBOX</span>
        <h1 className="text-3xl font-extrabold tracking-tight uppercase">Gridpass UI Component System</h1>
        <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Use this catalog to maintain design consistency across the Gridpass app ecosystem. All components are optimized for high-fidelity mobile-first viewport styling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
        {/* SECTION 1: Buttons & Interactive Components */}
        <section className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-3xl space-y-6">
          <div className="border-b border-[#2c2c2e] pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">1. Buttons & Controls</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Primary Action (iOS Blue)</span>
              <button className="w-full py-3.5 bg-[#007aff] hover:bg-[#0a84ff] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
                Primary Button
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Secondary Action (iOS Charcoal)</span>
              <button className="w-full py-3.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-[#3a3a3c] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
                Secondary Button
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Destructive Action (iOS Red)</span>
              <button className="w-full py-3.5 bg-[#ff3b30] hover:bg-[#ff453a] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
                Destructive Action
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Success Action (iOS Green)</span>
              <button className="w-full py-3.5 bg-[#34c759] hover:bg-[#30b351] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
                Success Action
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Interactive Switch / Toggle Row</span>
              <div 
                onClick={() => setToggleActive(!toggleActive)}
                className="flex items-center justify-between p-3.5 bg-[#2c2c2e]/40 border border-[#2c2c2e] rounded-xl cursor-pointer hover:bg-[#2c2c2e]/60 transition-colors"
              >
                <span className="text-xs font-semibold text-white">Enable Screen Wake Lock</span>
                <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  toggleActive ? 'bg-[#34c759]' : 'bg-[#3a3a3c]'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-all shadow ${
                    toggleActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: List Views & Setting Items */}
        <section className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-3xl space-y-6">
          <div className="border-b border-[#2c2c2e] pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">2. iOS Grouped Menu Rows</h3>
          </div>

          <div className="space-y-4">
            <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Grouped Action List (divide-y)</span>
            <div className="bg-black border border-[#2c2c2e] rounded-2xl overflow-hidden divide-y divide-[#2c2c2e]">
              
              {/* Row 1 */}
              <div className="flex items-center justify-between p-4 hover:bg-[#1c1c1e] transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#007aff]/10 flex items-center justify-center text-[#007aff]">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Digital Passports</p>
                    <p className="text-[10px] text-neutral-500">Configure your active tag decals</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between p-4 hover:bg-[#1c1c1e] transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Verified Garage</p>
                    <p className="text-[10px] text-neutral-500">Manage vehicles and specs</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between p-4 hover:bg-[#1c1c1e] transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ffd60a]/10 flex items-center justify-center text-[#ffd60a]">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Backer Dashboard</p>
                    <p className="text-[10px] text-neutral-500">Manage supporter badge tier</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:translate-x-0.5 transition-transform" />
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 3: Form Fields & Inputs */}
        <section className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-3xl space-y-6">
          <div className="border-b border-[#2c2c2e] pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">3. Native Styled Inputs</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase" htmlFor="demo-input">Standard Text Input</label>
              <input
                id="demo-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text..."
                className="w-full bg-[#2c2c2e] border border-[#3a3a3c] text-white px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#007aff]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Input Grid Group</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="2024"
                  className="bg-[#2c2c2e] border border-[#3a3a3c] text-white px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#007aff] text-center"
                />
                <input
                  type="text"
                  placeholder="Porsche"
                  className="bg-[#2c2c2e] border border-[#3a3a3c] text-white px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#007aff] col-span-2"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: System Alerts & Information Banners */}
        <section className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-3xl space-y-6">
          <div className="border-b border-[#2c2c2e] pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">4. Warnings & Proximity Banners</h3>
          </div>

          <div className="space-y-4">
            
            {/* Warning Alert */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Wi-Fi / Connectivity Alert</span>
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-left space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Wi-Fi Connection Alert</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">
                  Wi-Fi sign-in browser detected. To save details correctly, reopen in Safari or Chrome.
                </p>
              </div>
            </div>

            {/* Proximity / Status Alert */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Live Proximity Alert HUD</span>
              <div className="bg-[#2c2c2e] border border-[#3a3a3c] p-4 rounded-xl text-left space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-[#ffd60a]">
                  <span className="flex items-center gap-1.5"><Info className="w-4 h-4" /> Live Proximity Alert</span>
                  <span className="text-[9px] font-mono bg-yellow-500/10 px-2 py-0.5 rounded text-yellow-500">0.1 MILES</span>
                </div>
                <p className="text-[10px] text-white font-bold">Public Boat Launch (10 Lanes)</p>
                <p className="text-[9px] text-neutral-400 leading-normal">
                  Ramps are active. Keep wake speed under 5 MPH within the marked orange buoys.
                </p>
              </div>
            </div>

            {/* Success Status Alert */}
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Success Message Banner</span>
              <div className="bg-[#34c759]/10 border border-[#34c759]/20 p-3 rounded-xl text-center flex items-center justify-center gap-2 text-[#30b351] text-xs font-bold uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Vehicle Added Successfully</span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 5: Badges, Badges & Golden Avatar Wrappers */}
        <section className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-3xl space-y-6 lg:col-span-2">
          <div className="border-b border-[#2c2c2e] pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">5. Badges & Gilded Status Icons</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Gilded Supporter Avatar Wrapper */}
            <div className="space-y-2 text-center p-4 bg-black rounded-2xl border border-[#2c2c2e]">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Gilded Gold Avatar Border</span>
              <div className="relative inline-block mt-2">
                <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-[#ffe066] via-[#ffb700] to-[#ff9900] gold-glow-ring flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-neutral-400">
                    <User className="w-8 h-8" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 bg-[#ffd60a] text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                  GOLD
                </span>
              </div>
              <p className="text-xs font-bold text-white uppercase mt-2">Supporter Avatar</p>
            </div>

            {/* Unlocked Achievement Badges */}
            <div className="space-y-2 p-4 bg-black rounded-2xl border border-[#2c2c2e]">
              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Unlocked Achievement Badges</span>
              <div className="space-y-2 mt-2">
                
                <div className="flex items-center gap-2 p-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <span className="text-lg">🏅</span>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-bold text-yellow-500 uppercase">Original Supporter</div>
                    <div className="text-[8px] text-neutral-400">Backed Gridpass Launch</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-[#007aff]/5 border border-[#007aff]/20 rounded-xl">
                  <span className="text-lg">🌊</span>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-bold text-[#007aff] uppercase">River Pioneer</div>
                    <div className="text-[8px] text-neutral-400">Verified Fox River ramp</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Custom Gate Pass Stickers */}
            <div className="space-y-2 p-4 bg-black rounded-2xl border border-[#2c2c2e] text-center flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Sticker Pass Layout</span>
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-3.5 rounded-xl inline-block mt-3 space-y-1 text-center">
                  <span className="text-[7px] font-mono font-bold text-[#007aff] uppercase tracking-widest">GATE PASS</span>
                  <div className="w-12 h-12 bg-white rounded flex items-center justify-center mx-auto">
                    <QrCode className="w-8 h-8 text-black" />
                  </div>
                  <span className="text-[8px] font-mono text-white font-bold block pt-1">GP-MARCUS-ID</span>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium">Auto-generated print layouts</p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
