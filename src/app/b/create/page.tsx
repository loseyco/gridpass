'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { Building2, Store, MapPin, Mail, Globe, ArrowLeft, Loader2, Plus, Sparkles, Tag } from 'lucide-react';

const DEFAULT_CATEGORY_PRESETS = [
  { id: 'food_truck', label: '🍔 Food Truck & Catering', desc: 'Mobile food vendors, coffee, snacks & catering' },
  { id: 'auto_shop', label: '🛠️ Auto Repair & Detail Shop', desc: 'Detailers, mechanics, wrap shops & tuners' },
  { id: 'race_team', label: '🏎️ Race Team & Logistics', desc: 'Motorsport teams, sponsors & haulers' },
  { id: 'track_venue', label: '🏁 Track & Event Venue', desc: 'Racetracks, dragstrips & event venues' },
  { id: 'dealership', label: '🏷️ Vendor, Media & Merch', desc: 'Apparel, parts, media & general vendors' },
  { id: 'custom', label: '✨ Custom Category / Other', desc: 'Type any custom industry category for your business' }
];

function CreateBusinessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams ? searchParams.get('redirect') : null;
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('dealership');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [locationName, setLocationName] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Admin Managed Industries
  const [adminIndustries, setAdminIndustries] = useState<any[]>([]);

  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    }
  }, [user]);

  // Subscribe to real-time Admin Industries collection
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'industries'), (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAdminIndustries(docs);
    }, () => {
      setAdminIndustries([]);
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ title: 'Business Name Required', message: 'Please enter a valid business name.' });
      return;
    }

    setSubmitting(true);
    try {
      const businessId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `biz-${Date.now()}`;
      
      let finalCategory = selectedCategoryKey;
      if (selectedCategoryKey === 'custom') {
        finalCategory = customCategoryInput.trim() || 'General Vendor';
      } else {
        const foundAdmin = adminIndustries.find((i) => i.id === selectedCategoryKey);
        const foundPreset = DEFAULT_CATEGORY_PRESETS.find((p) => p.id === selectedCategoryKey);
        finalCategory = foundAdmin?.label || foundPreset?.label || selectedCategoryKey;
      }

      const payload = {
        id: businessId,
        name: name.trim(),
        category: finalCategory,
        category_key: selectedCategoryKey,
        location: locationName.trim() || 'Monmouth, IL',
        email: contactEmail.trim() || user?.email || '',
        website: website.trim() || '',
        description: description.trim() || '',
        owner_id: user?.uid || 'guest-owner',
        owner_uid: user?.uid || 'guest-owner',
        user_id: user?.uid || 'guest-owner',
        created_by: user?.uid || 'guest-owner',
        is_unclaimed: false,
        status: 'active',
        created_at: new Date().toISOString(),
        verified: true,
        logo_url: ''
      };

      await setDoc(doc(db, 'businesses', businessId), payload, { merge: true });

      showToast({
        title: 'Business Profile Registered!',
        message: `${name} has been added to Gridpass.`
      });

      if (redirectTarget) {
        router.push(redirectTarget);
      } else {
        router.push(`/b/${businessId}`);
      }
    } catch (err: any) {
      showToast({
        title: 'Error Creating Profile',
        message: err?.message || 'Failed to save business profile.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Header Breadcrumbs & Title */}
        <div className="mb-8">
          <Link 
            href="/events/maple-city-cruise" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-[#ff3b30] uppercase tracking-wider mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Vendor Exhibitors
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-red-50 text-[#ff3b30] rounded-xl border border-red-100">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ff3b30] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                Business &amp; Vendor Passport
              </span>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-900 mt-1">
                Register Your Business Profile
              </h1>
            </div>
          </div>
          <p className="text-xs text-neutral-600 font-medium max-w-xl">
            Create your digital business passport on Gridpass. Show up on event vendor rosters, display food truck locations, and allow attendees to connect with your brand.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleCreate} className="space-y-6 bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-2xl shadow-sm">
          
          {/* Section 1: Business Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Store className="w-4 h-4 text-[#ff3b30]" /> 1. Business Identity
            </h3>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Business or Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maple City Coffee &amp; Bakehouse"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] focus:ring-1 focus:ring-[#ff3b30] shadow-xs"
              />
            </div>

            {/* Category Selection Grid */}
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-2">
                Select Business Category <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEFAULT_CATEGORY_PRESETS.map((preset) => {
                  const isSelected = selectedCategoryKey === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedCategoryKey(preset.id)}
                      className={`p-3.5 text-left rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-white border-[#ff3b30] ring-2 ring-[#ff3b30]/20 shadow-xs' 
                          : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100/50'
                      }`}
                    >
                      <p className={`text-xs font-black uppercase ${isSelected ? 'text-[#ff3b30]' : 'text-neutral-900'}`}>
                        {preset.label}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-medium mt-0.5 leading-snug">
                        {preset.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Category Input if selected */}
              {selectedCategoryKey === 'custom' && (
                <div className="mt-3 animate-in fade-in duration-150">
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">
                    Specify Custom Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vintage Apparel &amp; Screen Printing"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#ff3b30]" /> 2. Location &amp; Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Primary Location / City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. Monmouth, IL"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder="vendor@maplecity.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Website or Online Store URL (Optional)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  type="url"
                  placeholder="https://maplecitycoffee.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Overview Description */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff3b30]" /> 3. Business Bio &amp; Offerings
            </h3>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 mb-1">
                Overview &amp; Services
              </label>
              <textarea
                rows={3}
                placeholder="Describe your products, food truck menu, merchandise, or services..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-neutral-200">
            <Link
              href="/events/maple-city-cruise"
              className="w-full sm:w-auto py-3 px-6 bg-transparent hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full sm:w-auto py-3.5 px-8 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-300 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Profile...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Business Profile Now
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

export default function CreateBusinessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xs uppercase text-neutral-500">Loading Business Portal...</div>}>
      <CreateBusinessForm />
    </Suspense>
  );
}
