'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Warehouse, Plus, Loader2, Camera, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CreateSpacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'Garage' | 'Storage Unit' | 'Rented Room' | 'Utility Trailer' | 'Enclosed Car Hauler' | 'Stacker Hauler' | 'Toy Hauler / RV' | 'Residence'>('Garage');
  const [location, setLocation] = useState('');
  const [sqft, setSqft] = useState('');
  const [accessCodeNotes, setAccessCodeNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Dual-Native Vehicle Sync State
  const [registerAsVehicle, setRegisterAsVehicle] = useState(false);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleVin, setVehicleVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [hitchType, setHitchType] = useState('2-5/16" Ball');

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
        const storageRef = ref(storage, `garage_spaces/${user.uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        setPhotoUrl(downloadUrl);
      }
    } catch (err) {
      console.error('Firebase storage photo upload failed, retaining preview:', err);
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
    try {
      const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');
      if (isMock) {
        const mockId = `u-haul-storage-hub-${Date.now()}`;
        const newSpace = {
          id: mockId,
          user_id: user?.uid || 'pjlosey',
          owner_uid: user?.uid || 'pjlosey',
          name: name.trim(),
          type,
          location: location.trim() || 'Elkhart Lake, WI',
          sqft: sqft.trim() ? (sqft.includes('sq') ? sqft.trim() : `${sqft.trim()} sqft`) : '1,200 sqft',
          access_code_notes: accessCodeNotes.trim(),
          photo_url: photoUrl.trim() || '',
          item_count: 0,
        };
        const storedSpaces = localStorage.getItem('__mock_spaces__');
        const existingSpaces = storedSpaces ? JSON.parse(storedSpaces) : [
          { id: 'space-1', owner_uid: 'pjlosey', name: "Kristina's Garage", type: 'Residential Garage', location: 'Grayslake, IL', sqft: '600' },
          { id: 'space-2', owner_uid: 'pjlosey', name: 'Monmouth Beach Self-Storage Unit #402', type: 'Storage Unit', location: 'Monmouth Beach, NJ', sqft: '200' },
          { id: 'space-3', owner_uid: 'pjlosey', name: 'Rented Workshop Room', type: 'Rented Room', location: 'Chicago, IL', sqft: '400' },
          { id: 'space-4', owner_uid: 'pjlosey', name: "7'x14' Enclosed Utility Trailer", type: 'Utility Trailer', location: 'Grayslake, IL', sqft: '98' },
          { id: 'space-5', owner_uid: 'pjlosey', name: "Kristina's House", type: 'Residence', location: 'Grayslake, IL', sqft: '2400' }
        ];
        localStorage.setItem('__mock_spaces__', JSON.stringify([...existingSpaces, newSpace]));
        router.push(`/dash/space/${mockId}/edit`);
        return;
      }

      if (user?.uid) {
        let vehicleId = '';

        // If registered as vehicle or trailer space type, create linked vehicle record in Cloud Firestore vehicles collection
        if (registerAsVehicle || type.includes('Trailer') || type.includes('Hauler')) {
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

        const docRef = await addDoc(collection(db, 'garage_spaces'), {
          user_id: user.uid,
          owner_uid: user.uid,
          name: name.trim(),
          type,
          location: location.trim(),
          sqft: sqft.trim(),
          access_code_notes: accessCodeNotes.trim(),
          photo_url: photoUrl.trim() || '',
          linked_vehicle_id: vehicleId,
          is_dual_native_vehicle: !!vehicleId,
          vehicle_make: vehicleMake.trim(),
          vehicle_model: vehicleModel.trim(),
          vehicle_vin: vehicleVin.trim(),
          license_plate: licensePlate.trim(),
          hitch_type: hitchType,
          item_count: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        router.push(`/dash/space/${docRef.id}/edit`);
      } else {
        router.push('/dash?tab=spaces');
      }
    } catch (err) {
      console.error('Error creating space:', err);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
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
              <Warehouse className="w-5 h-5 text-[#ff3b30]" /> Add Physical Space
            </h1>
            <p className="text-xs text-neutral-500 font-mono">Register workshops, storage units, trailers, or home garages</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Space Type</label>
              <select
                data-testid="space-type-select"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full min-h-[44px] h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans text-neutral-900 focus:outline-none focus:border-black"
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

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Access Code & Security Notes</label>
            <textarea
              rows={3}
              data-testid="space-access-notes-input"
              value={accessCodeNotes}
              onChange={(e) => setAccessCodeNotes(e.target.value)}
              placeholder="Gate codes, keybox combinations, alarm PINs, security notes..."
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans text-neutral-900 focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Storage Space Photo</label>
            {photoUrl ? (
              <div className="relative inline-block border border-neutral-200 rounded-xl overflow-hidden bg-neutral-100 group">
                <img
                  src={photoUrl}
                  alt="Storage space preview"
                  className="w-40 h-40 object-cover rounded-xl"
                  data-testid="space-photo-preview"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  data-testid="remove-space-photo-btn"
                  className="absolute top-2 right-2 min-h-[44px] min-w-[44px] px-3 py-2 bg-black/80 hover:bg-black text-white rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md text-xs font-mono font-bold"
                >
                  <X className="w-4 h-4 text-red-400" />
                  <span>✕ Remove</span>
                </button>
              </div>
            ) : (
              <label
                data-testid="space-photo-dropzone"
                className="min-h-[64px] px-4 py-4 bg-neutral-50 hover:bg-neutral-100 border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 text-neutral-700 font-mono text-xs font-bold cursor-pointer transition-all"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#ff3b30]" />
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
                    className="w-full min-h-[44px] h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-sans text-neutral-900 focus:outline-none focus:border-black"
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

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/dash?tab=spaces"
              data-testid="cancel-space-btn"
              className="min-h-[44px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              data-testid="submit-space-btn"
              disabled={saving || uploadingPhoto}
              className="min-h-[44px] px-6 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Add Space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
