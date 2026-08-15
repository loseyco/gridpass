'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Warehouse, Loader2, Camera, X, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage } from '@/lib/firebase/config';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ToastContext';

export interface PhysicalSpaceData {
  id?: string;
  user_id?: string;
  owner_uid?: string;
  name: string;
  type: string;
  location?: string;
  sqft?: string;
  access_code_notes?: string;
  notes?: string;
  photo_url?: string;
  linked_vehicle_id?: string;
  is_dual_native_vehicle?: boolean;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_vin?: string;
  license_plate?: string;
  hitch_type?: string;
  item_count?: number;
  is_hidden?: boolean;
}

interface StorageSpaceFormProps {
  mode: 'create' | 'edit';
  spaceId?: string;
  initialData?: PhysicalSpaceData | null;
}

export default function StorageSpaceForm({ mode, spaceId, initialData }: StorageSpaceFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'Garage');
  const [location, setLocation] = useState(initialData?.location || '');
  const [sqft, setSqft] = useState(initialData?.sqft || '');
  const [accessCodeNotes, setAccessCodeNotes] = useState(initialData?.access_code_notes || initialData?.notes || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || '');

  // Dual-Native Vehicle Sync State
  const isTrailerType = type.includes('Trailer') || type.includes('Hauler');
  const [registerAsVehicle, setRegisterAsVehicle] = useState(initialData?.is_dual_native_vehicle || isTrailerType);
  const [vehicleMake, setVehicleMake] = useState(initialData?.vehicle_make || '');
  const [vehicleModel, setVehicleModel] = useState(initialData?.vehicle_model || '');
  const [vehicleVin, setVehicleVin] = useState(initialData?.vehicle_vin || '');
  const [licensePlate, setLicensePlate] = useState(initialData?.license_plate || '');
  const [hitchType, setHitchType] = useState(initialData?.hitch_type || '2-5/16" Ball');

  // Sync initialData if loaded asynchronously in edit mode
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'Garage');
      setLocation(initialData.location || '');
      setSqft(initialData.sqft || '');
      setAccessCodeNotes(initialData.access_code_notes || initialData.notes || '');
      setPhotoUrl(initialData.photo_url || '');
      setRegisterAsVehicle(initialData.is_dual_native_vehicle || initialData.type?.includes('Trailer') || initialData.type?.includes('Hauler') || false);
      setVehicleMake(initialData.vehicle_make || '');
      setVehicleModel(initialData.vehicle_model || '');
      setVehicleVin(initialData.vehicle_vin || '');
      setLicensePlate(initialData.license_plate || '');
      setHitchType(initialData.hitch_type || '2-5/16" Ball');
    }
  }, [initialData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    try {
      if (user?.uid) {
        const storageRef = ref(storage, `garage_spaces/${user.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        setPhotoUrl(downloadUrl);
      }
    } catch (err) {
      console.error('Storage photo upload error, retaining preview:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

    try {
      const spacePayload = {
        user_id: user?.uid || 'pjlosey',
        owner_uid: user?.uid || 'pjlosey',
        name: name.trim(),
        type,
        location: location.trim(),
        sqft: sqft.trim(),
        access_code_notes: accessCodeNotes.trim(),
        notes: accessCodeNotes.trim(),
        photo_url: photoUrl.trim() || '',
        is_dual_native_vehicle: registerAsVehicle || type.includes('Trailer') || type.includes('Hauler'),
        vehicle_make: vehicleMake.trim(),
        vehicle_model: vehicleModel.trim(),
        vehicle_vin: vehicleVin.trim(),
        license_plate: licensePlate.trim(),
        hitch_type: hitchType,
        updated_at: new Date().toISOString()
      };

      if (isMock) {
        const mockId = spaceId || `space-${Date.now()}`;
        const storedSpaces = localStorage.getItem('__mock_spaces__');
        const existingSpaces = storedSpaces ? JSON.parse(storedSpaces) : [];

        if (mode === 'create') {
          const newSpace = { id: mockId, item_count: 0, created_at: new Date().toISOString(), ...spacePayload };
          localStorage.setItem('__mock_spaces__', JSON.stringify([...existingSpaces, newSpace]));
          showToast({ title: "📍 Space Registered", message: `Created physical space "${name}".`, icon: "✅" });
          router.push(`/dash/space/${mockId}/edit`);
        } else {
          const updated = existingSpaces.map((s: any) => s.id === spaceId ? { ...s, ...spacePayload } : s);
          localStorage.setItem('__mock_spaces__', JSON.stringify(updated));
          showToast({ title: "✅ Space Updated", message: `Saved changes to "${name}".`, icon: "🏆" });
          router.push('/dash?tab=spaces');
        }
        return;
      }

      if (user?.uid) {
        let vehicleId = initialData?.linked_vehicle_id || '';

        // Dual-Native Towed Vehicle Sync
        if ((registerAsVehicle || type.includes('Trailer') || type.includes('Hauler')) && !vehicleId) {
          try {
            const vehicleRef = await addDoc(collection(db, 'vehicles'), {
              user_id: user.uid,
              owner_uid: user.uid,
              name: name.trim(),
              make: vehicleMake.trim() || 'Custom Trailer',
              model: vehicleModel.trim() || type,
              vin: vehicleVin.trim(),
              license_plate: licensePlate.trim(),
              hitch_type: hitchType,
              category: 'Trailer / Hauler',
              photo_url: photoUrl.trim() || '',
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            });
            vehicleId = vehicleRef.id;
          } catch (vErr) {
            console.warn('Vehicle sync warning:', vErr);
          }
        }

        const finalPayload = {
          ...spacePayload,
          linked_vehicle_id: vehicleId,
          updated_at: serverTimestamp()
        };

        if (mode === 'create') {
          const docRef = await addDoc(collection(db, 'garage_spaces'), {
            ...finalPayload,
            item_count: 0,
            created_at: serverTimestamp()
          });
          showToast({ title: "📍 Space Registered", message: `Created physical space "${name}".`, icon: "✅" });
          router.push(`/dash/space/${docRef.id}/edit`);
        } else if (spaceId) {
          await updateDoc(doc(db, 'garage_spaces', spaceId), finalPayload);
          showToast({ title: "✅ Space Updated", message: `Saved changes to "${name}".`, icon: "🏆" });
          router.push('/dash?tab=spaces');
        }
      } else {
        router.push('/dash?tab=spaces');
      }
    } catch (err) {
      console.error('Error saving space:', err);
      showToast({ title: "❌ Error", message: "Failed to save physical space.", icon: "⚠️" });
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!spaceId || deleting) return;
    setDeleting(true);

    try {
      const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');
      if (isMock) {
        const storedSpaces = localStorage.getItem('__mock_spaces__');
        if (storedSpaces) {
          const existingSpaces = JSON.parse(storedSpaces);
          const updated = existingSpaces.filter((s: any) => s.id !== spaceId);
          localStorage.setItem('__mock_spaces__', JSON.stringify(updated));
        }
        showToast({ title: "🗑️ Space Archived", message: "Space removed from list.", icon: "✅" });
        router.push('/dash?tab=spaces');
        return;
      }

      if (user?.uid) {
        await updateDoc(doc(db, 'garage_spaces', spaceId), {
          is_hidden: true,
          updated_at: serverTimestamp()
        });
        showToast({ title: "🗑️ Space Archived", message: "Space soft-deleted.", icon: "✅" });
        router.push('/dash?tab=spaces');
      }
    } catch (err) {
      console.error('Soft delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4 md:p-8 selection:bg-[#ff3b30] selection:text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dash?tab=spaces"
              data-testid="back-to-spaces-btn"
              className="min-h-[44px] min-w-[44px] p-2.5 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-xl inline-flex items-center justify-center transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-800" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-[#ff3b30]" /> 
                {mode === 'create' ? 'Add Physical Storage Space' : 'Physical Storage Space Passport'}
              </h1>
              <p className="text-xs text-neutral-500 font-mono">
                {mode === 'create' 
                  ? 'Register workshops, storage units, trailers, basements, or home stockrooms' 
                  : 'Manage physical space details, location, security codes, and towed vehicle sync'}
              </p>
            </div>
          </div>

          {mode === 'edit' && (
            <button
              type="button"
              data-testid="soft-delete-space-btn"
              onClick={handleSoftDelete}
              disabled={deleting}
              className="min-h-[44px] px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all border border-red-200 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-600" />} Delete
            </button>
          )}
        </div>

        {/* Canonical Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Space Name */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Space Name *</label>
            <input
              type="text"
              required
              data-testid="space-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main HQ Garage / Storage Unit #42 B"
              className="w-full min-h-[44px] h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans text-neutral-900 focus:outline-none focus:border-black"
            />
          </div>

          {/* Space Type & Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Space Type *</label>
              <select
                data-testid="space-type-select"
                value={type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setType(newType);
                  if (newType.includes('Trailer') || newType.includes('Hauler')) {
                    setRegisterAsVehicle(true);
                  }
                }}
                className="w-full min-h-[44px] h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans text-neutral-900 focus:outline-none focus:border-black cursor-pointer"
              >
                <option value="Garage">Garage / Workshop</option>
                <option value="Storage Unit">Storage Unit / Locker</option>
                <option value="House">House / Residence</option>
                <option value="Basement">Basement / Cellar</option>
                <option value="Apartment">Apartment / Living Unit</option>
                <option value="Office">Office / Corporate HQ</option>
                <option value="Inventory Room">Inventory Room / Stockroom</option>
                <option value="Shed">Shed / Outbuilding</option>
                <option value="Paddock Pit">Paddock / Trackside Pit</option>
                <option value="Utility Trailer">Utility Trailer</option>
                <option value="Enclosed Car Hauler">Enclosed Car Hauler</option>
                <option value="Stacker Hauler">Stacker Hauler</option>
                <option value="Toy Hauler / RV">Toy Hauler / RV</option>
                <option value="Other Location">Other Storage Location</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Dimensions / Size</label>
              <input
                type="text"
                data-testid="space-dimensions-input"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="e.g. 7'x14' Enclosed or 1,200 sqft"
                className="w-full min-h-[44px] h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans text-neutral-900 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Location / Address */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Location / Address</label>
            <input
              type="text"
              data-testid="space-location-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Elkhart Lake, WI"
              className="w-full min-h-[44px] h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans text-neutral-900 focus:outline-none focus:border-black"
            />
          </div>

          {/* Access Code & Security Notes */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Access Code &amp; Security Notes</label>
            <textarea
              rows={3}
              data-testid="space-access-notes-input"
              value={accessCodeNotes}
              onChange={(e) => setAccessCodeNotes(e.target.value)}
              placeholder="Gate codes, keybox combinations, alarm PINs, security notes..."
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans text-neutral-900 focus:outline-none focus:border-black"
            />
          </div>

          {/* Storage Space Photo */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Storage Space Photo</label>
            {photoUrl ? (
              <div className="relative inline-block border border-neutral-200 rounded-xl overflow-hidden bg-neutral-100 group">
                <img
                  src={photoUrl}
                  alt="Storage space preview"
                  className="w-44 h-44 object-cover rounded-xl"
                  data-testid="space-photo-preview"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  data-testid="remove-space-photo-btn"
                  className="absolute top-2 right-2 min-h-[44px] min-w-[44px] px-3 py-2 bg-black/80 hover:bg-black text-white rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md text-xs font-mono font-bold"
                >
                  <X className="w-4 h-4 text-white" /> Remove
                </button>
              </div>
            ) : (
              <label
                data-testid="space-photo-dropzone"
                className="border-2 border-dashed border-neutral-200 hover:border-[#ff3b30] rounded-xl p-5 bg-neutral-50 flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[56px] text-xs font-mono font-bold text-neutral-700 uppercase"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 text-[#ff3b30] animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-[#ff3b30]" />
                )}
                <span>{uploadingPhoto ? 'Uploading Space Photo...' : '[ 📸 Upload Space Photo ]'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                  data-testid="space-photo-input"
                />
              </label>
            )}
          </div>

          {/* 🚚 DUAL-NATIVE VEHICLE & SPACE SYNC SECTION */}
          <div className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4" data-testid="dual-vehicle-sync-section">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-mono font-black uppercase text-neutral-900 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="register-as-vehicle-checkbox"
                    checked={registerAsVehicle || type.includes('Trailer') || type.includes('Hauler')}
                    onChange={(e) => setRegisterAsVehicle(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ff3b30] focus:ring-[#ff3b30] border-neutral-300"
                  />
                  <span>🚚 Register &amp; Link as Towed Vehicle in Garage</span>
                </label>
                <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                  Trailers &amp; Haulers act as both <strong className="text-neutral-800">Storage Spaces</strong> (for inventory &amp; tools) and <strong className="text-neutral-800">Towed Vehicles</strong> (for VIN, license plate &amp; towing specs).
                </p>
              </div>
            </div>

            {(registerAsVehicle || type.includes('Trailer') || type.includes('Hauler')) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-600 mb-1">Make / Manufacturer</label>
                  <input
                    type="text"
                    data-testid="trailer-make-input"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="e.g. Haulmark, PJ Trailers, Featherlite"
                    className="w-full min-h-[44px] h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-sans text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-600 mb-1">Model / Trailer Specs</label>
                  <input
                    type="text"
                    data-testid="trailer-model-input"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. 7'x14' Enclosed Tandem Axle"
                    className="w-full min-h-[44px] h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-sans text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-600 mb-1">License Plate / State</label>
                  <input
                    type="text"
                    data-testid="trailer-plate-input"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="e.g. 992-TLR (WI)"
                    className="w-full min-h-[44px] h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-sans text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-600 mb-1">Hitch Type / Ball Size</label>
                  <select
                    data-testid="trailer-hitch-select"
                    value={hitchType}
                    onChange={(e) => setHitchType(e.target.value)}
                    className="w-full min-h-[44px] h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-sans text-neutral-900 focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value='1-7/8" Ball'>1-7/8" Ball Hitch</option>
                    <option value='2" Ball'>2" Ball Hitch</option>
                    <option value='2-5/16" Ball'>2-5/16" Ball Hitch</option>
                    <option value='3" Gooseneck Ball'>3" Gooseneck Ball</option>
                    <option value="5th Wheel Kingpin">5th Wheel Kingpin</option>
                    <option value="Pintle Hook / Ring">Pintle Hook / Ring</option>
                    <option value="Weight Distribution Hitch">Weight Distribution Hitch</option>
                    <option value="Other / Custom Hitch">Other / Custom Hitch</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-600 mb-1">VIN # / Serial Number</label>
                  <input
                    type="text"
                    data-testid="trailer-vin-input"
                    value={vehicleVin}
                    onChange={(e) => setVehicleVin(e.target.value)}
                    placeholder="e.g. 4HMUT1429N100234"
                    className="w-full min-h-[44px] h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
            <Link
              href="/dash?tab=spaces"
              data-testid="cancel-space-btn"
              className="min-h-[44px] px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              data-testid="submit-space-btn"
              className="min-h-[44px] px-6 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{mode === 'create' ? '+ Add Physical Space' : 'Save Space Changes'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
