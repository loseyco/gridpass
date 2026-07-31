'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { PartnerRequest, RequestCategory, RequestPriority, RequestStatus } from '@/lib/types/partner';

type FilterStatus = 'all' | 'backlog' | 'in_progress' | 'deployed';
type SortField = 'title' | 'client_name' | 'priority' | 'status' | 'estimated_mrr_impact' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter, Search & Sort State
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Inline Editing State
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'title' | 'client_name' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Row Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState<RequestCategory>('feature_request');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [mrrImpact, setMrrImpact] = useState<number>(50);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'partner_requests'),
      (snapshot) => {
        const docs: PartnerRequest[] = [];
        snapshot.forEach((docSnap) => {
          docs.push({ id: docSnap.id, ...docSnap.data() } as PartnerRequest);
        });
        setRequests(docs);
        setLoading(false);
      },
      (err) => {
        console.warn('Requests listener fallback:', err);
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

  const saveInlineEdit = async (id: string, field: 'title' | 'client_name') => {
    if (!editingCell) return;
    const valueToSave = editValue;

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: valueToSave } : r))
    );
    setEditingCell(null);

    try {
      await setDoc(doc(db, 'partner_requests', id), { [field]: valueToSave }, { merge: true });
    } catch (err) {
      console.warn('Inline edit saved locally:', err);
    }
  };

  const startInlineEdit = (id: string, field: 'title' | 'client_name', currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || '');
  };

  const updateStatus = async (id: string, newStatus: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      await setDoc(doc(db, 'partner_requests', id), { status: newStatus }, { merge: true });
    } catch (err) {
      console.warn('Status updated locally:', err);
    }
  };

  const updatePriority = async (id: string, newPriority: RequestPriority) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, priority: newPriority } : r))
    );

    try {
      await setDoc(doc(db, 'partner_requests', id), { priority: newPriority }, { merge: true });
    } catch (err) {
      console.warn('Priority updated locally:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const reqId = `req-${Date.now()}`;
    const newReq: PartnerRequest = {
      id: reqId,
      created_at: new Date().toISOString().split('T')[0],
      created_by: 'Admin',
      client_name: clientName || 'General Platform',
      title,
      description,
      category,
      priority,
      estimated_mrr_impact: Number(mrrImpact) || 0,
      status: 'backlog',
    };

    setRequests((prev) => [newReq, ...prev.filter((r) => r.id !== reqId)]);

    try {
      await setDoc(doc(db, 'partner_requests', reqId), newReq, { merge: true });
    } catch (err) {
      console.warn('Ticket saved locally:', err);
    }

    setTitle('');
    setDescription('');
    setClientName('');
    setShowModal(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedRequests.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'backlog' && r.status !== 'backlog') return false;
    if (activeFilter === 'in_progress' && r.status !== 'in_progress') return false;
    if (activeFilter === 'deployed' && r.status !== 'deployed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title?.toLowerCase().includes(q) ||
        r.client_name?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let aVal: any = a[sortField] || '';
    let bVal: any = b[sortField] || '';

    if (sortField === 'estimated_mrr_impact') {
      aVal = a.estimated_mrr_impact || 0;
      bVal = b.estimated_mrr_impact || 0;
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Ticket Title', 'Client Name', 'Category', 'Priority', 'Status', 'MRR Impact ($)'];
    const rows = sortedRequests.map((r) => [
      r.id,
      `"${r.title || ''}"`,
      `"${r.client_name || ''}"`,
      r.category || 'feature_request',
      r.priority || 'medium',
      r.status || 'backlog',
      r.estimated_mrr_impact || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_backlog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const backlogCount = requests.filter((r) => r.status === 'backlog').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const deployedCount = requests.filter((r) => r.status === 'deployed').length;

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
            All ({requests.length})
          </button>
          <button
            onClick={() => setActiveFilter('backlog')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'backlog'
                ? 'bg-[#1c1c1e] text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Backlog ({backlogCount})
          </button>
          <button
            onClick={() => setActiveFilter('in_progress')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setActiveFilter('deployed')}
            className={`font-black uppercase px-2.5 py-1 rounded transition ${
              activeFilter === 'deployed'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Deployed ({deployedCount})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search tickets, client..."
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
            onClick={() => setShowModal(true)}
            className="text-xs font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-3 py-1.5 rounded transition shadow-sm whitespace-nowrap"
          >
            + Log Ticket
          </button>
        </div>
      </div>

      {/* Log Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">
                Log Feature Request or Bug
              </h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Ticket Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add SMS appointment confirmation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nielsen Motorsports"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    MRR Impact ($)
                  </label>
                  <input
                    type="number"
                    value={mrrImpact}
                    onChange={(e) => setMrrImpact(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  >
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="client_customization">Customization</option>
                    <option value="sales_blocker">Sales Blocker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ticket details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-medium p-2 bg-neutral-50 border border-neutral-300 rounded focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-neutral-600 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-1.5 rounded"
                >
                  Save Ticket
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
                    checked={selectedIds.length > 0 && selectedIds.length === sortedRequests.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                  />
                </th>

                <th
                  onClick={() => handleSort('title')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  TICKET TITLE {sortField === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('client_name')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  CLIENT {sortField === 'client_name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('priority')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  PRIORITY {sortField === 'priority' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap"
                >
                  STATUS {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th
                  onClick={() => handleSort('estimated_mrr_impact')}
                  className="p-2 border-r border-neutral-800 cursor-pointer hover:bg-neutral-800 transition whitespace-nowrap text-right"
                >
                  MRR IMPACT {sortField === 'estimated_mrr_impact' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                </th>

                <th className="p-2 text-right whitespace-nowrap">ID</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    Loading Backlog Sheet...
                  </td>
                </tr>
              ) : sortedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-bold text-neutral-400 uppercase font-sans">
                    No Tickets Found
                  </td>
                </tr>
              ) : (
                sortedRequests.map((req, idx) => {
                  const isSelected = selectedIds.includes(req.id);
                  const isEditingTitle = editingCell?.id === req.id && editingCell?.field === 'title';
                  const isEditingClient = editingCell?.id === req.id && editingCell?.field === 'client_name';

                  return (
                    <tr
                      key={req.id}
                      className={`transition ${
                        isSelected
                          ? 'bg-red-50/80'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-neutral-100/80'
                          : 'bg-neutral-50 hover:bg-neutral-100/80'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-2 border-r border-neutral-200 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(req.id)}
                          className="w-3.5 h-3.5 accent-[#ff3b30] cursor-pointer"
                        />
                      </td>

                      {/* Ticket Title (Inline Edit) */}
                      <td
                        onDoubleClick={() => startInlineEdit(req.id, 'title', req.title || '')}
                        className="p-2 border-r border-neutral-200 font-bold text-neutral-900 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingTitle ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(req.id, 'title')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(req.id, 'title');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{req.title}</span>
                        )}
                      </td>

                      {/* Client Name (Inline Edit) */}
                      <td
                        onDoubleClick={() => startInlineEdit(req.id, 'client_name', req.client_name || '')}
                        className="p-2 border-r border-neutral-200 text-neutral-700 whitespace-nowrap cursor-pointer hover:bg-yellow-50/60"
                      >
                        {isEditingClient ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(req.id, 'client_name')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(req.id, 'client_name');
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full bg-yellow-100 border border-yellow-400 p-0.5 text-xs font-mono rounded focus:outline-none"
                          />
                        ) : (
                          <span>{req.client_name || 'General Platform'}</span>
                        )}
                      </td>

                      {/* Priority Dropdown */}
                      <td className="p-2 border-r border-neutral-200 whitespace-nowrap">
                        <select
                          value={req.priority || 'medium'}
                          onChange={(e) => updatePriority(req.id, e.target.value as RequestPriority)}
                          className="bg-neutral-100 text-neutral-900 border border-neutral-300 font-sans font-bold text-[10px] uppercase p-1 rounded focus:outline-none"
                        >
                          <option value="low">LOW</option>
                          <option value="medium">MEDIUM</option>
                          <option value="high">HIGH</option>
                          <option value="urgent">URGENT</option>
                        </select>
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-2 border-r border-neutral-200 whitespace-nowrap">
                        <select
                          value={req.status || 'backlog'}
                          onChange={(e) => updateStatus(req.id, e.target.value as RequestStatus)}
                          className="bg-neutral-100 text-neutral-900 border border-neutral-300 font-sans font-bold text-[10px] uppercase p-1 rounded focus:outline-none"
                        >
                          <option value="backlog">BACKLOG</option>
                          <option value="in_review">IN REVIEW</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="deployed">DEPLOYED</option>
                          <option value="closed">CLOSED</option>
                        </select>
                      </td>

                      {/* MRR Impact */}
                      <td className="p-2 border-r border-neutral-200 text-right font-bold text-emerald-600 whitespace-nowrap">
                        +${req.estimated_mrr_impact || 0}/mo
                      </td>

                      {/* ID */}
                      <td className="p-2 text-right font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                        {req.id}
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
            Rows: {sortedRequests.length} of {requests.length} Backlog Tickets
          </span>
          <span className="text-neutral-400">
            Double-click title or client to edit inline
          </span>
        </div>
      </div>
    </div>
  );
}
