'use client';

import React, { useState } from 'react';
import { X, Save, Store, MapPin, Phone, Globe, Clock, Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/components/ToastContext';

interface EditBusinessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  business: any;
  onBusinessUpdated: (updatedBusiness: any) => void;
}

export function EditBusinessDrawer({ isOpen, onClose, business, onBusinessUpdated }: EditBusinessDrawerProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(business?.name || '');
  const [category, setCategory] = useState(business?.category || 'Official Sponsor & Shop');
  const [description, setDescription] = useState(business?.description || '');
  const [address, setAddress] = useState(business?.address || '');
  const [phone, setPhone] = useState(business?.phone || '');
  const [contactEmail, setContactEmail] = useState(business?.contact_email || '');
  const [website, setWebsite] = useState(business?.website || '');
  const [hours, setHours] = useState(business?.hours || 'Mon-Fri: 8AM-6PM');
  const [logoUrl, setLogoUrl] = useState(business?.logo_url || '');

  if (!isOpen) return null;

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Normalize website URL with https://
      let normalizedWebsite = website.trim();
      if (normalizedWebsite && !normalizedWebsite.startsWith('http://') && !normalizedWebsite.startsWith('https://')) {
        normalizedWebsite = `https://${normalizedWebsite}`;
      }

      const updatedData = {
        name,
        category,
        description,
        address,
        phone,
        contact_email: contactEmail,
        website: normalizedWebsite,
        hours,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      };

      if (business?.id && !business.id.startsWith('mock')) {
        const bRef = doc(db, 'businesses', business.id);
        await updateDoc(bRef, updatedData);
      }

      onBusinessUpdated({
        ...business,
        ...updatedData
      });

      showToast({
        title: "✅ Business Profile Saved!",
        message: "Your storefront details, contact information, and website links have been updated.",
        icon: "🏪"
      });

      onClose();
    } catch (err) {
      console.error("Save business error:", err);
      showToast({
        title: "Save Failed",
        message: "Could not save business profile updates. Please try again.",
        icon: "⚠️"
      });
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
              GRIDPASS BUSINESS MANAGER
            </span>
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ff3b30]" /> Edit Business Storefront &amp; Venue
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

        {/* Form Body */}
        <form onSubmit={handleSaveBusiness} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Business / Shop Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
              placeholder="e.g. LoseyCo Software & Holdings"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Category / Tag</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900"
            >
              <option value="Official Sponsor & Shop">Official Sponsor &amp; Performance Shop</option>
              <option value="Motorsport Venue / Racetrack">Motorsport Venue / Racetrack</option>
              <option value="Parent Software HQ">Parent Software &amp; Tech HQ</option>
              <option value="Food Truck & Concessions">Food Truck &amp; Concessions</option>
              <option value="Detailing & Upfitting">Detailing &amp; Upfitting</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900"
              placeholder="Describe your performance tuning, dyno testing, track staging, or software services..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-600" /> Physical Address
              </label>
              <input 
                type="text" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                placeholder="Grayslake, IL"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" /> Phone Number
              </label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                placeholder="(555) 019-2831"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" /> External Website URL
              </label>
              <input 
                type="text" 
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                placeholder="loseyco.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" /> Operating Hours
              </label>
              <input 
                type="text" 
                value={hours}
                onChange={e => setHours(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                placeholder="Mon-Fri: 8AM-6PM"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Business Logo Image URL</label>
            <input 
              type="url" 
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
              placeholder="https://..."
            />
          </div>

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
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Storefront Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
