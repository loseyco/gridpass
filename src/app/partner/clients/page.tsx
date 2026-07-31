'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, setDoc, doc, updateDoc } from 'firebase/firestore';
import { BusinessProfile } from '@/lib/types/business';

export default function PartnerClientsPage() {
  const [clients, setClients] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newVertical, setNewVertical] = useState<'auto_shop' | 'race_team' | 'food_truck' | 'track_venue'>('auto_shop');
  const [newEmail, setNewEmail] = useState('');
  const [newMrr, setNewMrr] = useState<number>(199);

  // Subscribe to live businesses collection
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        const bizList: BusinessProfile[] = [];
        snapshot.forEach((docSnap) => {
          bizList.push({ id: docSnap.id, ...docSnap.data() } as BusinessProfile);
        });
        setClients(bizList);
        setLoading(false);
      },
      (err) => {
        console.warn('Businesses listener fallback:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleClientModule = async (clientId: string, moduleKey: keyof NonNullable<BusinessProfile['enabled_modules']>) => {
    const targetClient = clients.find((c) => c.id === clientId);
    if (!targetClient) return;

    const currentModules = targetClient.enabled_modules || {};
    const updatedModules = {
      ...currentModules,
      [moduleKey]: !currentModules[moduleKey],
    };

    // Optimistic UI update
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, enabled_modules: updatedModules } : c))
    );

    try {
      await updateDoc(doc(db, 'businesses', clientId), {
        enabled_modules: updatedModules,
      });
    } catch (err) {
      console.warn('Module update saved locally:', err);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    const slug = newClientName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newBiz: BusinessProfile = {
      id: slug,
      name: newClientName,
      owner_uid: 'uid-new',
      description: `Gridpass Ops client account for ${newClientName}`,
      category: 'shop_garage',
      vertical: newVertical,
      location_name: 'Local Region',
      contact_email: newEmail || 'client@gridpass.app',
      subscription: {
        tier: 'pro',
        mrr: Number(newMrr) || 199,
        billing_cycle: 'monthly',
        status: 'active',
      },
      enabled_modules: {
        service_history_sync: newVertical === 'auto_shop',
        digital_waivers: newVertical === 'track_venue' || newVertical === 'race_team',
        live_location_radar: newVertical === 'food_truck',
      },
    };

    setClients((prev) => [newBiz, ...prev.filter((c) => c.id !== slug)]);

    try {
      await setDoc(doc(db, 'businesses', slug), newBiz);
    } catch (err) {
      console.warn('Client provisioned locally:', err);
    }

    setNewClientName('');
    setNewEmail('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Provision Action */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1e] uppercase tracking-tight">
              Client Business Management & Entitlements
            </h1>
            <p className="text-xs text-neutral-600 font-medium mt-1">
              Instantly toggle feature packages ON or OFF per client and provision new business accounts.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg transition shadow-sm"
          >
            + Provision New Client
          </button>
        </div>
      </div>

      {/* Provision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">
                Provision New Client Account
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 font-bold hover:text-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Business / Client Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blarney Island Speedboats"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Vertical
                  </label>
                  <select
                    value={newVertical}
                    onChange={(e) => setNewVertical(e.target.value as any)}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="auto_shop">Auto Shop / Detailer</option>
                    <option value="race_team">Race Team</option>
                    <option value="food_truck">Food Truck / Mobile</option>
                    <option value="track_venue">Track Venue / Club</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    value={newMrr}
                    onChange={(e) => setNewMrr(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="owner@client.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-bold text-neutral-600 hover:text-black uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-2 rounded-lg"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Accounts & Module Toggle List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-xs font-bold text-neutral-400 uppercase">
            Loading Client Accounts...
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-3">
            <p className="text-xs font-bold text-neutral-500 uppercase">
              No Client Accounts Provisioned
            </p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Provision your first client account above to start enabling modular feature packages.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#ff3b30] text-white font-bold text-xs uppercase px-4 py-2 rounded-lg"
            >
              + Provision First Client
            </button>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4"
            >
              {/* Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-lg text-[#1c1c1e]">
                      {client.name}
                    </h2>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded">
                      {client.vertical ? client.vertical.replace('_', ' ') : client.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">
                    ID: <code className="text-black font-mono">{client.id}</code> {client.contact_email ? `| Email: ${client.contact_email}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-neutral-900">
                    ${client.subscription?.mrr || 0}/mo
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                    {client.subscription?.tier || 'pro'} tier
                  </span>
                </div>
              </div>

              {/* Feature Module Entitlements Matrix */}
              <div>
                <p className="text-xs font-black text-neutral-700 uppercase tracking-wider mb-2">
                  A La Carte Feature Package Toggles
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    { key: 'service_history_sync', label: 'Service History Sync' },
                    { key: 'photo_inspection', label: 'Pre-Service Photos' },
                    { key: 'sms_notifications', label: 'SMS Status Alerts' },
                    { key: 'digital_waivers', label: 'Digital Waivers' },
                    { key: 'marshall_grid_scanner', label: 'Marshall Grid Scanner' },
                    { key: 'pit_crew_badges', label: 'Pit Crew Pass Badges' },
                    { key: 'live_location_radar', label: 'Live Location Pin' },
                    { key: 'vip_ticketing', label: 'VIP Gate Ticketing' },
                  ].map((mod) => {
                    const isEnabled = !!client.enabled_modules?.[mod.key as keyof NonNullable<BusinessProfile['enabled_modules']>];
                    return (
                      <div
                        key={mod.key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                          isEnabled
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                        }`}
                      >
                        <span>{mod.label}</span>
                        <button
                          onClick={() =>
                            toggleClientModule(
                              client.id,
                              mod.key as keyof NonNullable<BusinessProfile['enabled_modules']>
                            )
                          }
                          className={`text-[10px] font-black px-2 py-1 rounded uppercase transition ${
                            isEnabled
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                          }`}
                        >
                          {isEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
