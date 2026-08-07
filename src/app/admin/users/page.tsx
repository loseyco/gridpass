'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { MemberUser } from '@/lib/types/admin';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';

type UserFilterCategory = 'all' | 'gold' | 'business_owner' | 'admin';

interface MemberWithCounts extends MemberUser {
  real_vehicles_count: number;
  real_businesses_count: number;
  real_credits: number;
  usd_value: string;
}

export default function AdminUsersWorksheetPage() {
  const [users, setUsers] = useState<MemberUser[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [pointsLogs, setPointsLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Modal State
  const [activeFilter, setActiveFilter] = useState<UserFilterCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Member Modal State
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'member' | 'business_owner' | 'admin'>('member');
  const [newIsGold, setNewIsGold] = useState(false);

  // Subscribe to Firestore users, vehicles, businesses, and points_logs
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: MemberUser[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() } as MemberUser);
        });
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Users listener fallback:', err);
        setLoading(false);
      }
    );

    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      const vList: any[] = [];
      snapshot.forEach((docSnap) => vList.push({ id: docSnap.id, ...docSnap.data() }));
      setVehicles(vList);
    });

    const unsubBusinesses = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      const bList: any[] = [];
      snapshot.forEach((docSnap) => bList.push({ id: docSnap.id, ...docSnap.data() }));
      setBusinesses(bList);
    });

    const unsubPoints = onSnapshot(
      collection(db, 'points_logs'),
      (snapshot) => {
        const pList: any[] = [];
        snapshot.forEach((docSnap) => pList.push({ id: docSnap.id, ...docSnap.data() }));
        setPointsLogs(pList);
      },
      (err) => console.warn('Points logs listener error:', err)
    );

    return () => {
      unsubUsers();
      unsubVehicles();
      unsubBusinesses();
      unsubPoints();
    };
  }, []);

  // Compute Members with Live Real Vehicle, Business, and Credits Counts
  const membersWithCounts: MemberWithCounts[] = users.map((user) => {
    const userVehicles = vehicles.filter(
      (v) =>
        v.owner_id === user.uid ||
        (v.owner_name && user.display_name && v.owner_name.toLowerCase() === user.display_name.toLowerCase())
    );
    const userBusinesses = businesses.filter(
      (b) => b.owner_uid === user.uid || b.id === user.uid
    );

    const userLogs = pointsLogs.filter(
      (p) =>
        (p.userId === user.uid ||
          (p.userEmail && user.email && p.userEmail.toLowerCase() === user.email.toLowerCase())) &&
        p.status === 'approved'
    );

    const real_credits = userLogs.reduce((sum, item) => sum + (item.pointsAwarded || 0), 0);
    const usd_value = `$${(real_credits / 100).toFixed(2)}`;

    return {
      ...user,
      real_vehicles_count: userVehicles.length,
      real_businesses_count: userBusinesses.length,
      real_credits,
      usd_value,
    };
  });

  // Handle Inline Save to Firestore
  const handleInlineSave = async (id: string, key: string, newValue: any) => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === id ? { ...u, [key]: newValue } : u))
    );

    try {
      await setDoc(doc(db, 'users', id), { [key]: newValue }, { merge: true });
    } catch (err) {
      console.warn('Inline edit saved locally:', err);
    }
  };

  // Role Selection Update
  const handleRoleChange = async (uid: string, newRole: 'member' | 'business_owner' | 'admin') => {
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));

    try {
      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
    } catch (err) {
      console.warn('Role updated locally:', err);
    }
  };

  // Gold Supporter Toggle
  const toggleGold = async (uid: string, currentGold?: boolean) => {
    const nextGold = !currentGold;
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, is_gold: nextGold } : u)));

    try {
      await setDoc(doc(db, 'users', uid), { is_gold: nextGold }, { merge: true });
    } catch (err) {
      console.warn('Gold status updated locally:', err);
    }
  };

  // Add New Member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName || !newEmail) return;

    const uid = `usr_${Date.now()}`;
    const newMember: MemberUser = {
      uid,
      display_name: newDisplayName,
      email: newEmail,
      role: newRole,
      is_gold: newIsGold,
      vehicles_count: 0,
      joined_date: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [newMember, ...prev]);

    try {
      await setDoc(doc(db, 'users', uid), newMember, { merge: true });
    } catch (err) {
      console.warn('Member saved locally:', err);
    }

    setNewDisplayName('');
    setNewEmail('');
    setShowAddModal(false);
  };

  // Filtered Members
  const filteredMembers = membersWithCounts.filter((user) => {
    if (activeFilter === 'gold' && !user.is_gold) return false;
    if (activeFilter === 'business_owner' && user.role !== 'business_owner') return false;
    if (activeFilter === 'admin' && user.role !== 'admin') return false;
    return true;
  });

  // Export CSV
  const exportCSV = () => {
    const headers = ['UID', 'Display Name', 'Email', 'Role', 'Gold Supporter', 'Vehicles Count', 'Businesses Count'];
    const rows = filteredMembers.map((u) => [
      u.uid,
      `"${u.display_name || ''}"`,
      u.email || '',
      u.role || 'member',
      u.is_gold ? 'YES' : 'NO',
      u.real_vehicles_count,
      u.real_businesses_count,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Columns for ExcelWorksheetTable
  const columns: ColumnDef<MemberWithCounts>[] = [
    {
      key: 'display_name',
      label: 'MEMBER NAME',
      editable: true,
      render: (row) => <span className="font-bold text-neutral-900">{row.display_name || 'Anonymous Member'}</span>,
    },
    {
      key: 'email',
      label: 'EMAIL ADDRESS',
      editable: true,
      render: (row) => <span className="text-neutral-700">{row.email || '—'}</span>,
    },
    {
      key: 'uid',
      label: 'UID',
      render: (row) => <code className="text-[11px] font-mono text-neutral-500">{row.uid}</code>,
    },
    {
      key: 'role',
      label: 'SYSTEM ROLE',
      render: (row) => (
        <select
          value={row.role || 'member'}
          onChange={(e) => handleRoleChange(row.uid, e.target.value as any)}
          className="bg-neutral-100 text-neutral-900 border border-neutral-300 font-sans font-bold text-[10px] uppercase p-1 rounded focus:outline-none focus:border-[#ff3b30]"
        >
          <option value="member">Member</option>
          <option value="business_owner">Business Owner</option>
          <option value="admin">System Admin</option>
        </select>
      ),
    },
    {
      key: 'is_gold',
      label: 'GOLD STATUS',
      render: (row) => (
        <button
          onClick={() => toggleGold(row.uid, row.is_gold)}
          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition ${
            row.is_gold
              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
              : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
          }`}
        >
          {row.is_gold ? '★ GOLD' : 'STANDARD'}
        </button>
      ),
    },
    {
      key: 'real_vehicles_count',
      label: 'VEHICLES',
      align: 'center',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded ${row.real_vehicles_count > 0 ? 'bg-neutral-100 text-[#1c1c1e] font-black' : 'text-neutral-400'}`}>
          {row.real_vehicles_count}
        </span>
      ),
    },
    {
      key: 'real_businesses_count',
      label: 'BUSINESSES',
      align: 'center',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded ${row.real_businesses_count > 0 ? 'bg-neutral-100 text-[#1c1c1e] font-black' : 'text-neutral-400'}`}>
          {row.real_businesses_count}
        </span>
      ),
    },
    {
      key: 'real_credits',
      label: 'GRID CREDITS (USD)',
      align: 'center',
      render: (row) => (
        <span className="bg-red-50 border border-red-200 text-[#ff3b30] font-black text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
          ⚡ {row.real_credits} <span className="text-[9px] font-bold text-neutral-500">({row.usd_value})</span>
        </span>
      ),
    },
  ];

  const goldCount = users.filter((u) => u.is_gold).length;
  const bizOwnersCount = users.filter((u) => u.role === 'business_owner').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const filterCategories = [
    { label: 'All', key: 'all', count: users.length },
    { label: '★ Gold', key: 'gold', count: goldCount },
    { label: 'Owners', key: 'business_owner', count: bizOwnersCount },
    { label: 'Admins', key: 'admin', count: adminCount },
  ];

  return (
    <div className="space-y-4 font-sans">
      <ExcelWorksheetTable
        title="Members & Driver Directory"
        data={filteredMembers}
        columns={columns}
        idKey="uid"
        filterCategories={filterCategories}
        activeFilter={activeFilter}
        onFilterChange={(key) => setActiveFilter(key as UserFilterCategory)}
        searchPlaceholder="Search member names, emails, UIDs..."
        onAddRow={() => setShowAddModal(true)}
        onExportCSV={exportCSV}
        onInlineSave={handleInlineSave}
        loading={loading}
        actionRenderer={(row) => (
          <Link
            href={`/u/${row.uid}`}
            target="_blank"
            className="text-[10px] font-bold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2 py-1 rounded border border-neutral-300"
          >
            Passport ↗
          </Link>
        )}
      />

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">Add Member Row to Excel Sheet</h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 font-bold hover:text-neutral-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Full Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PJ Losey"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="member@gridpass.app"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="member">Member</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-neutral-800">
                    <input
                      type="checkbox"
                      checked={newIsGold}
                      onChange={(e) => setNewIsGold(e.target.checked)}
                      className="w-4 h-4 accent-[#ff3b30]"
                    />
                    <span>★ Gold Supporter</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-neutral-600 uppercase"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-1.5 rounded">
                  Save Member Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
