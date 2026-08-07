'use client';

import React, { useState } from 'react';
import { 
  X, Save, User, Briefcase, Car, Store, FileText, 
  Plus, Trash2, Globe, Instagram, Youtube, Twitter, Loader2, Sparkles 
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ToastContext';

interface EditPassportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onProfileUpdated: (updatedProfile: any) => void;
}

export function EditPassportDrawer({ isOpen, onClose, profile, onProfileUpdated }: EditPassportDrawerProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'career' | 'vehicles' | 'businesses' | 'stories'>('profile');
  const [saving, setSaving] = useState(false);

  // Profile Form State
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [homeTown, setHomeTown] = useState(profile?.home_town || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url || '');
  const [instagram, setInstagram] = useState(profile?.socials?.instagram || '');
  const [youtube, setYoutube] = useState(profile?.socials?.youtube || '');
  const [tiktok, setTiktok] = useState(profile?.socials?.tiktok || '');
  const [twitter, setTwitter] = useState(profile?.socials?.twitter || '');
  const [website, setWebsite] = useState(profile?.website || '');

  // Career Work Experience Entry Form State
  const [experiences, setExperiences] = useState<any[]>(profile?.experiences || []);
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expYears, setExpYears] = useState('');
  const [expCategory, setExpCategory] = useState('performance_shop');

  // Story / Build Log Form State
  const [storyTitle, setStoryTitle] = useState('');
  const [storyBody, setStoryBody] = useState('');
  const [storyCover, setStoryCover] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedData = {
        display_name: displayName,
        username: username.toLowerCase().trim(),
        bio,
        home_town: homeTown,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        website_url: website,
        socials: { instagram, youtube, tiktok, twitter },
        experiences,
        updated_at: new Date().toISOString()
      };

      if (profile?.uid && profile.uid !== 'mock') {
        const uRef = doc(db, 'users', profile.uid);
        await updateDoc(uRef, updatedData);
      }

      onProfileUpdated({
        ...profile,
        ...updatedData
      });

      showToast({
        title: "✅ Passport Saved!",
        message: "Your profile details, social links & career info have been updated.",
        icon: "🏆"
      });

      onClose();
    } catch (err) {
      console.error("Save passport error:", err);
      showToast({
        title: "Save Failed",
        message: "Could not save profile changes. Please try again.",
        icon: "⚠️"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddExperience = () => {
    if (!expTitle || !expCompany) {
      showToast({ title: "Incomplete Field", message: "Please fill in job title and company name.", icon: "⚠️" });
      return;
    }
    const newExp = {
      id: `exp_${Date.now()}`,
      title: expTitle,
      company: expCompany,
      years: expYears || 'Present',
      category: expCategory
    };
    setExperiences([...experiences, newExp]);
    setExpTitle('');
    setExpCompany('');
    setExpYears('');
    showToast({ title: "💼 Career Entry Added", message: `${expTitle} at ${expCompany} added to resume!`, icon: "✅" });
  };

  const handleRemoveExperience = (id: string) => {
    setExperiences(experiences.filter(e => e.id !== id));
  };

  const handlePublishStory = async () => {
    if (!storyTitle || !storyBody) {
      showToast({ title: "Incomplete Story", message: "Please write a title and story body.", icon: "⚠️" });
      return;
    }
    setSaving(true);
    try {
      if (profile?.uid) {
        await addDoc(collection(db, 'user_stories'), {
          author_uid: profile.uid,
          author_name: displayName,
          title: storyTitle,
          body: storyBody,
          cover_url: storyCover,
          created_at: serverTimestamp()
        });
      }
      showToast({ title: "📝 Story Published!", message: `"${storyTitle}" is live on your passport feed!`, icon: "🔥" });
      setStoryTitle('');
      setStoryBody('');
      setStoryCover('');
    } catch (e) {
      console.error("Publish story error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between text-left overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div>
            <span className="text-[9px] font-mono font-black text-[#ff3b30] uppercase tracking-widest block">
              GRIDPASS PASSPORT MANAGER
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ff3b30]" /> Manage My Profile &amp; Resume
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex items-center gap-1 p-2 bg-neutral-100 border-b border-neutral-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', label: '👤 Profile & Socials', icon: User },
            { id: 'career', label: '💼 Work & Career', icon: Briefcase },
            { id: 'stories', label: '📝 Blog & Build Logs', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 text-[11px] font-mono font-black uppercase rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PROFILE DETAILS & SOCIAL LINKS */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  placeholder="e.g. PJ Losey"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Username (@handle)</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                    placeholder="pjlosey"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Hometown</label>
                  <input 
                    type="text" 
                    value={homeTown}
                    onChange={e => setHomeTown(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                    placeholder="Chicago, IL"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Bio &amp; Personal Quote</label>
                <textarea 
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  placeholder="Tell fans and sponsors about your motorsport history..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Profile Photo URL</label>
                <input 
                  type="url" 
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Hero Cover Banner Photo URL</label>
                <input 
                  type="url" 
                  value={coverUrl}
                  onChange={e => setCoverUrl(e.target.value)}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  placeholder="https://..."
                />
              </div>

              {/* Social Media Links */}
              <div className="pt-3 border-t border-neutral-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-neutral-900">Social Media &amp; Web Links</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                      <Instagram className="w-3 h-3 text-pink-600" /> Instagram Handle
                    </label>
                    <input 
                      type="text" 
                      value={instagram}
                      onChange={e => setInstagram(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                      placeholder="pjlosey"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                      <Youtube className="w-3 h-3 text-red-600" /> YouTube Handle
                    </label>
                    <input 
                      type="text" 
                      value={youtube}
                      onChange={e => setYoutube(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                      placeholder="PJLosey"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                      <Twitter className="w-3 h-3 text-blue-500" /> Twitter / X Handle
                    </label>
                    <input 
                      type="text" 
                      value={twitter}
                      onChange={e => setTwitter(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                      placeholder="pjlosey"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-600" /> Personal Website
                    </label>
                    <input 
                      type="url" 
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                      placeholder="https://loseyco.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORK EXPERIENCE & CAREER HISTORY */}
          {activeTab === 'career' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#ff3b30]" /> Add Work Experience / Career Role
                </h4>

                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={expTitle}
                    onChange={e => setExpTitle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                    placeholder="Job Title / Role (e.g. Lead Architect, Shop Owner, Track Marshal)"
                  />
                  <input 
                    type="text" 
                    value={expCompany}
                    onChange={e => setExpCompany(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                    placeholder="Company / Shop / Racing Team (e.g. Gridpass, LoseyCo)"
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={expYears}
                      onChange={e => setExpYears(e.target.value)}
                      className="flex-1 p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                      placeholder="Years Active (e.g. 2021 - Present)"
                    />
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="py-2.5 px-4 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Add Entry
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Experiences List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-neutral-900">Career History ({experiences.length})</h4>
                {experiences.length > 0 ? (
                  <div className="space-y-2">
                    {experiences.map((exp: any) => (
                      <div key={exp.id} className="p-3 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-black uppercase text-neutral-900">{exp.title}</h5>
                          <p className="text-[11px] text-neutral-600 font-medium">{exp.company} • <span className="font-mono text-neutral-400">{exp.years}</span></p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(exp.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-neutral-50 border border-dashed border-neutral-200 rounded-2xl text-center">
                    <p className="text-xs font-mono font-bold text-neutral-400 uppercase">No work experience or career history added yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BLOG STORIES & BUILD LOGS */}
          {activeTab === 'stories' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-neutral-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" /> Write &amp; Publish Blog Story / Build Log
                </h4>

                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={storyTitle}
                    onChange={e => setStoryTitle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
                    placeholder="Story Title (e.g. Twin Turbo Dyno Pull & Track Day Recap)"
                  />
                  <input 
                    type="url" 
                    value={storyCover}
                    onChange={e => setStoryCover(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    placeholder="Header Cover Photo URL (https://...)"
                  />
                  <textarea 
                    value={storyBody}
                    onChange={e => setStoryBody(e.target.value)}
                    rows={5}
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900"
                    placeholder="Write your build story, race recap, or track notes..."
                  />
                  <button
                    type="button"
                    onClick={handlePublishStory}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Publish Story to Passport Feed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drawer Footer Save Bar */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
