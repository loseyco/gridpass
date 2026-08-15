'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SkillsTagInput } from '@/components/SkillsTagInput';
import { ExperiencePhotoUploader } from '@/components/ExperiencePhotoUploader';
import { ExperienceLinksInput, ExperienceLinkItem } from '@/components/ExperienceLinksInput';
import { ExperienceDatePicker } from '@/components/ExperienceDatePicker';

const CATEGORY_GROUPS = [
  {
    label: 'Role / Discipline Category',
    options: [
      'Shop Foreman / Lead Tech',
      'Master Mechanic / Service Tech',
      'Engine Builder / Machinist',
      'Custom Fabricator / TIG Welder',
      'ECU Tuner / Dyno Calibration',
      'Paint & Body / Restoration',
      'Electrical / Wiring Harness',
      '4x4 / Off-Road Upfitter',
      'Pro / Club Race Driver',
      'Track Day / HPDE / Time Attack',
      'Drag Racer / Street Strip',
      'Drift Driver',
      'Sim Racer / Esports',
      'Telemetry / Data Engineer',
      'Race Strategist / Crew Chief',
      'Pit Crew / Tire & Fuel',
      'Automotive Photographer / Video',
      'Content Creator / Media',
      'Speed Shop / Parts Specialist',
      'Special Project / Engineering',
    ],
  },
  {
    label: 'Custom Descriptor',
    options: ['Custom / Other'],
  },
];

const STANDARD_CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.options).filter((opt) => opt !== 'Custom / Other');

function EditExperienceForm() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? decodeURIComponent(rawId) : '';

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dash?tab=experiences';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('Shop Foreman / Lead Tech');
  const [customCategory, setCustomCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [links, setLinks] = useState<ExperienceLinkItem[]>([]);

  useEffect(() => {
    if (!id) return;

    // Check if running in Playwright mock mode
    const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

    if (isMock) {
      setTitle('Honda Racing / HRC Trackside Engineer');
      setCompany('Honda Racing Corporation (HRC)');
      setCategory('Shop Foreman / Lead Tech');
      setStartDate('2021');
      setEndDate('');
      setIsCurrent(true);
      setDateRange('2021 – Present');
      setDescription('High-speed telemetry extraction, race strategy engine engineering.');
      setSkills(['Telemetry Analysis', 'ECU Tuning', 'Dyno Calibration']);
      setPhotos([]);
      setLinks([{ title: 'Losey.co Pedigree', url: 'https://losey.co' }]);
      setLoading(false);
      return;
    }

    async function fetchExperience() {
      try {
        const docRef = doc(db, 'experiences', id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || '');
          setCompany(data.company || '');

          const cat = data.category || 'Shop Foreman / Lead Tech';
          if (STANDARD_CATEGORIES.includes(cat)) {
            setCategory(cat);
          } else {
            setCategory('Custom / Other');
            setCustomCategory(cat);
          }

          setStartDate(data.start_date || '');
          setEndDate(data.end_date || '');
          setIsCurrent(!!data.is_current || (data.date_range && data.date_range.includes('Present')));
          setDateRange(data.date_range || '');
          setDescription(data.description || '');
          setSkills(Array.isArray(data.skills) ? data.skills : []);
          setPhotos(Array.isArray(data.photos) ? data.photos : []);
          setLinks(Array.isArray(data.links) ? data.links : []);
        }
      } catch (err) {
        console.error('Error loading experience:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchExperience();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    try {
      const finalCategory = category === 'Custom / Other' && customCategory.trim() ? customCategory.trim() : category;
      const cleanSkills = skills.map((s) => s.trim()).filter(Boolean);
      const cleanLinks = links.filter((l) => l.url.trim().length > 0);

      const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');

      if (!isMock && user?.uid && id) {
        const docRef = doc(db, 'experiences', id);
        await updateDoc(docRef, {
          title: title.trim(),
          company: company.trim(),
          category: finalCategory,
          start_date: startDate.trim(),
          end_date: isCurrent ? null : endDate.trim(),
          is_current: isCurrent,
          date_range: dateRange.trim() || (isCurrent ? `${startDate} – Present` : startDate),
          description: description.trim(),
          skills: cleanSkills,
          photos: photos,
          links: cleanLinks,
          updated_at: serverTimestamp(),
        });

        // Sync with user's embedded array
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentExp = userSnap.data().experiences || [];
          const updatedList = currentExp.map((ex: any) => {
            if (ex.id === id) {
              return {
                ...ex,
                title: title.trim(),
                company: company.trim(),
                category: finalCategory,
                start_date: startDate.trim(),
                end_date: isCurrent ? null : endDate.trim(),
                is_current: isCurrent,
                date_range: dateRange.trim() || (isCurrent ? `${startDate} – Present` : startDate),
                description: description.trim(),
                skills: cleanSkills,
                photos: photos,
                links: cleanLinks,
              };
            }
            return ex;
          });
          await updateDoc(userRef, {
            experiences: updatedList,
            updated_at: serverTimestamp(),
          });
        }
      }

      router.push(redirectUrl);
    } catch (err) {
      console.error('Error updating experience:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff3b30]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 pb-20">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={redirectUrl}
              className="p-2 -ml-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <span className="text-[#ff3b30]">✏️</span> Edit Experience Asset
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                Update details, skills tags, photos, and verification links
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
              Role / Title <span className="text-[#ff3b30]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lead Race Engineer / Pro Driver"
              className="w-full h-12 px-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-bold focus:bg-white focus:border-[#ff3b30] focus:ring-1 focus:ring-[#ff3b30] outline-none transition-all"
            />
          </div>

          {/* Company / Team */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
              Team / Company / Venue
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Losey Racing / Road America"
              className="w-full h-12 px-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-bold focus:bg-white focus:border-[#ff3b30] focus:ring-1 focus:ring-[#ff3b30] outline-none transition-all"
            />
          </div>

          {/* Skills Tag Input */}
          <SkillsTagInput skills={skills} onChange={setSkills} />

          {/* Photo Gallery Uploader */}
          <ExperiencePhotoUploader photos={photos} onChange={setPhotos} />

          {/* Verification Links */}
          <ExperienceLinksInput links={links} onChange={setLinks} />

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
              Role Category (Optional)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-bold focus:bg-white focus:border-[#ff3b30] focus:ring-1 focus:ring-[#ff3b30] outline-none transition-all"
            >
              {CATEGORY_GROUPS.map((group, idx) => (
                <optgroup key={idx} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Custom Category input */}
          {category === 'Custom / Other' && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
                Custom Descriptor <span className="text-[#ff3b30]">*</span>
              </label>
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Vintage Restorer / Track Marshal"
                className="w-full h-12 px-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-bold focus:bg-white focus:border-[#ff3b30] focus:ring-1 focus:ring-[#ff3b30] outline-none transition-all"
              />
            </div>
          )}

          {/* Date Picker (Start / End / Present) */}
          <ExperienceDatePicker
            startDate={startDate}
            endDate={endDate}
            isCurrent={isCurrent}
            onChange={({ startDate, endDate, isCurrent, dateRangeText }) => {
              setStartDate(startDate);
              setEndDate(endDate);
              setIsCurrent(isCurrent);
              setDateRange(dateRangeText);
            }}
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key achievements, chassis tuned, championships won, or telemetry milestones..."
              className="w-full p-4 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-medium focus:bg-white focus:border-[#ff3b30] focus:ring-1 focus:ring-[#ff3b30] outline-none transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <Link
              href={redirectUrl}
              className="px-5 py-3 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-xs uppercase tracking-wider hover:bg-neutral-50 transition-colors min-h-[44px] flex items-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-6 py-3 rounded-xl bg-[#ff3b30] hover:bg-[#e0342b] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 min-h-[44px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditExperiencePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff3b30]" />
        </div>
      }
    >
      <EditExperienceForm />
    </Suspense>
  );
}
