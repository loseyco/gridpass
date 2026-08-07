'use client';

import React, { useState } from 'react';
import { X, Save, Car, Wrench, ShieldCheck, Zap, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ToastContext';

interface EditVehicleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  onVehicleUpdated: (updatedVehicle: any) => void;
}

export function EditVehicleDrawer({ isOpen, onClose, vehicle, onVehicleUpdated }: EditVehicleDrawerProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'specs' | 'electric' | 'mods' | 'story'>('specs');
  const [saving, setSaving] = useState(false);

  // Specs Form State
  const [year, setYear] = useState(vehicle?.year || 2024);
  const [make, setMake] = useState(vehicle?.make || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [trim, setTrim] = useState(vehicle?.trim || '');
  const [photoUrl, setPhotoUrl] = useState(vehicle?.photo_url || '');
  const [engine, setEngine] = useState(vehicle?.specs?.engine || '');
  const [transmission, setTransmission] = useState(vehicle?.specs?.transmission || '');
  const [hp, setHp] = useState(vehicle?.specs?.hp || '');
  const [torque, setTorque] = useState(vehicle?.specs?.torque || '');

  // PEV Electric Specs
  const [batteryWh, setBatteryWh] = useState(vehicle?.specs?.batteryWh || '');
  const [voltage, setVoltage] = useState(vehicle?.specs?.voltage || '');
  const [motorWatts, setMotorWatts] = useState(vehicle?.specs?.motorWatts || '');

  // Mods List
  const [mods, setMods] = useState<any[]>(Array.isArray(vehicle?.mods) ? vehicle.mods : []);
  const [modCategory, setModCategory] = useState('engine');
  const [modBrand, setModBrand] = useState('');
  const [modName, setModName] = useState('');
  const [modCost, setModCost] = useState('');

  // Story & History
  const [story, setStory] = useState(vehicle?.story || '');

  if (!isOpen) return null;

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedData = {
        year: Number(year) || 2024,
        make,
        model,
        trim,
        photo_url: photoUrl,
        story,
        specs: {
          engine,
          transmission,
          hp: hp ? Number(hp) : '',
          torque: torque ? Number(torque) : '',
          batteryWh,
          voltage,
          motorWatts
        },
        mods,
        updated_at: new Date().toISOString()
      };

      if (vehicle?.id && !vehicle.id.startsWith('mock')) {
        const vRef = doc(db, 'vehicles', vehicle.id);
        await updateDoc(vRef, updatedData);
      }

      onVehicleUpdated({
        ...vehicle,
        ...updatedData
      });

      showToast({
        title: "✅ Vehicle Build Saved!",
        message: "Your vehicle specs, mod list, and PEV details have been updated.",
        icon: "🏎️"
      });

      onClose();
    } catch (err) {
      console.error("Save vehicle error:", err);
      showToast({
        title: "Save Failed",
        message: "Could not save vehicle build updates. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMod = () => {
    if (!modBrand || !modName) {
      showToast({ title: "Incomplete Mod", message: "Please fill in brand and modification name.", icon: "⚠️" });
      return;
    }
    const newMod = {
      category: modCategory,
      brand: modBrand,
      name: modName,
      cost: modCost || ''
    };
    setMods([...mods, newMod]);
    setModBrand('');
    setModName('');
    setModCost('');
    showToast({ title: "🛠️ Modification Added", message: `${modBrand} ${modName} added to build!`, icon: "✅" });
  };

  const handleRemoveMod = (idx: number) => {
    setMods(mods.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between text-left overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div>
            <span className="text-[9px] font-mono font-black text-[#ff3b30] uppercase tracking-widest block">
              GRIDPASS VEHICLE MANAGER
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ff3b30]" /> Manage Build Specs &amp; Mods
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex items-center gap-1 p-2 bg-neutral-100 border-b border-neutral-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'specs', label: '🏎️ Basic Specs', icon: Car },
            { id: 'electric', label: '⚡ PEV Specs', icon: Zap },
            { id: 'mods', label: '🛠️ Mod List', icon: Wrench },
            { id: 'story', label: '📖 Build Story', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 text-[11px] font-mono font-black uppercase rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveVehicle} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: BASIC SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Year</label>
                  <input 
                    type="number" 
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                    placeholder="2024"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Make</label>
                  <input 
                    type="text" 
                    value={make}
                    onChange={e => setMake(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                    placeholder="Ford"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Model</label>
                  <input 
                    type="text" 
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                    placeholder="Mustang GT"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Trim / Sub-Model</label>
                <input 
                  type="text" 
                  value={trim}
                  onChange={e => setTrim(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                  placeholder="5.0 V8 Dark Horse Spec"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Main Photo URL</label>
                <input 
                  type="url" 
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Engine Specs</label>
                  <input 
                    type="text" 
                    value={engine}
                    onChange={e => setEngine(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    placeholder="5.0L Coyote V8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Transmission</label>
                  <input 
                    type="text" 
                    value={transmission}
                    onChange={e => setTransmission(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    placeholder="6-Speed Manual"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Horsepower (HP)</label>
                  <input 
                    type="number" 
                    value={hp}
                    onChange={e => setHp(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    placeholder="480"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Torque (lb-ft)</label>
                  <input 
                    type="number" 
                    value={torque}
                    onChange={e => setTorque(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    placeholder="415"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEV ELECTRIC SPECS */}
          {activeTab === 'electric' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <h4 className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" /> PEV &amp; Electric Vehicle Specs (Onewheel/E-Bike/EUC)
                </h4>
                <p className="text-[10px] text-emerald-800 font-medium">
                  Configure battery watt-hours, system voltage, and peak motor wattage for electric rideables.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Battery Capacity (Watt-Hours Wh)</label>
                  <input 
                    type="text" 
                    value={batteryWh}
                    onChange={e => setBatteryWh(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    placeholder="756Wh"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">System Voltage (V)</label>
                  <input 
                    type="text" 
                    value={voltage}
                    onChange={e => setVoltage(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    placeholder="75.6V"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Motor Peak Wattage (W)</label>
                  <input 
                    type="text" 
                    value={motorWatts}
                    onChange={e => setMotorWatts(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    placeholder="750W Peak"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MOD LIST */}
          {activeTab === 'mods' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#ff3b30]" /> Add Modification
                </h4>

                <div className="space-y-2">
                  <select
                    value={modCategory}
                    onChange={e => setModCategory(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                  >
                    <option value="engine">Engine &amp; Performance</option>
                    <option value="exhaust">Exhaust System</option>
                    <option value="suspension">Suspension &amp; Handling</option>
                    <option value="wheels">Wheels &amp; Tires</option>
                    <option value="exterior">Exterior &amp; Aero</option>
                    <option value="interior">Interior &amp; Electronics</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={modBrand}
                      onChange={e => setModBrand(e.target.value)}
                      className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                      placeholder="Brand (e.g. Roush, Borla)"
                    />
                    <input 
                      type="text" 
                      value={modName}
                      onChange={e => setModName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                      placeholder="Part Name (e.g. Cat-Back Exhaust)"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={modCost}
                      onChange={e => setModCost(e.target.value)}
                      className="flex-1 p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                      placeholder="Cost ($)"
                    />
                    <button
                      type="button"
                      onClick={handleAddMod}
                      className="py-2.5 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Add Mod
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Mods List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-neutral-900">Modifications ({mods.length})</h4>
                {mods.length > 0 ? (
                  <div className="space-y-2">
                    {mods.map((mod: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">{mod.category}</span>
                          <h5 className="text-xs font-black uppercase text-neutral-900">{mod.brand} {mod.name}</h5>
                        </div>
                        <div className="flex items-center gap-3">
                          {mod.cost && <span className="text-xs font-mono font-bold text-emerald-600">${mod.cost}</span>}
                          <button
                            type="button"
                            onClick={() => handleRemoveMod(idx)}
                            className="p-1 text-neutral-400 hover:text-red-600 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl text-center">
                    <p className="text-xs font-mono font-bold text-neutral-400 uppercase">No modifications listed on this build yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BUILD STORY */}
          {activeTab === 'story' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Build Story &amp; Provenance</label>
                <textarea 
                  value={story}
                  onChange={e => setStory(e.target.value)}
                  rows={6}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  placeholder="Share the story behind this vehicle, restoration details, track history, or build timeline..."
                />
              </div>
            </div>
          )}

          {/* Drawer Footer Save Bar */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Build Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
