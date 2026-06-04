'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Check, Shield, Sparkles, Cpu, Wrench, 
  ArrowRight, Landmark, CreditCard, ChevronDown, CheckCircle2, Car, Printer
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
  features: string[];
}

export default function Pricing() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const tiers: PricingTier[] = [
    {
      id: 'free_passport',
      name: 'Free Vehicle Passport',
      price: 0.00,
      period: 'Free Forever',
      description: 'Log your rig\'s specifications, list custom modifications, upload gallery photos, and generate your dynamic specs page. Completely free to claim and configure, forever.',
      icon: Car,
      accentColor: 'from-neutral-900/60 to-neutral-950 border-neutral-850 text-neutral-400',
      buttonText: 'Claim Free Passport',
      features: [
        '100% Free digital vehicle profile hosting',
        'Detailed specifications registry (VIN make/model)',
        'Unlimited modifications & parts catalog listings',
        'Add linked social accounts (Instagram, TikTok)',
        'Free digital specs webpage link',
        'One-click profile transfer to the new owner',
        'Ad-supported spectator layouts'
      ]
    },
    {
      id: 'print_customize_pack',
      name: 'Custom QR Decals & Avery Pack',
      price: 0.00,
      period: 'Free Templates / Print at Home',
      badge: 'Popular',
      description: 'The physical connection for your vehicle. Design custom color palettes and export print-ready SVG vectors matching standard Avery sheets completely free, or order premium vinyl decal packs shipped to your door.',
      icon: Printer,
      accentColor: 'from-neutral-900/60 to-[#bd2925]/10 border-[#bd2925]/30 text-[#bd2925]',
      buttonText: 'Configure Print Pack',
      features: [
        'Avery round and square sticker sheet exports',
        'High-resolution PDF & SVG vector downloads',
        'Windshield spec-sheet car show poster templates',
        'Free lifetime print template generator access',
        'Optional shipped vinyl stickers & keytags ($14.99+)',
        'Removes all sponsor ads from public layouts',
        'Support early Gridpass platform development'
      ]
    },
    {
      id: 'b2b_portal',
      name: 'Dealership & Track Gate Portal',
      price: 0.00,
      period: 'Waitlist Priority Active',
      badge: 'Coming Soon',
      description: 'For service shops, detailers, dealerships, and racetracks. Write verified service logs onto user profiles, capture dealership leads, or configure paperless waiver track gate splits.',
      icon: Cpu,
      accentColor: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      buttonText: 'Join B2B Waitlist',
      features: [
        'Zero base monthly subscription fees for tracks',
        'Verified Service Writer credentials for detail/tune shops',
        'Dealership Sponsored Inventory infinite slots',
        'Pro CRM lead capture dashboard integration',
        'Paperless mobile gate check-in and waivers',
        'Secure spectator ticketing splits via Stripe Connect'
      ]
    }
  ];

  const faqs = [
    {
      q: "Does it cost anything to get a vehicle passport on Gridpass?",
      a: "No, never! Registering your vehicle, building your specifications registry, listing modifications, and hosting your digital passport is 100% free forever. We believe every build deserves a beautiful digital record."
    },
    {
      q: "How does Gridpass make money?",
      a: "We charge for physical printed decal kits (vinyl stickers, custom keytags) shipped directly to your door, and one-time Custom Print Studio unlocks ($4.99) that let you export standard Avery printable formats and custom car show windshield spec sheets. We also monetize through professional B2B portals for detail shops, dealerships, and tracks."
    },
    {
      q: "Can I transfer my vehicle passport if I sell my car?",
      a: "Absolutely. The physical QR code sticker stays on the chassis. When you sell the car, click 'Transfer Ownership' in your dashboard to hand over the complete specifications, modifications list, and verified service logbook history to the next owner in one click."
    },
    {
      q: "What is the Custom Avery Print Studio?",
      a: "It's our custom design builder launching in Phase 2. Instead of ordering decals from us, you can customize your QR color accents, add personal branding, and export print-ready SVG vector templates configured to match off-the-shelf Avery sticker sheets so you can print them at home or a local print shop instantly."
    },
    {
      q: "Do racetracks or detail shops need proprietary scanning hardware?",
      a: "Not at all. Gridpass runs directly inside web browsers on standard smartphones and tablets. Organizers or service writers scan the vehicle decals with their phone cameras to log check-ins or log service entries and maintenance records."
    }
  ];

  const handleCheckout = async (tier: PricingTier) => {
    if (tier.id === 'free_passport') {
      router.push('/login?redirect=/dash');
      return;
    }

    if (tier.id === 'print_customize_pack') {
      alert("Print Studio and Avery Decal configurator is launching in Phase 2! You've been successfully added to our priority access list.");
      return;
    }

    if (tier.id === 'b2b_portal') {
      alert("Thank you for your interest! The Dealership & Track Gate Portal is coming soon. You've been added to our priority waitlist!");
      return;
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden selection:bg-rose-500/30 flex flex-col justify-between">
      {/* Dynamic ambient mesh glow */}
      <div className="mesh-glow" />

      {/* Global Navigation Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-8 px-6 max-w-5xl mx-auto text-center space-y-6 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          Gridpass Value Alignment
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white leading-tight">
          Configure Your Passports. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-500 to-[#bd2925]">
            100% Free Registry.
          </span>
        </h1>

        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Create dynamic digital passports for your builds at zero cost. Upgrade to high-resolution Avery print layout sheets or order weather-proof vinyl kits shipped to your door.
        </p>
      </section>

      {/* Tiers Grid */}
      <section className="py-12 px-6 max-w-5xl mx-auto relative z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
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
                      <span className="text-xs text-neutral-500 font-mono">GRIDPASS_PLATFORM</span>
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      {tier.id === 'b2b_portal' ? (
                        <span className="text-3xl font-black text-white">
                          Waitlist
                        </span>
                      ) : (
                        <>
                          <span className="text-4xl font-black text-white font-mono">
                            ${tier.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-neutral-500 font-medium">USD</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-neutral-405 block font-semibold">
                      {tier.period}
                    </span>
                  </div>

                  <p className="text-neutral-400 text-xs leading-relaxed">{tier.description}</p>

                  <div className="border-t border-neutral-900/60 pt-6 space-y-3">
                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest block">Capabilities</span>
                    <ul className="space-y-2">
                      {tier.features.map((feat, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-xs text-neutral-400">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${tier.id === 'print_customize_pack' ? 'text-[#bd2925]' : tier.id === 'b2b_portal' ? 'text-emerald-400' : 'text-neutral-400'}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 mt-auto">
                  <button 
                    onClick={() => handleCheckout(tier)}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 px-6 py-3 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-lg"
                  >
                    {tier.buttonText} 
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
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Secure Payment Encryption</h4>
              <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed">
                Stripe payment connections are encrypted with bank-grade AES-256 standard protocols.
              </p>
            </div>
          </div>
          <div className="flex gap-4 shrink-0 font-mono text-[9px] text-neutral-500 uppercase">
            <span className="flex items-center gap-1"><Landmark className="w-3.5 h-3.5 text-emerald-400" /> Waitlist Open</span>
            <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-blue-400" /> PCI-DSS Level 1</span>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="py-16 border-t border-neutral-900 px-6 relative z-10 w-full">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Frequently Asked Questions</h2>
            <p className="text-neutral-500 text-xs mt-2">Everything you need to know about the vehicle-centric digital passport registry.</p>
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
