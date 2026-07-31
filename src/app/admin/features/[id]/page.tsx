'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AdminFeature, FeatureNote, FeatureBug, FeatureAccessLevel, FeatureStatus } from '@/lib/types/admin';

export default function AdminFeatureDetailPage() {
  const params = useParams();
  const featureId = params.id as string;

  const [feature, setFeature] = useState<AdminFeature | null>(null);
  const [loading, setLoading] = useState(true);

  // New Note State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [authorName, setAuthorName] = useState('Zach');

  // New Bug State
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugSeverity, setBugSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  useEffect(() => {
    if (!featureId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'features', featureId),
      (docSnap) => {
        if (docSnap.exists()) {
          setFeature({ id: docSnap.id, ...docSnap.data() } as AdminFeature);
        } else {
          // Fallback initial feature state
          setFeature({
            id: featureId,
            name: featureId.replace(/[-_]/g, ' '),
            route_path: `/admin/${featureId}`,
            category: 'auto_shop',
            status: 'live',
            is_page_live: true,
            access_level: 'admins_only',
            version: 'v4.1.0',
            wanted_count: 1,
            priority: 'medium',
            description: 'Feature details, route path configuration, and audience entitlement rules.',
            notes: [],
            bugs: [],
            last_updated_at: '2026-07-29',
            created_at: new Date().toISOString().split('T')[0],
          });
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Feature detail listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [featureId]);

  // Live Page Controller Controls
  const togglePageLive = async () => {
    if (!feature) return;
    const nextLive = !feature.is_page_live;
    const nextStatus: FeatureStatus = nextLive ? 'live' : 'beta';
    const today = new Date().toISOString().split('T')[0];

    const updated = { ...feature, is_page_live: nextLive, status: nextStatus, last_updated_at: today };
    setFeature(updated);

    try {
      await setDoc(doc(db, 'features', featureId), { is_page_live: nextLive, status: nextStatus, last_updated_at: today }, { merge: true });
    } catch (err) {
      console.warn('Live state updated locally:', err);
    }
  };

  const updateAccessLevel = async (access_level: FeatureAccessLevel) => {
    if (!feature) return;
    const today = new Date().toISOString().split('T')[0];

    const updated = { ...feature, access_level, last_updated_at: today };
    setFeature(updated);

    try {
      await setDoc(doc(db, 'features', featureId), { access_level, last_updated_at: today }, { merge: true });
    } catch (err) {
      console.warn('Access level updated locally:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !feature) return;

    const newNote: FeatureNote = {
      id: `note_${Date.now()}`,
      author: authorName || 'Team Admin',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: newNoteContent,
    };

    const updatedNotes = [...(feature.notes || []), newNote];
    setFeature({ ...feature, notes: updatedNotes });

    try {
      await setDoc(doc(db, 'features', featureId), { notes: updatedNotes }, { merge: true });
    } catch (err) {
      console.warn('Note saved locally:', err);
    }

    setNewNoteContent('');
  };

  const handleAddBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDescription.trim() || !feature) return;

    const newBug: FeatureBug = {
      id: `bug_${Date.now()}`,
      reported_by: authorName || 'Team Admin',
      created_at: new Date().toISOString().split('T')[0],
      severity: bugSeverity,
      description: bugDescription,
      resolved: false,
    };

    const updatedBugs = [...(feature.bugs || []), newBug];
    setFeature({ ...feature, bugs: updatedBugs });

    try {
      await setDoc(doc(db, 'features', featureId), { bugs: updatedBugs }, { merge: true });
    } catch (err) {
      console.warn('Bug saved locally:', err);
    }

    setBugDescription('');
    setShowBugModal(false);
  };

  const toggleBugResolved = async (bugId: string) => {
    if (!feature) return;

    const updatedBugs = (feature.bugs || []).map((b) =>
      b.id === bugId ? { ...b, resolved: !b.resolved } : b
    );
    setFeature({ ...feature, bugs: updatedBugs });

    try {
      await setDoc(doc(db, 'features', featureId), { bugs: updatedBugs }, { merge: true });
    } catch (err) {
      console.warn('Bug status updated locally:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-neutral-300 rounded-xl p-8 text-center text-xs font-bold text-neutral-400 uppercase">
        Loading Feature Page Controller...
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="bg-white border border-neutral-300 rounded-xl p-8 text-center text-xs font-bold text-neutral-500 uppercase space-y-2">
        <p>Feature Controller Not Found</p>
        <Link href="/admin/features" className="text-[#ff3b30] underline">
          ← Back to Features Engine
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Top Header & Page Controller Box */}
      <div className="bg-white border border-neutral-300 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/admin/features" className="text-xs font-extrabold text-[#ff3b30] hover:underline">
                ← Features Sheet
              </Link>
              <span className="text-neutral-300">|</span>
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                ID: {feature.id}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1e] uppercase tracking-tight mt-1">
              {feature.name}
            </h1>
            {feature.route_path && (
              <p className="text-xs font-mono font-bold text-neutral-600 mt-0.5">
                Route: <code className="bg-neutral-100 p-1 rounded border border-neutral-200 text-[#1c1c1e]">{feature.route_path}</code>
              </p>
            )}
          </div>

          {/* Jump Button */}
          {feature.route_path && !feature.route_path.includes('[') && (
            <Link
              href={feature.route_path}
              target="_blank"
              className="bg-[#1c1c1e] hover:bg-black text-white font-black text-xs uppercase px-3.5 py-2 rounded-lg transition shadow-sm whitespace-nowrap text-center"
            >
              Open Page Route ↗
            </Link>
          )}
        </div>

        {/* Live Feature Control Panel Matrix */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-black text-[#1c1c1e] uppercase tracking-wider">
            ⚡ Live Feature & Page Access Controller
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Is Page Live Toggle */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1">
              <span className="block text-[10px] font-black text-neutral-500 uppercase">
                Page Online Status
              </span>
              <button
                onClick={togglePageLive}
                className={`w-full text-xs font-black uppercase px-3 py-1.5 rounded transition ${
                  feature.is_page_live !== false
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
              >
                {feature.is_page_live !== false ? '● LIVE ONLINE' : '✖ OFFLINE / MAINTENANCE'}
              </button>
            </div>

            {/* Who Can See It Dropdown */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1">
              <span className="block text-[10px] font-black text-neutral-500 uppercase">
                Audience Access Level
              </span>
              <select
                value={feature.access_level || 'public'}
                onChange={(e) => updateAccessLevel(e.target.value as FeatureAccessLevel)}
                className="w-full text-xs font-bold p-1.5 bg-neutral-50 border border-neutral-300 rounded uppercase font-sans focus:outline-none"
              >
                <option value="public">All Public</option>
                <option value="members">Members Only</option>
                <option value="gold">Gold Supporters</option>
                <option value="business_owners">Business Owners</option>
                <option value="admins_only">Admins Only</option>
              </select>
            </div>

            {/* Last Code Update Date */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1">
              <span className="block text-[10px] font-black text-neutral-500 uppercase">
                Last Feature Update
              </span>
              <div className="font-mono text-xs font-bold text-neutral-800 p-1.5 bg-neutral-50 border border-neutral-200 rounded">
                📅 {feature.last_updated_at || feature.created_at || '2026-07-29'}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-neutral-600 font-medium">
            {feature.description}
          </p>
        </div>
      </div>

      {/* Grid Layout: Discussion Thread + Bug Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Ideas & Discussion Thread */}
        <div className="bg-white border border-neutral-300 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
            <h2 className="font-black text-xs uppercase text-[#1c1c1e] tracking-wider">
              💬 Internal Feature Discussion Thread
            </h2>
            <span className="text-[11px] font-bold text-neutral-400">
              {feature.notes?.length || 0} Note{(feature.notes?.length || 0) === 1 ? '' : 's'}
            </span>
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="space-y-2">
            <div className="flex gap-2">
              <select
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
              >
                <option value="Zach">Zach</option>
                <option value="PJ">PJ</option>
                <option value="Developer">Developer</option>
              </select>
              <input
                type="text"
                required
                placeholder="Share an idea, requirement, or note..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="flex-1 text-xs font-medium p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
              />
              <button
                type="submit"
                className="bg-[#ff3b30] text-white font-black text-xs uppercase px-3 py-2 rounded shadow-sm whitespace-nowrap"
              >
                + Post
              </button>
            </div>
          </form>

          {/* Notes List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pt-1">
            {!feature.notes || feature.notes.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-4 border border-dashed border-neutral-200 rounded-lg">
                No discussion notes posted yet. Add one above!
              </p>
            ) : (
              feature.notes.map((note) => (
                <div key={note.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase">
                    <span className="text-[#1c1c1e] font-extrabold">{note.author}</span>
                    <span>{note.created_at}</span>
                  </div>
                  <p className="text-xs text-neutral-800 font-medium">{note.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Reported Bugs Section */}
        <div className="bg-white border border-neutral-300 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
            <h2 className="font-black text-xs uppercase text-[#1c1c1e] tracking-wider">
              🐞 Feature Bug Tracker ({feature.bugs?.length || 0})
            </h2>
            <button
              onClick={() => setShowBugModal(true)}
              className="text-xs font-black uppercase bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded transition shadow-sm"
            >
              + Report Bug
            </button>
          </div>

          {/* Bug Modal */}
          {showBugModal && (
            <form onSubmit={handleAddBug} className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-rose-900 mb-1">
                  Bug Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe the bug on this feature/page..."
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  className="w-full text-xs font-medium p-2 bg-white border border-rose-300 rounded focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <select
                  value={bugSeverity}
                  onChange={(e) => setBugSeverity(e.target.value as any)}
                  className="text-xs font-bold p-1.5 bg-white border border-rose-300 rounded"
                >
                  <option value="low">Low Severity</option>
                  <option value="medium">Medium Severity</option>
                  <option value="high">High Severity</option>
                  <option value="critical">Critical Showstopper</option>
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBugModal(false)}
                    className="text-xs font-bold text-neutral-600 uppercase px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 text-white font-black text-xs uppercase px-3 py-1 rounded"
                  >
                    Save Bug
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Bugs List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {!feature.bugs || feature.bugs.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-4 border border-dashed border-neutral-200 rounded-lg">
                No bugs reported for this feature!
              </p>
            ) : (
              feature.bugs.map((bug) => (
                <div
                  key={bug.id}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                    bug.resolved
                      ? 'bg-neutral-50 border-neutral-200 opacity-60'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          bug.severity === 'critical'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {bug.severity}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {bug.reported_by} • {bug.created_at}
                      </span>
                    </div>
                    <p className={`text-xs font-medium ${bug.resolved ? 'line-through text-neutral-500' : 'text-neutral-900'}`}>
                      {bug.description}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleBugResolved(bug.id)}
                    className={`text-[9px] font-black uppercase px-2 py-1 rounded transition ${
                      bug.resolved
                        ? 'bg-neutral-200 text-neutral-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {bug.resolved ? 'RESOLVED' : 'MARK RESOLVED'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
