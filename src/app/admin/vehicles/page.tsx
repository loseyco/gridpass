'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { GarageVehicle } from '@/lib/types/admin';

type SortField = 'year' | 'make' | 'model' | 'owner_name' | 'vin' | 'id';
type SortOrder = 'asc' | 'desc';

export default function AdminVehiclesWorksheetPage() {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter, Search & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [makeFilter, setMakeFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('make');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Inline Editing State
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'make' | 'model' | 'year' | 'vin' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add Vehicle Modal State
  const [showAddModal, setShowAddModal] = useState(false);
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const saveInlineEdit = async (id: string, field: 'make' | 'model' | 'year' | 'vin') => {
    if (!editingCell) return;
    const valueToSave = field === 'year' ? Number(editValue) || 2024 : editValue;

    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: valueToSave } : v))
    );
    setEditingCell(null);

    try {
      await setDoc(doc(db, 'vehicles', id), { [field]: valueToSave }, { merge: true });
    } catch (err) {
      console.warn('Vehicle inline edit saved locally:', err);
    }
  };

  const startInlineEdit = (id: string, field: 'make' | 'model' | 'year' | 'vin', currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue || ''));
  };

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

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedVehicles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedVehicles.map((v) => v.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (makeFilter !== 'all' && v.make?.toLowerCase() !== makeFilter.toLowerCase()) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.vin?.toLowerCase().includes(q) ||
        v.owner_name?.toLowerCase().includes(q) ||
        v.id?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let aVal: any = a[sortField] || '';
    let bVal: any = b[sortField] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const exportCSV = () => {
    const headers = ['Vehicle ID', 'Year', 'Make', 'Model', 'VIN', 'Owner Name', 'Owner ID'];
    const rows = sortedVehicles.map((v) => [
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

  return (
    <div className="space-y-3 font-sans">
      {/* Excel Toolbar */}
      <div className="bg-white border border-neutral-300 rounded-lg p-2.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Make Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {['all', 'Chevrolet', 'Ford', 'Porsche', 'BMW', 'Dodge'].map((mk) => (
            <button
              key={mk}
              onClick={() => setMakeFilter(mk)}
              className={`font-black uppercase px-2.5 py-1 rounded transition whitespace-nowrap ${
                makeFilter === mk
                  ? 'bg-[#ff3b30] text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {mk === 'all' ? `All (${vehicles.length})` : mk}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search make, model, VIN..."
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
            + Add Vehicle
          </button>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">
                Add Vehicle Row to Digital Garage
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Make
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chevrolet"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corvette Z06"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Owner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. PJ Losey"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  VIN (17-Chars)
                </label>
                <input
                  type="text"
                  placeholder="1G1YK2D47H5..."
                  value={newVin}
                  onChange={(e) => setNewVin(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
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
                  Save Vehicle
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
                    checked={selectedIds.length > 0 && selectedIds.length === sortedVehicles.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                  />
                </th>

                <th
                  onClick={() => handleSort('year')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  YEAR {sortField === 'year' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('make')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  MAKE {sortField === 'make' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('model')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  MODEL {sortField === 'model' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('owner_name')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  MEMBER OWNER {sortField === 'owner_name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('vin')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  VIN {sortField === 'vin' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th className="p-2 text-right whitespace-nowrap">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    Loading Digital Garage Sheet...
                  </td>
                </tr>
              ) : sortedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    No Vehicles Registered
                  </td>
                </tr>
              ) : (
                sortedVehicles.map((v, idx) => {
                  const isSelected = selectedIds.includes(v.id);
                  const isEditingMake = editingCell?.id === v.id && editingCell?.field === 'make';
                  const isEditingModel = editingCell?.id === v.id && editingCell?.field === 'model';
                  const isEditingYear = editingCell?.id === v.id && editingCell?.field === 'year';
                  const isEditingVin = editingCell?.id === v.id && editingCell?.field === 'vin';

                  return (
                    <tr
                      key={v.id}
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
                          onChange={() => toggleSelect(v.id)}
                          className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                        />
                      </td>

                      {/* Year */}
                      <td
                        onDoubleClick={() => startInlineEdit(v.id, 'year', v.year)}
                        className="p-2 border-r border-neutral-200 font-bold text-neutral-900 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingYear ? (
                          <input
                            type="number"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(v.id, 'year')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(v.id, 'year');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-[#60px] bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{v.year}</span>
                        )}
                      </td>

                      {/* Make */}
                      <td
                        onDoubleClick={() => startInlineEdit(v.id, 'make', v.make || '')}
                        className="p-2 border-r border-neutral-200 font-bold text-neutral-900 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingMake ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(v.id, 'make')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(v.id, 'make');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{v.make}</span>
                        )}
                      </td>

                      {/* Model */}
                      <td
                        onDoubleClick={() => startInlineEdit(v.id, 'model', v.model || '')}
                        className="p-2 border-r border-neutral-200 font-bold text-neutral-900 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingModel ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(v.id, 'model')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(v.id, 'model');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{v.model}</span>
                        )}
                      </td>

                      {/* Member Owner */}
                      <td className="p-2 border-r border-neutral-200 text-neutral-800 whitespace-nowrap">
                        {v.owner_name || 'Member Owner'}
                      </td>

                      {/* VIN */}
                      <td
                        onDoubleClick={() => startInlineEdit(v.id, 'vin', v.vin || '')}
                        className="p-2 border-r border-neutral-200 text-[11px] text-neutral-500 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingVin ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(v.id, 'vin')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(v.id, 'vin');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{v.vin || '—'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-right whitespace-nowrap font-sans">
                        <Link
                          href={`/garage/${v.id}`}
                          target="_blank"
                          className="text-[10px] font-bold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2 py-1 rounded border border-neutral-300"
                        >
                          Specs ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 text-white p-2.5 border-t border-neutral-800 flex items-center justify-between text-[10px] font-extrabold uppercase font-sans">
          <span>
            Rows: {sortedVehicles.length} of {vehicles.length} Vehicles
          </span>
          <span className="text-neutral-400">
            Double-click cell to edit year, make, model, VIN inline
          </span>
        </div>
      </div>
    </div>
  );
}
