'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';

export interface SalesStaffItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'sales_rep' | 'sales_lead' | 'partner' | 'admin';
  commission_split: number;
  status: 'active' | 'inactive';
}

const DEFAULT_STAFF: SalesStaffItem[] = [
  { id: 'pj-losey', name: 'PJ Losey', email: 'pj@gridpass.app', role: 'admin', commission_split: 100, status: 'active' },
  { id: 'zach-shaw', name: 'Zach Shaw', email: 'zach@shawdaddys.com', phone: '(555) 867-5309', role: 'partner', commission_split: 50, status: 'active' },
];

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<SalesStaffItem[]>(DEFAULT_STAFF);
  const [loading, setLoading] = useState(true);

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

  const handleInlineSave = async (id: string, key: string, newValue: any) => {
    const valToSave = key === 'commission_split' ? Number(newValue) || 50 : newValue;
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: valToSave } : s))
    );

    try {
      await setDoc(doc(db, 'staff', id), { [key]: valToSave }, { merge: true });
    } catch (err) {}
  };

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

  // Export CSV
  const exportCSV = () => {
    const headers = ['Rep ID', 'Name', 'Email', 'Phone', 'Role', 'Commission Split (%)'];
    const rows = staff.map((s) => [
      s.id,
      `"${s.name || ''}"`,
      s.email || '',
      s.phone || '',
      s.role || '',
      s.commission_split,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_staff_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Columns for ExcelWorksheetTable
  const columns: ColumnDef<SalesStaffItem>[] = [
    {
      key: 'name',
      label: 'REP NAME',
      editable: true,
      render: (row) => <span className="font-bold text-neutral-900 uppercase">👤 {row.name}</span>,
    },
    {
      key: 'email',
      label: 'EMAIL & CONTACT',
      editable: true,
      render: (row) => (
        <span className="font-mono text-neutral-700">
          {row.email}
          {row.phone && <span className="block text-[10px] text-neutral-400">{row.phone}</span>}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'ROLE',
      render: (row) => (
        <span className="px-2 py-0.5 bg-neutral-100 font-black text-[10px] text-neutral-800 uppercase rounded">
          {(row.role || 'sales_rep').replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'commission_split',
      label: 'COMMISSION SPLIT',
      editable: true,
      render: (row) => (
        <span className="px-2.5 py-1 bg-purple-100 font-black text-xs text-purple-900 rounded">
          {row.commission_split}% Revenue Split
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      <ExcelWorksheetTable
        title="Sales Staff & Platform Reps"
        data={staff}
        columns={columns}
        idKey="id"
        searchPlaceholder="Search sales reps..."
        onAddRow={openAddModal}
        onExportCSV={exportCSV}
        onInlineSave={handleInlineSave}
        loading={loading}
        actionRenderer={(row) => (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => openEditModal(row)}
              className="text-xs font-bold text-neutral-900 hover:text-[#ff3b30] hover:underline"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => handleDeleteStaff(row.id)}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      />

      {/* MODAL: ADD / EDIT STAFF */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl font-sans">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h3 className="font-black text-sm text-neutral-900 uppercase">
                {editingItem ? '✏️ Edit Sales Rep' : '+ Add Sales Rep'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Rep Full Name</label>
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
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Email Address</label>
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
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Role</label>
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
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Commission Split (%)</label>
                  <input
                    type="number"
                    value={splitInput}
                    onChange={(e) => setSplitInput(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Phone Number (Optional)</label>
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
                  className="px-3 py-1.5 text-xs font-bold text-neutral-600 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded shadow-sm"
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
