'use client';

import React, { useState } from 'react';

type VerticalType = 'auto_shop' | 'race_team' | 'food_truck' | 'track_venue';

export default function SalesDemoStudioPage() {
  const [activeVertical, setActiveVertical] = useState<VerticalType>('auto_shop');

  // Quote Configurator State
  const [clientName, setClientName] = useState('Apex Auto Performance');
  const [baseTier, setBaseTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Selected Add-on Modules State
  const [selectedModules, setSelectedModules] = useState<{ [key: string]: boolean }>({
    service_history_sync: true,
    photo_inspection: true,
    sms_notifications: false,
    digital_waivers: false,
    marshall_grid_scanner: false,
    pit_crew_badges: false,
    live_location_radar: false,
    queue_loyalty: false,
    vip_ticketing: false,
  });

  const moduleCatalog = [
    {
      id: 'service_history_sync',
      name: 'Service Log Sync to Vehicle Passport',
      price: 49,
      vertical: 'Auto Shop',
      desc: 'Writes shop maintenance directly to customer Gridpass profiles, increasing vehicle resale value.',
    },
    {
      id: 'photo_inspection',
      name: 'Pre-Service Photo Uploads',
      price: 29,
      vertical: 'Auto Shop',
      desc: 'High-res condition intake photo logs to eliminate damage dispute liability.',
    },
    {
      id: 'sms_notifications',
      name: 'Automated SMS Status Alerts',
      price: 39,
      vertical: 'Auto Shop / All',
      desc: 'Send automated SMS updates ("Vehicle Ready for Pickup", "Work Order Approved").',
    },
    {
      id: 'digital_waivers',
      name: 'Digital Waivers & Touchless Signatures',
      price: 59,
      vertical: 'Track / Team',
      desc: 'Scan QR tag to instantly sign track day or shop test-drive liability waivers.',
    },
    {
      id: 'marshall_grid_scanner',
      name: 'Marshall Grid Scanner Console (/grid)',
      price: 79,
      vertical: 'Track / Team',
      desc: 'Rapid gate & grid check-in scanner for marshalls with green/red verification lights.',
    },
    {
      id: 'pit_crew_badges',
      name: 'Pit Crew Pass & Transponder Sync',
      price: 49,
      vertical: 'Race Team',
      desc: 'Credential management for pit crew members and transponder telemetry linking.',
    },
    {
      id: 'live_location_radar',
      name: 'Live Location Radar & Event Pin',
      price: 39,
      vertical: 'Food Truck',
      desc: 'Broadcast real-time GPS pin to nearby Gridpass enthusiasts on mobile radar.',
    },
    {
      id: 'queue_loyalty',
      name: 'Customer Scan Loyalty Points',
      price: 29,
      vertical: 'Food Truck / Club',
      desc: 'Reward repeat attendees with instant QR scan loyalty points and VIP perks.',
    },
  ];

  const baseTierPrices = {
    starter: 99,
    pro: 199,
    enterprise: 499,
  };

  const calculateTotal = () => {
    let base = baseTierPrices[baseTier];
    let addonsTotal = 0;
    moduleCatalog.forEach((m) => {
      if (selectedModules[m.id]) {
        addonsTotal += m.price;
      }
    });

    let totalMonthly = base + addonsTotal;
    if (billingCycle === 'annual') {
      totalMonthly = Math.round(totalMonthly * 0.8); // 20% discount on annual
    }
    return {
      base,
      addonsTotal,
      totalMonthly,
      totalAnnual: totalMonthly * 12,
    };
  };

  const quote = calculateTotal();

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const setVerticalPreset = (v: VerticalType) => {
    setActiveVertical(v);
    if (v === 'auto_shop') {
      setClientName('Apex Motorsport Garage');
      setSelectedModules({
        service_history_sync: true,
        photo_inspection: true,
        sms_notifications: true,
        digital_waivers: false,
        marshall_grid_scanner: false,
        pit_crew_badges: false,
        live_location_radar: false,
        queue_loyalty: false,
      });
    } else if (v === 'race_team') {
      setClientName('Ironhead Racing Team #88');
      setSelectedModules({
        service_history_sync: false,
        photo_inspection: false,
        sms_notifications: false,
        digital_waivers: true,
        marshall_grid_scanner: true,
        pit_crew_badges: true,
        live_location_radar: false,
        queue_loyalty: false,
      });
    } else if (v === 'food_truck') {
      setClientName('Nitro Eats Food Truck');
      setSelectedModules({
        service_history_sync: false,
        photo_inspection: false,
        sms_notifications: true,
        digital_waivers: false,
        marshall_grid_scanner: false,
        pit_crew_badges: false,
        live_location_radar: true,
        queue_loyalty: true,
      });
    } else if (v === 'track_venue') {
      setClientName('Midwest Raceway Complex');
      setSelectedModules({
        service_history_sync: false,
        photo_inspection: true,
        sms_notifications: true,
        digital_waivers: true,
        marshall_grid_scanner: true,
        pit_crew_badges: true,
        live_location_radar: false,
        queue_loyalty: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase text-[#ff3b30] tracking-wider">
              Sales Partner Studio
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1e] uppercase tracking-tight mt-0.5">
              Live Sales Pitch & Quote Builder
            </h1>
            <p className="text-xs text-neutral-600 font-medium">
              Demo Gridpass Ops live to prospects and configure custom recurring pricing on the fly.
            </p>
          </div>

          {/* Quick Vertical Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['auto_shop', 'race_team', 'food_truck', 'track_venue'] as VerticalType[]).map((v) => (
              <button
                key={v}
                onClick={() => setVerticalPreset(v)}
                className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                  activeVertical === v
                    ? 'bg-[#ff3b30] text-white border-[#ff3b30]'
                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {v.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Live Preview Container (Mobile App Frame on Desktop) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-[#1c1c1e] uppercase tracking-wider">
              Live Prospect Preview Demo Mode
            </h2>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ● Interactive Live View
            </span>
          </div>

          {/* Simulated Mobile Card Display Frame */}
          <div className="bg-neutral-900 border-4 border-neutral-800 rounded-3xl p-3 shadow-xl max-w-sm mx-auto">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-neutral-800 rounded-b-xl mx-auto mb-3 flex items-center justify-center">
              <div className="w-8 h-1 bg-neutral-700 rounded-full" />
            </div>

            {/* Inner App Content Screen */}
            <div className="bg-white rounded-2xl p-4 text-neutral-900 space-y-4 min-h-[480px] max-h-[580px] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-black text-xs flex items-center justify-center">
                    GP
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-[#1c1c1e] leading-tight">
                      {clientName}
                    </h3>
                    <p className="text-[9px] text-neutral-400 font-semibold uppercase">
                      Gridpass Ops Enabled
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black bg-[#ff3b30] text-white px-2 py-0.5 rounded uppercase">
                  VERIFIED
                </span>
              </div>

              {/* Dynamic Content Preview Based on Vertical */}
              {activeVertical === 'auto_shop' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#1c1c1e]">Active Work Order #WO-892</span>
                      <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded">In Service</span>
                    </div>
                    <p className="text-[11px] text-neutral-600">2017 Jeep Wrangler Unlimited</p>
                    <p className="text-[10px] text-neutral-400">Owner: Marcus Vance (QR Pass #GP-884)</p>
                  </div>

                  {selectedModules.service_history_sync && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px]">
                      <span className="font-bold text-emerald-900">✓ Digital Passport Sync</span>
                      <p className="text-[10px] text-emerald-700 mt-0.5">
                        Service records automatically written to vehicle QR passport card.
                      </p>
                    </div>
                  )}

                  {selectedModules.photo_inspection && (
                    <div className="p-2.5 bg-neutral-100 border border-neutral-200 rounded-lg text-[11px]">
                      <span className="font-bold text-neutral-900">📷 Pre-Service Inspection Photos (4/4)</span>
                      <div className="grid grid-cols-4 gap-1 mt-1.5">
                        <div className="h-10 bg-neutral-300 rounded flex items-center justify-center text-[9px] text-neutral-600 font-bold">Front</div>
                        <div className="h-10 bg-neutral-300 rounded flex items-center justify-center text-[9px] text-neutral-600 font-bold">Rear</div>
                        <div className="h-10 bg-neutral-300 rounded flex items-center justify-center text-[9px] text-neutral-600 font-bold">Side</div>
                        <div className="h-10 bg-neutral-300 rounded flex items-center justify-center text-[9px] text-neutral-600 font-bold">Cabin</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeVertical === 'race_team' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#1c1c1e]">Car #88 Transponder Sync</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Grid Ready</span>
                    </div>
                    <p className="text-[11px] text-neutral-600">MyLaps Tag: #MY-99420</p>
                  </div>

                  {selectedModules.pit_crew_badges && (
                    <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg space-y-1">
                      <span className="font-bold text-neutral-900 text-[11px]">🏁 Active Pit Crew Passes (5)</span>
                      <div className="text-[10px] text-neutral-600 space-y-1 pt-1">
                        <div className="flex justify-between"><span>Dave (Chief Mechanic)</span><span className="font-bold text-emerald-600">Hot Pit OK</span></div>
                        <div className="flex justify-between"><span>John (Tire Crew)</span><span className="font-bold text-emerald-600">Hot Pit OK</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeVertical === 'food_truck' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#1c1c1e]">📍 Live Location Pin</span>
                      <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">Live Radar</span>
                    </div>
                    <p className="text-[11px] text-neutral-600">Gridpass Car Meet @ Blackhawk Farms</p>
                  </div>

                  {selectedModules.queue_loyalty && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px]">
                      <span className="font-bold text-amber-900">⭐ Customer QR Loyalty Scan</span>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        150 points earned on order #104. Customer unlocked Free Drink perk!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeVertical === 'track_venue' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#1c1c1e]">🏁 Marshall Gate Scanner (/grid)</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Gate Active</span>
                    </div>
                    <p className="text-[11px] text-neutral-600">Today: Midwest Track Day Championship</p>
                  </div>

                  {selectedModules.digital_waivers && (
                    <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-[11px]">
                      <span className="font-bold text-sky-900">📝 Touchless Digital Waiver</span>
                      <p className="text-[10px] text-sky-700 mt-0.5">
                        Driver signed waiver digitally via QR scan at 08:14 AM.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Sample CTA inside mobile frame */}
              <div className="pt-4 border-t border-neutral-100 text-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Powered by Gridpass Ops Engine
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quote Configurator & Pricing Calculator */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-[#1c1c1e] uppercase tracking-wider border-b border-neutral-100 pb-2">
              Instant Quote Configurator
            </h2>

            {/* Client Name Input */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Prospect Client Business Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Base Tier Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Select Base SaaS Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['starter', 'pro', 'enterprise'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBaseTier(t)}
                    className={`p-2.5 text-center rounded-lg border transition ${
                      baseTier === t
                        ? 'bg-[#1c1c1e] text-white border-[#1c1c1e]'
                        : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <p className="text-xs font-black uppercase">{t}</p>
                    <p className="text-[11px] font-bold mt-0.5">${baseTierPrices[t]}/mo</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
              <span className="text-xs font-bold text-neutral-700 uppercase">Billing Interval</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`text-xs font-bold px-3 py-1 rounded ${
                    billingCycle === 'monthly' ? 'bg-[#ff3b30] text-white' : 'text-neutral-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`text-xs font-bold px-3 py-1 rounded ${
                    billingCycle === 'annual' ? 'bg-[#ff3b30] text-white' : 'text-neutral-600'
                  }`}
                >
                  Annual (20% OFF)
                </button>
              </div>
            </div>

            {/* A La Carte Module Checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                A La Carte Add-on Modules
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {moduleCatalog.map((mod) => (
                  <label
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`flex items-start justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                      selectedModules[mod.id]
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{mod.name}</span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            selectedModules[mod.id]
                              ? 'bg-neutral-800 text-neutral-300'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {mod.vertical}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          selectedModules[mod.id] ? 'text-neutral-300' : 'text-neutral-500'
                        }`}
                      >
                        {mod.desc}
                      </p>
                    </div>
                    <span className="font-extrabold text-xs whitespace-nowrap">
                      +${mod.price}/mo
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Total Quote Summary Box */}
            <div className="bg-[#1c1c1e] text-white p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase text-neutral-400">
                  Total Projected Price for {clientName}
                </span>
                <span className="text-xs font-bold text-[#ff3b30] uppercase">
                  {billingCycle}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-neutral-800 pt-2">
                <div>
                  <span className="text-3xl font-black text-white">${quote.totalMonthly}</span>
                  <span className="text-xs font-bold text-neutral-400">/month</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-neutral-300">${quote.totalAnnual}/year</p>
                  <p className="text-[10px] text-neutral-400">
                    Base (${quote.base}) + Add-ons (${quote.addonsTotal})
                  </p>
                </div>
              </div>

              <button
                onClick={() => alert(`Quote generated for ${clientName}! Total: $${quote.totalMonthly}/mo`)}
                className="w-full bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase py-2.5 rounded-lg transition"
              >
                Copy Quote Summary & Send Proposal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
