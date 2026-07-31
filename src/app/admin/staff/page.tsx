'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface SalesStaffItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'sales_rep' | 'sales_lead' | 'partner' | 'admin';
  commission_split: number; // e.g. 50%
  status: 'active' | 'inactive';
}

const DEFAULT_STAFF: SalesStaffItem[] = [
  { id: 'pj-losey', name: 'PJ Losey', email: 'pj@gridpass.app', role: 'admin', commission_split: 100, status: 'active' },
  { id: 'zach-shaw', name: 'Zach Shaw', email: 'zach@shawdaddys.com', phone: '(555) 867-5309', role: 'partner', commission_split: 50, status: 'active' },
];

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<SalesStaffItem[]>(DEFAULT_STAFF);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesStaffItem | null>(null);

  // Form Inputs
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [roleInput, setRoleInput] = useState<SalesStaffItem['role']>('sales_rep');
  const [splitInput, setSplitInput] = useState<number>(50);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocal = localStorage.getItem('__gridpass_sales_staff__');
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) setStaff(parsed);
        } catch (e) {}
      }
    }

    const unsub = onSnapshot(
      collection(db, 'staff'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SalesStaffItem[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as SalesStaffItem);
          });
          setStaff(list);
          if (typeof window !== 'undefined') {
            localStorage.setItem('__gridpass_sales_staff__', JSON.stringify(list));
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
    setEmailInput('');
    setPhoneInput('');
    setRoleInput('sales_rep');
    setSplitInput(50);
    setShowModal(true);
  };

  const openEditModal = (item: SalesStaffItem) => {
    setEditingItem(item);
    setNameInput(item.name);
    setEmailInput(item.email);
    setPhoneInput(item.phone || '');
    setRoleInput(item.role);
    setSplitInput(item.commission_split);
    setShowModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const id = editingItem
      ? editingItem.id
      : nameInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const itemObj: SalesStaffItem = {
      id,
      name: nameInput,
      email: emailInput,
      phone: phoneInput,
      role: roleInput,
      commission_split: Number(splitInput) || 50,
      status: 'active',
    };

    setStaff((prev) => {
      const exists = prev.some((s) => s.id === id);
      const updated = exists ? prev.map((s) => (s.id === id ? itemObj : s)) : [...prev, itemObj];
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_sales_staff__', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'staff', id), itemObj);
    } catch (err) {}

    setShowModal(false);
    setEditingItem(null);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales staff member?')) return;
    setStaff((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_sales_staff__', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (err) {}
  };

  const filteredStaff = staff.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-neutral-900 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
            Sales &amp; CRM Department
          </span>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight mt-1">
            Sales Staff &amp; Reps
          </h1>
          <p className="text-sm font-medium text-neutral-600 mt-0.5">
            Manage active sales representatives, partners, and revenue commission splits.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <span>+ Add Sales Rep</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-neutral-500 uppercase">
          Total Active Reps: {staff.length}
        </span>

        <input
          type="text"
          placeholder="Search sales reps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs w-full md:w-60 focus:outline-none focus:border-[#ff3b30]"
        />
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-black">
              <th className="p-3">Rep Name</th>
              <th className="p-3">Email &amp; Contact</th>
              <th className="p-3">Role</th>
              <th className="p-3">Commission Split</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredStaff.map((s) => (
              <tr key={s.id} className="hover:bg-neutral-50 transition">
                <td className="p-3 font-black text-neutral-900 uppercase">
                  👤 {s.name}
                </td>
                <td className="p-3 font-mono text-neutral-700">
                  {s.email}
                  {s.phone && <span className="block text-[10px] text-neutral-400">{s.phone}</span>}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-neutral-100 font-black text-[10px] text-neutral-800 uppercase rounded">
                    {s.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-2.5 py-1 bg-purple-100 font-black text-xs text-purple-900 rounded">
                    {s.commission_split}% Revenue Split
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(s)}
                    className="text-xs font-bold text-neutral-900 hover:text-[#ff3b30] hover:underline"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(s.id)}
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

      {/* MODAL: ADD / EDIT STAFF */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900 uppercase">
                {editingItem ? '✏️ Edit Sales Rep' : '+ Add Sales Rep'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Rep Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zach Shaw"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zach@shawdaddys.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Role</label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="sales_rep">Sales Rep</option>
                    <option value="sales_lead">Sales Lead</option>
                    <option value="partner">Sales Partner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Commission Split (%)</label>
                  <input
                    type="number"
                    value={splitInput}
                    onChange={(e) => setSplitInput(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. (555) 867-5309"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
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
                  {editingItem ? 'Save Changes' : 'Save Rep'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
