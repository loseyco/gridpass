'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';
import { logAgentExecutionTicket } from '@/lib/agent-logger';

export interface UserFeedbackItem {
  id: string;
  category: 'bug' | 'feature' | 'suggestion' | 'access';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  submitted_by_email: string;
  submitted_by_name?: string;
  page_url: string;
  page_route: string;
  status: 'PENDING_REVIEW' | 'APPROVED_FOR_DEV' | 'ROADMAP_IDEA' | 'DECLINED' | 'RESOLVED';
  created_at: string;
  promoted_ticket_number?: string;
  user_agent?: string;
}

const DEFAULT_FEEDBACK_ITEMS: UserFeedbackItem[] = [
  {
    id: 'fb_1001_marketplace_idea',
    category: 'feature',
    priority: 'high',
    title: 'Where can i buy one / Local Dealership Marketplace Search',
    description: 'Would be cool if we have a way to search marketplace local dealerships, partnered dealerships with gridpass, or ask the owner if they want to sell it :)',
    submitted_by_email: 'loseyp@gmail.com',
    submitted_by_name: 'PJ Losey',
    page_url: 'http://localhost:3000/v/61Nfxem05soZDU3burKz',
    page_route: '/v/61Nfxem05soZDU3burKz',
    status: 'PENDING_REVIEW',
    created_at: new Date().toISOString(),
  },
  {
    id: 'fb_1002_photo_uploader',
    category: 'suggestion',
    priority: 'medium',
    title: 'Multi-angle photo gallery upload for vehicle passports',
    description: 'Allow uploading engine bay, interior, and track setup photos directly from mobile Safari without compression artifacting.',
    submitted_by_email: 'marcus@racing.org',
    submitted_by_name: 'Marcus Vance',
    page_url: 'http://localhost:3000/dash/vehicles/edit',
    page_route: '/dash/vehicles/edit',
    status: 'ROADMAP_IDEA',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'fb_1003_gate_scan_sound',
    category: 'bug',
    priority: 'low',
    title: 'Audio feedback chime on physical RFID pass scan',
    description: 'Gate operators out in sunlight want a loud audio confirmation ping when an emblem pass is successfully scanned at the track gate.',
    submitted_by_email: 'dave@highplains.com',
    submitted_by_name: 'Ranger Dave',
    page_url: 'http://localhost:3000/scan',
    page_route: '/scan',
    status: 'APPROVED_FOR_DEV',
    promoted_ticket_number: 'TICK-1008',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function AdminFeedbackTriagePage() {
  const [items, setItems] = useState<UserFeedbackItem[]>(DEFAULT_FEEDBACK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState<UserFeedbackItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'user_feedback'), orderBy('created_at', 'desc')),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: UserFeedbackItem[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as UserFeedbackItem);
          });
          setItems(list);
        } else {
          setItems(DEFAULT_FEEDBACK_ITEMS);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('user_feedback listener fallback:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Filter items based on activeTab
  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'PENDING') return item.status === 'PENDING_REVIEW' || !item.status;
    if (activeTab === 'APPROVED') return item.status === 'APPROVED_FOR_DEV';
    if (activeTab === 'ROADMAP') return item.status === 'ROADMAP_IDEA';
    if (activeTab === 'DECLINED') return item.status === 'DECLINED';
    return true;
  });

  // Promote User Feedback to Active TODO Execution Ticket in agent_tickets
  const promoteToSubagentTicket = async (item: UserFeedbackItem) => {
    const ticketNum = `TICK-${Math.floor(2000 + Math.random() * 8000)}`;
    
    try {
      // 1. Log ticket in agent_tickets
      await logAgentExecutionTicket({
        ticket_number: ticketNum,
        agent_role: item.category === 'bug' ? 'site_auditor' : 'architect',
        title: `[USER ${item.category.toUpperCase()}] ${item.title}`,
        category: item.category === 'bug' ? 'ui_design' : 'feature',
        priority: item.priority || 'high',
        status: 'TODO',
        components_used: ['UserFeedbackTriage', item.page_route],
        files_modified: [item.page_route],
        issue_description: `User Feedback from ${item.submitted_by_email} on page ${item.page_route}: ${item.description}`,
        root_cause: `Promoted from Member Feedback Triage HQ by Super Admin.`,
        resolution_summary: 'Approved by Super Admin for AI Subagent development and backlog execution.',
        verification_proof: 'Pending subagent development and visual E2E verification.',
        sop_summary: `Approved user feature request/bug fix for ${item.title}.`,
        sop_steps: [
          `Inspect user feedback payload ${item.id} on route ${item.page_route}.`,
          `Implement architectural changes or bug fix requested by member ${item.submitted_by_email}.`,
          `Run npx tsc --noEmit and npm run test:headed to verify clean implementation.`,
          `Update ticket status to VERIFIED.`
        ],
      });

      // 2. Update status in user_feedback Firestore document
      try {
        await updateDoc(doc(db, 'user_feedback', item.id), {
          status: 'APPROVED_FOR_DEV',
          promoted_ticket_number: ticketNum,
        });
      } catch (e) {
        console.warn('Update user_feedback doc fallback:', e);
      }

      // 3. Update local state
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'APPROVED_FOR_DEV', promoted_ticket_number: ticketNum } : i
        )
      );

      setActionSuccess(`🚀 Promoted to Active Subagent Ticket ${ticketNum}!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to promote ticket:', err);
    }
  };

  // Mark Feedback as Roadmap Idea
  const markAsRoadmap = async (item: UserFeedbackItem) => {
    try {
      await updateDoc(doc(db, 'user_feedback', item.id), { status: 'ROADMAP_IDEA' }).catch(() => {});
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'ROADMAP_IDEA' } : i)));
      setActionSuccess('💡 Saved to Roadmap Wishlist!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to mark roadmap:', err);
    }
  };

  // Decline / Archive Feedback
  const declineFeedback = async (item: UserFeedbackItem) => {
    try {
      await updateDoc(doc(db, 'user_feedback', item.id), { status: 'DECLINED' }).catch(() => {});
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'DECLINED' } : i)));
      setActionSuccess('❌ Archived feedback submission.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to decline feedback:', err);
    }
  };

  const getStatusBadge = (status: UserFeedbackItem['status']) => {
    switch (status) {
      case 'PENDING_REVIEW':
      default:
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] uppercase rounded">⏳ PENDING REVIEW</span>;
      case 'APPROVED_FOR_DEV':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] uppercase rounded">🚀 APPROVED FOR DEV</span>;
      case 'ROADMAP_IDEA':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-black text-[10px] uppercase rounded">💡 ROADMAP IDEA</span>;
      case 'DECLINED':
        return <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-300 font-black text-[10px] uppercase rounded">❌ ARCHIVED</span>;
    }
  };

  const columns: ColumnDef<UserFeedbackItem>[] = [
    {
      key: 'created_at',
      label: 'SUBMITTED',
      render: (row) => (
        <span className="text-[11px] font-mono text-neutral-600 font-bold">
          {(row.created_at || '').split('T')[0]}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'TYPE',
      render: (row) => (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 border border-neutral-300 text-neutral-800">
          {row.category === 'bug' ? '🐛 BUG' : row.category === 'feature' ? '🚀 FEATURE' : row.category === 'suggestion' ? '💡 IDEA' : '🔒 ACCESS'}
        </span>
      ),
    },
    {
      key: 'submitted_by_email',
      label: 'SUBMITTED BY',
      render: (row) => (
        <div>
          <span className="font-black text-xs text-neutral-900 block">{row.submitted_by_name || 'Member'}</span>
          <span className="text-[10px] font-mono text-neutral-500">{row.submitted_by_email}</span>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'IDEA / BUG TITLE',
      render: (row) => (
        <div>
          <span className="font-black text-xs text-[#1c1c1e] block truncate max-w-sm">{row.title}</span>
          <code className="text-[9px] font-mono text-neutral-500 truncate max-w-xs block">{row.page_route}</code>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <div>
          {getStatusBadge(row.status)}
          {row.promoted_ticket_number && (
            <span className="text-[9px] font-mono font-bold text-[#ff3b30] block mt-0.5">
              🎟️ {row.promoted_ticket_number}
            </span>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = items.filter((i) => i.status === 'PENDING_REVIEW' || !i.status).length;
  const approvedCount = items.filter((i) => i.status === 'APPROVED_FOR_DEV').length;
  const roadmapCount = items.filter((i) => i.status === 'ROADMAP_IDEA').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">
              Member Ideas & Feature Request Triage HQ
            </h1>
          </div>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Review incoming feedback, bug reports, and feature requests submitted by drivers and members. One-click approval promotes items directly into active AI subagent execution tickets.
          </p>
        </div>

        {actionSuccess && (
          <div className="px-4 py-2 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-black uppercase animate-in fade-in">
            {actionSuccess}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Total Submissions</span>
          <span className="text-2xl font-black text-neutral-900">{items.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">⏳ Pending Triage</span>
          <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">🚀 Approved for Dev</span>
          <span className="text-2xl font-black text-emerald-600">{approvedCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">💡 Roadmap Ideas</span>
          <span className="text-2xl font-black text-purple-600">{roadmapCount}</span>
        </div>
      </div>

      {/* Main Table */}
      <ExcelWorksheetTable
        title="Member Feedback & Feature Intake Queue"
        data={filteredItems}
        columns={columns}
        idKey="id"
        filterCategories={[
          { label: 'All Submissions', key: 'all', count: items.length },
          { label: '⏳ Pending Triage', key: 'PENDING', count: pendingCount },
          { label: '🚀 Approved for Dev', key: 'APPROVED', count: approvedCount },
          { label: '💡 Roadmap Ideas', key: 'ROADMAP', count: roadmapCount },
          { label: '❌ Archived', key: 'DECLINED', count: items.filter((i) => i.status === 'DECLINED').length },
        ]}
        activeFilter={activeTab}
        onFilterChange={setActiveTab}
        searchPlaceholder="Search submitter email, title, or route..."
        loading={loading}
        actionRenderer={(row) => (
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => setSelectedItem(row)}
              className="text-[10px] font-bold uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded transition min-h-[44px] flex items-center justify-center"
            >
              Details 🔍
            </button>

            {row.status !== 'APPROVED_FOR_DEV' && (
              <button
                onClick={() => promoteToSubagentTicket(row)}
                className="text-[10px] font-black uppercase bg-[#ff3b30] hover:bg-[#bd2925] text-white px-3 py-1 rounded shadow-xs transition active:scale-95 whitespace-nowrap min-h-[44px] flex items-center justify-center gap-1"
                title="Promote item into an Active TODO Execution Ticket for AI Subagents"
              >
                <span>🚀 Approve & Create Ticket</span>
              </button>
            )}
          </div>
        )}
      />

      {/* Details Slide-Out Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full flex flex-col justify-between shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-200 font-sans">
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block font-bold">
                  FEEDBACK ID: {selectedItem.id}
                </span>
                <h2 className="font-black text-lg uppercase text-white mt-0.5">
                  {selectedItem.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="touch-target-44 text-neutral-400 hover:text-white font-bold active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedItem.status)}
                <span className="text-xs font-mono text-neutral-500">{selectedItem.created_at}</span>
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">Submitted By</span>
                <p className="text-sm font-black text-neutral-900">{selectedItem.submitted_by_name || 'Member'}</p>
                <p className="text-xs font-mono text-neutral-600">{selectedItem.submitted_by_email}</p>
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">Route / Page URL</span>
                <code className="text-xs font-mono font-bold text-neutral-900 block break-all">
                  {selectedItem.page_url}
                </code>
              </div>

              <div className="p-4 bg-neutral-900 text-white rounded-xl space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">Full Description / Request</span>
                <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                  {selectedItem.description}
                </p>
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-700 block">Triage Actions</span>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      promoteToSubagentTicket(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="w-full py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>🚀 Approve & Create Subagent Ticket</span>
                  </button>
                  <button
                    onClick={() => {
                      markAsRoadmap(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="w-full py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>💡 Save to Roadmap Wishlist</span>
                  </button>
                  <button
                    onClick={() => {
                      declineFeedback(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="w-full py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs uppercase tracking-wider rounded-xl transition active:scale-95 flex items-center justify-center"
                  >
                    <span>❌ Decline / Archive</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs uppercase rounded-xl transition active:scale-95"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
