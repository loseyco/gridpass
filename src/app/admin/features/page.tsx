'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { AdminFeature, FeatureStatus, FeatureCategory, FeatureAccessLevel } from '@/lib/types/admin';

type FeatureFilterState = 'all' | 'saas_modules' | 'live' | 'beta' | 'idea';
type SortField = 'name' | 'route_path' | 'module_key' | 'saas_addon_price' | 'status' | 'access_level' | 'last_updated_at' | 'version';
type SortOrder = 'asc' | 'desc';

export default function AdminFeaturesPage() {
  const [features, setFeatures] = useState<AdminFeature[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter, Search & Sort State
  const [activeFilter, setActiveFilter] = useState<FeatureFilterState>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Inline Editing State
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'name' | 'route_path' | 'module_key' | 'saas_addon_price' | 'version' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Row Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add Feature Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRoutePath, setNewRoutePath] = useState('');
  const [newModuleKey, setNewModuleKey] = useState('');
  const [newIsSaasModule, setNewIsSaasModule] = useState(false);
  const [newAddonPrice, setNewAddonPrice] = useState<number>(29);
  const [newCategory, setNewCategory] = useState<FeatureCategory>('auto_shop');
  const [newStatus, setNewStatus] = useState<FeatureStatus>('live');
  const [newAccessLevel, setNewAccessLevel] = useState<FeatureAccessLevel>('public');
  const [newVersion, setNewVersion] = useState('v4.1.0');
  const [newDescription, setNewDescription] = useState('');

  // Subscribe to Firestore features collection cleanly (NO fake seed arrays)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'features'),
      (snapshot) => {
        const list: AdminFeature[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AdminFeature);
        });
        setFeatures(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Features listener fallback:', err);
        setFeatures([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Live Inline Edit Save
  const saveInlineEdit = async (id: string, field: 'name' | 'route_path' | 'module_key' | 'saas_addon_price' | 'version') => {
    if (!editingCell) return;
    const valueToSave = field === 'saas_addon_price' ? Number(editValue) || 0 : editValue;
    const today = new Date().toISOString().split('T')[0];

    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: valueToSave, last_updated_at: today } : f))
    );
    setEditingCell(null);

    try {
      await setDoc(doc(db, 'features', id), { [field]: valueToSave, last_updated_at: today }, { merge: true });
    } catch (err) {
      console.warn('Feature saved locally:', err);
    }
  };

  const startInlineEdit = (id: string, field: 'name' | 'route_path' | 'module_key' | 'saas_addon_price' | 'version', currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue || ''));
  };

  // Live SaaS Module Toggle
  const toggleSaasModule = async (id: string, currentVal?: boolean) => {
    const nextVal = !currentVal;
    const today = new Date().toISOString().split('T')[0];

    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_saas_module: nextVal, last_updated_at: today } : f))
    );

    try {
      await setDoc(doc(db, 'features', id), { is_saas_module: nextVal, last_updated_at: today }, { merge: true });
    } catch (err) {
      console.warn('SaaS module flag updated locally:', err);
    }
  };

  // Live Status Change
  const handleStatusChange = async (id: string, status: FeatureStatus) => {
    const isLive = status === 'live';
    const today = new Date().toISOString().split('T')[0];

    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status, is_page_live: isLive, last_updated_at: today } : f))
    );

    try {
      await setDoc(doc(db, 'features', id), { status, is_page_live: isLive, last_updated_at: today }, { merge: true });
    } catch (err) {
      console.warn('Status updated locally:', err);
    }
  };

  // Live Access Level Change
  const handleAccessLevelChange = async (id: string, access_level: FeatureAccessLevel) => {
    const today = new Date().toISOString().split('T')[0];

    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, access_level, last_updated_at: today } : f))
    );

    try {
      await setDoc(doc(db, 'features', id), { access_level, last_updated_at: today }, { merge: true });
    } catch (err) {
      console.warn('Access level updated locally:', err);
    }
  };

  // Add Feature
  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const featureId = `feat_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const newFeat: AdminFeature = {
      id: featureId,
      name: newName,
      route_path: newRoutePath || `/admin/${newName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      module_key: newModuleKey || newName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      is_saas_module: newIsSaasModule,
      saas_addon_price: Number(newAddonPrice) || 29,
      category: newCategory,
      status: newStatus,
      is_page_live: newStatus === 'live',
      access_level: newAccessLevel,
      version: newVersion || 'v4.1.0',
      priority: 'medium',
      description: newDescription || `Specification and modular SaaS package for ${newName}`,
      notes: [],
      bugs: [],
      last_updated_at: today,
      created_at: today,
    };

    setFeatures((prev) => [newFeat, ...prev]);

    try {
      await setDoc(doc(db, 'features', featureId), newFeat, { merge: true });
    } catch (err) {
      console.warn('Feature saved locally:', err);
    }

    setNewName('');
    setNewRoutePath('');
    setNewModuleKey('');
    setNewDescription('');
    setShowAddModal(false);
  };

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === sortedFeatures.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedFeatures.map((f) => f.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filtering & Sorting
  const filteredFeatures = features.filter((f) => {
    if (activeFilter === 'saas_modules' && !f.is_saas_module) return false;
    if (activeFilter === 'live' && f.status !== 'live') return false;
    if (activeFilter === 'beta' && f.status !== 'beta') return false;
    if (activeFilter === 'idea' && f.status !== 'idea') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name?.toLowerCase().includes(q) ||
        f.route_path?.toLowerCase().includes(q) ||
        f.module_key?.toLowerCase().includes(q) ||
        f.id?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const sortedFeatures = [...filteredFeatures].sort((a, b) => {
    let aVal: any = a[sortField] || '';
    let bVal: any = b[sortField] || '';

    if (sortField === 'saas_addon_price') {
      aVal = a.saas_addon_price || 0;
      bVal = b.saas_addon_price || 0;
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Export CSV
  const exportCSV = () => {
    const headers = ['ID', 'Feature Name', 'Route Path', 'Module Key', 'SaaS Module', 'Add-on Price ($)', 'Status', 'Access Level', 'Last Updated'];
    const rows = sortedFeatures.map((f) => [
      f.id,
      `"${f.name || ''}"`,
      f.route_path || '',
      f.module_key || '',
      f.is_saas_module ? 'YES' : 'NO',
      f.saas_addon_price || 0,
      f.status || 'idea',
      f.access_level || 'public',
      f.last_updated_at || f.created_at || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_features_modules_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saasModulesCount = features.filter((f) => f.is_saas_module).length;
  const liveCount = features.filter((f) => f.status === 'live').length;
  const betaCount = features.filter((f) => f.status === 'beta').length;
  const ideaCount = features.filter((f) => f.status === 'idea').length;

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
            All ({features.length})
          </button>
          <button
            onClick={() => setActiveFilter('saas_modules')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'saas_modules'
                ? 'bg-[#1c1c1e] text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            ⚡ SaaS Modules ({saasModulesCount})
          </button>
          <button
            onClick={() => setActiveFilter('live')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'live'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Live ({liveCount})
          </button>
          <button
            onClick={() => setActiveFilter('beta')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'beta'
                ? 'bg-purple-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Beta ({betaCount})
          </button>
          <button
            onClick={() => setActiveFilter('idea')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'idea'
                ? 'bg-amber-500 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Ideas ({ideaCount})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search features, routes..."
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
            + Add Feature Route
          </button>
        </div>
      </div>

      {/* Add Feature Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">
                Register Feature / Page Route
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFeature} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Feature / Page Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated SMS Reminders"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Route Path
                  </label>
                  <input
                    type="text"
                    placeholder="/b/[id]/sms"
                    value={newRoutePath}
                    onChange={(e) => setNewRoutePath(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Module Key
                  </label>
                  <input
                    type="text"
                    placeholder="sms_notifications"
                    value={newModuleKey}
                    onChange={(e) => setNewModuleKey(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center pt-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-neutral-800">
                    <input
                      type="checkbox"
                      checked={newIsSaasModule}
                      onChange={(e) => setNewIsSaasModule(e.target.checked)}
                      className="w-4 h-4 accent-[#ff3b30]"
                    />
                    <span>⚡ SaaS Module</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Add-on Price ($/mo)
                  </label>
                  <input
                    type="number"
                    value={newAddonPrice}
                    onChange={(e) => setNewAddonPrice(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    State
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  >
                    <option value="idea">Idea</option>
                    <option value="alpha">Alpha</option>
                    <option value="beta">Beta</option>
                    <option value="live">Live Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Who Can See It?
                  </label>
                  <select
                    value={newAccessLevel}
                    onChange={(e) => setNewAccessLevel(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  >
                    <option value="public">All Public</option>
                    <option value="members">Members Only</option>
                    <option value="gold">Gold Supporters</option>
                    <option value="business_owners">Business Owners</option>
                    <option value="admins_only">Admins Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Feature goals, specification, and audience..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs font-medium p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
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
                  Save Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL EXCEL SHEET TABLE */}
      <div className="bg-white border border-neutral-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-neutral-800 select-none">
                <th className="p-2 border-r border-neutral-800 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === sortedFeatures.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                  />
                </th>

                <th
                  onClick={() => handleSort('name')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  FEATURE / PAGE {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('route_path')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  ROUTE PATH {sortField === 'route_path' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('module_key')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  MODULE KEY {sortField === 'module_key' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th className="p-2 border-r border-neutral-800 whitespace-nowrap text-center">
                  SAAS MODULE?
                </th>

                <th
                  onClick={() => handleSort('saas_addon_price')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap text-right"
                >
                  ADD-ON ($) {sortField === 'saas_addon_price' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  IS LIVE? {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('access_level')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  WHO CAN SEE IT? {sortField === 'access_level' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th className="p-2 text-right whitespace-nowrap">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    Loading Feature Engine Grid...
                  </td>
                </tr>
              ) : sortedFeatures.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    No Features Registered
                  </td>
                </tr>
              ) : (
                sortedFeatures.map((feat, idx) => {
                  const isSelected = selectedIds.includes(feat.id);
                  const isEditingName = editingCell?.id === feat.id && editingCell?.field === 'name';
                  const isEditingRoute = editingCell?.id === feat.id && editingCell?.field === 'route_path';
                  const isEditingModuleKey = editingCell?.id === feat.id && editingCell?.field === 'module_key';
                  const isEditingPrice = editingCell?.id === feat.id && editingCell?.field === 'saas_addon_price';

                  return (
                    <tr
                      key={feat.id}
                      className={`transition ${
                        isSelected
                          ? 'bg-red-50/80'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-neutral-100/80'
                          : 'bg-neutral-50 hover:bg-neutral-100/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-2 border-r border-neutral-200 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(feat.id)}
                          className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                        />
                      </td>

                      {/* Feature Name (Inline Edit) */}
                      <td
                        onDoubleClick={() => startInlineEdit(feat.id, 'name', feat.name || '')}
                        className="p-2 border-r border-neutral-200 font-bold text-neutral-900 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingName ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(feat.id, 'name')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(feat.id, 'name');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <Link
                            href={`/admin/features/${feat.id}`}
                            className="hover:text-[#ff3b30] transition flex items-center justify-between group"
                          >
                            <span>{feat.name}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-neutral-400">✏️</span>
                          </Link>
                        )}
                      </td>

                      {/* Route Path (Inline Edit) */}
                      <td
                        onDoubleClick={() => startInlineEdit(feat.id, 'route_path', feat.route_path || '')}
                        className="p-2 border-r border-neutral-200 text-[#1c1c1e] font-bold whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingRoute ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(feat.id, 'route_path')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(feat.id, 'route_path');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{feat.route_path || '—'}</span>
                        )}
                      </td>

                      {/* Module Key (Inline Edit) */}
                      <td
                        onDoubleClick={() => startInlineEdit(feat.id, 'module_key', feat.module_key || '')}
                        className="p-2 border-r border-neutral-200 text-neutral-600 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingModuleKey ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(feat.id, 'module_key')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(feat.id, 'module_key');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <code className="text-[11px] font-mono">{feat.module_key || '—'}</code>
                        )}
                      </td>

                      {/* Is SaaS Module Toggle */}
                      <td className="p-2 border-r border-neutral-200 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleSaasModule(feat.id, feat.is_saas_module)}
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition ${
                            feat.is_saas_module
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                          }`}
                        >
                          {feat.is_saas_module ? '⚡ SAAS MODULE' : 'STANDARD'}
                        </button>
                      </td>

                      {/* Add-on Price (Inline Edit) */}
                      <td
                        onDoubleClick={() => startInlineEdit(feat.id, 'saas_addon_price', feat.saas_addon_price || 0)}
                        className="p-2 border-r border-neutral-200 text-right font-black text-emerald-600 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingPrice ? (
                          <input
                            type="number"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(feat.id, 'saas_addon_price')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(feat.id, 'saas_addon_price');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-[#60px] bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{feat.is_saas_module ? `$${feat.saas_addon_price || 0}/mo` : '—'}</span>
                        )}
                      </td>

                      {/* Status / Is Live Dropdown */}
                      <td className="p-2 border-r border-neutral-200 whitespace-nowrap">
                        <select
                          value={feat.status || 'idea'}
                          onChange={(e) => handleStatusChange(feat.id, e.target.value as FeatureStatus)}
                          className={`font-sans font-black text-[10px] uppercase p-1 rounded border focus:outline-none ${
                            feat.status === 'live'
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : feat.status === 'beta'
                              ? 'bg-purple-100 text-purple-950 border-purple-300'
                              : feat.status === 'alpha'
                              ? 'bg-blue-100 text-blue-950 border-blue-300'
                              : 'bg-amber-100 text-amber-950 border-amber-300'
                          }`}
                        >
                          <option value="live">● LIVE ONLINE</option>
                          <option value="beta">▲ BETA TESTING</option>
                          <option value="alpha">■ ALPHA SPEC</option>
                          <option value="idea">★ IDEA / ROADMAP</option>
                        </select>
                      </td>

                      {/* Access Level (Who Can See It?) */}
                      <td className="p-2 border-r border-neutral-200 whitespace-nowrap">
                        <select
                          value={feat.access_level || 'public'}
                          onChange={(e) => handleAccessLevelChange(feat.id, e.target.value as FeatureAccessLevel)}
                          className="bg-neutral-100 text-neutral-900 border border-neutral-300 font-sans font-bold text-[10px] uppercase p-1 rounded focus:outline-none"
                        >
                          <option value="public">ALL PUBLIC</option>
                          <option value="members">MEMBERS ONLY</option>
                          <option value="gold">GOLD SUPPORTERS</option>
                          <option value="business_owners">BUSINESS OWNERS</option>
                          <option value="admins_only">ADMINS ONLY</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-right whitespace-nowrap font-sans">
                        <Link
                          href={`/admin/features/${feat.id}`}
                          className="text-[10px] font-bold uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-2 py-1 rounded shadow-sm"
                        >
                          Control & Bugs ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Record Counter */}
        <div className="bg-neutral-900 text-white p-2.5 border-t border-neutral-800 flex items-center justify-between text-[10px] font-extrabold uppercase font-sans">
          <span>
            Rows: {sortedFeatures.length} of {features.length} Features & Modular Packages
          </span>
          <span className="text-neutral-400">
            Double-click module key or add-on price to edit | Toggle SaaS Module status inline
          </span>
        </div>
      </div>
    </div>
  );
}
