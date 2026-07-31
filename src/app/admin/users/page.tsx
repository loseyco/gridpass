'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { MemberUser } from '@/lib/types/admin';

type UserFilterCategory = 'all' | 'gold' | 'business_owner' | 'admin';
type SortField = 'display_name' | 'email' | 'role' | 'vehicles_count' | 'businesses_count' | 'is_gold' | 'uid';
type SortOrder = 'asc' | 'desc';

interface MemberWithCounts extends MemberUser {
  real_vehicles_count: number;
  real_businesses_count: number;
}

export default function AdminUsersWorksheetPage() {
  const [users, setUsers] = useState<MemberUser[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter, Search & Sort State
  const [activeFilter, setActiveFilter] = useState<UserFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('display_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Inline Editing State
  const [editingCell, setEditingCell] = useState<{ uid: string; field: 'display_name' | 'email' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Row Selection State
  const [selectedUids, setSelectedUids] = useState<string[]>([]);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'member' | 'business_owner' | 'admin'>('member');
  const [newIsGold, setNewIsGold] = useState(false);

  // Subscribe to Firestore users, vehicles, and businesses
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

    return () => {
      unsubUsers();
      unsubVehicles();
      unsubBusinesses();
    };
  }, []);

  // Compute Members with Live Real Vehicle & Business Counts
  const membersWithCounts: MemberWithCounts[] = users.map((user) => {
    const userVehicles = vehicles.filter(
      (v) => v.owner_id === user.uid || (v.owner_name && user.display_name && v.owner_name.toLowerCase() === user.display_name.toLowerCase())
    );
    const userBusinesses = businesses.filter(
      (b) => b.owner_uid === user.uid || b.id === user.uid
    );

    return {
      ...user,
      real_vehicles_count: userVehicles.length,
      real_businesses_count: userBusinesses.length,
    };
  });

  // Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Live Inline Edit Save to Firestore
  const saveInlineEdit = async (uid: string, field: 'display_name' | 'email') => {
    if (!editingCell) return;
    const valueToSave = editValue;

    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, [field]: valueToSave } : u))
    );
    setEditingCell(null);

    try {
      await setDoc(doc(db, 'users', uid), { [field]: valueToSave }, { merge: true });
    } catch (err) {
      console.warn('Inline edit saved locally:', err);
    }
  };

  const startInlineEdit = (uid: string, field: 'display_name' | 'email', currentValue: string) => {
    setEditingCell({ uid, field });
    setEditValue(currentValue || '');
  };

  // Live Role Selection Update
  const handleRoleChange = async (uid: string, newRole: 'member' | 'business_owner' | 'admin') => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
    );

    try {
      await setDoc(doc(db, 'users', uid), { role: newRole }, { merge: true });
    } catch (err) {
      console.warn('Role updated locally:', err);
    }
  };

  // Live Gold Supporter Toggle
  const toggleGold = async (uid: string, currentGold?: boolean) => {
    const nextGold = !currentGold;
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, is_gold: nextGold } : u))
    );

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

  // Checkbox Selection
  const toggleSelectAll = () => {
    if (selectedUids.length === sortedUsers.length) {
      setSelectedUids([]);
    } else {
      setSelectedUids(sortedUsers.map((u) => u.uid));
    }
  };

  const toggleSelectUser = (uid: string) => {
    if (selectedUids.includes(uid)) {
      setSelectedUids(selectedUids.filter((id) => id !== uid));
    } else {
      setSelectedUids([...selectedUids, uid]);
    }
  };

  // Filtering & Sorting
  const filteredUsers = membersWithCounts.filter((user) => {
    if (activeFilter === 'gold' && !user.is_gold) return false;
    if (activeFilter === 'business_owner' && user.role !== 'business_owner') return false;
    if (activeFilter === 'admin' && user.role !== 'admin') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        user.display_name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.uid?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal: any = a[sortField as keyof MemberWithCounts] || '';
    let bVal: any = b[sortField as keyof MemberWithCounts] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // CSV Export
  const exportCSV = () => {
    const headers = ['UID', 'Display Name', 'Email', 'Role', 'Gold Supporter', 'Vehicles Count', 'Businesses Count'];
    const rows = sortedUsers.map((u) => [
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

  const goldCount = users.filter((u) => u.is_gold).length;
  const bizOwnersCount = users.filter((u) => u.role === 'business_owner').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-3 font-sans">
      {/* Excel Toolbar */}
      <div className="bg-white border border-neutral-300 rounded-lg p-2.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'all'
                ? 'bg-[#ff3b30] text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setActiveFilter('gold')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'gold'
                ? 'bg-amber-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            ★ Gold ({goldCount})
          </button>
          <button
            onClick={() => setActiveFilter('business_owner')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'business_owner'
                ? 'bg-[#1c1c1e] text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Owners ({bizOwnersCount})
          </button>
          <button
            onClick={() => setActiveFilter('admin')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Admins ({adminCount})
          </button>
        </div>

        {/* Search & Action Controls */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search column values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-52 text-xs font-bold p-1.5 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
          />
          <button
            onClick={exportCSV}
            className="text-xs font-extrabold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 px-2.5 py-1.5 rounded transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-3 py-1.5 rounded transition shadow-sm whitespace-nowrap"
          >
            + Add Row
          </button>
        </div>
      </div>

      {/* Add Row Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">
                Add Member Row to Excel Sheet
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PJ Losey"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="member@gridpass.app"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    System Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
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
                <button
                  type="submit"
                  className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-1.5 rounded"
                >
                  Save Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL EXCEL WORKSHEET TABLE */}
      <div className="bg-white border border-neutral-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-neutral-800 select-none">
                <th className="p-2 border-r border-neutral-800 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedUids.length > 0 && selectedUids.length === sortedUsers.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                  />
                </th>

                <th
                  onClick={() => handleSort('display_name')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  MEMBER NAME {sortField === 'display_name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('email')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  EMAIL ADDRESS {sortField === 'email' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('uid')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  UID {sortField === 'uid' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('role')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  SYSTEM ROLE {sortField === 'role' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('is_gold')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  GOLD STATUS {sortField === 'is_gold' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('vehicles_count')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap text-center"
                >
                  VEHICLES {sortField === 'vehicles_count' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('businesses_count')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap text-center"
                >
                  BUSINESSES {sortField === 'businesses_count' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th className="p-2 text-right whitespace-nowrap">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    Loading Excel Grid Data...
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    No Rows Matching Filter
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user, idx) => {
                  const isSelected = selectedUids.includes(user.uid);
                  const isEditingName = editingCell?.uid === user.uid && editingCell?.field === 'display_name';
                  const isEditingEmail = editingCell?.uid === user.uid && editingCell?.field === 'email';

                  return (
                    <tr
                      key={user.uid}
                      className={`transition ${
                        isSelected
                          ? 'bg-red-50/80'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-neutral-100/80'
                          : 'bg-neutral-50 hover:bg-neutral-100/80'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-2 border-r border-neutral-200 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(user.uid)}
                          className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                        />
                      </td>

                      {/* Display Name (Inline Edit) */}
                      <td
                        onDoubleClick={() => startInlineEdit(user.uid, 'display_name', user.display_name || '')}
                        className="p-2 border-r border-neutral-200 font-bold text-neutral-900 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                        title="Double-click to edit name"
                      >
                        {isEditingName ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(user.uid, 'display_name')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(user.uid, 'display_name');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span>{user.display_name || 'Anonymous Member'}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-neutral-400">✏️</span>
                          </div>
                        )}
                      </td>

                      {/* Email (Inline Edit) */}
                      <td
                        onDoubleClick={() => startInlineEdit(user.uid, 'email', user.email || '')}
                        className="p-2 border-r border-neutral-200 text-neutral-700 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                        title="Double-click to edit email"
                      >
                        {isEditingEmail ? (
                          <input
                            type="email"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(user.uid, 'email')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(user.uid, 'email');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span>{user.email || '—'}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-neutral-400">✏️</span>
                          </div>
                        )}
                      </td>

                      {/* UID */}
                      <td className="p-2 border-r border-neutral-200 text-[11px] text-neutral-500 whitespace-nowrap">
                        {user.uid}
                      </td>

                      {/* System Role (Inline Dropdown Select) */}
                      <td className="p-2 border-r border-neutral-200 whitespace-nowrap">
                        <select
                          value={user.role || 'member'}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                          className="bg-neutral-100 text-neutral-900 border border-neutral-300 font-sans font-bold text-[10px] uppercase p-1 rounded focus:outline-none focus:border-[#ff3b30]"
                        >
                          <option value="member">Member</option>
                          <option value="business_owner">Business Owner</option>
                          <option value="admin">System Admin</option>
                        </select>
                      </td>

                      {/* Gold Status Toggle */}
                      <td className="p-2 border-r border-neutral-200 whitespace-nowrap">
                        <button
                          onClick={() => toggleGold(user.uid, user.is_gold)}
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition ${
                            user.is_gold
                              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                              : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
                          }`}
                        >
                          {user.is_gold ? '★ GOLD' : 'STANDARD'}
                        </button>
                      </td>

                      {/* Real Vehicles Count */}
                      <td className="p-2 border-r border-neutral-200 font-bold text-center text-neutral-900 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded ${user.real_vehicles_count > 0 ? 'bg-neutral-100 text-[#1c1c1e] font-black' : 'text-neutral-400'}`}>
                          {user.real_vehicles_count}
                        </span>
                      </td>

                      {/* Real Businesses Count */}
                      <td className="p-2 border-r border-neutral-200 font-bold text-center text-neutral-900 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded ${user.real_businesses_count > 0 ? 'bg-neutral-100 text-[#1c1c1e] font-black' : 'text-neutral-400'}`}>
                          {user.real_businesses_count}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-right whitespace-nowrap font-sans">
                        <Link
                          href={`/u/${user.uid}`}
                          target="_blank"
                          className="text-[10px] font-bold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2 py-1 rounded border border-neutral-300"
                        >
                          Passport ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div className="bg-neutral-900 text-white p-2.5 border-t border-neutral-800 flex items-center justify-between text-[10px] font-extrabold uppercase font-sans">
          <div className="flex items-center gap-3">
            <span>
              Rows: {sortedUsers.length} of {users.length} Total Members
            </span>
            {selectedUids.length > 0 && (
              <span className="text-[#ff3b30]">
                ({selectedUids.length} Selected)
              </span>
            )}
          </div>
          <span className="text-neutral-400">
            Double-click cell to edit | Real live vehicle & business counters active
          </span>
        </div>
      </div>
    </div>
  );
}
