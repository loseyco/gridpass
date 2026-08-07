'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, setDoc, doc, updateDoc } from 'firebase/firestore';
import { GarageVehicle, StagingClass } from '@/lib/types/admin';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';
import { AdminVehicleSupportDrawer } from '@/components/admin/AdminVehicleSupportDrawer';

export default function AdminVehiclesWorksheetPage() {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Support Drawer State
  const [makeFilter, setMakeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'archived'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicleForSupport, setSelectedVehicleForSupport] = useState<GarageVehicle | null>(null);

  // Add Vehicle Modal State
  const [newYear, setNewYear] = useState<number>(2024);
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newVin, setNewVin] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'vehicles'),
      (snapshot) => {
        const list: GarageVehicle[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let ownerName = data.owner_name || data.owner_email || '';
          if (!ownerName || data.owner_id === 'YOYN2HDCwqXc3OYsHd8mdJIwr9K2' || data.owner_email === 'loseyp@gmail.com') {
            ownerName = 'PJ Losey';
          }

          list.push({
            id: docSnap.id,
            ...data,
            owner_name: ownerName,
          } as GarageVehicle);
        });
        setVehicles(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Vehicles listener fallback:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Inline Save to Firestore
  const handleInlineSave = async (id: string, key: string, newValue: any) => {
    const valueToSave = key === 'year' ? Number(newValue) || 2024 : newValue;

    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [key]: valueToSave } : v))
    );

    try {
      await updateDoc(doc(db, 'vehicles', id), { [key]: valueToSave });
    } catch (err) {
      console.warn('Vehicle inline edit saved locally:', err);
    }
  };

  // Handle Drawer Save Overrides
  const handleSaveDrawerOverrides = async (id: string, updates: Partial<GarageVehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );

    try {
      await updateDoc(doc(db, 'vehicles', id), updates);
    } catch (err) {
      console.warn('Vehicle overrides saved locally:', err);
    }
  };

  // Handle Soft Hide Toggle
  const handleHideToggle = async (id: string, currentHidden: boolean) => {
    const newHiddenState = !currentHidden;
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, is_hidden: newHiddenState } : v))
    );

    try {
      await updateDoc(doc(db, 'vehicles', id), { is_hidden: newHiddenState });
    } catch (err) {
      console.warn('Vehicle hide toggle saved locally:', err);
    }
  };

  // Handle Soft Archive / Restore
  const handleArchiveToggle = async (id: string, currentArchived: boolean) => {
    const newArchivedState = !currentArchived;
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, archived: newArchivedState } : v))
    );

    try {
      await updateDoc(doc(db, 'vehicles', id), {
        archived: newArchivedState,
        archived_at: newArchivedState ? new Date().toISOString() : null,
      });
    } catch (err) {
      console.warn('Vehicle archive toggle saved locally:', err);
    }
  };

  // Create Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMake || !newModel) return;

    const vehId = `veh_${Date.now()}`;
    const newVeh: GarageVehicle = {
      id: vehId,
      owner_id: 'YOYN2HDCwqXc3OYsHd8mdJIwr9K2',
      owner_name: newOwnerName || 'PJ Losey',
      year: Number(newYear) || 2024,
      make: newMake,
      model: newModel,
      vin: newVin || '',
      staging_class: 'stock',
      is_hidden: false,
      archived: false,
      service_logs_count: 0,
      created_at: new Date().toISOString().split('T')[0],
    };

    setVehicles((prev) => [newVeh, ...prev]);

    try {
      await setDoc(doc(db, 'vehicles', vehId), newVeh, { merge: true });
    } catch (err) {
      console.warn('Vehicle saved locally:', err);
    }

    setNewMake('');
    setNewModel('');
    setNewOwnerName('');
    setNewVin('');
    setShowAddModal(false);
  };

  // Filtered Vehicles
  const filteredVehicles = vehicles.filter((v) => {
    // Status Filter
    if (statusFilter === 'active' && (v.archived || v.is_hidden)) return false;
    if (statusFilter === 'hidden' && !v.is_hidden) return false;
    if (statusFilter === 'archived' && !v.archived) return false;

    // Make Filter
    if (makeFilter !== 'all' && v.make?.toLowerCase() !== makeFilter.toLowerCase()) return false;
    return true;
  });

  // Dynamic Make Filter Category Pills calculated directly from active Firestore vehicles
  const uniqueMakes = Array.from(new Set(vehicles.map((v) => v.make).filter(Boolean)));
  const filterCategories = [
    { label: 'All Makes', key: 'all', count: vehicles.length },
    ...uniqueMakes.map((make) => ({
      label: make,
      key: make,
      count: vehicles.filter((v) => v.make?.toLowerCase() === make.toLowerCase()).length,
    })),
  ];

  // Export CSV
  const exportCSV = () => {
    const headers = ['Vehicle ID', 'Year', 'Make', 'Model', 'VIN', 'Staging Class', 'Tag ID', 'Owner Name', 'Owner ID', 'Hidden', 'Archived'];
    const rows = filteredVehicles.map((v) => [
      v.id,
      v.year,
      `"${v.make || ''}"`,
      `"${v.model || ''}"`,
      v.vin || '',
      v.staging_class || 'stock',
      v.tag_id || v.qr_tag_id || '',
      `"${v.owner_name || 'PJ Losey'}"`,
      v.owner_id || '',
      v.is_hidden ? 'YES' : 'NO',
      v.archived ? 'YES' : 'NO',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_vehicles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStagingBadge = (stagingClass?: StagingClass) => {
    switch (stagingClass) {
      case 'track_weapon':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">Track Weapon</span>;
      case 'show_car':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-pink-100 text-pink-800 border border-pink-300">Show Build</span>;
      case 'craft':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300">Craft / Marine</span>;
      case 'pev_micromobility':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300">PEV / Electric</span>;
      case 'fleet':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300">Fleet</span>;
      case 'modified':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">Modified</span>;
      default:
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-300">Stock OEM</span>;
    }
  };

  // Columns for ExcelWorksheetTable
  const columns: ColumnDef<GarageVehicle>[] = [
    {
      key: 'year',
      label: 'YEAR',
      editable: true,
      render: (row) => <span className="font-bold text-neutral-900">{row.year}</span>,
    },
    {
      key: 'make',
      label: 'MAKE',
      editable: true,
      render: (row) => <span className="font-bold text-neutral-900">{row.make}</span>,
    },
    {
      key: 'model',
      label: 'MODEL',
      editable: true,
      render: (row) => <span className="font-bold text-neutral-900">{row.model}</span>,
    },
    {
      key: 'staging_class',
      label: 'STAGING CLASS',
      render: (row) => getStagingBadge(row.staging_class),
    },
    {
      key: 'owner_name',
      label: 'MEMBER OWNER',
      editable: true,
      render: (row) => <span className="text-neutral-800 font-bold">{row.owner_name || 'PJ Losey'}</span>,
    },
    {
      key: 'tag_id',
      label: 'HARDWARE TAG',
      render: (row) => {
        const tag = row.tag_id || row.qr_tag_id;
        return tag ? (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
            📡 {tag}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-neutral-400">Unlinked</span>
        );
      },
    },
    {
      key: 'vin',
      label: 'VIN',
      editable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <code className="text-[11px] font-mono text-neutral-500">{row.vin || '—'}</code>
          {row.vin_verified && <span className="text-[10px] font-bold text-emerald-600">✓</span>}
        </div>
      ),
    },
    {
      key: 'is_hidden',
      label: 'STATUS',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.archived ? (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">📦 Archived</span>
          ) : row.is_hidden ? (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">🙈 Hidden</span>
          ) : (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 Live</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-full 2xl:max-w-[1800px] 4k:max-w-[3400px] mx-auto space-y-4 font-sans pb-24 sm:pb-0">
      
      {/* Top Header Status Filter Ribbon */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'active', label: '🟢 Live Active' },
            { id: 'hidden', label: '🙈 Hidden' },
            { id: 'archived', label: '📦 Archived' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border transition active:scale-95 ${
                statusFilter === st.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <ExcelWorksheetTable
        title="Digital Garage Vehicles"
        data={filteredVehicles}
        columns={columns}
        idKey="id"
        filterCategories={filterCategories}
        activeFilter={makeFilter}
        onFilterChange={(key) => setMakeFilter(key)}
        searchPlaceholder="Search make, model, VIN, owner..."
        onAddRow={() => setShowAddModal(true)}
        onExportCSV={exportCSV}
        onInlineSave={handleInlineSave}
        loading={loading}
        actionRenderer={(row) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedVehicleForSupport(row)}
              className="text-[10px] font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-2.5 py-1 rounded shadow-xs transition active:scale-95"
            >
              Support 🛠️
            </button>
            <Link
              href={`/v/${row.id}`}
              target="_blank"
              className="text-[10px] font-bold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded border border-neutral-300 transition active:scale-95"
            >
              Specs ↗
            </Link>
          </div>
        )}
      />

      {/* Super Admin Vehicle Support Drawer */}
      <AdminVehicleSupportDrawer
        isOpen={!!selectedVehicleForSupport}
        vehicle={selectedVehicleForSupport}
        onClose={() => setSelectedVehicleForSupport(null)}
        onSave={handleSaveDrawerOverrides}
        onHideToggle={handleHideToggle}
        onArchiveToggle={handleArchiveToggle}
      />

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">Add Vehicle Row to Digital Garage</h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 font-bold hover:text-neutral-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full text-base md:text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Honda"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    className="w-full text-base md:text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CRF300L"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full text-base md:text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  placeholder="PJ Losey"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full text-base md:text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">VIN (17-Chars)</label>
                <input
                  type="text"
                  placeholder="1G1YK2D47H5..."
                  value={newVin}
                  onChange={(e) => setNewVin(e.target.value)}
                  className="w-full text-base md:text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
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
                <button type="submit" className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-1.5 rounded active:scale-95">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
