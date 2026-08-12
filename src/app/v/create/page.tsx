'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { db, auth } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Car, ArrowLeft, Loader2, Sparkles, Plus, Camera, Upload, Check, Shield, Lock, Wrench, Trash2, Images } from 'lucide-react';

function CreateVehicleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams ? searchParams.get('redirect') : null;
  const refSource = searchParams ? searchParams.get('ref') || searchParams.get('referral') : null;
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Core Required / Basic Identity
  const [year, setYear] = useState<string>('2024');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<'car_truck' | 'motorcycle_pev' | 'watercraft' | 'commercial_fleet' | 'heavy_equipment' | 'aircraft'>('car_truck');
  const [color, setColor] = useState('');

  // Drivetrain & Powertrain Specs (Optional)
  const [engineSpecs, setEngineSpecs] = useState('');
  const [transmission, setTransmission] = useState('');
  const [differential, setDifferential] = useState('');
  const [gearRatio, setGearRatio] = useState('');

  // Photos (Optional Native File Picker Uploads)
  const [imagePreview, setImagePreview] = useState<string>('');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);

  // Modifications (Optional)
  const [modsDescription, setModsDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Native File Upload Handler (Main Cover Photo)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({ title: 'File Too Large', message: 'Please select an image smaller than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setImagePreview(base64);
        showToast({
          title: 'Cover Photo Attached! 📸',
          message: 'Main vehicle cover photo uploaded.',
          icon: '📸',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Additional Gallery Photos File Uploader
  const handleAdditionalPhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let count = 0;

    fileList.forEach(file => {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setAdditionalPhotos(prev => [...prev, base64]);
          count++;
        }
      };
      reader.readAsDataURL(file);
    });

    showToast({
      title: 'Gallery Photos Uploaded! 🖼️',
      message: 'Additional photos added to your vehicle gallery.',
      icon: '🖼️',
    });
  };

  const handleRemoveAdditionalPhoto = (index: number) => {
    setAdditionalPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Submit vehicle creation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) {
      showToast({ title: 'Missing Information', message: 'Please enter Make and Model for your vehicle.' });
      return;
    }

    const ownerUid = user?.uid || 'guest-owner';
    await saveVehicleData(ownerUid);
  };

  // Internal Save Function
  const saveVehicleData = async (ownerUid: string) => {
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
        engine_specs: engineSpecs.trim() || '',
        transmission: transmission.trim() || '',
        differential: differential.trim() || '',
        gear_ratio: gearRatio.trim() || '',
        specs: {
          engine: engineSpecs.trim() || '',
          transmission: transmission.trim() || '',
          differential: differential.trim() || '',
          gear_ratio: gearRatio.trim() || '',
        },
        image: imagePreview || '',
        image_url: imagePreview || '',
        photo_url: imagePreview || '',
        additional_photos: additionalPhotos,
        mods: modsDescription.split('\n').filter((m) => m.trim().length > 0),
        mods_description: modsDescription.trim(),
        owner_id: ownerUid,
        ref: refSource || 'direct',
        created_at: new Date().toISOString(),
        location: 'Monmouth, IL',
        scan_count: 1
      };

      await setDoc(doc(db, 'vehicles', vehicleSlug), payload, { merge: true });

      showToast({
        title: 'Vehicle Passport Created! 🏎️',
        message: `${fullTitle} is now live in your Garage.`
      });

      if (redirectTarget) {
        router.push(redirectTarget);
      } else {
        router.push(`/v/${vehicleSlug}`);
      }
    } catch (err: any) {
      showToast({
        title: 'Error Creating Passport',
        message: err?.message || 'Failed to save vehicle passport.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Google 1-Click Sign-in within Auth Modal
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setShowAuthModal(false);
        await saveVehicleData(result.user.uid);
      }
    } catch (err: any) {
      showToast({ title: 'Sign-in Failed', message: err?.message || 'Could not complete Google sign-in.' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Header Breadcrumb & Plain-English Title */}
        <div className="mb-8">
          <Link 
            href="/vehicles" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-[#ff3b30] uppercase tracking-wider mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Vehicles
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-red-50 text-[#ff3b30] rounded-xl border border-red-100 shrink-0">
              <Car className="w-6 h-6" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff3b30] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                Digital Vehicle Passport
              </span>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-900 mt-1">
                Add Your Car
              </h1>
            </div>
          </div>
          <p className="text-xs text-neutral-600 font-medium max-w-xl">
            Create a free digital passport and spec sheet for your car, truck, motorcycle, or build.
          </p>
        </div>

        {/* Vehicle Form */}
        <form onSubmit={handleCreate} className="space-y-6 bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-2xl shadow-sm">
          
          {/* Section 1: Vehicle Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#ff3b30]" /> 1. Vehicle Identity &amp; Basic Specs
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
                  Trim / Package <span className="text-neutral-400 font-normal">(Optional)</span>
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
                  Exterior Color / Finish <span className="text-neutral-400 font-normal">(Optional)</span>
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
                  Vehicle Type
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
          </div>

          {/* Section 2: Drivetrain & Powertrain Specs (Optional) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#ff3b30]" /> 2. Powertrain &amp; Drivetrain Specs <span className="text-neutral-400 font-normal">(Optional)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Transmission
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tremec 8-Speed Dual-Clutch / 6-Speed Manual"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Differential / Axle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electronic Limited-Slip (eLSD) / Dana 44"
                  value={differential}
                  onChange={(e) => setDifferential(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Gear Ratio
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3.73 / 4.10 / 4.56"
                  value={gearRatio}
                  onChange={(e) => setGearRatio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photo Uploads (Main Cover & Additional Build Photos) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#ff3b30]" /> 3. Vehicle Photos <span className="text-neutral-400 font-normal">(Optional)</span>
            </h3>

            <div className="space-y-4">
              {/* Main Cover Photo Uploader */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase text-neutral-600 block">Main Cover Photo:</span>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-neutral-200 rounded-2xl">
                  {imagePreview ? (
                    <div className="w-28 h-20 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-300 relative shrink-0">
                      <img src={imagePreview} alt="Vehicle Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-28 h-20 rounded-xl bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 shrink-0">
                      <Camera className="w-8 h-8 text-neutral-400" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <span className="text-xs font-bold text-neutral-800 block">
                      {imagePreview ? '✓ Cover Photo Attached' : 'No photo uploaded yet. Snap or pick a photo from your phone/computer.'}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase rounded-xl cursor-pointer transition-all min-h-[40px]">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>{imagePreview ? 'Change Cover Photo' : 'Upload Main Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => setImagePreview('')}
                          className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-xs uppercase rounded-xl transition-all min-h-[40px] cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Photos Gallery Uploader */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-neutral-600 block flex items-center gap-1.5">
                    <Images className="w-4 h-4 text-amber-500" /> Additional Build Photos ({additionalPhotos.length})
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-[11px] uppercase rounded-lg cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-[#ff3b30]" />
                    <span>+ Add Gallery Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAdditionalPhotosUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {additionalPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {additionalPhotos.map((photo, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video">
                        <img src={photo} alt={`Build Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalPhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-90 hover:opacity-100 text-xs shadow-md cursor-pointer"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-dashed border-neutral-200 rounded-xl text-center text-neutral-400 text-xs font-medium">
                    Optional: Upload additional shots (Engine Bay, Interior, Track Shots, Underbody).
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Modifications */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff3b30]" /> 4. Build Modifications &amp; Upgrades <span className="text-neutral-400 font-normal">(Optional)</span>
            </h3>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Modifications &amp; Parts Installed (One per line)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Borla ATAK Cat-Back Exhaust&#10;KW V3 Adjustable Coilovers&#10;Forgeline Monoblock Wheels&#10;Warn VR EVO 10-S Winch"
                value={modsDescription}
                onChange={(e) => setModsDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="submit"
              disabled={submitting || !make.trim() || !model.trim()}
              className="w-full sm:w-auto py-3.5 px-8 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-300 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Passport...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Save &amp; Create Vehicle Passport
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Auth Modal if visitor is not logged in when submitting */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl border border-neutral-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-[#ff3b30]">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase text-[#1c1c1e]">Save Your Vehicle Passport</h3>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                Create a free account or sign in to bind <strong>{year} {make} {model}</strong> to your digital garage.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 bg-[#1c1c1e] hover:bg-black text-white font-bold uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm min-h-[44px]"
              >
                <span>Continue with Google</span>
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-neutral-400"><span className="bg-white px-2">or</span></div>
              </div>

              <Link
                href={`/login?redirect=${encodeURIComponent(`/v/new`)}`}
                className="block w-full py-3.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold uppercase rounded-xl text-center cursor-pointer transition-all min-h-[44px]"
              >
                Sign In / Register with Email
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="text-xs font-mono text-neutral-400 hover:text-neutral-600 uppercase font-bold block mx-auto cursor-pointer"
            >
              Cancel &amp; Edit Details
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CreateVehiclePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xs uppercase text-neutral-500">Loading Vehicle Form...</div>}>
      <CreateVehicleForm />
    </Suspense>
  );
}
