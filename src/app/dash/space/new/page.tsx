'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Warehouse, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateSpacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'Garage' | 'Storage Unit' | 'Rented Room' | 'Utility Trailer' | 'Residence'>('Garage');
  const [location, setLocation] = useState('');
  const [sqft, setSqft] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (user?.uid) {
        await addDoc(collection(db, 'garage_spaces'), {
          user_id: user.uid,
          name: name.trim(),
          type,
          location: location.trim(),
          sqft: sqft.trim(),
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
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dash?tab=spaces"
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

        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Space Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main HQ Garage / Storage Unit #42 B"
              className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Space Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
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
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="e.g. 1,200 sqft or 24ft Enclosed"
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Location / Address</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Elkhart Lake, WI"
              className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/dash?tab=spaces"
              className="min-h-[44px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl flex items-center justify-center transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
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
