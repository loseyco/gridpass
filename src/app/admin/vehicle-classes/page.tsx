'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Loader2, Plus, CheckCircle2, Trash2, Edit3, Save, RefreshCw, 
  Car, Layers, ShieldCheck, ArrowLeft, Tag, Info, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { 
  VehicleClassItem, 
  DEFAULT_VEHICLE_CLASSES, 
  getGlobalVehicleClasses, 
  saveGlobalVehicleClasses 
} from '@/lib/actions/stagingClasses';

export default function AdminVehicleClassesPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<VehicleClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Class Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('🚘');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Inline State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIcon, setEditIcon] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await getGlobalVehicleClasses();
      setClasses(data);
    } catch (err) {
      console.error("Failed to load vehicle classes:", err);
      showToast({
        title: "Error Loading Classes",
        message: "Failed to load global vehicle classes.",
        icon: "⚠️"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (updatedList: VehicleClassItem[]) => {
    setSaving(true);
    setClasses(updatedList);
    const success = await saveGlobalVehicleClasses(updatedList);
    setSaving(false);

    if (success) {
      showToast({
        title: "Vehicle Classes Saved!",
        message: "Global vehicle classes & dropdown choices updated live!",
        icon: "🏷️"
      });
    } else {
      showToast({
        title: "Saved Locally",
        message: "Classes saved to local cache. Live sync will complete on reconnect.",
        icon: "💾"
      });
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newId = newName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newItem: VehicleClassItem = {
      id: newId,
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      icon: newIcon.trim() || '🚘',
      active: true,
      order: classes.length + 1
    };

    const updated = [...classes, newItem];
    handleSaveAll(updated);
    setNewName('');
    setNewDesc('');
    setNewIcon('🚘');
    setShowAddForm(false);
  };

  const handleToggleActive = (id: string) => {
    const updated = classes.map(c => c.id === id ? { ...c, active: !c.active } : c);
    handleSaveAll(updated);
  };

  const handleDeleteClass = (id: string) => {
    if (classes.length <= 1) {
      showToast({
        title: "Cannot Delete All",
        message: "At least one vehicle class must remain active.",
        icon: "⚠️"
      });
      return;
    }
    const updated = classes.filter(c => c.id !== id);
    handleSaveAll(updated);
  };

  const startEdit = (c: VehicleClassItem) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDesc(c.description || '');
    setEditIcon(c.icon || '🚘');
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    const updated = classes.map(c => c.id === id ? {
      ...c,
      name: editName.trim(),
      description: editDesc.trim() || undefined,
      icon: editIcon.trim() || '🚘'
    } : c);
    handleSaveAll(updated);
    setEditingId(null);
  };

  const handleResetToDefaults = () => {
    if (confirm("Reset all vehicle classes to system defaults? Custom added classes will be overwritten.")) {
      handleSaveAll(DEFAULT_VEHICLE_CLASSES);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6">
        <div className="flex items-center gap-3 font-mono text-sm text-neutral-400">
          <Loader2 className="w-5 h-5 text-[#ff3b30] animate-spin" />
          <span>Loading Global Vehicle Classes...</span>
        </div>
      </div>
    );
  }

  const activeCount = classes.filter(c => c.active).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              href="/admin" 
              className="text-xs font-mono text-neutral-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-xs font-mono text-[#ff3b30] uppercase font-bold">Category System</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-7 h-7 text-[#ff3b30]" /> Vehicle Classes &amp; Staging Groups
          </h1>
          <p className="text-xs text-neutral-400">
            Manage global vehicle dropdown categories used across Garage Profiles, Event Registration, and Staging Modals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="py-2.5 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Vehicle Class
          </button>
          <button
            onClick={handleResetToDefaults}
            className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            title="Reset to system default vehicle classes"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1">
          <div className="text-[10px] font-mono text-neutral-500 uppercase font-bold">Total Configured Classes</div>
          <div className="text-2xl font-black text-white">{classes.length}</div>
        </div>
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1">
          <div className="text-[10px] font-mono text-emerald-500 uppercase font-bold">Active in Dropdowns</div>
          <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
        </div>
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] font-mono text-neutral-500 uppercase font-bold">System Status</div>
          <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Live Sync Active
          </div>
        </div>
      </div>

      {/* Add New Class Form Modal / Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddClass} className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4 text-left shadow-2xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#ff3b30]" /> Add Global Vehicle Class
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="text-xs text-neutral-400 hover:text-white font-mono font-bold uppercase"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Class Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Overland / 4x4 or Heavy Duty Diesel"
                required
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Icon / Emoji</label>
              <input
                type="text"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="e.g. 🛻 or ⚡"
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Description (Optional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Super Duty, HD Trucks & Diesel Pullers"
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-black uppercase rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase rounded-xl shadow-md shadow-red-500/10"
            >
              {saving ? 'Saving...' : 'Save & Publish Class'}
            </button>
          </div>
        </form>
      )}

      {/* Global Vehicle Classes Directory List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
            Configured Vehicle Categories ({classes.length})
          </span>
          <span className="text-[10px] font-mono text-neutral-500 uppercase">
            Changes auto-save live to Firestore
          </span>
        </div>

        <div className="space-y-2">
          {classes.map((c) => {
            const isEditing = editingId === c.id;

            if (isEditing) {
              return (
                <div key={c.id} className="p-4 bg-neutral-900 border border-[#ff3b30] rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Emoji</label>
                      <input
                        type="text"
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Class Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-1 flex items-end justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(c.id)}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="py-2.5 px-3 bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Description</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={c.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  c.active ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-neutral-950/60 border-neutral-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-lg shrink-0">
                    {c.icon || '🚘'}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black uppercase text-white tracking-wider truncate">
                        {c.name}
                      </h4>
                      {!c.active && (
                        <span className="text-[9px] font-mono uppercase bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md">
                          Disabled
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p className="text-[11px] text-neutral-400 truncate pt-0.5">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleToggleActive(c.id)}
                    className={`py-1.5 px-3 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer border ${
                      c.active 
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/80' 
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
                    }`}
                  >
                    {c.active ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-neutral-400" />}
                    <span>{c.active ? 'Active' : 'Disabled'}</span>
                  </button>

                  <button
                    onClick={() => startEdit(c)}
                    className="py-1.5 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold uppercase rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>

                  <button
                    onClick={() => handleDeleteClass(c.id)}
                    className="py-1.5 px-2.5 bg-neutral-900 hover:bg-red-950/80 text-neutral-500 hover:text-red-400 text-[10px] font-bold uppercase rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-transparent hover:border-red-800/50"
                    title="Delete vehicle class"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
