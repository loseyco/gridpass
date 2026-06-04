'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Check, Shield, Sparkles, Activity, Cpu, Wrench, 
  ArrowRight, Landmark, CreditCard, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  badge?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  buttonText: string;
  itemType: 'premium_upgrade' | 'day_pass' | 'subscription';
  features: string[];
}

export default function Pricing() {
  const { user } = useAuth();
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const getActiveIdentityPrice = (qty: number) => {
    if (qty >= 10) return 0.99;
    if (qty >= 3) return 1.49;
    return 1.99;
  };

  const tiers: PricingTier[] = [
    {
      id: 'active_identity',
      name: 'Active Identity Passport',
      price: 1.99,
      period: 'per month',
      badge: 'Popular',
      description: 'The low-friction monthly subscription for your active identity. Less than the price of a cup of coffee or a Monster Energy drink per month. Literally half the price of a single gallon of gas to give your rig a permanent, verified digital identity. Covers any asset — car, boat, bike, dog, trailer, or pilot profile.',
      icon: Sparkles,
      accentColor: 'from-neutral-900/60 to-[#bd2925]/10 border-[#bd2925]/30 text-[#bd2925]',
      buttonText: 'Subscribe Now',
      itemType: 'subscription',
      features: [
        'Covers any asset (car, boat, bike, dog, trailer, or pilot)',
        '100% Dynamic, Re-routable Tags (instant reassignment to any asset or business)',
        'Real-time Resolution via Firestore (infinitely reusable sticker)',
        'Permanent, flexible dynamic redirection asset',
        'Dynamic QR-code identity resolution',
        'Immutable digital service logbook',
        'Interactive modifications spec sheet',
        'Scan location geo-analytics map',
        'Peer-to-peer digital ownership transfer',
        'Cancel anytime subscription'
      ]
    },
    {
      id: 'b2b_free_portal',
      name: 'Dealership & Track Gate Portal',
      price: 0.00,
      period: 'Priority Waitlist Active',
      badge: 'Coming Soon',
      description: 'Zero flat monthly base fees. Provision printed paddock banners, publish paperless waivers, set up track spectator gates, and pay only standard commission on ticket splits.',
      icon: Cpu,
      accentColor: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      buttonText: 'Join Waitlist',
      itemType: 'subscription',
      features: [
        '100% Free Signup (Zero flat B2B base fees)',
        'Dynamic Volume Billing per active tag (Automatically falls to $0.99/mo for 10+ tags)',
        'Free Track Gate Portals (Zero monthly subscription fee for event organizers)',
        'Printed gate QR banners, signs & sheets',
        'Secure spectator ticket splits via Stripe Connect',
        'Phones & tablets as scanners (No hardware required)',
        'Paperless mobile liability safety waivers',
        'Stripe Express bank split-payouts'
      ]
    }
  ];

  const faqs = [
    {
      q: "Do tracks or garages need proprietary scanning hardware?",
      a: "Not at all. GridPass works directly on standard smartphones and tablets, meaning zero hardware costs. Organizers can also print out their venue's unique check-in QR codes on large gate signs, banners, track sheets, or spectator handouts to let drivers scan and check in themselves."
    },
    {
      q: "Does this require hands-on management from the founder?",
      a: "No. Everything operates on autopilot. Registration keys, Stripe Connected accounts, spectator ticket splits, digital waivers, and hosting billing collections run completely on serverless workflows."
    },
    {
      q: "How do the split payouts work for racetracks and garages?",
      a: "Racetracks connect their bank details in 30 seconds via Stripe Express. When spectators scan a tag and purchase gate passes, Stripe instantly routes the ticket balance to the track and your transaction commission cut directly to your Stripe account."
    },
    {
      q: "Can I transfer my Digital Driver Passport if I sell my car?",
      a: "Yes. The physical GridPass QR tag stays with the chassis forever. When you sell the vehicle, click 'Transfer Ownership' in your dashboard to instantly hand over the digital logbook and specs index to the new buyer."
    },
    {
      q: "Are there any hidden transaction fees?",
      a: "For tracks and service garages, the standard Stripe processing fee (2.9% + 30¢) applies. GridPass collects a tiny 1.0% + $1.50 application cut to power the serverless routing networks."
    },
    {
      q: "Are the physical QR code stickers permanent or can I re-assign them to different assets?",
      a: "They are completely flexible! Every physical Gridpass sticker or card is a permanent, flexible dynamic redirection asset. Because scanner resolution is performed dynamically in real-time in Firestore, you can instantly unlink a physical tag from a vehicle or asset and re-assign it to another asset (such as a car, boat, bike, dog collar, or personal card) or partner business on the fly. The physical sticker is infinitely reusable and re-routable."
    },
    {
      q: "How does bulk decal distribution and scan-to-activate work?",
      a: "It is the ultimate high-velocity physical growth loop! Clubs, tracks, and meets can print massive rolls of unassigned, generic QR code stickers and hand them out immediately at car shows or gates. When an enthusiast scans an unlinked tag, our optimized 30-second onboarding flow (/join?id=xxx) dynamically guides them through a 30-second registration, registers their vehicle inline, and instantly activates the tag and $1.99/mo subscription on the spot."
    }
  ];

  const handleCheckout = async (tier: PricingTier) => {
    if (tier.id === 'b2b_free_portal') {
       alert("Thank you for your interest! The Dealership & Track Gate Portal is coming soon. You've been successfully added to our priority waitlist!");
       return;
     }

    if (!user) {
      // Direct guest to log in first so they establish their driver key
      router.push(`/login?redirect=/pricing&tier=${tier.id}`);
      return;
    }

    setLoadingTier(tier.id);
    try {
      const isIdentity = tier.id === 'active_identity';
      const actualPrice = isIdentity ? getActiveIdentityPrice(quantity) : tier.price;
      const actualQty = isIdentity ? quantity : 1;

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: 'platform',
          itemName: tier.name,
          itemType: tier.itemType,
          price: actualPrice,
          quantity: actualQty,
          gridPassFee: 0,
          userId: user.uid,
          userEmail: user.email || 'loseyp@gmail.com',
          redirectUrl: '/dash'
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.assign(data.url); // Forward directly to secure Stripe billing
      } else {
        console.error("No checkout URL returned:", data);
        alert("Failed to provision Stripe session. Wires disconnected.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Billing network offline. Please retry in paddock.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden selection:bg-blue-500/30">
      {/* Dynamic ambient mesh glow */}
      <div className="mesh-glow" />

      {/* Global Navigation Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-8 px-6 max-w-5xl mx-auto text-center space-y-6 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          Secure Autonomous Checkout
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white leading-tight">
          Select Your Plan. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-500 to-[#bd2925]">
            Launch On Autopilot.
          </span>
        </h1>

        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Zero-maintenance digital products designed to run hands-off. Secure Stripe Connect payment routing, automated paperless waivers, and dynamic serverless hosting keys.
        </p>
      </section>

      {/* Tiers Grid */}
      <section className="py-12 px-6 max-w-4xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div 
                key={tier.id} 
                className={`glass-card p-8 rounded-3xl border flex flex-col justify-between relative bg-gradient-to-b ${tier.accentColor}`}
              >
                {tier.badge && (
                  <span className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-black text-[9px] uppercase px-2.5 py-1 rounded-full tracking-widest shadow-md">
                    {tier.badge}
                  </span>
                )}

                <div className="space-y-6">
                  {/* Tier Title & Icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">{tier.name}</h3>
                      <span className="text-xs text-neutral-500 font-mono">AUTOPILOT_SAAS</span>
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      {tier.id === 'b2b_free_portal' ? (
                        <span className="text-3xl font-black text-white">
                          Coming Soon
                        </span>
                      ) : (
                        <>
                          <span className="text-4xl font-black text-white font-mono">
                            ${tier.id === 'active_identity' ? getActiveIdentityPrice(quantity).toFixed(2) : tier.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">USD</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 block font-semibold">
                      {tier.id === 'b2b_free_portal' ? 'Priority Waitlist Active' : (
                        <>{tier.period} {tier.id === 'active_identity' && `(Total: $${(getActiveIdentityPrice(quantity) * quantity).toFixed(2)}/mo)`}</>
                      )}
                    </span>
                    {tier.id === 'active_identity' && (
                      <p className="text-[11px] text-[#bd2925]/90 leading-normal font-medium mt-1.5 border-l-2 border-[#bd2925]/30 pl-2">
                        Less than the price of a cup of coffee or a Monster Energy drink per month. Literally half the price of a single gallon of gas to give your rig a permanent, verified digital identity.
                      </p>
                    )}
                  </div>

                  <p className="text-neutral-400 text-xs leading-relaxed">{tier.description}</p>

                  {tier.id === 'active_identity' && (
                    <div className="space-y-2 py-3 bg-white/5 border border-white/10 rounded-2xl p-4 my-2">
                      <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest block">Fleet Passport Quantity</span>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-sm font-black font-mono w-8 text-center">{quantity}</span>
                          <button 
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 flex items-center justify-center font-bold text-white transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-500 font-mono block">Fleet Tier:</span>
                          <span className="text-xs font-bold text-[#bd2925] font-mono uppercase">
                            {quantity >= 10 ? 'Commercial' : quantity >= 3 ? 'Enthusiast' : 'Single'}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium pt-1.5 border-t border-neutral-900">
                        {quantity >= 10 ? 'Save 50% ($0.99/mo per passport)' : quantity >= 3 ? 'Save 25% ($1.49/mo per passport)' : 'Standard rate ($1.99/mo per passport)'}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-neutral-900/60 pt-6 space-y-3">
                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest block">Capabilities</span>
                    <ul className="space-y-2">
                      {tier.features.map((feat, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-xs text-neutral-400">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${tier.id === 'active_identity' ? 'text-[#bd2925]' : 'text-emerald-400'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 mt-auto">
                  <button 
                    onClick={() => handleCheckout(tier)}
                    disabled={loadingTier === tier.id}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {loadingTier === tier.id ? 'Connecting Billing...' : tier.buttonText} 
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Gating & Trust Badges */}
      <section className="py-12 px-6 max-w-4xl mx-auto z-10 relative">
        <div className="glass-card p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Secure Payment Encryption</h4>
              <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed">
                Billing services are processed via Stripe Connect API utilizing AES-256 bank-grade network encryption standards.
              </p>
            </div>
          </div>
          <div className="flex gap-4 shrink-0 font-mono text-[9px] text-neutral-500 uppercase">
            <span className="flex items-center gap-1"><Landmark className="w-3.5 h-3.5 text-emerald-400" /> Connect Compliant</span>
            <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-blue-400" /> PCI-DSS Level 1</span>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="py-16 border-t border-neutral-900 px-6 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-neutral-500 text-xs mt-2">Everything you need to know about the automated motorsports checkout layer.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-neutral-950/60 border border-neutral-900 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-neutral-300 hover:text-white transition-colors"
                >
                  <span className="text-xs sm:text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${activeFaq === idx ? 'transform rotate-180 text-white' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-neutral-500 leading-relaxed border-t border-neutral-900/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </main>
  );
}
