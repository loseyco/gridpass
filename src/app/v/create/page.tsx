'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { Car, ArrowLeft, Loader2, Sparkles, Plus, Camera, Image as ImageIcon } from 'lucide-react';

const SAMPLE_PHOTO_PRESETS = [
  { label: 'C8 Corvette Torch Red', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Ford Mustang Dark Horse', url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Porsche 911 GT3 RS', url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Ram 1500 TRX Offroad', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80' }
];

function CreateVehicleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams ? searchParams.get('redirect') : null;
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [year, setYear] = useState<string>('2024');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<'car_truck' | 'motorcycle_pev' | 'watercraft' | 'commercial_fleet' | 'heavy_equipment' | 'aircraft'>('car_truck');
  const [color, setColor] = useState('');
  const [engineSpecs, setEngineSpecs] = useState('');
  const [imageUrl, setImageUrl] = useState(SAMPLE_PHOTO_PRESETS[0].url);
  const [modsDescription, setModsDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) {
      showToast({ title: 'Missing Information', message: 'Please provide both Make and Model for your vehicle.' });
      return;
    }

    setSubmitting(true);
    try {
      const fullTitle = `${year} ${make.trim()} ${model.trim()}${trim.trim() ? ` ${trim.trim()}` : ''}`;
      const vehicleSlug = fullTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `vehicle-${Date.now()}`;

      const payload = {
        id: vehicleSlug,
        title: fullTitle,
        year: year.trim() || '2024',
        make: make.trim(),
        model: model.trim(),
        trim: trim.trim() || '',
        color: color.trim() || 'Custom Finish',
        category: vehicleCategory,
        engine_specs: engineSpecs.trim() || 'Stock Factory Engine',
        image: imageUrl || SAMPLE_PHOTO_PRESETS[0].url,
        image_url: imageUrl || SAMPLE_PHOTO_PRESETS[0].url,
        mods: modsDescription.split('\n').filter((m) => m.trim().length > 0),
        mods_description: modsDescription.trim(),
        owner_id: user?.uid || 'guest-owner',
        created_at: new Date().toISOString(),
        location: 'Monmouth, IL',
        scan_count: 1
      };

      await setDoc(doc(db, 'vehicles', vehicleSlug), payload, { merge: true });

      showToast({
        title: 'Vehicle Staged!',
        message: `${fullTitle} has been added to your Gridpass Garage.`
      });

      if (redirectTarget) {
        router.push(redirectTarget);
      } else {
        router.push(`/v/${vehicleSlug}`);
      }
    } catch (err: any) {
      showToast({
        title: 'Error Registering Vehicle',
        message: err?.message || 'Failed to create vehicle passport.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Header Breadcrumbs */}
        <div className="mb-8">
          <Link 
            href="/events/maple-city-cruise" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-[#ff3b30] uppercase tracking-wider mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Vehicle Staging
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-red-50 text-[#ff3b30] rounded-xl border border-red-100">
              <Car className="w-6 h-6" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff3b30] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                Digital Vehicle Passport
              </span>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-900 mt-1">
                Stage a Vehicle Build
              </h1>
            </div>
          </div>
          <p className="text-xs text-neutral-600 font-medium max-w-xl">
            Create a digital passport for your car, truck, motorcycle, watercraft, food truck, or trade fleet asset.
          </p>
        </div>

        {/* Vehicle Form */}
        <form onSubmit={handleCreate} className="space-y-6 bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-2xl shadow-sm">
          
          {/* Section 1: Core Specifications */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#ff3b30]" /> 1. Vehicle Identity &amp; Specs
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Model Year
                </label>
                <input
                  type="text"
                  required
                  placeholder="2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Make / Manufacturer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chevrolet"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corvette Stingray"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Trim / Package (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3LT Z51"
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Exterior Color / Finish
                </label>
                <input
                  type="text"
                  placeholder="e.g. Torch Red"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Asset Category
                </label>
                <select
                  value={vehicleCategory}
                  onChange={(e) => setVehicleCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                >
                  <option value="car_truck">🚗 Car or Truck</option>
                  <option value="motorcycle_pev">🏍️ Motorcycle or PEV</option>
                  <option value="watercraft">🛥️ Watercraft / Boat</option>
                  <option value="commercial_fleet">🚚 Food Truck / Fleet</option>
                  <option value="heavy_equipment">🚜 Heavy Equipment</option>
                  <option value="aircraft">✈️ Aircraft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Engine Specs &amp; Powertrain
              </label>
              <input
                type="text"
                placeholder="e.g. 6.2L LT2 V8 - 495 HP"
                value={engineSpecs}
                onChange={(e) => setEngineSpecs(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          {/* Section 2: Photo Selection */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#ff3b30]" /> 2. Cover Photo URL
            </h3>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Photo Image URL
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            <div>
              <span className="block text-[10px] font-black uppercase text-neutral-500 mb-1.5">Or Choose Sample Preset:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      imageUrl === preset.url ? 'border-[#ff3b30] bg-red-50/50' : 'border-neutral-200 bg-white hover:bg-neutral-100'
                    }`}
                  >
                    <span className="block text-[10px] font-bold text-neutral-900 truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Modifications */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff3b30]" /> 3. Build Modifications &amp; Upgrades
            </h3>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Staged Build Modifications (One per line)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Borla ATAK Cat-Back Exhaust&#10;KW V3 Adjustable Coilovers&#10;Forgeline Monoblock Wheels"
                value={modsDescription}
                onChange={(e) => setModsDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Link
              href="/events/maple-city-cruise"
              className="w-full sm:w-auto py-3 px-6 bg-transparent hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !make.trim() || !model.trim()}
              className="w-full sm:w-auto py-3.5 px-8 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-300 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registering Vehicle...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Vehicle to Garage Now
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default function CreateVehiclePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xs uppercase text-neutral-500">Loading Staging Portal...</div>}>
      <CreateVehicleForm />
    </Suspense>
  );
}
