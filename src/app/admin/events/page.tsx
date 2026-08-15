'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';

export interface AdminEvent {
  id: string;
  title: string;
  location_name: string;
  date_str: string;
  host_uid?: string;
  attendees_count?: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
}

type SortField = 'title' | 'location_name' | 'date_str' | 'status' | 'attendees_count' | 'id';
type SortOrder = 'asc' | 'desc';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [scrapedEvents, setScrapedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'events_list' | 'scraped_queue'>('events_list');
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);
  const [copiedClaimId, setCopiedClaimId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Filter, Search & Sort State
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date_str');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Inline Edit State
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'title' | 'location_name' | 'date_str' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add Event Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'events'),
      (snapshot) => {
        const list: AdminEvent[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AdminEvent);
        });
        setEvents(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Events listener fallback:', err);
        setLoading(false);
      }
    );

    const unsubScraped = onSnapshot(
      collection(db, 'scraped_events'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setScrapedEvents(list);
      },
      (err) => {
        console.warn('Scraped events listener fallback:', err);
      }
    );

    return () => {
      unsubscribe();
      unsubScraped();
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const saveInlineEdit = async (id: string, field: 'title' | 'location_name' | 'date_str') => {
    if (!editingCell) return;
    const valueToSave = editValue;

    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: valueToSave } : e))
    );
    setEditingCell(null);

    try {
      await setDoc(doc(db, 'events', id), { [field]: valueToSave }, { merge: true });
    } catch (err) {
      console.warn('Event inline edit saved locally:', err);
    }
  };

  const startInlineEdit = (id: string, field: 'title' | 'location_name' | 'date_str', currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || '');
  };

  const handleStatusChange = async (id: string, status: 'upcoming' | 'completed' | 'cancelled') => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );

    try {
      await setDoc(doc(db, 'events', id), { status }, { merge: true });
    } catch (err) {
      console.warn('Status updated locally:', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const eventId = `evt_${Date.now()}`;
    const newEvt: AdminEvent = {
      id: eventId,
      title: newTitle,
      location_name: newLocation || '',
      date_str: newDate || new Date().toISOString().split('T')[0],
      host_uid: 'admin',
      attendees_count: 1,
      status: 'upcoming',
      created_at: new Date().toISOString().split('T')[0],
    };

    setEvents((prev) => [newEvt, ...prev]);

    try {
      await setDoc(doc(db, 'events', eventId), newEvt, { merge: true });
    } catch (err) {
      console.warn('Event saved locally:', err);
    }

    setNewTitle('');
    setNewLocation('');
    setShowAddModal(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedEvents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedEvents.map((e) => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (activeFilter !== 'all' && e.status !== activeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title?.toLowerCase().includes(q) ||
        e.location_name?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aVal: any = a[sortField] || '';
    let bVal: any = b[sortField] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const exportCSV = () => {
    const headers = ['Event ID', 'Event Title', 'Location', 'Date', 'Status', 'Attendees'];
    const rows = sortedEvents.map((e) => [
      e.id,
      `"${e.title || ''}"`,
      `"${e.location_name || ''}"`,
      e.date_str || '',
      e.status || 'upcoming',
      e.attendees_count || 1,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_events_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOutreachCopy = async (item: any) => {
    const eventSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const outreachMessage = `Hey! I saw your upcoming car show "${item.title}" and set up a free interactive Event Hub for you on Gridpass: https://gridpass.app/events/${eventSlug}

Gridpass is a free tool built for local car communities.

🚗 For Drivers:
You build your digital vehicle spec sheet once, and you can use it to join multiple local meets. It automatically outputs a clean, printable windshield spec poster with a QR code, so spectators at the show can scan it to see your full build log, modification list, and dyno stats.

📅 For Event Managers:
You get a free hub to coordinate your show, map out staging/parking groups, see who is coming in real-time, and easily share event schedules and details with your drivers.

Feel free to share this hub link in your main page or discussion group so drivers can start listing their builds!`;

    try {
      await navigator.clipboard.writeText(outreachMessage);
      await setDoc(doc(db, 'scraped_events', item.id), { status: 'copied' }, { merge: true });
      window.open(item.target_url, '_blank', 'width=1200,height=800,noopener,noreferrer');
      if (item.source_url) {
        window.open(item.source_url, '_blank', 'width=1200,height=800,noopener,noreferrer');
      }
    } catch (err) {
      console.warn("Failed to copy outreach: ", err);
    }
  };

  const handleApproveEvent = async (item: any) => {
    const eventSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newEvent = {
      id: eventSlug,
      title: item.title,
      location_name: item.location_name || '',
      physical_address: item.physical_address || item.location_name || '',
      date_str: item.date_str,
      start_date: item.start_date || `${item.date_str}T09:00`,
      end_date: item.end_date || `${item.date_str}T12:00`,
      description: item.description || '',
      banner_url: item.banner_url || '',
      latitude: item.latitude || null,
      longitude: item.longitude || null,
      official_event_url: item.target_url || '',
      claim_token: Math.random().toString(36).substring(2, 10).toUpperCase(),
      host_uid: 'admin',
      host_name: 'Gridpass Organizer',
      attendees_count: 1,
      status: 'upcoming',
      created_at: new Date().toISOString().split('T')[0],
      allow_vehicles: true,
      allow_spectators: true,
      allow_vendors: true
    };

    try {
      await setDoc(doc(db, 'events', eventSlug), newEvent, { merge: true });
      await setDoc(doc(db, 'scraped_events', item.id), { status: 'approved' }, { merge: true });
    } catch (err) {
      console.warn("Failed to approve event: ", err);
    }
  };

  const handleRejectEvent = async (id: string) => {
    try {
      await setDoc(doc(db, 'scraped_events', id), { status: 'rejected' }, { merge: true });
    } catch (err) {
      console.warn("Failed to reject event: ", err);
    }
  };

  const handleCopyProdUrl = async (id: string) => {
    const prodUrl = `https://gridpass.app/events/${id}`;
    try {
      await navigator.clipboard.writeText(prodUrl);
      setCopiedEventId(id);
      setTimeout(() => setCopiedEventId(null), 2000);
    } catch (err) {
      console.warn("Failed to copy URL:", err);
    }
  };

  const handleCopyClaimLink = async (evt: any) => {
    const token = evt.claim_token || 'CLAIMTOKEN';
    const claimUrl = `https://gridpass.app/events/${evt.id}/claim?token=${token}`;
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopiedClaimId(evt.id);
      setTimeout(() => setCopiedClaimId(null), 2000);
    } catch (err) {
      console.warn("Failed to copy claim link:", err);
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          onClick={() => setViewTab('events_list')}
          className={`px-4 py-2 min-h-[44px] flex items-center justify-center text-xs font-black uppercase tracking-wider border-b-2 transition ${
            viewTab === 'events_list'
              ? 'border-[#ff3b30] text-[#ff3b30]'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          📅 Active Events
        </button>
        <button
          onClick={() => setViewTab('scraped_queue')}
          className={`px-4 py-2 min-h-[44px] flex items-center justify-center text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
            viewTab === 'scraped_queue'
              ? 'border-[#ff3b30] text-[#ff3b30]'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          🔍 Scraped Triage Queue
          {scrapedEvents.filter(e => e.status !== 'approved' && e.status !== 'rejected').length > 0 && (
            <span className="bg-[#ff3b30] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {scrapedEvents.filter(e => e.status !== 'approved' && e.status !== 'rejected').length}
            </span>
          )}
        </button>
      </div>

      {viewTab === 'events_list' ? (
        <>
          {/* Excel Toolbar */}
          <div className="bg-white border border-neutral-300 rounded-lg p-2.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`font-black uppercase px-2.5 py-1 min-h-[44px] flex items-center justify-center rounded transition ${
                  activeFilter === 'all'
                    ? 'bg-[#ff3b30] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All ({events.length})
              </button>
              <button
                onClick={() => setActiveFilter('upcoming')}
                className={`font-black uppercase px-2.5 py-1 min-h-[44px] flex items-center justify-center rounded transition ${
                  activeFilter === 'upcoming'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className={`font-black uppercase px-2.5 py-1 min-h-[44px] flex items-center justify-center rounded transition ${
                  activeFilter === 'completed'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveFilter('cancelled')}
                className={`font-black uppercase px-2.5 py-1 min-h-[44px] flex items-center justify-center rounded transition ${
                  activeFilter === 'cancelled'
                    ? 'bg-neutral-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Cancelled
              </button>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search title, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-52 text-xs font-bold p-1.5 min-h-[44px] bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
              />
              <button
                onClick={exportCSV}
                className="text-xs font-extrabold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 px-2.5 py-1.5 min-h-[44px] flex items-center justify-center rounded transition"
              >
                Export CSV
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-3 py-1.5 min-h-[44px] flex items-center justify-center rounded transition shadow-sm whitespace-nowrap"
              >
                + Create Event
              </button>
            </div>
          </div>

          {/* Create Event Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                  <h2 className="font-black text-sm uppercase text-[#1c1c1e]">
                    Create Admin Event
                  </h2>
                  <button onClick={() => setShowAddModal(false)} className="text-neutral-400 font-bold min-h-[44px] min-w-[44px] flex items-center justify-center">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                      Event Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Event title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full text-xs font-bold p-2 min-h-[44px] bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                      Raceway / Location
                    </label>
                    <input
                      type="text"
                      placeholder="Raceway / City name..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full text-xs font-bold p-2 min-h-[44px] bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full text-xs font-bold p-2 min-h-[44px] bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-3 py-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold text-neutral-600 uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-1.5 min-h-[44px] flex items-center justify-center rounded"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FULL EXCEL SHEET TABLE */}
          <div className="bg-white border border-neutral-300 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-neutral-800 select-none h-11">
                    <th className="p-2 border-r border-neutral-800 w-10 text-center">
                      <div className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === sortedEvents.length}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                        />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('title')}
                      className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                    >
                      <div className="min-h-[44px] flex items-center">
                        EVENT TITLE {sortField === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('location_name')}
                      className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                    >
                      <div className="min-h-[44px] flex items-center">
                        LOCATION {sortField === 'location_name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('date_str')}
                      className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                    >
                      <div className="min-h-[44px] flex items-center">
                        DATE {sortField === 'date_str' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('status')}
                      className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                    >
                      <div className="min-h-[44px] flex items-center">
                        STATUS {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('attendees_count')}
                      className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap text-center"
                    >
                      <div className="min-h-[44px] flex items-center justify-center">
                        ATTENDEES {sortField === 'attendees_count' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </div>
                    </th>

                    <th className="p-2 text-right whitespace-nowrap">
                      <div className="min-h-[44px] flex items-center justify-end">
                        ID
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                        Loading Events Sheet...
                      </td>
                    </tr>
                  ) : sortedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                        No Events Found
                      </td>
                    </tr>
                  ) : (
                    sortedEvents.map((evt, idx) => {
                      const isSelected = selectedIds.includes(evt.id);
                      const isEditingTitle = editingCell?.id === evt.id && editingCell?.field === 'title';
                      const isEditingLocation = editingCell?.id === evt.id && editingCell?.field === 'location_name';
                      const isEditingDate = editingCell?.id === evt.id && editingCell?.field === 'date_str';

                      return (
                        <tr
                          key={evt.id}
                          className={`transition ${
                            isSelected
                              ? 'bg-red-50/80'
                              : idx % 2 === 0
                              ? 'bg-white hover:bg-neutral-100/80'
                              : 'bg-neutral-50 hover:bg-neutral-100/80'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-2 border-r border-neutral-200 text-center">
                            <div className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(evt.id)}
                                className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                              />
                            </div>
                          </td>

                          {/* Title */}
                          <td
                            onDoubleClick={() => startInlineEdit(evt.id, 'title', evt.title || '')}
                            className="p-2 border-r border-neutral-200 font-bold text-neutral-900 whitespace-nowrap cursor-pointer hover:bg-neutral-100/60"
                          >
                            {isEditingTitle ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(evt.id, 'title')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(evt.id, 'title');
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full bg-white border border-[#ff3b30] p-0.5 min-h-[44px] text-xs font-mono rounded focus:outline-none"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5 min-h-[44px]">
                                <span>{evt.title}</span>
                                <Link
                                  href={`/events/${evt.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  className="text-neutral-400 hover:text-[#ff3b30] transition-colors inline-flex items-center min-h-[44px] px-1"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            )}
                          </td>

                          {/* Location */}
                          <td
                            onDoubleClick={() => startInlineEdit(evt.id, 'location_name', evt.location_name || '')}
                            className="p-2 border-r border-neutral-200 text-neutral-700 whitespace-nowrap cursor-pointer hover:bg-neutral-100/60"
                          >
                            {isEditingLocation ? (
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(evt.id, 'location_name')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(evt.id, 'location_name');
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full bg-white border border-[#ff3b30] p-0.5 min-h-[44px] text-xs font-mono rounded focus:outline-none"
                              />
                            ) : (
                              <div className="min-h-[44px] flex items-center">
                                <span>{evt.location_name || ''}</span>
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td
                            onDoubleClick={() => startInlineEdit(evt.id, 'date_str', evt.date_str || '')}
                            className="p-2 border-r border-neutral-200 text-neutral-700 whitespace-nowrap cursor-pointer hover:bg-neutral-100/60"
                          >
                            {isEditingDate ? (
                              <input
                                type="date"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(evt.id, 'date_str')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(evt.id, 'date_str');
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="bg-white border border-[#ff3b30] p-0.5 min-h-[44px] text-xs font-mono rounded focus:outline-none"
                              />
                            ) : (
                              <div className="min-h-[44px] flex items-center">
                                <span>{evt.date_str || 'TBD'}</span>
                              </div>
                            )}
                          </td>

                          {/* Status Dropdown */}
                          <td className="p-2 border-r border-neutral-200 whitespace-nowrap">
                            <div className="min-h-[44px] flex items-center">
                              <select
                                value={evt.status || 'upcoming'}
                                onChange={(e) => handleStatusChange(evt.id, e.target.value as any)}
                                className="bg-neutral-100 text-neutral-900 border border-neutral-300 font-sans font-bold text-[10px] uppercase p-1 min-h-[44px] rounded focus:outline-none"
                              >
                                <option value="upcoming">UPCOMING</option>
                                <option value="completed">COMPLETED</option>
                                <option value="cancelled">CANCELLED</option>
                              </select>
                            </div>
                          </td>

                          {/* Attendees */}
                          <td className="p-2 border-r border-neutral-200 font-bold text-center text-neutral-900 whitespace-nowrap">
                            <div className="min-h-[44px] flex items-center justify-center">
                              {evt.attendees_count || 1}
                            </div>
                          </td>

                          {/* ID */}
                          <td className="p-2 text-right font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                            <div className="min-h-[44px] flex items-center justify-end gap-1.5">
                              <span>{evt.id}</span>
                              <button
                                onClick={() => handleCopyProdUrl(evt.id)}
                                title="Copy Production URL"
                                className={`px-2 min-h-[44px] inline-flex items-center justify-center rounded transition text-[10px] font-black uppercase ${
                                  copiedEventId === evt.id
                                    ? 'bg-neutral-900 text-white border border-neutral-900'
                                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300'
                                }`}
                              >
                                {copiedEventId === evt.id ? 'Copied' : 'Copy'}
                              </button>
                              <button
                                onClick={() => handleCopyClaimLink(evt)}
                                title="Copy Magic Claim Link for Promoter Onboarding"
                                className={`px-2 min-h-[44px] inline-flex items-center justify-center rounded transition text-[10px] font-black uppercase ${
                                  copiedClaimId === evt.id
                                    ? 'bg-neutral-900 text-white border border-neutral-900'
                                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300'
                                }`}
                              >
                                {copiedClaimId === evt.id ? 'Claim Copied' : 'Claim'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-neutral-900 text-white p-2.5 border-t border-neutral-800 flex items-center justify-between text-[10px] font-extrabold uppercase font-sans">
              <span>
                Rows: {sortedEvents.length} of {events.length} Total Events
              </span>
              <span className="text-neutral-400">
                Double-click title, location, or date to edit inline
              </span>
            </div>
          </div>
        </>
      ) : (
        /* Scraped Triage Queue View */
        <div className="bg-white border border-neutral-300 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-neutral-800 select-none h-11">
                  <th className="p-2 border-r border-neutral-800"><div className="min-h-[44px] flex items-center">Event Details</div></th>
                  <th className="p-2 border-r border-neutral-800"><div className="min-h-[44px] flex items-center">Date &amp; Location</div></th>
                  <th className="p-2 border-r border-neutral-800"><div className="min-h-[44px] flex items-center">Outreach Status</div></th>
                  <th className="p-2 border-r border-neutral-800"><div className="min-h-[44px] flex items-center">Target Page</div></th>
                  <th className="p-2"><div className="min-h-[44px] flex items-center">Actions</div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {scrapedEvents.filter(item => item.status !== 'approved' && item.status !== 'rejected').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                      No Scraped Shows Pending Triage
                    </td>
                  </tr>
                ) : (
                  scrapedEvents.filter(item => item.status !== 'approved' && item.status !== 'rejected').map((item, idx) => {
                    const isExpanded = expandedItemId === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          className={idx % 2 === 0 ? 'bg-white hover:bg-neutral-100/80' : 'bg-neutral-50 hover:bg-neutral-100/80'}
                        >
                          <td className="p-2.5 border-r border-neutral-200 font-bold text-neutral-900">
                            <button
                              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                              className="w-full text-left font-bold text-neutral-900 cursor-pointer min-h-[44px] flex items-center justify-between gap-2 focus:outline-none"
                            >
                              <span>{item.title}</span>
                              <span className="text-[10px] text-neutral-500 font-normal shrink-0">
                                {isExpanded ? '▲ Hide' : '▼ Show Details'}
                              </span>
                            </button>
                          </td>
                          <td className="p-2.5 border-r border-neutral-200 text-neutral-700 font-medium">
                            <div className="min-h-[44px] flex flex-col justify-center">
                              <div className="font-bold">{item.date_str}</div>
                              <div className="text-[10px] text-neutral-500">{item.location_name}</div>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-neutral-200 text-neutral-700">
                            <div className="min-h-[44px] flex items-center">
                              <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                                item.status === 'copied' 
                                  ? 'bg-neutral-900 border border-neutral-950 text-white' 
                                  : 'bg-neutral-100 border border-neutral-200 text-neutral-500'
                              }`}>
                                {item.status || 'pending'}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-neutral-200 font-bold">
                            <a 
                              href={item.target_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-neutral-600 hover:text-[#ff3b30] hover:underline inline-flex items-center gap-1 text-[10px] min-h-[44px]"
                            >
                              View Source
                            </a>
                          </td>
                          <td className="p-2.5">
                            <div className="min-h-[44px] flex items-center gap-2">
                              <button
                                onClick={() => handleOutreachCopy(item)}
                                className="text-[10px] font-black uppercase bg-neutral-900 hover:bg-black text-white px-2.5 min-h-[44px] rounded transition flex items-center justify-center"
                              >
                                📋 Copy &amp; Open
                              </button>
                              <button
                                onClick={() => handleApproveEvent(item)}
                                className="text-[10px] font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-2.5 min-h-[44px] rounded transition flex items-center justify-center"
                              >
                                🚀 Approve
                              </button>
                              <button
                                onClick={() => handleRejectEvent(item.id)}
                                className="text-[10px] font-bold uppercase text-neutral-400 hover:text-[#ff3b30] px-2 min-h-[44px] transition flex items-center justify-center"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-neutral-50 border-b border-neutral-200">
                            <td colSpan={5} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                                <div className="flex flex-col gap-2">
                                  <div className="font-bold text-neutral-800 uppercase tracking-wider text-[10px]">Flyer Preview</div>
                                  {item.banner_url ? (
                                    <img
                                      src={item.banner_url}
                                      alt={item.title || "Flyer Preview"}
                                      className="border border-neutral-200 rounded-xl max-h-64 object-cover shadow-sm w-full"
                                    />
                                  ) : (
                                    <div className="border border-dashed border-neutral-300 rounded-xl p-6 text-center text-neutral-400 bg-white">
                                      No flyer banner preview available
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-3">
                                  <div>
                                    <div className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] mb-1">Geocoding &amp; Address</div>
                                    <div className="bg-white p-2.5 border border-neutral-200 rounded-lg font-mono text-[11px] leading-relaxed text-neutral-700">
                                      <div>Latitude: {item.latitude !== undefined && item.latitude !== null ? item.latitude : 'N/A'}</div>
                                      <div>Longitude: {item.longitude !== undefined && item.longitude !== null ? item.longitude : 'N/A'}</div>
                                      <div className="mt-1.5 pt-1.5 border-t border-neutral-100 font-sans text-xs">
                                        <span className="font-bold text-neutral-600">Physical Address:</span> {item.physical_address || 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] mb-1">Parsed Event Description</div>
                                    <div className="whitespace-pre-line overflow-y-auto max-h-40 font-mono text-[11px] bg-neutral-100/50 p-3 border border-neutral-200 rounded-lg text-neutral-800">
                                      {item.description || 'No description parsed.'}
                                    </div>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      onClick={() => window.open(item.target_url, '_blank', 'width=1200,height=800,noopener,noreferrer')}
                                      className="inline-flex items-center justify-center min-h-[44px] px-4 font-bold text-white bg-[#ff3b30] hover:bg-[#bd2925] rounded-lg transition text-xs select-none cursor-pointer"
                                    >
                                      Go to Event Source →
                                    </button>
                                    {item.source_url && (
                                      <button
                                        onClick={() => window.open(item.source_url, '_blank', 'width=1200,height=800,noopener,noreferrer')}
                                        className="inline-flex items-center justify-center min-h-[44px] px-4 font-bold text-neutral-900 hover:bg-neutral-100 border border-neutral-300 bg-white rounded-lg transition text-xs select-none cursor-pointer"
                                      >
                                        Original Source Link
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
