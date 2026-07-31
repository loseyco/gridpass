'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, setDoc, doc, updateDoc } from 'firebase/firestore';
import { PartnerRequest, RequestCategory, RequestPriority, RequestStatus } from '@/lib/types/partner';

export default function PartnerRequestsPage() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState<RequestCategory>('feature_request');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [mrrImpact, setMrrImpact] = useState<number>(50);

  // Subscribe to live Firestore collection
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'partner_requests'),
      (snapshot) => {
        const docs: PartnerRequest[] = [];
        snapshot.forEach((docSnap) => {
          docs.push({ id: docSnap.id, ...docSnap.data() } as PartnerRequest);
        });
        
        if (docs.length > 0) {
          setRequests(docs);
        } else {
          // Fallback initial data if collection is completely empty
          setRequests([
            {
              id: 'req-101',
              created_at: '2026-07-29',
              created_by: 'Sales Partner',
              client_name: 'Nielsen Motorsports',
              title: 'Bulk CSV Inventory Upload',
              description: 'Client has 40+ power sports vehicles and wants to upload via CSV instead of adding one by one.',
              category: 'feature_request',
              priority: 'high',
              estimated_mrr_impact: 100,
              status: 'in_progress',
              dev_notes: 'Adding CSV import API endpoint in Phase 3.',
              target_release: 'v4.2',
            },
            {
              id: 'req-102',
              created_at: '2026-07-28',
              created_by: 'Sales Partner',
              client_name: 'Blackhawk Farms Raceway',
              title: 'Safari Digital Waiver Touch Canvas Clear Button',
              description: 'Clear button on signature canvas is offset on iPhone 14 Safari.',
              category: 'bug_report',
              priority: 'urgent',
              estimated_mrr_impact: 0,
              status: 'backlog',
              dev_notes: 'Will inspect canvas viewport bounds on iOS.',
            },
          ]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const reqId = `req-${Date.now()}`;
    const newReq: PartnerRequest = {
      id: reqId,
      created_at: new Date().toISOString().split('T')[0],
      created_by: 'Sales Partner',
      client_name: clientName || 'General Platform',
      title,
      description,
      category,
      priority,
      estimated_mrr_impact: Number(mrrImpact) || 0,
      status: 'backlog',
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'partner_requests', reqId), newReq);
    } catch (err) {
      console.warn('Saving locally, Firestore write pending auth context:', err);
    }

    setRequests((prev) => [newReq, ...prev.filter((r) => r.id !== reqId)]);
    setTitle('');
    setDescription('');
    setClientName('');
    setShowModal(false);
  };

  const updateStatus = async (id: string, newStatus: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      await updateDoc(doc(db, 'partner_requests', id), { status: newStatus });
    } catch (err) {
      console.warn('Updated status locally:', err);
    }
  };

  const getPriorityBadge = (p: RequestPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1c1c1e] uppercase tracking-tight">
              Feature Requests & Bug Backlog Hub
            </h1>
            <p className="text-xs text-neutral-600 font-medium mt-1">
              Direct collaboration line between Sales Partner and Developer to turn client requests into live features.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg transition shadow-sm"
          >
            + Log Request / Bug
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
              <h2 className="font-black text-sm uppercase text-[#1c1c1e]">
                Log Feature Request or Bug Report
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
                  placeholder="e.g. Add SMS appointment confirmation for Auto Shop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nielsen Motorsports"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    MRR Impact ($/mo)
                  </label>
                  <input
                    type="number"
                    value={mrrImpact}
                    onChange={(e) => setMrrImpact(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="client_customization">Client Customization</option>
                    <option value="sales_blocker">Sales Deal Blocker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
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
                  Description & Context
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what the client needs or what bug occurred..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs font-bold text-neutral-600 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ff3b30] text-white font-black text-xs uppercase px-4 py-2 rounded-lg"
                >
                  Log Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backlog List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-neutral-400 uppercase">
            Loading Live Backlog Tickets...
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base text-[#1c1c1e]">{req.title}</h3>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getPriorityBadge(
                        req.priority
                      )}`}
                    >
                      {req.priority}
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                      {req.category?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium mt-1">
                    Client: <span className="font-bold text-black">{req.client_name}</span> | Logged: {req.created_at}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {req.estimated_mrr_impact ? (
                    <span className="text-xs font-extrabold text-emerald-600">
                      +${req.estimated_mrr_impact}/mo MRR
                    </span>
                  ) : null}

                  {/* Status Dropdown */}
                  <select
                    value={req.status}
                    onChange={(e) => updateStatus(req.id, e.target.value as RequestStatus)}
                    className="text-xs font-extrabold uppercase px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded focus:outline-none"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_review">In Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="deployed">Deployed & Live</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                {req.description}
              </p>

              {req.dev_notes && (
                <div className="text-xs bg-sky-50 border border-sky-200 p-2.5 rounded-lg text-sky-950 flex items-start gap-2">
                  <span className="font-bold text-sky-700">🛠 Dev Note:</span>
                  <span>{req.dev_notes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
