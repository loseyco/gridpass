'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { AdminFeature, FeatureStatus, FeatureCategory, FeatureAccessLevel } from '@/lib/types/admin';
import { INITIAL_PLATFORM_FEATURES } from '@/lib/seed/platformSeedData';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';

type FeatureFilterState = 'all' | 'saas_modules' | 'live' | 'beta' | 'idea';

export default function AdminFeaturesPage() {
  const [features, setFeatures] = useState<AdminFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Filter & Modal State
  const [activeFilter, setActiveFilter] = useState<FeatureFilterState>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add Feature Modal State
  const [newName, setNewName] = useState('');
  const [newRoutePath, setNewRoutePath] = useState('');
  const [newModuleKey, setNewModuleKey] = useState('');
  const [newIsSaasModule, setNewIsSaasModule] = useState(false);
  const [newAddonPrice, setNewAddonPrice] = useState<number>(29);
  const [newCategory, setNewCategory] = useState<FeatureCategory>('auto_shop');
  const [newStatus, setNewStatus] = useState<FeatureStatus>('live');
  const [newAccessLevel, setNewAccessLevel] = useState<FeatureAccessLevel>('public');
  const [newVersion, setNewVersion] = useState('v4.2.0');
  const [newDescription, setNewDescription] = useState('');

  // Auto-seed function to populate platform features in Firestore
  const seedFeatures = async () => {
    setSeeding(true);
    try {
      for (const feat of INITIAL_PLATFORM_FEATURES) {
        const id = feat.module_key || feat.route_path.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(
          doc(db, 'features', id),
          {
            ...feat,
            status: feat.is_live ? 'live' : 'beta',
            access_level: feat.who_can_see,
            last_updated_at: new Date().toISOString().split('T')[0],
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error('Failed to seed platform features:', err);
    } finally {
      setSeeding(false);
    }
  };

  // Subscribe to Firestore features collection & auto-seed if empty
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'features'),
      (snapshot) => {
        if (snapshot.empty) {
          seedFeatures();
          setFeatures(
            INITIAL_PLATFORM_FEATURES.map((feat, idx) => ({
              id: feat.module_key || `feat_${idx}`,
              ...feat,
              priority: 'high',
              created_at: new Date().toISOString().split('T')[0],
              status: feat.is_live ? 'live' : 'beta',
              access_level: feat.who_can_see,
              last_updated_at: new Date().toISOString().split('T')[0],
            })) as unknown as AdminFeature[]
          );
          setLoading(false);
          return;
        }
        const list: AdminFeature[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AdminFeature);
        });
        setFeatures(list);
        setLoading(false);
      },
      (err) => {
        setFeatures(
          INITIAL_PLATFORM_FEATURES.map((feat, idx) => ({
            id: feat.module_key || `feat_${idx}`,
            ...feat,
            priority: 'high',
            created_at: new Date().toISOString().split('T')[0],
            status: feat.is_live ? 'live' : 'beta',
            access_level: feat.who_can_see,
            last_updated_at: new Date().toISOString().split('T')[0],
          })) as unknown as AdminFeature[]
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Inline Editing Save
  const handleInlineSave = async (id: string, key: string, newValue: any) => {
    const valueToSave = key === 'saas_addon_price' ? Number(newValue) || 0 : newValue;
    const today = new Date().toISOString().split('T')[0];

    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: valueToSave, last_updated_at: today } : f))
    );

    try {
      await setDoc(doc(db, 'features', id), { [key]: valueToSave, last_updated_at: today }, { merge: true });
    } catch (err) {
      console.warn('Feature saved locally:', err);
    }
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
      version: newVersion || 'v4.2.0',
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

  // Deduplicate features by unique module_key, route_path, or name
  const uniqueFeaturesMap = new Map<string, AdminFeature>();
  features.forEach((f) => {
    const key = (f.module_key || f.route_path || f.name || f.id).toLowerCase();
    if (!uniqueFeaturesMap.has(key)) {
      uniqueFeaturesMap.set(key, f);
    }
  });
  const uniqueFeatures = Array.from(uniqueFeaturesMap.values());

  // Filtered Data
  const filteredFeatures = uniqueFeatures.filter((f) => {
    if (activeFilter === 'saas_modules' && !f.is_saas_module) return false;
    if (activeFilter === 'live' && f.status !== 'live') return false;
    if (activeFilter === 'beta' && f.status !== 'beta') return false;
    if (activeFilter === 'idea' && f.status !== 'idea') return false;
    return true;
  });

  // Export CSV
  const exportCSV = () => {
    const headers = [
      'ID',
      'Feature Name',
      'Route Path',
      'Module Key',
      'SaaS Module',
      'Add-on Price ($)',
      'Status',
      'Access Level',
      'Last Updated',
    ];
    const rows = filteredFeatures.map((f) => [
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

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `gridpass_routes_features_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Column Definitions for ExcelWorksheetTable
  const columns: ColumnDef<AdminFeature>[] = [
    {
      key: 'name',
      label: 'FEATURE / PAGE NAME',
      editable: true,
      render: (row) => (
        <Link href={`/admin/features/${row.id}`} className="hover:text-[#ff3b30] font-bold transition">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'route_path',
      label: 'ROUTE PATH',
      editable: true,
      render: (row) => <span className="font-bold text-[#1c1c1e]">{row.route_path || '—'}</span>,
    },
    {
      key: 'module_key',
      label: 'MODULE KEY',
      editable: true,
      render: (row) => <code className="text-[11px] font-mono text-neutral-600">{row.module_key || '—'}</code>,
    },
    {
      key: 'is_saas_module',
      label: 'SAAS MODULE?',
      align: 'center',
      render: (row) => (
        <button
          onClick={() => toggleSaasModule(row.id, row.is_saas_module)}
          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition ${
            row.is_saas_module
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : 'bg-neutral-100 text-neutral-400 border-neutral-200'
          }`}
        >
          {row.is_saas_module ? '⚡ SAAS MODULE' : 'STANDARD'}
        </button>
      ),
    },
    {
      key: 'saas_addon_price',
      label: 'ADD-ON ($)',
      align: 'right',
      editable: true,
      render: (row) => (
        <span className="font-black text-emerald-600">
          {row.is_saas_module ? `$${row.saas_addon_price || 0}/mo` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'IS LIVE?',
      render: (row) => (
        <select
          value={row.status || 'idea'}
          onChange={(e) => handleStatusChange(row.id, e.target.value as FeatureStatus)}
          className={`font-sans font-black text-[10px] uppercase p-1 rounded border focus:outline-none ${
            row.status === 'live'
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : row.status === 'beta'
              ? 'bg-purple-100 text-purple-950 border-purple-300'
              : row.status === 'alpha'
              ? 'bg-blue-100 text-blue-950 border-blue-300'
              : 'bg-amber-100 text-amber-950 border-amber-300'
          }`}
        >
          <option value="live">● LIVE ONLINE</option>
          <option value="beta">▲ BETA TESTING</option>
          <option value="alpha">■ ALPHA SPEC</option>
          <option value="idea">★ IDEA / ROADMAP</option>
        </select>
      ),
    },
    {
      key: 'access_level',
      label: 'WHO CAN SEE IT?',
      render: (row) => (
        <select
          value={row.access_level || 'public'}
          onChange={(e) => handleAccessLevelChange(row.id, e.target.value as FeatureAccessLevel)}
          className="bg-neutral-100 text-neutral-900 border border-neutral-300 font-sans font-bold text-[10px] uppercase p-1 rounded focus:outline-none"
        >
          <option value="public">ALL PUBLIC</option>
          <option value="members">MEMBERS ONLY</option>
          <option value="gold">GOLD SUPPORTERS</option>
          <option value="business_owners">BUSINESS OWNERS</option>
          <option value="admins_only">ADMINS ONLY</option>
        </select>
      ),
    },
  ];

  const saasModulesCount = uniqueFeatures.filter((f) => f.is_saas_module).length;
  const liveCount = uniqueFeatures.filter((f) => f.status === 'live').length;
  const betaCount = uniqueFeatures.filter((f) => f.status === 'beta').length;
  const ideaCount = uniqueFeatures.filter((f) => f.status === 'idea').length;

  const filterCategories = [
    { label: 'All', key: 'all', count: uniqueFeatures.length },
    { label: '⚡ SaaS Modules', key: 'saas_modules', count: saasModulesCount },
    { label: 'Live Online', key: 'live', count: liveCount },
    { label: 'Beta', key: 'beta', count: betaCount },
    { label: 'Ideas', key: 'idea', count: ideaCount },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* Universal Excel Worksheet Component */}
      <ExcelWorksheetTable
        title="Platform Feature & Route Matrix"
        data={filteredFeatures}
        columns={columns}
        idKey="id"
        filterCategories={filterCategories}
        activeFilter={activeFilter}
        onFilterChange={(key) => setActiveFilter(key as FeatureFilterState)}
        searchPlaceholder="Search routes, feature names, module keys..."
        onAddRow={() => setShowAddModal(true)}
        onExportCSV={exportCSV}
        onInlineSave={handleInlineSave}
        loading={loading}
        actionRenderer={(row) => {
          const rawPath = row.route_path || '';
          const cleanPath = rawPath.split(',')[0].trim();
          const safePath = cleanPath.includes('[')
            ? cleanPath.replace(/\[id\]/g, 'demo').replace(/\[slug\]/g, 'sample')
            : cleanPath;

          return (
            <a
              href={safePath || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2 py-1 rounded border border-neutral-300"
            >
              Open Route ↗
            </a>
          );
        }}
      />

      {/* Add Feature Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">Add Feature / Route Definition</h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 font-bold hover:text-neutral-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFeature} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Feature / Page Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Second Life Sim Control Center"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Route Path</label>
                  <input
                    type="text"
                    placeholder="/secondlife/admin"
                    value={newRoutePath}
                    onChange={(e) => setNewRoutePath(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Module Key</label>
                  <input
                    type="text"
                    placeholder="sl_admin"
                    value={newModuleKey}
                    onChange={(e) => setNewModuleKey(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
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
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Add-on Price ($/mo)</label>
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
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">State</label>
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
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Who Can See It?</label>
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
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Route details and access controls..."
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
                <button type="submit" className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-1.5 rounded">
                  Save Route Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
