'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface IndustryCatalogItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
}

const DEFAULT_INDUSTRIES: IndustryCatalogItem[] = [
  { id: 'food_truck', name: 'Food Truck & Mobile Vendor', icon: '🍔', description: 'Digital paddock menus, express mobile pickup, catering vouchers', is_active: true },
  { id: 'auto_shop', name: 'Auto Repair & Detail Shop', icon: '🛠️', description: 'Repair work orders, digital service history stamps, estimate approvals', is_active: true },
  { id: 'race_team', name: 'Race Team & Logistics', icon: '🏎️', description: 'Pit crew badges, telemetry logs, team paddock passes', is_active: true },
  { id: 'track_venue', name: 'Track & Event Venue', icon: '🏁', description: 'Digital waivers, event ticketing, live venue radar grid', is_active: true },
  { id: 'marine_shop', name: 'Marine & PWC Shop', icon: '🛥️', description: 'Watercraft maintenance, dockside ordering, anchoring guides', is_active: true },
  { id: 'offroad_park', name: 'Offroad & Powersports Park', icon: '🏔️', description: 'Trail check-ins, safety waivers, vehicle telemetry', is_active: true },
  { id: 'car_club', name: 'Car Club & Organizer', icon: '🚗', description: 'Member Roster, cruise meets, spotted galleries', is_active: true },
  { id: 'general_merchant', name: 'General Merchant / Business', icon: '🏢', description: 'Local business listings, sponsor tags, QR store passes', is_active: true },
];

export default function AdminIndustriesPage() {
  const [industries, setIndustries] = useState<IndustryCatalogItem[]>(DEFAULT_INDUSTRIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<IndustryCatalogItem | null>(null);

  // Form Inputs
  const [nameInput, setNameInput] = useState('');
  const [iconInput, setIconInput] = useState('⚙️');
  const [descriptionInput, setDescriptionInput] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocal = localStorage.getItem('__gridpass_industries__');
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) setIndustries(parsed);
        } catch (e) {}
      }
    }

    const unsub = onSnapshot(
      collection(db, 'industries'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: IndustryCatalogItem[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as IndustryCatalogItem);
          });
          setIndustries(list);
          if (typeof window !== 'undefined') {
            localStorage.setItem('__gridpass_industries__', JSON.stringify(list));
          }
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setNameInput('');
    setIconInput('⚙️');
    setDescriptionInput('');
    setShowModal(true);
  };

  const openEditModal = (item: IndustryCatalogItem) => {
    setEditingItem(item);
    setNameInput(item.name);
    setIconInput(item.icon);
    setDescriptionInput(item.description);
    setShowModal(true);
  };

  const handleSaveIndustry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const id = editingItem
      ? editingItem.id
      : nameInput.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

    const itemObj: IndustryCatalogItem = {
      id,
      name: nameInput,
      icon: iconInput || '⚙️',
      description: descriptionInput,
      is_active: true,
    };

    setIndustries((prev) => {
      const exists = prev.some((i) => i.id === id);
      const updated = exists ? prev.map((i) => (i.id === id ? itemObj : i)) : [...prev, itemObj];
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_industries__', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'industries', id), itemObj);
    } catch (err) {}

    setShowModal(false);
    setEditingItem(null);
  };

  const handleDeleteIndustry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this industry vertical?')) return;
    setIndustries((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_industries__', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'industries', id));
    } catch (err) {}
  };

  const filteredIndustries = industries.filter((i) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-neutral-900 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
            Data &amp; Records
          </span>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight mt-1">
            Industries &amp; Verticals Catalog
          </h1>
          <p className="text-sm font-medium text-neutral-600 mt-0.5">
            Internal catalog of supported business industries. Used across dropdowns in CRM &amp; Business onboarding.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <span>+ Add Industry</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-neutral-500 uppercase">
          Total Industries: {industries.length}
        </span>

        <input
          type="text"
          placeholder="Search industries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs w-full md:w-60 focus:outline-none focus:border-[#ff3b30]"
        />
      </div>

      {/* Industries Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-black">
              <th className="p-3">Icon</th>
              <th className="p-3">Industry Name</th>
              <th className="p-3">System Slug ID</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredIndustries.map((item) => (
              <tr key={item.id} className="hover:bg-neutral-50 transition">
                <td className="p-3 text-lg">{item.icon}</td>
                <td className="p-3 font-black text-neutral-900 uppercase">{item.name}</td>
                <td className="p-3 font-mono text-neutral-500">{item.id}</td>
                <td className="p-3 text-neutral-600 font-medium">{item.description}</td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-xs font-bold text-neutral-900 hover:text-[#ff3b30] hover:underline"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteIndustry(item.id)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD / EDIT INDUSTRY */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900 uppercase">
                {editingItem ? '✏️ Edit Industry' : '+ Add Industry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveIndustry} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Industry Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Towing & Recovery Service"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Emoji / Icon</label>
                <input
                  type="text"
                  placeholder="e.g. 🚛 or 🛠️"
                  value={iconInput}
                  onChange={(e) => setIconInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of what software features this industry uses..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold text-xs uppercase rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded-lg shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Save Industry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
