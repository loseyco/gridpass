'use client';

import React, { useEffect, useState } from 'react';
import { 
  fetchMembershipTiers, 
  saveMembershipTiers, 
  DEFAULT_MEMBERSHIP_TIERS, 
  MembershipTierConfig 
} from '@/lib/actions/membershipTiers';
import { 
  Crown, 
  Plus, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  ShieldCheck, 
  Sparkles,
  Palette
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';

export default function AdminMembershipTiersPage() {
  const { showToast } = useToast();
  const [tiers, setTiers] = useState<MembershipTierConfig[]>(DEFAULT_MEMBERSHIP_TIERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New tier form state
  const [newTierName, setNewTierName] = useState('');
  const [newTierCode, setNewTierCode] = useState('');
  const [newTierIcon, setNewTierIcon] = useState('🎖️');
  const [newBorderColor, setNewBorderColor] = useState('#ff3b30');
  const [newTextColor, setNewTextColor] = useState('#ff3b30');
  const [newBgColor, setNewBgColor] = useState('#fef2f2');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchMembershipTiers();
      setTiers(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    const success = await saveMembershipTiers(tiers);
    setSaving(false);
    if (success) {
      showToast({
        title: 'Membership Tiers Saved',
        message: 'Updated membership tier badges and color schemes live in Firestore.',
        icon: '✅'
      });
    } else {
      showToast({
        title: 'Save Failed',
        message: 'Could not save tier updates. Please check Firestore permissions.',
        icon: '⚠️'
      });
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all membership tiers to default system presets?')) {
      setTiers(DEFAULT_MEMBERSHIP_TIERS);
      showToast({
        title: 'Reset to Defaults',
        message: 'Restored default Founder, Gold, Pro, and Silver member presets.',
        icon: '🔄'
      });
    }
  };

  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierName.trim() || !newTierCode.trim()) {
      showToast({
        title: 'Missing Fields',
        message: 'Please provide both a tier name and a unique identifier code.',
        icon: '⚠️'
      });
      return;
    }

    const cleanCode = newTierCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (tiers.some(t => t.code === cleanCode)) {
      showToast({
        title: 'Duplicate Code',
        message: `A tier with code "${cleanCode}" already exists.`,
        icon: '⚠️'
      });
      return;
    }

    const newTier: MembershipTierConfig = {
      id: `tier-${Date.now()}`,
      name: newTierName.trim(),
      code: cleanCode,
      icon: newTierIcon || '🎖️',
      borderColor: newBorderColor || '#ff3b30',
      textColor: newTextColor || '#ff3b30',
      bgColor: newBgColor || '#fef2f2',
      description: newDescription.trim() || 'Custom Passport Tier',
      isSystem: false
    };

    setTiers([...tiers, newTier]);
    setNewTierName('');
    setNewTierCode('');
    setNewDescription('');

    showToast({
      title: 'Tier Added',
      message: `Added new membership rank "${newTier.name}". Remember to click "Save All Tiers"!`,
      icon: '✅'
    });
  };

  const handleDeleteTier = (id: string) => {
    const target = tiers.find(t => t.id === id);
    if (target?.isSystem) {
      showToast({
        title: 'System Tier Protected',
        message: 'Core system tiers (Founder, Gold, Pro, Member) cannot be deleted.',
        icon: '⚠️'
      });
      return;
    }

    setTiers(tiers.filter(t => t.id !== id));
    showToast({
      title: 'Tier Removed',
      message: 'Removed tier from configuration draft.',
      icon: '🗑️'
    });
  };

  const handleUpdateTierField = (id: string, field: keyof MembershipTierConfig, value: string) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Header Bar */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-mono font-black text-[#ff3b30] uppercase tracking-widest flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-[#ff3b30]" /> ADMIN CONTROL PANEL
          </span>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-neutral-900 tracking-tight">
            Membership Tier Badges &amp; Styling
          </h1>
          <p className="text-xs font-mono font-medium text-neutral-500 max-w-2xl">
            Configure member ranks (*Founder, Gold Member, Pro Member, Silver Member*), badge icons, border colors, text colors, and background styling displayed on printable passes &amp; user profiles.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" /> Reset Defaults
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-md shadow-red-500/10 cursor-pointer min-h-[44px]"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Tiers</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Live Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tiers.map((tier) => (
          <div 
            key={tier.id}
            className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-5 relative"
          >
            {/* Top Row Header & Live Badge Preview */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                  CODE: {tier.code} {tier.isSystem && '• CORE SYSTEM TIER'}
                </span>
                <h3 className="text-lg font-black uppercase text-neutral-900 tracking-tight">
                  {tier.name}
                </h3>
              </div>

              {/* Live Badge Preview Box */}
              <div className="shrink-0">
                <span 
                  className="text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-md border flex items-center gap-1 shadow-sm"
                  style={{
                    borderColor: tier.borderColor,
                    color: tier.textColor,
                    backgroundColor: tier.bgColor
                  }}
                >
                  <span>{tier.icon}</span>
                  <span>{tier.name.toUpperCase()}</span>
                </span>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Tier Display Name</label>
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => handleUpdateTierField(tier.id, 'name', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Badge Emoji / Icon</label>
                <input
                  type="text"
                  value={tier.icon}
                  onChange={(e) => handleUpdateTierField(tier.id, 'icon', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Border Outline Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tier.borderColor}
                    onChange={(e) => handleUpdateTierField(tier.id, 'borderColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={tier.borderColor}
                    onChange={(e) => handleUpdateTierField(tier.id, 'borderColor', e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Text &amp; Label Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tier.textColor}
                    onChange={(e) => handleUpdateTierField(tier.id, 'textColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={tier.textColor}
                    onChange={(e) => handleUpdateTierField(tier.id, 'textColor', e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tier.bgColor}
                    onChange={(e) => handleUpdateTierField(tier.id, 'bgColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={tier.bgColor}
                    onChange={(e) => handleUpdateTierField(tier.id, 'bgColor', e.target.value)}
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Tier Description</label>
                <input
                  type="text"
                  value={tier.description}
                  onChange={(e) => handleUpdateTierField(tier.id, 'description', e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-400"
                />
              </div>
            </div>

            {!tier.isSystem && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleDeleteTier(tier.id)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Custom Tier
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Custom Tier Panel */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-extrabold text-[#ff3b30] uppercase tracking-widest block">
            CREATE CUSTOM RANK
          </span>
          <h2 className="text-xl font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#ff3b30]" /> Add New Membership Tier
          </h2>
        </div>

        <form onSubmit={handleAddTier} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Tier Name</label>
            <input
              type="text"
              placeholder="e.g. Vendor VIP"
              value={newTierName}
              onChange={(e) => setNewTierName(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Code Identifier</label>
            <input
              type="text"
              placeholder="e.g. vendor-vip"
              value={newTierCode}
              onChange={(e) => setNewTierCode(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Icon / Emoji</label>
            <input
              type="text"
              placeholder="e.g. 🎪"
              value={newTierIcon}
              onChange={(e) => setNewTierIcon(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Border Outline Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newBorderColor}
                onChange={(e) => setNewBorderColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-neutral-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={newBorderColor}
                onChange={(e) => setNewBorderColor(e.target.value)}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-neutral-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Text &amp; Label Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newTextColor}
                onChange={(e) => setNewTextColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-neutral-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={newTextColor}
                onChange={(e) => setNewTextColor(e.target.value)}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-neutral-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newBgColor}
                onChange={(e) => setNewBgColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-neutral-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={newBgColor}
                onChange={(e) => setNewBgColor(e.target.value)}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-neutral-900"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Description</label>
            <input
              type="text"
              placeholder="e.g. Official Food Truck & Exhibitor Pass"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-400"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              <Plus className="w-4 h-4 text-[#ff3b30]" /> Add Membership Rank
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
