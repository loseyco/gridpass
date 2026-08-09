'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function EditExperiencePage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? decodeURIComponent(rawId) : '';

  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('Driver');
  const [dateRange, setDateRange] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!id) return;
    async function loadExperience() {
      try {
        const docRef = doc(db, 'experiences', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || '');
          setCompany(data.company || '');
          setCategory(data.category || 'Driver');
          setDateRange(data.date_range || '');
          setDescription(data.description || '');
        }
      } catch (err) {
        console.error('Error fetching experience asset:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExperience();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !id) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'experiences', id);
      await updateDoc(docRef, {
        title: title.trim(),
        company: company.trim(),
        category,
        date_range: dateRange.trim(),
        description: description.trim(),
        updated_at: serverTimestamp(),
      });
      router.push('/dash?tab=experiences');
    } catch (err) {
      console.error('Error updating experience asset:', err);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center font-mono text-sm text-neutral-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading Experience Asset...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dash?tab=experiences"
            className="min-h-[44px] min-w-[44px] p-2.5 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-xl inline-flex items-center justify-center transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-800" />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#ff3b30]" /> Edit Experience Asset
            </h1>
            <p className="text-xs text-neutral-500 font-mono">Update role details, dates, and experience highlights</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Role / Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Team / Company / Venue</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
              >
                <option value="Driver">Driver</option>
                <option value="Engineering">Engineering</option>
                <option value="Pit Crew">Pit Crew</option>
                <option value="Media/Photo">Media/Photo</option>
                <option value="Organizer">Organizer</option>
                <option value="Sponsor">Sponsor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Date Range</label>
              <input
                type="text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/dash?tab=experiences"
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
