'use client';

import React, { useState, useEffect } from 'react';
import { GarageVehicle, StagingClass } from '@/lib/types/admin';

interface AdminVehicleSupportDrawerProps {
  isOpen: boolean;
  vehicle: GarageVehicle | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<GarageVehicle>) => Promise<void>;
  onHideToggle: (id: string, currentHidden: boolean) => Promise<void>;
  onArchiveToggle: (id: string, currentArchived: boolean) => Promise<void>;
}

export function AdminVehicleSupportDrawer({
  isOpen,
  vehicle,
  onClose,
  onSave,
  onHideToggle,
  onArchiveToggle,
}: AdminVehicleSupportDrawerProps) {
  const [activeTab, setActiveTab] = useState<'specs' | 'tag' | 'staging' | 'audit'>('specs');
  const [saving, setSaving] = useState(false);

  // Form State
  const [year, setYear] = useState<number>(2024);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [vin, setVin] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [tagId, setTagId] = useState('');
  const [stagingClass, setStagingClass] = useState<StagingClass>('stock');
  const [vinVerified, setVinVerified] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setYear(vehicle.year || 2024);
      setMake(vehicle.make || '');
      setModel(vehicle.model || '');
      setTrim(vehicle.trim || '');
      setVin(vehicle.vin || '');
      setOwnerId(vehicle.owner_id || '');
      setOwnerName(vehicle.owner_name || 'PJ Losey');
      setTagId(vehicle.tag_id || vehicle.qr_tag_id || '');
      setStagingClass((vehicle.staging_class as StagingClass) || 'stock');
      setVinVerified(!!vehicle.vin_verified);
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSaveOverrides = async () => {
    setSaving(true);
    try {
      await onSave(vehicle.id, {
        year: Number(year) || 2024,
        make,
        model,
        trim,
        vin,
        owner_id: ownerId || 'YOYN2HDCwqXc3OYsHd8mdJIwr9K2',
        owner_name: ownerName || 'PJ Losey',
        tag_id: tagId,
        qr_tag_id: tagId,
        staging_class: stagingClass,
        vin_verified: vinVerified,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save vehicle overrides:', err);
    } finally {
      setSaving(false);
    }
  };

  const stagingClasses: { label: string; key: StagingClass; color: string }[] = [
    { label: 'Stock OEM', key: 'stock', color: 'bg-neutral-100 text-neutral-800' },
    { label: 'Modified Street', key: 'modified', color: 'bg-blue-100 text-blue-800' },
    { label: 'Track Weapon', key: 'track_weapon', color: 'bg-purple-100 text-purple-800' },
    { label: 'Show Build', key: 'show_car', color: 'bg-pink-100 text-pink-800' },
    { label: 'Commercial Fleet', key: 'fleet', color: 'bg-cyan-100 text-cyan-800' },
    { label: 'Marine / Craft', key: 'craft', color: 'bg-orange-100 text-orange-800' },
    { label: 'Venue Shuttle', key: 'venue_shuttle', color: 'bg-amber-100 text-amber-800' },
    { label: 'PEV / Electric', key: 'pev_micromobility', color: 'bg-teal-100 text-teal-800' },
    { label: 'Vendor Unit', key: 'vendor_unit', color: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full flex flex-col justify-between shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white font-black text-sm flex items-center justify-center">
              {make.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-black text-base uppercase text-[#1c1c1e] tracking-tight">
                {year} {make} {model}
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                ID: {vehicle.id} • Owner: <span className="font-bold text-neutral-900">{ownerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-target-44 rounded-lg text-neutral-400 hover:text-neutral-900 font-bold active:scale-95 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-white px-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'specs', label: '1. Specs & Owner' },
            { id: 'tag', label: '2. RFID/QR Tag' },
            { id: 'staging', label: '3. Staging Class' },
            { id: 'audit', label: '4. Audit & History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-[#ff3b30] text-[#ff3b30]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* TAB 1: Specs & Owner Override */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Make</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Trim / Spec</label>
                  <input
                    type="text"
                    placeholder="e.g. Z06 / GT3"
                    value={trim}
                    onChange={(e) => setTrim(e.target.value)}
                    className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">VIN Number (17-Chars)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="1G1YK2D47H5..."
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    className="flex-1 text-base md:text-xs font-mono font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setVinVerified(!vinVerified)}
                    className={`px-3 py-2 text-xs font-black uppercase rounded-lg border transition ${
                      vinVerified
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                    }`}
                  >
                    {vinVerified ? '✓ Verified' : 'Verify'}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 space-y-3">
                <h3 className="text-xs font-black uppercase text-[#1c1c1e]">Owner Account Assignment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Owner Display Name</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Owner Firebase UID</label>
                    <input
                      type="text"
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="w-full text-base md:text-xs font-mono p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Hardware RFID/QR Tag */}
          {activeTab === 'tag' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <span className="text-xs font-black uppercase text-neutral-900 block">Physical Hardware Emblem Tag</span>
                <p className="text-xs text-neutral-600">
                  Bind or update the universal physical RFID emblem or QR code assigned to this vehicle asset.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Tag UID / Emblem ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. #0248 or GP-TAG-991"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    className="flex-1 text-base md:text-xs font-mono font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none"
                  />
                  {tagId && (
                    <button
                      type="button"
                      onClick={() => setTagId('')}
                      className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg"
                    >
                      Unlink
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-900">Scan Status:</span>
                <span className="font-mono font-bold text-cyan-800">
                  {tagId ? `📡 Bound to Tag ${tagId}` : '🔴 No Hardware Tag Linked'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: Multi-Vertical Staging Class */}
          {activeTab === 'staging' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                <span className="text-xs font-black uppercase text-neutral-900 block mb-1">Multi-Vertical Staging Class</span>
                <p className="text-xs text-neutral-600">
                  Reclassify this vehicle to fit its exact vertical domain (Race Track, Watercraft, Trade Fleet, or PEV).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {stagingClasses.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStagingClass(item.key)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between active:scale-95 ${
                      stagingClass === item.key
                        ? 'border-[#ff3b30] ring-2 ring-[#ff3b30]/20 bg-neutral-900 text-white'
                        : `${item.color} border-neutral-200`
                    }`}
                  >
                    <span className="text-xs font-black uppercase">{item.label}</span>
                    {stagingClass === item.key && <span className="text-xs font-bold text-[#ff3b30]">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Audit & Service History */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <span className="text-xs font-black uppercase text-neutral-900 block">Audit Log & System Metadata</span>
                <div className="space-y-1 text-xs text-neutral-600 font-mono">
                  <p>Document ID: {vehicle.id}</p>
                  <p>Created: {vehicle.created_at || 'N/A'}</p>
                  <p>Service Logs Count: {vehicle.service_logs_count || 0}</p>
                  <p>Visibility State: {vehicle.is_hidden ? '🙈 Hidden' : '🟢 Public Live'}</p>
                  <p>Archival State: {vehicle.archived ? '📦 Soft Archived' : '✅ Active'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onHideToggle(vehicle.id, !!vehicle.is_hidden)}
              className={`py-2.5 px-3 text-xs font-black uppercase rounded-xl border transition active:scale-95 ${
                vehicle.is_hidden
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-neutral-200 text-neutral-800 border-neutral-300'
              }`}
            >
              {vehicle.is_hidden ? '👁️ Unhide Vehicle' : '🙈 Hide Vehicle'}
            </button>

            <button
              type="button"
              onClick={() => onArchiveToggle(vehicle.id, !!vehicle.archived)}
              className={`py-2.5 px-3 text-xs font-black uppercase rounded-xl border transition active:scale-95 ${
                vehicle.archived
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border-rose-300'
              }`}
            >
              {vehicle.archived ? '📦 Restore Asset' : '📦 Soft Archive'}
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveOverrides}
            className="w-full touch-target-44 py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : '💾 Save Spec Overrides'}
          </button>
        </div>

      </div>
    </div>
  );
}
