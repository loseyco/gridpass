'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { GarageVehicle } from '@/lib/types/admin';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';

export default function AdminVehiclesWorksheetPage() {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Modal State
  const [makeFilter, setMakeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

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
          list.push({ id: docSnap.id, ...docSnap.data() } as GarageVehicle);
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
      await setDoc(doc(db, 'vehicles', id), { [key]: valueToSave }, { merge: true });
    } catch (err) {
      console.warn('Vehicle inline edit saved locally:', err);
    }
  };

  // Create Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMake || !newModel) return;

    const vehId = `veh_${Date.now()}`;
    const newVeh: GarageVehicle = {
      id: vehId,
      owner_id: 'admin',
      owner_name: newOwnerName || 'Member Owner',
      year: Number(newYear) || 2024,
      make: newMake,
      model: newModel,
      vin: newVin || '',
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
    if (makeFilter !== 'all' && v.make?.toLowerCase() !== makeFilter.toLowerCase()) return false;
    return true;
  });

  // Export CSV
  const exportCSV = () => {
    const headers = ['Vehicle ID', 'Year', 'Make', 'Model', 'VIN', 'Owner Name', 'Owner ID'];
    const rows = filteredVehicles.map((v) => [
      v.id,
      v.year,
      `"${v.make || ''}"`,
      `"${v.model || ''}"`,
      v.vin || '',
      `"${v.owner_name || ''}"`,
      v.owner_id || '',
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
      key: 'owner_name',
      label: 'MEMBER OWNER',
      render: (row) => <span className="text-neutral-800">{row.owner_name || 'Member Owner'}</span>,
    },
    {
      key: 'vin',
      label: 'VIN',
      editable: true,
      render: (row) => <code className="text-[11px] font-mono text-neutral-500">{row.vin || '—'}</code>,
    },
  ];

  const filterCategories = [
    { label: 'All', key: 'all', count: vehicles.length },
    { label: 'Chevrolet', key: 'Chevrolet' },
    { label: 'Ford', key: 'Ford' },
    { label: 'Porsche', key: 'Porsche' },
    { label: 'BMW', key: 'BMW' },
    { label: 'Dodge', key: 'Dodge' },
  ];

  return (
    <div className="space-y-4 font-sans">
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
          <Link
            href={`/v/${row.id}`}
            target="_blank"
            className="text-[10px] font-bold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2 py-1 rounded border border-neutral-300"
          >
            Specs ↗
          </Link>
        )}
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
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chevrolet"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corvette Z06"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. PJ Losey"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">VIN (17-Chars)</label>
                <input
                  type="text"
                  placeholder="1G1YK2D47H5..."
                  value={newVin}
                  onChange={(e) => setNewVin(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
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
