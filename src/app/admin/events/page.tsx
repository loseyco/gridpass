'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [loading, setLoading] = useState(true);

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

    return () => unsubscribe();
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
      location_name: newLocation || 'Regional Circuit',
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

  return (
    <div className="space-y-3 font-sans">
      {/* Excel Toolbar */}
      <div className="bg-white border border-neutral-300 rounded-lg p-2.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'all'
                ? 'bg-[#ff3b30] text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveFilter('cancelled')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
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
            className="w-full sm:w-52 text-xs font-bold p-1.5 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:border-[#ff3b30]"
          />
          <button
            onClick={exportCSV}
            className="text-xs font-extrabold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 px-2.5 py-1.5 rounded transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-3 py-1.5 rounded transition shadow-sm whitespace-nowrap"
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
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 font-bold">
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
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
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
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
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
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-neutral-600 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-1.5 rounded"
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
              <tr className="bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-neutral-800 select-none">
                <th className="p-2 border-r border-neutral-800 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === sortedEvents.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                  />
                </th>

                <th
                  onClick={() => handleSort('title')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  EVENT TITLE {sortField === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('location_name')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  LOCATION {sortField === 'location_name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('date_str')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  DATE {sortField === 'date_str' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  STATUS {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('attendees_count')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap text-center"
                >
                  ATTENDEES {sortField === 'attendees_count' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th className="p-2 text-right whitespace-nowrap">ID</th>
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
                    No Events Staged
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
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(evt.id)}
                          className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                        />
                      </td>

                      {/* Title */}
                      <td
                        onDoubleClick={() => startInlineEdit(evt.id, 'title', evt.title || '')}
                        className="p-2 border-r border-neutral-200 font-bold text-neutral-900 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
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
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{evt.title}</span>
                        )}
                      </td>

                      {/* Location */}
                      <td
                        onDoubleClick={() => startInlineEdit(evt.id, 'location_name', evt.location_name || '')}
                        className="p-2 border-r border-neutral-200 text-neutral-700 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
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
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{evt.location_name || 'Regional Circuit'}</span>
                        )}
                      </td>

                      {/* Date */}
                      <td
                        onDoubleClick={() => startInlineEdit(evt.id, 'date_str', evt.date_str || '')}
                        className="p-2 border-r border-neutral-200 text-neutral-700 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
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
                            className="bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{evt.date_str || 'TBD'}</span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-2 border-r border-neutral-200 whitespace-nowrap">
                        <select
                          value={evt.status || 'upcoming'}
                          onChange={(e) => handleStatusChange(evt.id, e.target.value as any)}
                          className="bg-neutral-100 text-neutral-900 border border-neutral-300 font-sans font-bold text-[10px] uppercase p-1 rounded focus:outline-none"
                        >
                          <option value="upcoming">UPCOMING</option>
                          <option value="completed">COMPLETED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                      </td>

                      {/* Attendees */}
                      <td className="p-2 border-r border-neutral-200 font-bold text-center text-neutral-900 whitespace-nowrap">
                        {evt.attendees_count || 1}
                      </td>

                      {/* ID */}
                      <td className="p-2 text-right font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                        {evt.id}
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
            Rows: {sortedEvents.length} of {events.length} Staged Events
          </span>
          <span className="text-neutral-400">
            Double-click title, location, or date to edit inline
          </span>
        </div>
      </div>
    </div>
  );
}
