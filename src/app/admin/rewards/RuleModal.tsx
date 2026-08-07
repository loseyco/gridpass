'use client';

import React, { useState, useEffect } from 'react';

export interface RewardRule {
  id?: string;
  title: string;
  actionKey: string;
  points: number;
  category: string;
  requiresGps: boolean;
  geofenceRadiusMeters: number;
  requiresPhoto: boolean;
  requiresApproval: boolean;
  cooldownMinutes: number;
  oneTimeOnly?: boolean;
  badgeIcon?: string;
  active: boolean;
  description?: string;
}

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: RewardRule) => Promise<void>;
  initialRule?: RewardRule | null;
}

export default function RuleModal({ isOpen, onClose, onSave, initialRule }: RuleModalProps) {
  const [formData, setFormData] = useState<RewardRule>({
    title: '',
    actionKey: 'track_checkin',
    points: 5,
    category: 'Event',
    requiresGps: true,
    geofenceRadiusMeters: 500,
    requiresPhoto: false,
    requiresApproval: false,
    cooldownMinutes: 60,
    oneTimeOnly: false,
    badgeIcon: '🏆',
    active: true,
    description: '',
  });


  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialRule) {
      setFormData(initialRule);
    } else {
      setFormData({
        title: '',
        actionKey: 'track_checkin',
        points: 5,
        category: 'Event',
        requiresGps: true,
        geofenceRadiusMeters: 500,
        requiresPhoto: false,
        requiresApproval: false,
        cooldownMinutes: 60,
        active: true,
        description: '',
      });
    }
  }, [initialRule, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.actionKey.trim()) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving rule:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-neutral-200 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="font-black text-lg text-neutral-900 uppercase tracking-tight">
            {initialRule ? '✏️ Edit Reward Rule' : '➕ Create Reward Rule'}
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
              Rule Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Track Day GPS Check-In"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 focus:outline-none focus:border-[#ff3b30] font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Action Key *
              </label>
              <select
                value={formData.actionKey}
                onChange={(e) => setFormData({ ...formData, actionKey: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 font-bold"
              >
                <option value="achievement_join_gridpass">achievement_join_gridpass (Join Bonus)</option>
                <option value="track_checkin">track_checkin</option>
                <option value="spot_vehicle">spot_vehicle</option>
                <option value="state_sign">state_sign</option>
                <option value="dyno_proof">dyno_proof</option>
                <option value="like_photo">like_photo</option>
                <option value="comment_thread">comment_thread</option>
                <option value="qr_scan">qr_scan</option>
                <option value="custom_action">custom_action</option>
              </select>

            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Points Awarded *
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 font-bold text-base text-[#ff3b30]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 font-bold"
              >
                <option value="Event">Event</option>
                <option value="Spotting">Spotting</option>
                <option value="Community">Community</option>
                <option value="Verification">Verification</option>
                <option value="CRM B2B">CRM B2B</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                Anti-Spam Cooldown (Mins)
              </label>
              <input
                type="number"
                min="0"
                value={formData.cooldownMinutes}
                onChange={(e) => setFormData({ ...formData, cooldownMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-900 font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
            <p className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">
              Verification & Geofence Guardrails
            </p>

            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-bold text-neutral-800">Require GPS Geofence Check</span>
                <p className="text-[10px] text-neutral-500 font-normal">
                  User coordinates must fall within venue radius
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.requiresGps}
                onChange={(e) => setFormData({ ...formData, requiresGps: e.target.checked })}
                className="w-4 h-4 accent-[#ff3b30]"
              />
            </div>

            {formData.requiresGps && (
              <div className="pl-2 pt-1 border-t border-neutral-200">
                <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                  Geofence Radius Limit (Meters)
                </label>
                <input
                  type="number"
                  min="50"
                  max="10000"
                  step="50"
                  value={formData.geofenceRadiusMeters}
                  onChange={(e) => setFormData({ ...formData, geofenceRadiusMeters: parseInt(e.target.value) || 500 })}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg bg-white font-bold"
                />
              </div>
            )}

            <div className="flex items-center justify-between py-1 border-t border-neutral-200">
              <div>
                <span className="font-bold text-neutral-800">Require Photo Proof</span>
                <p className="text-[10px] text-neutral-500 font-normal">
                  User must upload camera photo
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.requiresPhoto}
                onChange={(e) => setFormData({ ...formData, requiresPhoto: e.target.checked })}
                className="w-4 h-4 accent-[#ff3b30]"
              />
            </div>

            <div className="flex items-center justify-between py-1 border-t border-neutral-200">
              <div>
                <span className="font-bold text-neutral-800">Manual Admin Review Required</span>
                <p className="text-[10px] text-neutral-500 font-normal">
                  Hold in pending queue before awarding points
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="w-4 h-4 accent-[#ff3b30]"
              />
            </div>

            <div className="flex items-center justify-between py-1 border-t border-neutral-200">
              <div>
                <span className="font-bold text-neutral-800">🏆 One-Time Achievement (Feat of Strength)</span>
                <p className="text-[10px] text-neutral-500 font-normal">
                  Can only be unlocked ONCE per user account (e.g. First Track Day, Garage Master)
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!formData.oneTimeOnly}
                onChange={(e) => setFormData({ ...formData, oneTimeOnly: e.target.checked })}
                className="w-4 h-4 accent-[#ff3b30]"
              />
            </div>
          </div>


          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 accent-[#ff3b30]"
              />
              <span>Rule Active Immediately</span>
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
              {saving ? 'Saving...' : initialRule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
