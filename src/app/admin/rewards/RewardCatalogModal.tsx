'use client';

import React, { useState, useEffect } from 'react';

export interface RewardCatalogItem {
  id?: string;
  title: string;
  pointsCost: number;
  rewardType: 'badge' | 'coupon' | 'physical_perk' | 'status_tier';
  badgeIcon: string;
  description: string;
  active: boolean;
  totalRedeemed?: number;
}

interface RewardCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: RewardCatalogItem) => Promise<void>;
  initialItem?: RewardCatalogItem | null;
}

export default function RewardCatalogModal({ isOpen, onClose, onSave, initialItem }: RewardCatalogModalProps) {
  const [formData, setFormData] = useState<RewardCatalogItem>({
    title: '',
    pointsCost: 50,
    rewardType: 'badge',
    badgeIcon: '🏆',
    description: '',
    active: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setFormData(initialItem);
    } else {
      setFormData({
        title: '',
        pointsCost: 50,
        rewardType: 'badge',
        badgeIcon: '🏆',
        description: '',
        active: true,
      });
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving perk catalog item:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-neutral-200 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="font-black text-lg text-neutral-900 uppercase tracking-tight">
            {initialItem ? '✏️ Edit Catalog Perk' : '🎁 Create Catalog Perk'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 font-black text-xl px-2"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-neutral-700">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Perk / Reward Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. VIP Paddock Pass Badge"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Badge Icon
              </label>
              <input
                type="text"
                required
                placeholder="🏆"
                value={formData.badgeIcon}
                onChange={(e) => setFormData({ ...formData, badgeIcon: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-center text-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Points Cost *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.pointsCost}
                onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 font-bold text-base text-[#ff3b30]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Reward Type
              </label>
              <select
                value={formData.rewardType}
                onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 font-bold"
              >
                <option value="badge">Badge</option>
                <option value="coupon">Discount</option>
                <option value="physical_perk">Pass / Physical</option>
                <option value="status_tier">VIP Status</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Description / Unlock Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Explain how the driver redeems or displays this perk..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 font-medium"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 accent-[#ff3b30]"
              />
              <span>Available in Catalog</span>
            </label>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 font-bold hover:bg-neutral-100 transition text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#ff3b30] text-white font-black hover:bg-[#bd2925] transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialItem ? 'Update Perk' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
