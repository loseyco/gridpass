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
  const [type, setType] = useState<'Garage' | 'Storage Unit' | 'Rented Room' | 'Utility Trailer' | 'Residence'>('Garage');
  const [location, setLocation] = useState('');
  const [sqft, setSqft] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

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
      if (user?.uid) {
        await addDoc(collection(db, 'garage_spaces'), {
          user_id: user.uid,
          owner_uid: user.uid,
          name: name.trim(),
          type,
          location: location.trim(),
          sqft: sqft.trim(),
          photo_url: photoUrl.trim() || '',
          item_count: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      router.push('/dash?tab=spaces');
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
                <option value="Garage">Garage</option>
                <option value="Storage Unit">Storage Unit</option>
                <option value="Rented Room">Rented Room</option>
                <option value="Utility Trailer">Utility Trailer</option>
                <option value="Residence">Residence</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Dimensions / Size</label>
              <input
                type="text"
                data-testid="space-dimensions-input"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="e.g. 1,200 sqft or 24ft Enclosed"
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
