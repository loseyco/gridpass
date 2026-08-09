'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Warehouse, Save, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function EditSpacePage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? decodeURIComponent(rawId) : '';

  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'Garage' | 'Storage Unit' | 'Rented Room' | 'Utility Trailer' | 'Residence'>('Garage');
  const [location, setLocation] = useState('');
  const [sqft, setSqft] = useState('');

  useEffect(() => {
    if (!id) return;
    async function loadSpace() {
      try {
        const docRef = doc(db, 'garage_spaces', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || '');
          setType(data.type || 'Garage');
          setLocation(data.location || '');
          setSqft(data.sqft || '');
        }
      } catch (err) {
        console.error('Error fetching physical space:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSpace();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'garage_spaces', id);
      await updateDoc(docRef, {
        name: name.trim(),
        type,
        location: location.trim(),
        sqft: sqft.trim(),
        updated_at: serverTimestamp(),
      });
      router.push('/dash?tab=spaces');
    } catch (err) {
      console.error('Error updating space:', err);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this space?')) return;

    setDeleting(true);
    try {
      const docRef = doc(db, 'garage_spaces', id);
      await deleteDoc(docRef);
      router.push('/dash?tab=spaces');
    } catch (err) {
      console.error('Error deleting space:', err);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dash?tab=spaces"
              className="min-h-[44px] min-w-[44px] p-2.5 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-xl inline-flex items-center justify-center transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-800" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-[#ff3b30]" /> Edit Physical Space
              </h1>
              <p className="text-xs text-neutral-500 font-mono">Update details for workshop, garage, or storage unit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="min-h-[44px] px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all border border-red-200 cursor-pointer disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
