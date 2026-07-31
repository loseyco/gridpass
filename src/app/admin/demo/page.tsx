'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc } from 'firebase/firestore';

type VerticalType = 'auto_shop' | 'race_team' | 'food_truck' | 'track_venue';

export default function AdminSalesDemoPage() {
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
  });

  // Custom Feature Dev Request Modal State
  const [showCustomReqModal, setShowCustomReqModal] = useState(false);
  const [customToolTitle, setCustomToolTitle] = useState('');
  const [customToolCategory, setCustomToolCategory] = useState<VerticalType>('auto_shop');
  const [customToolPrice, setCustomToolPrice] = useState(49);
  const [customToolDesc, setCustomToolDesc] = useState('');
  const [salesRepName, setSalesRepName] = useState('Zach');
  const [submittedStatusMsg, setSubmittedStatusMsg] = useState('');

  // Dynamically created custom modules during sales call
  const [customModules, setCustomModules] = useState<
    Array<{ id: string; name: string; price: number; desc: string; vertical: string }>
  >([]);

  const offTheShelfCatalog = [
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

  const allModules = [...offTheShelfCatalog, ...customModules];

  const baseTierPrices = {
    starter: 99,
    pro: 199,
    enterprise: 499,
  };

  const calculateTotal = () => {
    let base = baseTierPrices[baseTier];
    let addonsTotal = 0;
    allModules.forEach((m) => {
      if (selectedModules[m.id]) {
        addonsTotal += m.price;
      }
    });

    let totalMonthly = base + addonsTotal;
    if (billingCycle === 'annual') {
      totalMonthly = Math.round(totalMonthly * 0.8);
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

  // Dispatch Custom Feature Dev Request to Dev Engine Queue
  const handleRequestCustomTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToolTitle.trim()) return;

    const reqId = `req_${Date.now()}`;
    const featId = `feat_custom_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    // 1. Add to local pitch quote catalog immediately
    const newCustomMod = {
      id: featId,
      name: `⚡ CUSTOM: ${customToolTitle.trim()}`,
      price: customToolPrice,
      vertical: customToolCategory.replace('_', ' '),
      desc: customToolDesc || `Custom dev tool requested for ${clientName}`,
    };

    setCustomModules((prev) => [newCustomMod, ...prev]);
    setSelectedModules((prev) => ({ ...prev, [featId]: true }));

    // 2. Dispatch to Backlog Request Tickets collection
    try {
      await setDoc(doc(db, 'request_tickets', reqId), {
        id: reqId,
        title: `Custom Module Request: ${customToolTitle.trim()} (for ${clientName})`,
        client_name: clientName,
        requested_by: salesRepName,
        category: customToolCategory,
        status: 'new',
        priority: 'urgent',
        details: `Client ${clientName} requested custom tool: "${customToolTitle}". Target price: $${customToolPrice}/mo. Description: ${customToolDesc}`,
        created_at: today,
      }, { merge: true });

      // 3. Dispatch to Features collection as custom wanted feature
      await setDoc(doc(db, 'features', featId), {
        id: featId,
        name: `CUSTOM: ${customToolTitle.trim()}`,
        category: customToolCategory,
        status: 'idea',
        version: 'v4.2.0-custom',
        priority: 'urgent',
        description: `Custom build requested during sales call for ${clientName}. ${customToolDesc}`,
        module_key: customToolTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        is_saas_module: true,
        saas_addon_price: customToolPrice,
        route_path: `/custom/${customToolTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        created_at: today,
      }, { merge: true });

      setSubmittedStatusMsg(`⚡ Custom Dev Request sent to Gridpass Dev Engine! Feature "${customToolTitle}" added to live quote.`);
    } catch (err) {
      console.warn('Custom dev request logged locally:', err);
      setSubmittedStatusMsg(`⚡ Custom tool "${customToolTitle}" added to pitch catalog!`);
    }

    setCustomToolTitle('');
    setCustomToolDesc('');
    setShowCustomReqModal(false);

    setTimeout(() => setSubmittedStatusMsg(''), 6000);
  };

  const setVerticalPreset = (v: VerticalType) => {
    setActiveVertical(v);
    setCustomToolCategory(v);
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
    <div className="space-y-6 font-sans">
      {/* Dev Engine Banner */}
      {submittedStatusMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-950 p-3 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-pulse">
          <span>{submittedStatusMsg}</span>
          <button onClick={() => setSubmittedStatusMsg('')} className="text-emerald-700 font-black">
            ✕
          </button>
        </div>
      )}

      {/* Studio Header */}
      <div className="bg-white border border-neutral-300 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#ff3b30] tracking-wider">
                Sales Pitch & Solution Studio
              </span>
              <span className="text-[9px] font-extrabold uppercase bg-black text-white px-2 py-0.5 rounded">
                🤖 AI DEV ENGINE LINKED
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1e] uppercase tracking-tight mt-0.5">
              Off-The-Shelf Modules & On-Demand Dev Pitch
            </h1>
            <p className="text-xs text-neutral-600 font-medium">
              Present live features to clients. If they need custom tools, Gridpass Devs build it on demand!
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

      {/* CUSTOM FEATURE REQUEST MODAL */}
      {showCustomReqModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <div>
                <h2 className="font-black text-sm uppercase text-[#1c1c1e] flex items-center gap-1.5">
                  <span>⚡</span> Request Custom Dev Tool for Client
                </h2>
                <p className="text-[11px] text-neutral-500 font-bold">
                  Gridpass AI Dev Team builds & deploys custom tools directly to client profiles.
                </p>
              </div>
              <button onClick={() => setShowCustomReqModal(false)} className="text-neutral-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestCustomTool} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Target Client / Prospect
                </label>
                <input
                  type="text"
                  readOnly
                  value={clientName}
                  className="w-full text-xs font-bold p-2 bg-neutral-100 border border-neutral-300 rounded text-neutral-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Requested Tool / Feature Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Dyno Pull Telemetry Link"
                  value={customToolTitle}
                  onChange={(e) => setCustomToolTitle(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Vertical Category
                  </label>
                  <select
                    value={customToolCategory}
                    onChange={(e) => setCustomToolCategory(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  >
                    <option value="auto_shop">Auto Shop</option>
                    <option value="race_team">Race Team</option>
                    <option value="food_truck">Food Truck</option>
                    <option value="track_venue">Track Venue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Monthly Add-on Price ($)
                  </label>
                  <input
                    type="number"
                    value={customToolPrice}
                    onChange={(e) => setCustomToolPrice(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Sales Rep Pitching
                </label>
                <input
                  type="text"
                  value={salesRepName}
                  onChange={(e) => setSalesRepName(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Custom Needs & Specs Details
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what the customer needs this tool to do..."
                  value={customToolDesc}
                  onChange={(e) => setCustomToolDesc(e.target.value)}
                  className="w-full text-xs font-medium p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomReqModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-neutral-600 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase px-4 py-1.5 rounded shadow-sm"
                >
                  ⚡ Send to Dev Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN STUDIO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Module Selection & Custom Dev Trigger */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-neutral-300 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
              <div>
                <h2 className="text-xs font-black text-[#1c1c1e] uppercase tracking-wider">
                  Modules & Tool Packages
                </h2>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Toggle existing modules or request a custom build on the fly.
                </p>
              </div>
              <button
                onClick={() => setShowCustomReqModal(true)}
                className="bg-[#1c1c1e] hover:bg-black text-white text-xs font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition"
              >
                <span>⚡ Request Custom Dev Tool</span>
              </button>
            </div>

            {/* Modules List */}
            <div className="space-y-2">
              {allModules.map((m) => {
                const isSelected = selectedModules[m.id];
                const isCustom = m.id.startsWith('feat_custom_');

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleModule(m.id)}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? isCustom
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs">{m.name}</span>
                        {isCustom && (
                          <span className="text-[9px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.2 rounded">
                            CUSTOM BUILD
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            isSelected && !isCustom
                              ? 'bg-neutral-800 text-neutral-300'
                              : 'bg-neutral-200 text-neutral-700'
                          }`}
                        >
                          {m.vertical}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] leading-tight font-medium ${
                          isSelected && !isCustom ? 'text-neutral-300' : 'text-neutral-600'
                        }`}
                      >
                        {m.desc}
                      </p>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <span className={`text-xs font-black ${isSelected && !isCustom ? 'text-[#ff3b30]' : 'text-neutral-900'}`}>
                        +${m.price}
                      </span>
                      <span className="text-[10px] font-bold block text-neutral-400">/mo</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Quote Builder & Dev Engine Pitch */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-neutral-300 rounded-xl p-5 shadow-sm space-y-5">
            <h2 className="text-xs font-black text-[#1c1c1e] uppercase tracking-wider border-b border-neutral-200 pb-2">
              Instant Client Quote & Package Builder
            </h2>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Prospect Business Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Select Base Platform Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['starter', 'pro', 'enterprise'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBaseTier(t)}
                    className={`p-2 text-center rounded-lg border transition ${
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

            <div className="bg-[#1c1c1e] text-white p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400">
                  Total Investment for {clientName}
                </span>
                <span className="text-[10px] font-black text-[#ff3b30] uppercase">
                  {billingCycle} billing
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-neutral-800 pt-2">
                <div>
                  <span className="text-3xl font-black text-white">${quote.totalMonthly}</span>
                  <span className="text-xs font-bold text-neutral-400">/month</span>
                </div>
              </div>
            </div>

            {/* Sales Pitch Assurance Box */}
            <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-2 border border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-base">🚀</span>
                <p className="text-xs font-black uppercase text-[#ff3b30]">Gridpass Guarantee</p>
              </div>
              <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                Need a tool that isn&apos;t in our off-the-shelf catalog yet? Our dedicated AI dev team builds and deploys custom tools directly into your account!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
