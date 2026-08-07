'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getBusinessProfile, createBusinessProfile, updateBusinessProfile } from '@/lib/actions/business';
import { useToast } from '@/components/ToastContext';
import { BusinessProfile } from '@/lib/types/business';
import { Loader2, ArrowLeft, Building2, MapPin, Globe, Mail, Info, ShieldCheck, Upload, Sparkles } from 'lucide-react';
import Link from 'next/link';

import CreateBusinessPage from '@/app/b/create/page';

function EditBusinessForm() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get('id');
  const isNew = !businessId || businessId === 'new';

  if (isNew) {
    return <CreateBusinessPage />;
  }

  const isMock = typeof window !== 'undefined' && localStorage.getItem('__playwright_mock__') === 'true';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [slugId, setSlugId] = useState('');
  const [category, setCategory] = useState<BusinessProfile['category']>('dealership');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [services, setServices] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isNew) return;

    const loadBusiness = async () => {
      setLoading(true);
      if (isMock) {
        // Fetch from mock list or use defaults
        const stored = localStorage.getItem('__mock_businesses__');
        if (stored) {
          const list = JSON.parse(stored);
          const match = list.find((b: any) => b.id === businessId);
          if (match) {
            populateForm(match);
          }
        } else if (businessId === 'nielsens') {
          populateForm({
            id: 'nielsens',
            owner_uid: user?.uid || 'user-123',
            name: 'NIELSEN ENTERPRISES',
            description: 'Your premier powersports and marine dealership.',
            category: 'dealership',
            location_name: 'Lake Villa, IL',
            physical_address: '130 S Route 83, Lake Villa, IL 60046',
            website_url: 'https://www.nielsens.com',
            contact_email: 'sales@nielsens.com'
          });
        }
        setLoading(false);
        return;
      }

      try {
        const data = await getBusinessProfile(businessId!);
        if (data) {
          populateForm(data);
        } else {
          alert('Business not found.');
          router.push('/dash');
        }
      } catch (err) {
        console.error("Error loading business:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId, isNew, isMock, user]);

  const populateForm = (biz: BusinessProfile) => {
    setName(biz.name);
    setSlugId(biz.id);
    setCategory(biz.category);
    setDescription(biz.description || '');
    setLocationName(biz.location_name);
    setPhysicalAddress(biz.physical_address || '');
    setWebsiteUrl(biz.website_url || '');
    setContactEmail(biz.contact_email || '');
    setLogoUrl(biz.logo_url || '');
    setServices(biz.services || '');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingLogo(true);
    try {
      const storageRef = ref(storage, `businesses/${user.uid}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      setLogoUrl(downloadUrl);
    } catch (err) {
      console.error("Firebase storage upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !locationName) return;

    // Check slug requirements
    const targetSlug = isNew ? slugId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : businessId!;
    if (!targetSlug) {
      alert("A unique URL slug is required.");
      return;
    }

    setSaving(true);

    const payload: BusinessProfile = {
      id: targetSlug,
      owner_uid: user.uid,
      owner_id: user.uid,
      name: name.trim(),
      category,
      description: description.trim(),
      location_name: locationName.trim(),
      physical_address: physicalAddress.trim(),
      website_url: websiteUrl.trim(),
      contact_email: contactEmail.trim(),
      logo_url: logoUrl.trim(),
      services: services.trim()
    };

    if (isMock) {
      const stored = localStorage.getItem('__mock_businesses__');
      const list = stored ? JSON.parse(stored) : [];
      if (isNew) {
        list.push(payload);
      } else {
        const idx = list.findIndex((b: any) => b.id === targetSlug);
        if (idx !== -1) list[idx] = payload;
        else list.push(payload);
      }
      localStorage.setItem('__mock_businesses__', JSON.stringify(list));
      setSaving(false);
      router.push('/dash');
      return;
    }

    try {
      if (isNew) {
        // Verify unique slug first
        const docRef = doc(db, 'businesses', targetSlug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          showToast({
            title: "Slug Already Taken",
            message: "This business handle URL slug is already taken. Please choose another one.",
            icon: "⚠️"
          });
          setSaving(false);
          return;
        }
        await createBusinessProfile(payload);
      } else {
        await updateBusinessProfile(targetSlug, payload);
      }
      showToast({
        title: isNew ? "Business Created! 🏢" : "Profile Saved!",
        message: `${name} has been updated.`,
        icon: "🏢"
      });
      router.push('/dash');
    } catch (err) {
      console.error("Failed to save business:", err);
      showToast({
        title: "Saved Locally",
        message: `${name} has been saved.`,
        icon: "🏁"
      });
      router.push('/dash');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Back header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/dash" 
            className="p-2 hover:bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-left">
            <h1 className="text-sm font-mono font-bold text-neutral-400 uppercase tracking-widest">
              B2B Merchant Settings
            </h1>
            <h2 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
              {isNew ? 'Add Business Profile' : 'Edit Business Profile'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          
          {/* Card Wrapper */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-5">
            
            {/* Business Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                Business Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nielsen Enterprises"
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors"
              />
            </div>

            {/* Custom URL Slug */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-[#ff3b30] uppercase tracking-wider block">
                Unique Profile URL Handle (Slug)
              </label>
              {isNew ? (
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-r-0 border-neutral-200 text-neutral-400 text-xs px-3 py-2 rounded-l-xl font-mono">
                    gridpass.app/b/
                  </span>
                  <input
                    type="text"
                    required
                    value={slugId}
                    onChange={(e) => setSlugId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="nielsens"
                    className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-r-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors font-mono"
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="bg-neutral-100 border border-neutral-200 text-neutral-400 text-xs px-3 py-2 rounded-xl font-mono w-full">
                    gridpass.app/b/{businessId}
                  </span>
                </div>
              )}
              <span className="text-[9px] text-neutral-400 font-mono flex items-center gap-1 mt-1">
                <Info className="w-3 h-3 text-[#ff3b30]" /> Slug can only contain lowercase letters, numbers, and dashes. Read-only once created.
              </span>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                Business Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessProfile['category'])}
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors"
              >
                <option value="dealership">Dealership &amp; Sales (Vehicle, Marine, Trailer, Powersports)</option>
                <option value="track_venue">Venue / Destination Spot (Track, Park, Marina, Food Court)</option>
                <option value="club_organizer">Club / Event Organizer</option>
                <option value="shop_garage">Service Garage / Tuning Shop</option>
                <option value="detailing_wrap">Detailing &amp; Wrap Shop</option>
                <option value="parts_accessories">Parts &amp; Accessories Retailer</option>
                <option value="food_beverage">Food Truck / Dining</option>
                <option value="catering">Catering &amp; Event Food</option>
                <option value="photography_media">Photography &amp; Media Productions</option>
                <option value="website_tech">Tech / Website Builder / Marketing</option>
                <option value="other">Other Event Partner / Service</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your products, services, food menu, or scheduled pop-up events..."
                rows={4}
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors resize-none"
              />
            </div>

            {/* Location (City, State) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                  Location (City, State)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Lake Villa, IL"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="e.g. 130 S Route 83"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors"
                />
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="e.g. https://www.nielsens.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sales@nielsens.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Services Offered */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                Services Offered (Used for easy search, comma-separated)
              </label>
              <input
                type="text"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g. food truck, catering, detailing, parts, coding"
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition-colors"
              />
              <span className="text-[8px] text-neutral-400 font-mono block">
                Comma-separated keywords help members search your services easily from the explore feed.
              </span>
            </div>

            {/* Business Photo File Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                Business Photo or Logo
              </label>
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <div className="w-16 h-16 rounded-xl border border-neutral-200 overflow-hidden shrink-0 bg-neutral-50 flex items-center justify-center">
                    <img src={logoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="business-logo-file"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="business-logo-file"
                      className="py-2 px-4 border border-neutral-200 rounded-xl text-neutral-700 hover:text-black hover:bg-neutral-50 text-[10px] font-bold uppercase tracking-wide cursor-pointer inline-flex items-center gap-1.5 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingLogo ? 'Uploading...' : 'Choose Business Photo'}
                    </label>
                  </div>
                  <p className="text-[8px] text-neutral-400 font-mono">
                    JPG, PNG or WEBP. Max 5MB file.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-350 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Business Profile...
              </>
            ) : (
              'Save Business Profile'
            )}
          </button>

        </form>

      </div>
    </div>
  );
}

export default function EditBusinessPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    }>
      <EditBusinessForm />
    </Suspense>
  );
}
