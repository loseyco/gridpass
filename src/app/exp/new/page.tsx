'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateExperiencePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('Driver');
  const [dateRange, setDateRange] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (user?.uid) {
        await addDoc(collection(db, 'experiences'), {
          user_id: user.uid,
          title: title.trim(),
          company: company.trim(),
          category,
          date_range: dateRange.trim(),
          description: description.trim(),
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      router.push('/dash?tab=experiences');
    } catch (err) {
      console.error('Error creating experience:', err);
      setSaving(false);
    }
  };

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
              <Briefcase className="w-5 h-5 text-[#ff3b30]" /> New Experience Asset
            </h1>
            <p className="text-xs text-neutral-500 font-mono">Add motorsport gig, engineering role, or racing project</p>
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
              placeholder="e.g. Lead Race Engineer / Pro Driver"
              className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">Team / Company / Venue</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Losey Racing / Road America"
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
                placeholder="e.g. 2024 - Present"
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
              placeholder="Detail key responsibilities, podiums, achievements, or track specs..."
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:border-black"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/dash/edit-profile"
              data-testid="cancel-exp-btn"
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
              {saving ? 'Saving...' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
