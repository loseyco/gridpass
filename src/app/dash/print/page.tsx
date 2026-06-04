'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  Loader2, Printer, Download, Sparkles, AlertTriangle, ShieldCheck, 
  ArrowLeft, Check, CheckCircle2, Lock, Tag, Heart, Eye
} from 'lucide-react';

interface VehicleDetails {
  id?: string;
  year?: number | string;
  make?: string;
  model?: string;
  specs?: {
    engine?: string;
    hp?: number | string;
  };
  tag_id?: string;
  mods?: string;
}

function PrintPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const vehicleId = searchParams.get('vehicleId') || '';

  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTag, setUpdatingTag] = useState(false);

  // Customizer States
  const [layout, setLayout] = useState<'round' | 'square' | 'keytag' | 'windshield'>('round');
  const [borderTheme, setBorderTheme] = useState<'carbon' | 'crimson' | 'gold'>('carbon');
  const [includeMods, setIncludeMods] = useState(true);
  const [accentColor, setAccentColor] = useState('#bd2925');
  const [customMods, setCustomMods] = useState('Carbon fiber wing, Cold air intake, Stage 2 tune, Cat-back exhaust');
  const [showSupporterModal, setShowSupporterModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

    const loadData = async () => {
      if (isMock) {
        setVehicle({
          id: vehicleId || 'mock-v1',
          year: 2023,
          make: 'Chevrolet',
          model: 'Corvette Z06',
          specs: { engine: '5.5L V8', hp: 670 },
          tag_id: 'GP-PRNT-Z06MOCK',
          mods: 'Carbon fiber wing, Cold air intake, Stage 2 tune, Cat-back exhaust'
        });
        setUserProfile({
          is_supporter: true
        });
        setLoading(false);
        return;
      }

      if (!vehicleId) {
        setLoading(false);
        return;
      }

      try {
        // Load user profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        let isSupporter = false;
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setUserProfile(uData);
          isSupporter = uData.is_supporter === true;
        } else {
          setUserProfile({ is_supporter: false });
        }

        // Load vehicle details
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleSnap = await getDoc(vehicleRef);
        if (vehicleSnap.exists()) {
          const vData = vehicleSnap.data() as VehicleDetails;
          
          // Generate free tag if empty
          if (!vData.tag_id) {
            setUpdatingTag(true);
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let randomPart = '';
            for (let i = 0; i < 6; i++) {
              randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const newTagId = `GP-PRNT-${randomPart}`;
            await updateDoc(vehicleRef, { tag_id: newTagId });
            vData.tag_id = newTagId;
            setUpdatingTag(false);
          }

          setVehicle(vData);
          if (vData.mods) {
            setCustomMods(vData.mods);
          }
        }
      } catch (err) {
        console.error("Error loading vehicle/profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, vehicleId, router]);

  // Support Upgrade trigger
  const handleBecomeSupporter = async () => {
    if (!user) return;
    const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

    try {
      if (isMock) {
        setUserProfile((prev: any) => ({ ...prev, is_supporter: true }));
      } else {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { is_supporter: true });
        setUserProfile((prev: any) => ({ ...prev, is_supporter: true }));
      }
      setBorderTheme('gold');
      setShowSupporterModal(false);
    } catch (err) {
      console.error("Error upgrading support status:", err);
    }
  };

  // Border selection handler
  const handleBorderSelect = (theme: 'carbon' | 'crimson' | 'gold') => {
    if (theme === 'gold' && !userProfile?.is_supporter) {
      setShowSupporterModal(true);
    } else {
      setBorderTheme(theme);
    }
  };

  // Helper colors
  const getBorderColorHex = () => {
    if (borderTheme === 'crimson') return '#bd2925';
    if (borderTheme === 'gold') return '#ffd700';
    return '#262626'; // carbon
  };

  const getBorderClasses = () => {
    if (borderTheme === 'crimson') return 'border-[#bd2925]';
    if (borderTheme === 'gold') return 'border-yellow-500 gold-glow-ring';
    return 'border-neutral-800';
  };

  // Tag ID display
  const tagId = vehicle?.tag_id || 'GP-PRNT-XXXXXX';
  const qrRedirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/qr/${tagId}`
    : `https://gridpass.app/qr/${tagId}`;
  
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrRedirectUrl)}`;

  // Download SVG
  const handleDownloadSVG = () => {
    const vYear = vehicle?.year || '2024';
    const vMake = vehicle?.make || 'Chevrolet';
    const vModel = vehicle?.model || 'Corvette';
    const vEngine = vehicle?.specs?.engine || 'N/A';
    const vHp = vehicle?.specs?.hp || 'N/A';
    const bColor = getBorderColorHex();

    let svgContent = '';

    if (layout === 'round') {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <circle cx="150" cy="150" r="145" fill="#060608" stroke="${bColor}" stroke-width="8"/>
        <circle cx="150" cy="150" r="130" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="6,4"/>
        <image href="${qrCodeImgSrc}" x="85" y="75" width="130" height="130"/>
        <text x="150" y="52" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="900" letter-spacing="3" text-anchor="middle">GRIDPASS</text>
        <text x="150" y="235" fill="#ffffff" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">${tagId}</text>
        <text x="150" y="260" fill="${accentColor}" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="1" text-anchor="middle">SCAN FOR SPECS</text>
      </svg>`;
    } else if (layout === 'square') {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <rect x="5" y="5" width="290" height="290" rx="20" fill="#060608" stroke="${bColor}" stroke-width="8"/>
        <rect x="20" y="20" width="260" height="260" rx="12" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="8,4"/>
        <image href="${qrCodeImgSrc}" x="85" y="75" width="130" height="130"/>
        <text x="150" y="52" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="900" letter-spacing="4" text-anchor="middle">GRIDPASS</text>
        <text x="150" y="230" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${vYear} ${vMake} ${vModel}</text>
        <text x="150" y="255" fill="${accentColor}" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">${tagId}</text>
      </svg>`;
    } else if (layout === 'keytag') {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150" width="300" height="150">
        <rect x="5" y="5" width="290" height="140" rx="10" fill="#060608" stroke="${bColor}" stroke-width="6"/>
        <image href="${qrCodeImgSrc}" x="20" y="25" width="100" height="100"/>
        <text x="135" y="50" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="900" letter-spacing="2">GRIDPASS</text>
        <text x="135" y="80" fill="#ffffff" font-family="monospace" font-size="12" font-weight="bold">${tagId}</text>
        <text x="135" y="110" fill="${accentColor}" font-family="sans-serif" font-size="10" font-weight="bold">${vYear} ${vMake} ${vModel}</text>
      </svg>`;
    } else if (layout === 'windshield') {
      const modsLines = includeMods ? customMods.split(',').slice(0, 4).map((m, idx) => {
        return `<text x="80" y="${460 + idx * 30}" fill="#cccccc" font-family="sans-serif" font-size="14">• ${m.trim()}</text>`;
      }).join('') : '';

      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 792" width="612" height="792">
        <rect x="15" y="15" width="582" height="762" rx="30" fill="#060608" stroke="${bColor}" stroke-width="12"/>
        <rect x="35" y="35" width="542" height="722" rx="20" fill="none" stroke="${accentColor}" stroke-width="3" stroke-dasharray="10,5"/>
        
        <text x="306" y="90" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="900" letter-spacing="6" text-anchor="middle">GRIDPASS PASSPORT</text>
        
        <text x="306" y="160" fill="#ffffff" font-family="sans-serif" font-size="34" font-weight="900" text-anchor="middle">${vYear} ${vMake}</text>
        <text x="306" y="210" fill="${accentColor}" font-family="sans-serif" font-size="40" font-weight="900" text-anchor="middle">${vModel}</text>
        
        <text x="80" y="280" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">SPECIFICATIONS</text>
        <line x1="80" y1="290" x2="532" y2="290" stroke="#333333" stroke-width="2"/>
        
        <text x="80" y="320" fill="#888888" font-family="sans-serif" font-size="14">Engine / Motor:</text>
        <text x="240" y="320" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${vEngine}</text>
        
        <text x="80" y="355" fill="#888888" font-family="sans-serif" font-size="14">Output Power:</text>
        <text x="240" y="355" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${vHp} HP</text>
        
        <text x="80" y="390" fill="#888888" font-family="sans-serif" font-size="14">Registry Tag:</text>
        <text x="240" y="390" fill="${accentColor}" font-family="monospace" font-size="14" font-weight="bold">${tagId}</text>

        ${includeMods ? `
        <text x="80" y="440" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">MODIFICATIONS</text>
        <line x1="80" y1="450" x2="532" y2="450" stroke="#333333" stroke-width="2"/>
        ${modsLines}
        ` : ''}

        <rect x="80" y="660" width="280" height="50" rx="10" fill="${accentColor}"/>
        <text x="220" y="690" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="black" letter-spacing="1" text-anchor="middle">SCAN TO VOTE / SPOTTED</text>
        
        <image href="${qrCodeImgSrc}" x="400" y="600" width="130" height="130"/>
      </svg>`;
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gridpass-${layout}-${tagId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || updatingTag) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#bd2925] animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-[#bd2925]" />
        <h2 className="text-xl font-bold uppercase">Vehicle Not Found</h2>
        <Link href="/dash" className="text-sm font-mono text-[#bd2925] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative flex flex-col">
      {/* Dynamic inline styles for print layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html, main {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999;
          }
          .print-sheet-card {
            background: white !important;
            color: black !important;
            border: 4px solid black !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
          }
        }
      `}} />

      <div className="mesh-glow no-print" />
      
      <div className="no-print">
        <Navbar />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-10">
        
        {/* Back Link */}
        <div className="no-print flex items-center justify-between">
          <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Digital Garage
          </Link>
          <span className="text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-400 px-3 py-1 rounded-full uppercase">
            STicker Studio v2.0
          </span>
        </div>

        {/* Studio Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Customizer Sidebar */}
          <div className="lg:col-span-4 space-y-6 no-print">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Decal Studio</h1>
              <div className="bg-[#bd2925]/5 border border-[#bd2925]/20 p-3 rounded-2xl text-[11px] leading-relaxed text-neutral-300">
                <strong>Why print a Decal?</strong> Stick this QR code onto your windshield, bumper, or key ring. When spectators or track marshals scan it with their phones, they instantly access your vehicle's digital passport, mods list, track times, and registry.
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Customize your layout templates, border themes, and color branding. Print for free at home or order official waterproof vinyls.
              </p>
            </div>

            {/* Customizer Card */}
            <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/40 space-y-6">
              
              {/* Layout Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Layout Template</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setLayout('round')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                      layout === 'round' 
                        ? 'border-[#bd2925] bg-[#bd2925]/5 text-white' 
                        : 'border-neutral-850 hover:border-neutral-700 bg-neutral-900/30 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase">2.5" Round Decals</span>
                    <span className="text-[9px] font-mono block opacity-70">Fits Avery 94500 sheets</span>
                  </button>
                  <button 
                    onClick={() => setLayout('square')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                      layout === 'square' 
                        ? 'border-[#bd2925] bg-[#bd2925]/5 text-white' 
                        : 'border-neutral-850 hover:border-neutral-700 bg-neutral-900/30 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase">3" x 3" Square Stickers</span>
                    <span className="text-[9px] font-mono block opacity-70">Fits Avery 22806 sheets</span>
                  </button>
                  <button 
                    onClick={() => setLayout('keytag')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                      layout === 'keytag' 
                        ? 'border-[#bd2925] bg-[#bd2925]/5 text-white' 
                        : 'border-neutral-850 hover:border-neutral-700 bg-neutral-900/30 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase">Keytag</span>
                    <span className="text-[9px] font-mono block opacity-70">1"x2" Key Ring Tag</span>
                  </button>
                  <button 
                    onClick={() => setLayout('windshield')}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                      layout === 'windshield' 
                        ? 'border-[#bd2925] bg-[#bd2925]/5 text-white' 
                        : 'border-neutral-850 hover:border-neutral-700 bg-neutral-900/30 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase">Windshield Spec</span>
                    <span className="text-[9px] font-mono block opacity-70">8.5"x11" Show Poster</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                  <span className="text-neutral-550">Need sticker paper?</span>
                  <a 
                    href="https://www.amazon.com/s?k=avery+sticker+paper" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 font-bold uppercase transition-colors"
                  >
                    Buy Avery Sheets on Amazon →
                  </a>
                </div>
              </div>

              {/* Border Theme Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Border Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleBorderSelect('carbon')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      borderTheme === 'carbon' 
                        ? 'border-neutral-100 bg-neutral-900 text-white' 
                        : 'border-neutral-850 hover:border-neutral-700 bg-neutral-900/10 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase">Carbon</span>
                  </button>
                  <button 
                    onClick={() => handleBorderSelect('crimson')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      borderTheme === 'crimson' 
                        ? 'border-red-500 bg-red-950/20 text-red-500' 
                        : 'border-neutral-850 hover:border-neutral-700 bg-neutral-900/10 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs font-bold block uppercase">Crimson</span>
                  </button>
                  <button 
                    onClick={() => handleBorderSelect('gold')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-1 ${
                      borderTheme === 'gold' 
                        ? 'border-yellow-500 bg-yellow-950/20 text-yellow-500' 
                        : 'border-neutral-850 hover:border-neutral-700 bg-neutral-900/10 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">Gold</span>
                    {!userProfile?.is_supporter && <Lock className="w-3 h-3 text-yellow-600" />}
                  </button>
                </div>
              </div>

              {/* Accent Color Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Custom Accent Color</label>
                  <span className="text-[10px] font-mono font-bold text-neutral-400">{accentColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <div className="flex gap-2">
                    {['#bd2925', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className="w-6 h-6 rounded-full border border-neutral-900"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Modifications Toggle & Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Include Mod List</label>
                  <input 
                    type="checkbox" 
                    checked={includeMods}
                    onChange={(e) => setIncludeMods(e.target.checked)}
                    className="w-4 h-4 accent-[#bd2925]"
                  />
                </div>
                {includeMods && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Edit Mod List (comma-separated)</label>
                    <textarea 
                      value={customMods}
                      onChange={(e) => setCustomMods(e.target.value)}
                      rows={3}
                      className="w-full p-2 rounded-xl glass-input text-xs"
                      placeholder="e.g. Stage 2 Tune, Coilovers, Intake"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="w-full py-3.5 bg-white text-black hover:bg-neutral-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[54px]"
                >
                  <Printer className="w-4 h-4" /> Print Decal at Home
                </button>
                <button
                  onClick={handleDownloadSVG}
                  className="w-full py-3.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[54px]"
                >
                  <Download className="w-4 h-4" /> Download Printable File (SVG)
                </button>
                <Link
                  href="/pricing"
                  className="w-full py-3.5 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[54px]"
                >
                  <Sparkles className="w-4 h-4" /> Order Shipped Weatherproof Decals
                </Link>
              </div>

            </div>
          </div>

          {/* Live Preview Container */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[#07070a] border border-neutral-900/60 p-8 rounded-3xl min-h-[500px] relative overflow-hidden">
            {/* Screen layout mockup */}
            <div className="absolute top-4 left-4 flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest no-print">
              <Eye className="w-3.5 h-3.5" /> Studio Preview Mockup
            </div>

            {/* Print Area which resolves to white/clean on print */}
            <div className="print-area w-full flex items-center justify-center p-2">
              
              {/* Avery Round Layout */}
              {layout === 'round' && (
                <div 
                  className={`w-64 h-64 rounded-full border-8 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center relative print-sheet-card ${getBorderClasses()}`}
                  style={{ borderColor: borderTheme !== 'gold' ? getBorderColorHex() : undefined }}
                >
                  {/* Dashed inner accent line */}
                  <div 
                    className="absolute inset-3 rounded-full border-2 border-dashed pointer-events-none opacity-60" 
                    style={{ borderColor: accentColor }}
                  />
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <span className="text-xs font-black text-white tracking-widest uppercase">GRIDPASS</span>
                    {/* QR code */}
                    <div className="w-28 h-28 my-3 bg-white p-1 rounded shadow-md flex items-center justify-center">
                      <img src={qrCodeImgSrc} alt="QR Code" className="w-full h-full" />
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">{tagId}</span>
                    <span className="text-[8px] font-bold mt-1 uppercase tracking-widest" style={{ color: accentColor }}>Scan for spec sheet</span>
                  </div>
                </div>
              )}

              {/* Avery Square Layout */}
              {layout === 'square' && (
                <div 
                  className={`w-72 h-72 rounded-3xl border-8 bg-neutral-950 flex flex-col items-center justify-between p-6 text-center relative print-sheet-card ${getBorderClasses()}`}
                  style={{ borderColor: borderTheme !== 'gold' ? getBorderColorHex() : undefined }}
                >
                  <div 
                    className="absolute inset-3 rounded-2xl border-2 border-dashed pointer-events-none opacity-60" 
                    style={{ borderColor: accentColor }}
                  />
                  <span className="text-sm font-black text-white tracking-widest uppercase relative z-10">GRIDPASS DECAL</span>
                  <div className="w-28 h-28 bg-white p-1 rounded shadow-md flex items-center justify-center relative z-10">
                    <img src={qrCodeImgSrc} alt="QR Code" className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-black text-white uppercase">{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mt-1" style={{ color: accentColor }}>{tagId}</span>
                  </div>
                </div>
              )}

              {/* Keytag Layout */}
              {layout === 'keytag' && (
                <div 
                  className={`w-80 h-40 rounded-2xl border-4 bg-neutral-950 flex items-center p-5 relative print-sheet-card ${getBorderClasses()}`}
                  style={{ borderColor: borderTheme !== 'gold' ? getBorderColorHex() : undefined }}
                >
                  <div className="w-24 h-24 bg-white p-1 rounded shadow-md flex items-center justify-center shrink-0">
                    <img src={qrCodeImgSrc} alt="QR Code" className="w-full h-full" />
                  </div>
                  <div className="ml-5 flex-1 flex flex-col justify-center space-y-1">
                    <span className="text-xs font-black text-white tracking-widest uppercase">GRIDPASS</span>
                    <span className="text-xs font-mono font-bold text-neutral-400">{tagId}</span>
                    <span className="text-[9px] font-bold uppercase mt-2 line-clamp-2" style={{ color: accentColor }}>
                      {vehicle.year} {vehicle.make}<br />{vehicle.model}
                    </span>
                  </div>
                </div>
              )}

              {/* Windshield Spec-Sheet 8.5"x11" Layout */}
              {layout === 'windshield' && (
                <div 
                  className={`w-[450px] min-h-[600px] rounded-3xl border-[10px] bg-neutral-950 flex flex-col justify-between p-8 relative print-sheet-card ${getBorderClasses()}`}
                  style={{ borderColor: borderTheme !== 'gold' ? getBorderColorHex() : undefined }}
                >
                  {/* Dashed outer border */}
                  <div 
                    className="absolute inset-4 rounded-[20px] border-2 border-dashed pointer-events-none opacity-40" 
                    style={{ borderColor: accentColor }}
                  />

                  {/* Header */}
                  <div className="text-center space-y-3 relative z-10 pt-2">
                    <span className="text-xs font-mono font-black text-neutral-500 uppercase tracking-[6px] block">GRIDPASS PASSPORT</span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                      {vehicle.year} {vehicle.make}
                    </h2>
                    <h1 className="text-3xl font-black uppercase tracking-tight leading-none" style={{ color: accentColor }}>
                      {vehicle.model}
                    </h1>
                  </div>

                  {/* Body Specs */}
                  <div className="space-y-4 my-6 relative z-10 px-4">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Specifications</h4>
                      <div className="h-[1px] bg-neutral-800 mt-1" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-y-2 text-xs font-semibold">
                      <span className="text-neutral-500">Engine / Motor</span>
                      <span className="col-span-2 text-white font-bold">{vehicle.specs?.engine || 'N/A'}</span>

                      <span className="text-neutral-500">Output Power</span>
                      <span className="col-span-2 text-white font-bold">{vehicle.specs?.hp ? `${vehicle.specs.hp} HP` : 'N/A'}</span>

                      <span className="text-neutral-500">Registry Tag</span>
                      <span className="col-span-2 font-mono font-bold" style={{ color: accentColor }}>{tagId}</span>
                    </div>

                    {/* Modifications List */}
                    {includeMods && (
                      <div className="space-y-2 pt-2">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Modifications</h4>
                          <div className="h-[1px] bg-neutral-800 mt-1" />
                        </div>
                        <ul className="space-y-1.5 text-xs text-neutral-300">
                          {customMods.split(',').slice(0, 4).map((mod, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-neutral-500">•</span>
                              <span>{mod.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer Check-in & QR code */}
                  <div className="flex items-end justify-between relative z-10 pt-4 border-t border-neutral-900">
                    <div className="space-y-2 max-w-[200px]">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: accentColor }}>
                        Scan to Vote / Spotted
                      </div>
                      <p className="text-[9px] text-neutral-500 font-bold leading-normal uppercase">
                        Scan the code on the right with any phone camera to view specs & track logs.
                      </p>
                    </div>
                    <div className="w-24 h-24 bg-white p-1 rounded shadow-md flex items-center justify-center shrink-0">
                      <img src={qrCodeImgSrc} alt="QR Code" className="w-full h-full" />
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

        {/* Print-At-Home vs Shipped comparison */}
        <div className="no-print space-y-6 pt-10 border-t border-neutral-900">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Decal Print Options</h2>
            <p className="text-xs text-neutral-500 font-medium">Compare DIY local printing versus ordering weatherproof, track-ready vinyl badges.</p>
          </div>

          <div className="glass-card overflow-hidden rounded-3xl border border-neutral-900 bg-neutral-950/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Feature</th>
                  <th className="p-4">Print-At-Home (DIY)</th>
                  <th className="p-4 text-red-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Shipped Weatherproof Vinyl
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/50 font-medium text-neutral-300">
                <tr>
                  <td className="p-4 font-bold text-white">Price</td>
                  <td className="p-4 text-emerald-400 font-mono font-bold">FREE ($0)</td>
                  <td className="p-4 text-white font-mono font-bold">$15.00 / pack</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Material</td>
                  <td className="p-4">Standard Paper Label / Office Cardstock</td>
                  <td className="p-4 text-white font-bold">Premium Weatherproof Adhesive Vinyl</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">UV Protection</td>
                  <td className="p-4">None (Fades under direct sunlight in days)</td>
                  <td className="p-4 text-white">UV-Laminate Gloss Finish (Protects print colors)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Lifespan</td>
                  <td className="p-4 text-neutral-500">1 - 3 Months</td>
                  <td className="p-4 text-yellow-500 font-bold">3 - 5+ Years (Indoors or Outdoors)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Water Resistance</td>
                  <td className="p-4">Low (Inks bleed when wet)</td>
                  <td className="p-4 text-white flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500" /> 100% Waterproof & Jet-wash safe</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">QR Reliability</td>
                  <td className="p-4 text-neutral-500">Dependent on printer resolution & ink bleed</td>
                  <td className="p-4 text-white">High Contrast Precision Cut (Guaranteed scans)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Upgrade Supporter Modal */}
      {showSupporterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-yellow-500/20 bg-neutral-950/95 text-center space-y-6">
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mx-auto animate-bounce">
              <Heart className="w-8 h-8 fill-yellow-500/10" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Unlock Supporter Themes</h3>
              <p className="text-xs text-neutral-405 leading-relaxed font-medium">
                The **Glowing Gold** border theme is reserved exclusively for Gridpass Original Supporters. Support our development to unlock lifetime customization badges.
              </p>
            </div>

            <div className="bg-neutral-900/50 border border-neutral-900 p-4 rounded-2xl flex items-center gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-yellow-500 shrink-0" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-white block uppercase">Supporter Privileges</span>
                Gold avatar ring, gold poster borders, and priority waitlist clearance for upcoming racing logs.
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleBecomeSupporter}
                className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-yellow-500/20 cursor-pointer min-h-[54px]"
              >
                Pledge Support ($5.00)
              </button>
              <button
                onClick={() => setShowSupporterModal(false)}
                className="w-full py-3 bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer min-h-[54px]"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="no-print">
        <Footer />
      </div>
    </main>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#bd2925] animate-spin" />
      </div>
    }>
      <PrintPageContent />
    </Suspense>
  );
}
