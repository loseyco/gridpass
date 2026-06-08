'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Anchor, ExternalLink, ShieldCheck, MapPin, 
  AlertTriangle, Navigation, Star, ShoppingCart, Check, Info, Compass, Sparkles,
  Link2, MessageSquare, Share2, Send, CheckCircle2, Facebook, Twitter, Building2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GUIDES } from '@/lib/data/guides';

export default function GuideArticleClient({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const guide = GUIDES.find((g) => g.slug === slug);

  // Sharing states
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Suggestions form states
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [requestCredit, setRequestCredit] = useState(true);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [suggestionSuccess, setSuggestionSuccess] = useState(false);

  // Interactive buoy state for Round Lake guide
  const [selectedBuoy, setSelectedBuoy] = useState<string>('slalom-overview');

  // Admin seeding states
  const [adminCopied, setAdminCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // Check admin privileges (either email matches or ?admin=true search param)
  const isAdmin = user?.email === 'loseyp@gmail.com' || searchParams.get('admin') === 'true';
  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

  // Format Facebook Seeding Template
  const facebookPostText = guide?.facebookTemplate
    ? guide.facebookTemplate.replace('[LINK]', currentUrl)
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAdminPost = () => {
    navigator.clipboard.writeText(facebookPostText);
    setAdminCopied(true);
    setTimeout(() => setAdminCopied(false), 2000);
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim() || !contributorName.trim()) return;
    setSubmittingSuggestion(true);

    const payload = {
      type: 'guide_suggestion',
      guide_slug: slug,
      guide_title: guide?.title || '',
      contributor_name: contributorName.trim(),
      email: contributorEmail.trim() || 'Not Provided',
      suggestion: suggestionText.trim(),
      request_credit: requestCredit,
      created_at: isMock ? new Date().toISOString() : serverTimestamp()
    };

    if (isMock) {
      await new Promise(r => setTimeout(r, 200));
      setSuggestionSuccess(true);
      setSubmittingSuggestion(false);
      return;
    }

    try {
      await addDoc(collection(db, 'feedback_queue'), payload);
      setSuggestionSuccess(true);
      setContributorName('');
      setContributorEmail('');
      setSuggestionText('');
    } catch (err) {
      console.error("Failed to submit guide suggestion:", err);
      alert("There was an error submitting your suggestion. Please try again.");
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  if (!guide) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center space-y-4">
        <Anchor className="w-16 h-16 text-neutral-700 animate-bounce" />
        <h2 className="text-xl font-bold uppercase tracking-wider">Guide Not Found</h2>
        <Link href="/guides" className="text-xs font-mono text-[#bd2925] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Guides
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden selection:bg-rose-500/30 flex flex-col justify-between">
      {/* Carbon/Crimson ambient background glow */}
      <div className="mesh-glow" />

      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/guides" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Guides
          </Link>
          <span className="text-[10px] font-mono font-bold bg-[#bd2925]/5 border border-[#bd2925]/25 text-rose-405 px-3 py-1 rounded-full uppercase tracking-wider">
            Category: {guide.category}
          </span>
        </div>

        {/* Super Admin Seeding Console */}
        {mounted && isAdmin && (
          <div className="glass-card p-6 rounded-3xl border border-rose-500/20 bg-rose-500/[0.02] space-y-4 text-left animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Super Admin Seeding Console</h3>
            </div>
            
            <div className="space-y-3">
              <p className="text-[11px] text-neutral-405 leading-normal">
                Seed this guide in local Facebook Groups (e.g., Fox Chain boating/jet ski groups) using the pre-written copy below.
              </p>
              
              <div className="bg-[#0b0b0f] border border-neutral-900 rounded-2xl p-4 text-xs font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed select-all">
                {facebookPostText}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopyAdminPost}
                  className="flex-1 py-3 bg-[#bd2925] hover:bg-[#bd2925]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#bd2925]/15"
                >
                  <Share2 className="w-4 h-4" />
                  {adminCopied ? 'Post Copied!' : 'Copy Seeding Post'}
                </button>
                <a
                  href={`https://www.facebook.com/groups/search/groups/?q=fox%20chain%2520o%2520lakes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 border border-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer"
                >
                  <Facebook className="w-4 h-4 text-blue-500" />
                  Search Local Groups
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Article Header Card */}
        <header className="glass-card p-8 md:p-10 rounded-[2rem] border-neutral-900 bg-neutral-950/40 space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-500">
            <span>Published {guide.publishDate}</span>
            <span>•</span>
            <span>{guide.readTime}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            {guide.title}
          </h1>

          <p className="text-base md:text-lg text-neutral-405 leading-relaxed max-w-3xl">
            {guide.description}
          </p>
        </header>

        {/* Viewer/Guest Sharing Bar */}
        <div className="glass-card p-4 rounded-3xl border border-neutral-900 bg-neutral-950/20 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5 pl-2">
            <Share2 className="w-3.5 h-3.5 text-rose-500" /> Share This Passport
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {mounted ? (
              <>
                {/* Copy Link Button */}
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    copied
                      ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-450'
                      : 'bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                {/* Facebook Share Button */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Facebook className="w-3.5 h-3.5 text-blue-500" />
                  <span>Facebook</span>
                </a>

                {/* X Share Button */}
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(guide.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Twitter className="w-3.5 h-3.5 text-white" />
                  <span>Share to X</span>
                </a>

                {/* SMS Share Button */}
                <a
                  href={`sms:?&body=${encodeURIComponent(`Check out this guide: ${guide.title} - ${currentUrl}`)}`}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                  <span>Text SMS</span>
                </a>
              </>
            ) : (
              <div className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 border border-neutral-850 text-neutral-500 flex items-center gap-1.5 opacity-50">
                <Link2 className="w-3.5 h-3.5 text-neutral-600" />
                <span>Copy Link</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Article body column */}
          <article className="lg:col-span-8 space-y-12 text-left">
            
            {/* Context/Background Section */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                <Info className="w-5 h-5 text-rose-500" />{' '}
                {guide.slug === 'fox-chain-pwc-anchoring-launch-guide'
                  ? 'Bottom Conditions & Setting Up'
                  : guide.slug === 'round-lake-buoy-colored-meanings'
                  ? 'Round Lake Buoys & Regulations'
                  : 'Introduction & Overview'}
              </h2>
              <div className="text-sm text-neutral-450 leading-relaxed space-y-4">
                {guide.introduction && guide.introduction.length > 0 ? (
                  guide.introduction.map((paragraph, index) => (
                    <p 
                      key={index} 
                      dangerouslySetInnerHTML={{ 
                        __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                      }} 
                    />
                  ))
                ) : (
                  <>
                    <p>
                      The Fox Chain O&apos; Lakes and Round Lake in Illinois present a unique challenge for PWC anchoring. The lake bottom is notoriously soft—composed primarily of mud, deep silt, clay, and organic weed debris. 
                    </p>
                    <p>
                      Because these lakes are extremely popular on summer weekends, your 900+ lb Sea-Doo GTI SE will be constantly hit by heavy boat wakes. Standard grapnel/folding anchors (which fold like umbrellas) will drag right through this muck, risking damage to your hull. 
                    </p>
                    <p>
                      To hold your heavy PWC securely, a **fluke-style (Danforth)** anchor is required. Flukes are designed to dig deeper the harder they are pulled.
                    </p>
                  </>
                )}
              </div>
            </section>

            {/* Custom Slalom & Buoys Visualizer for Round Lake guide */}
            {guide.slug === 'round-lake-buoy-colored-meanings' && (
              <section className="space-y-6">
                <div className="relative border border-neutral-900 bg-neutral-950/40 rounded-3xl p-6 overflow-hidden space-y-6">
                  {/* Aquatic overlay background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0e2a35]/35 via-[#0c1f28]/20 to-[#020617]/50 pointer-events-none" />
                  
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2 relative z-10">
                    <Compass className="w-5 h-5 text-rose-500" /> Interactive Slalom Course Map
                  </h2>
                  
                  <p className="text-xs text-neutral-400 relative z-10 leading-relaxed">
                    Round Lake Beach hosts a standard 6-buoy water ski slalom course. Tap the markers on the course to see their function, rules, and impeller hazard notices.
                  </p>

                  {/* Visual Grid of the Course */}
                  <div className="relative z-10 border border-neutral-900/40 bg-neutral-950/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-8 max-w-md mx-auto py-8">
                    
                    {/* Water wave texture or lane lines */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 border-dashed border-neutral-800/30 pointer-events-none" />

                    {/* Entry Gates (Green) */}
                    <div className="flex items-center gap-10">
                      <button 
                        type="button"
                        onClick={() => setSelectedBuoy('green-gate')}
                        className={`relative group h-6 w-6 rounded-full bg-emerald-500 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.7)] ${selectedBuoy === 'green-gate' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''}`}
                      >
                        <span className="absolute -top-6 text-[8px] font-mono font-bold text-emerald-400 uppercase whitespace-nowrap">Gate (Green)</span>
                      </button>
                      <div className="text-[10px] font-mono text-neutral-600 select-none">Start Gates</div>
                      <button 
                        type="button"
                        onClick={() => setSelectedBuoy('green-gate')}
                        className={`relative group h-6 w-6 rounded-full bg-emerald-500 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.7)] ${selectedBuoy === 'green-gate' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''}`}
                      >
                        <span className="absolute -top-6 text-[8px] font-mono font-bold text-emerald-450 uppercase whitespace-nowrap">Gate (Green)</span>
                      </button>
                    </div>

                    {/* Turn 1 (Red Left) & Boat Guide 1 (Yellow Center) */}
                    <div className="grid grid-cols-3 w-full items-center justify-items-center">
                      {/* Turn Buoy Left */}
                      <button 
                        type="button"
                        onClick={() => setSelectedBuoy('red-turn')}
                        className={`relative h-6 w-6 rounded-full bg-rose-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.7)] ${selectedBuoy === 'red-turn' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''}`}
                      >
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-rose-405 uppercase whitespace-nowrap">Turn 1 (Red)</span>
                      </button>
                      
                      {/* Boat Guide Center */}
                      <button 
                        type="button"
                        onClick={() => setSelectedBuoy('yellow-guide')}
                        className={`relative h-6 w-6 rounded-full bg-yellow-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.7)] ${selectedBuoy === 'yellow-guide' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''}`}
                      >
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-yellow-500 uppercase whitespace-nowrap">Guide (Yellow)</span>
                      </button>
                      
                      {/* Empty space on right */}
                      <div className="h-6 w-6" />
                    </div>

                    {/* Boat Guide 2 (Yellow Center) & Turn 2 (Red Right) */}
                    <div className="grid grid-cols-3 w-full items-center justify-items-center">
                      {/* Empty space on left */}
                      <div className="h-6 w-6" />
                      
                      {/* Boat Guide Center */}
                      <button 
                        type="button"
                        onClick={() => setSelectedBuoy('yellow-guide')}
                        className={`relative h-6 w-6 rounded-full bg-yellow-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.7)] ${selectedBuoy === 'yellow-guide' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''}`}
                      >
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-yellow-500 uppercase whitespace-nowrap">Guide (Yellow)</span>
                      </button>

                      {/* Turn Buoy Right */}
                      <button 
                        type="button"
                        onClick={() => setSelectedBuoy('red-turn')}
                        className={`relative h-6 w-6 rounded-full bg-rose-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.7)] ${selectedBuoy === 'red-turn' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''}`}
                      >
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-rose-405 uppercase whitespace-nowrap">Turn 2 (Red)</span>
                      </button>
                    </div>

                    {/* Submerged Cable Grid Visual Callout */}
                    <button 
                      type="button"
                      onClick={() => setSelectedBuoy('ski-anchors')}
                      className={`relative w-4/5 py-2.5 rounded-xl border border-dashed text-center hover:bg-red-500/5 transition-all cursor-pointer ${
                        selectedBuoy === 'ski-anchors' 
                          ? 'border-red-500 bg-red-950/20 text-red-400 font-bold' 
                          : 'border-neutral-800 text-neutral-500 hover:border-neutral-750'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span>Submerged Cable Grid & Anchors</span>
                      </div>
                      <div className="text-[8px] font-mono text-neutral-600 mt-0.5">Lies ~1.5 feet beneath water surface</div>
                    </button>

                    {/* Exit Gates (Green) */}
                    <div className="flex items-center gap-10">
                      <button 
                        type="button"
                        onClick={() => setSelectedBuoy('green-gate')}
                        className={`relative group h-6 w-6 rounded-full bg-emerald-500 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.7)] ${selectedBuoy === 'green-gate' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''}`}
                      >
                        <span className="absolute -bottom-6 text-[8px] font-mono font-bold text-emerald-400 uppercase whitespace-nowrap">Gate (Green)</span>
                      </button>
                      <div className="text-[10px] font-mono text-neutral-600 select-none">Exit Gates</div>
                      <button 
                        type="button"
                        onClick={() => setSelectedBuoy('green-gate')}
                        className={`relative group h-6 w-6 rounded-full bg-emerald-500 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.7)] ${selectedBuoy === 'green-gate' ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''}`}
                      >
                        <span className="absolute -bottom-6 text-[8px] font-mono font-bold text-emerald-450 uppercase whitespace-nowrap">Gate (Green)</span>
                      </button>
                    </div>

                  </div>

                  {/* Description Panel for Selected Element */}
                  <div className="glass-card p-5 border border-neutral-900 bg-neutral-950/40 rounded-2xl relative overflow-hidden transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/50 to-transparent pointer-events-none" />
                    
                    {selectedBuoy === 'slalom-overview' && (
                      <div className="space-y-2 relative z-10 text-left">
                        <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">Course Overview & Rules</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          The slalom course on Round Lake is a sanctioned zone designed for competitive and recreational water skiing. The entire setup is held in place by a heavy galvanized steel cable grid submerged about 1.5 to 2 feet under the water, anchored by massive concrete blocks.
                        </p>
                        <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex gap-2 items-start mt-2">
                          <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-neutral-405 leading-normal">
                            <strong>Jet Ski Warning:</strong> While it looks like an obstacle course, riding a jet ski (PWC) at high speed through these buoys is highly dangerous. Sucking in tethers or cables can instantly ruin your impeller. Tap any buoy above to learn details.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedBuoy === 'green-gate' && (
                      <div className="space-y-2 relative z-10 text-left">
                        <h4 className="text-xs font-mono font-black text-emerald-405 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                          Entry / Exit Gates (Green Ball Buoys)
                        </h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Two green balls mark the beginning and end of the slalom course. The boat driver must steer the tow boat exactly between these gates, and the water skier must cross through the center of the start gates to initiate their scored run.
                        </p>
                        <p className="text-[11px] text-neutral-500 leading-normal">
                          <strong>Location:</strong> Positioned at the extreme north and south ends of the slalom grid on Round Lake.
                        </p>
                      </div>
                    )}

                    {selectedBuoy === 'red-turn' && (
                      <div className="space-y-2 relative z-10 text-left">
                        <h4 className="text-xs font-mono font-black text-rose-405 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,1)]" />
                          Turn Buoys (Red / Orange Ball Buoys)
                        </h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          Six red round balls sit on the outer edges of the course (three on the left, three on the right). The skier must swing wide and navigate around the outside of each of these six turn markers sequentially while the boat continues straight.
                        </p>
                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-2 items-start text-[11px]">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <p className="text-neutral-400 leading-normal">
                            <strong>PWC Caution:</strong> Avoid jumping, splashing, or running too close to the red balls. Their tethers are tensioned under water; hit one at speed, and you could slice the line, causing the buoy to float away, which carries municipal fines.
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedBuoy === 'yellow-guide' && (
                      <div className="space-y-2 relative z-10 text-left">
                        <h4 className="text-xs font-mono font-black text-yellow-555 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,1)]" />
                          Boat Path Guides (Yellow Ball Buoys)
                        </h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          These yellow balls form a narrow central corridor down the exact middle of the course. The tow boat must drive straight down this line, keeping the yellow balls on either side of the hull. This keeps the skier aligned and provides a consistent pull.
                        </p>
                        <p className="text-[11px] text-neutral-500 leading-normal">
                          <strong>Riding Rule:</strong> Boats and PWCs not towing a skier should steer clear of this central corridor to prevent safety hazards.
                        </p>
                      </div>
                    )}

                    {selectedBuoy === 'ski-anchors' && (
                      <div className="space-y-2 relative z-10 text-left">
                        <h4 className="text-xs font-mono font-black text-red-505 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Submerged Cables & Ski Anchors
                        </h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          The secret to a perfect slalom course is the <strong>submerged frame</strong>. Heavy-duty galvanized steel cables or tensioned high-strength lines run just 1 to 2 feet under the water surface, connecting all buoy tethers to massive concrete anchor weights on the lake bed.
                        </p>
                        <div className="p-3.5 bg-red-950/20 border border-red-500/35 rounded-xl space-y-2">
                          <div className="font-bold text-white text-[11px] uppercase flex items-center gap-1.5 text-red-405">
                            <Info className="w-4 h-4 text-red-500" /> PWC IMPELLER DESTRUCTION RISK
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            Jet skis generate propulsion by vacuuming water into the intake grate. If you idle, drift, or start your jet ski directly over the slalom course:
                          </p>
                          <ul className="list-disc list-inside text-[10px] text-neutral-400 space-y-1 pl-1">
                            <li>The intense suction will pull the floating rope tethers or loose steel guide lines right into your intake grate.</li>
                            <li>Once inside, the driveshaft (spinning at up to 8,000 RPM) will instantly wrap the lines, shearing your wear ring and bending the impeller.</li>
                            <li>In worst cases, this locks the engine, cracks the pump housing, and requires a tow and an expensive mechanical rebuild.</li>
                          </ul>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </section>
            )}

            {/* Gear Recommendation Section */}
            {guide.gear && guide.gear.length > 0 && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-rose-500" />{' '}
                    {guide.gearSectionTitle || 'Recommended Gear'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {guide.gearSectionDesc || 'Compare the best products and setups.'}
                  </p>
                </div>

                <div className="space-y-6">
                  {guide.gear.map((item) => (
                    <div key={item.name} className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden hover:border-neutral-800 transition-colors">
                      
                      {/* Badge Accent Glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none" />

                      <div className="flex-1 space-y-4">
                        {/* Badge / Title */}
                        <div className="flex items-start md:items-center flex-wrap gap-2.5">
                          <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                            item.badge === 'Premium Choice' 
                              ? 'bg-yellow-500 text-black font-black' 
                              : item.badge === 'Community Favorite'
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                              : item.badge === 'Best Value'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {item.badge}
                          </span>
                          
                          <div className="flex items-center gap-1 text-xs font-mono font-bold text-yellow-500">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
                            <span>{item.rating.toFixed(1)} / 5</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-white uppercase leading-snug">{item.name}</h3>
                          <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                        </div>

                        {/* Pros & Cons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Pros</span>
                            <ul className="space-y-1">
                              {item.pros.map((pro) => (
                                <li key={pro} className="flex items-center gap-1.5 text-neutral-300">
                                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Cons</span>
                            <ul className="space-y-1">
                              {item.cons.map((con) => (
                                <li key={con} className="flex items-center gap-1.5 text-neutral-400">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Checkout Column */}
                      <div className="w-full md:w-48 shrink-0 flex flex-col justify-center items-center md:items-end md:border-l border-neutral-900 md:pl-6 gap-3">
                        <div className="text-center md:text-right">
                          <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Estimated Price</div>
                          <div className="text-2xl font-black text-white font-mono mt-0.5">{item.price}</div>
                          <div className="text-[9px] font-mono text-neutral-500">Excl. Shipping & Tax</div>
                        </div>

                        <a 
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full btn-glow bg-[#bd2925] hover:bg-[#bd2925]/90 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Buy on Amazon
                        </a>
                      </div>

                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Local Launch Spots Directory */}
            {guide.launches && guide.launches.length > 0 && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-rose-500" />{' '}
                    {guide.launchesTitle || 'Boat Launch Ramps'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {guide.launchesDesc || 'Explore the best launch points and marinas.'}
                  </p>
                </div>

                <div className="space-y-6">
                  {guide.launches.map((launch) => (
                    <div key={launch.name} className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-900/60 pb-3">
                        <h3 className="text-lg font-black text-white uppercase">{launch.name}</h3>
                        <span className="text-[10px] font-mono font-bold bg-[#bd2925]/10 border border-[#bd2925]/30 text-rose-450 px-3 py-1 rounded-full uppercase tracking-wider">
                          Fee: {launch.fee}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-400 leading-relaxed">{launch.desc}</p>

                      <div className="flex flex-wrap items-center gap-6 text-[10px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1.5 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {launch.location}
                        </span>
                      </div>

                      {/* Amenities & Navigation */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {launch.amenities.map((amenity) => (
                            <span key={amenity} className="text-[9px] font-mono font-bold text-neutral-500 bg-neutral-900 border border-neutral-850 px-2.5 py-0.5 rounded">
                              {amenity}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 self-stretch sm:self-auto w-full sm:w-auto">
                          <Link 
                            href={`/b/${launch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-855 border border-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 justify-center text-center cursor-pointer flex-1 sm:flex-none"
                          >
                            <Building2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>View Business Hub</span>
                          </Link>

                          <a 
                            href={launch.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border border-neutral-800 hover:bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 justify-center text-center cursor-pointer flex-1 sm:flex-none"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>Get Directions</span>
                          </a>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Crowdsourced Suggestions Form */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                  <Send className="w-5 h-5 text-rose-500" /> Help Us Improve This Guide
                </h2>
                <p className="text-xs text-neutral-400">
                  Know a hidden sandbar or a better boat ramp? Submit a suggestion below. Our AI curator will review it, and if accepted, you&apos;ll get credited on this guide!
                </p>
              </div>

              {suggestionSuccess ? (
                <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.02] text-center space-y-4 animate-in zoom-in-95 duration-300">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white uppercase">Suggestion Submitted!</h4>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                      Thank you for contributing. Our AI curator will evaluate your input shortly. If approved, you will see your handle added to the contributor credits roll.
                    </p>
                  </div>
                  <button
                    onClick={() => setSuggestionSuccess(false)}
                    className="px-5 py-2 border border-neutral-800 hover:bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Submit Another Correction
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSuggestionSubmit} className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Driver Handle / Name</label>
                      <input 
                        type="text" 
                        required
                        value={contributorName}
                        onChange={(e) => setContributorName(e.target.value)}
                        placeholder="e.g. WaveRunnerMarcus" 
                        className="glass-input w-full p-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Contact Email (Optional)</label>
                      <input 
                        type="email" 
                        value={contributorEmail}
                        onChange={(e) => setContributorEmail(e.target.value)}
                        placeholder="e.g. driver@domain.com" 
                        className="glass-input w-full p-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Your Suggestion or Correction</label>
                    <textarea 
                      rows={4}
                      required
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                      placeholder="e.g. Petite Lake sandbar is mostly clay, not sand. Also, Barnacle Bud's ramp is now closed, but Barnacle Point is open..." 
                      className="glass-input w-full p-2.5 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox"
                      id="requestCredit"
                      checked={requestCredit}
                      onChange={(e) => setRequestCredit(e.target.checked)}
                      className="rounded border-neutral-800 text-rose-500 focus:ring-rose-500 bg-neutral-900 h-4 w-4"
                    />
                    <label htmlFor="requestCredit" className="text-[10px] font-mono text-neutral-400 font-bold uppercase select-none cursor-pointer">
                      Accredit my handle on this guide if accepted
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={submittingSuggestion}
                    className="px-6 py-3 bg-[#bd2925] hover:bg-[#bd2925]/90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submittingSuggestion ? 'Submitting...' : 'Submit Suggestion'}</span>
                  </button>
                </form>
              )}
            </section>

          </article>

          {/* Sidebar Widgets Column */}
          <div className="lg:col-span-4 space-y-6 text-left">
            
            {/* Contributor credits roll */}
            {guide.contributors && guide.contributors.length > 0 && (
              <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-500" /> Contributor Credits
                </h3>
                
                <p className="text-[10px] text-neutral-500 leading-normal">
                  Special thanks to the local drivers and riders who contributed details, verification, and feedback to this handbook:
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {guide.contributors.map((name) => (
                    <span 
                      key={name} 
                      className="text-[10px] font-mono font-bold text-neutral-300 bg-neutral-900 border border-neutral-850 px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <UserCircle className="w-3 h-3 text-rose-500" />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Local Rules checklist widget */}
            {guide.rules && guide.rules.length > 0 && (
              <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Regulations & Safety
                </h3>

                <div className="space-y-3.5">
                  {guide.rules.map((rule) => (
                    <div key={rule.title} className="space-y-1 text-xs">
                      <h4 className="font-bold text-white uppercase flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {rule.title}
                      </h4>
                      <p className="text-neutral-450 leading-normal pl-3">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gridpass QR Tag Callout */}
            <div className="glass-card p-6 rounded-3xl border border-yellow-500/15 bg-yellow-500/[0.01] space-y-4">
              <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-500" /> Claim Your PWC Tag
              </h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Connect your watercraft to the digital network. Setup a beautiful public specs profile, log aftermarket wraps or hull updates, and let spotters tag your build at the docks.
              </p>
              <Link 
                href="/login?redirect=/dash" 
                className="w-full btn-glow bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[10px] uppercase tracking-wider py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Claim Free Passport
              </Link>
            </div>

          </div>
        </div>

        {/* Affiliate Link FTC Disclosure Statement */}
        <div className="text-center pt-8 border-t border-neutral-900/60 max-w-2xl mx-auto">
          <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
            Disclosure: Gridpass is reader-supported. Some products recommended in this guide contain Amazon affiliate tracking links (using the tracking tag **loseyco-20**). When you click and buy through these links, we may earn an affiliate referral commission at no additional cost to you.
          </p>
        </div>

      </div>

      <Footer />
    </main>
  );
}

// Simple inline SVG User icon replacement to avoid missing imports
function UserCircle({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
