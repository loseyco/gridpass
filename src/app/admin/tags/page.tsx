'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { PhysicalTagRecord, DistributionMethod, TagTargetType } from '@/lib/types/admin';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';

// Real-Time Physical Tag Control Center

export default function AdminTagsPage() {
  const [tags, setTags] = useState<PhysicalTagRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<PhysicalTagRecord | null>(null);

  // Edit / Re-route Modal State
  const [editTargetType, setEditTargetType] = useState<TagTargetType>('intake_join');
  const [editTargetDest, setEditTargetDest] = useState('/join');
  const [editMethod, setEditMethod] = useState<DistributionMethod>('handout');
  const [editPartnerName, setEditPartnerName] = useState('');

  // Subscribe to physical_tags collection directly from Cloud Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'physical_tags'),
      (snapshot) => {
        const list: PhysicalTagRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as PhysicalTagRecord);
        });
        setTags(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Physical tags listener error:', err);
        setTags([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Save Dynamic Target Re-route
  const handleSaveTagTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTag) return;

    const updated = {
      ...selectedTag,
      target_type: editTargetType,
      target_destination: editTargetDest,
      distribution_method: editMethod,
      partner_business_name: editPartnerName || selectedTag.partner_business_name || '',
      last_scanned_at: new Date().toISOString(),
    };

    setTags((prev) => prev.map((t) => (t.id === selectedTag.id ? updated : t)));

    try {
      await setDoc(doc(db, 'physical_tags', selectedTag.id), updated, { merge: true });
    } catch (err) {
      console.warn('Tag target updated locally:', err);
    }

    setSelectedTag(null);
  };

  const getMethodBadge = (method: DistributionMethod) => {
    switch (method) {
      case 'car_drop':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] uppercase rounded">🏎️ CAR DROP</span>;
      case 'lanyard':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-black text-[9px] uppercase rounded">🏷️ LANYARD HANG</span>;
      case 'sticker':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 font-black text-[9px] uppercase rounded">🚽 STICKER</span>;
      case 'dealership_intake':
      case 'service_bay':
      case 'sales_floor':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-300 font-black text-[9px] uppercase rounded">🏬 B2B DEALERSHIP</span>;
      case 'handout':
      default:
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 font-black text-[9px] uppercase rounded">🎴 HANDOUT CARD</span>;
    }
  };

  const filteredTags = tags.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'handout' && t.distribution_method === 'handout') return true;
    if (activeTab === 'car_drop' && t.distribution_method === 'car_drop') return true;
    if (activeTab === 'lanyard' && t.distribution_method === 'lanyard') return true;
    if (activeTab === 'sticker' && t.distribution_method === 'sticker') return true;
    if (activeTab === 'dealership' && (t.distribution_method.includes('dealership') || t.distribution_method.includes('sales') || t.distribution_method.includes('service'))) return true;
    return false;
  });

  const totalScansSum = tags.reduce((acc, t) => acc + (t.total_scans || 0), 0);
  const totalJoinedSum = tags.reduce((acc, t) => acc + (t.members_joined_count || 0), 0);
  const conversionRate = totalScansSum > 0 ? ((totalJoinedSum / totalScansSum) * 100).toFixed(1) : '0.0';

  const columns: ColumnDef<PhysicalTagRecord>[] = [
    {
      key: 'tag_id',
      label: 'CARD / TAG ID',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-xs text-[#ff3b30] bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded">
            #{row.tag_id}
          </span>
          <div>
            <span className="font-bold text-neutral-900 text-xs block">{row.title || `Tag #${row.tag_id}`}</span>
            {row.partner_business_name && (
              <span className="text-[9px] font-mono text-emerald-700 font-bold block">{row.partner_business_name}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'distribution_method',
      label: 'DISTRIBUTION TYPE',
      render: (row) => getMethodBadge(row.distribution_method),
    },
    {
      key: 'target_destination',
      label: 'TARGET DESTINATION',
      render: (row) => (
        <div>
          <span className="text-[10px] font-black uppercase text-neutral-500 block">{row.target_type}</span>
          <code className="text-xs font-mono font-bold text-neutral-900 block truncate max-w-[180px]">
            {row.target_destination}
          </code>
        </div>
      ),
    },
    {
      key: 'total_scans',
      label: 'SCANS',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-black text-xs text-neutral-900">{row.total_scans || 0}</span>
      ),
    },
    {
      key: 'members_joined_count',
      label: 'JOINED',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-black text-xs text-emerald-600">{row.members_joined_count || 0}</span>
      ),
    },
    {
      key: 'last_scanned_at',
      label: 'LAST SCANNED',
      render: (row) => (
        <span className="text-[10px] font-mono text-neutral-500">
          {(row.last_scanned_at || row.created_at || '').split('T')[0]}
        </span>
      ),
    },
  ];

  // CSV Export
  const exportCSV = () => {
    const headers = ['Tag ID', 'Title', 'Distribution Method', 'Target Type', 'Destination', 'Total Scans', 'Members Joined', 'Partner Business'];
    const rows = filteredTags.map((t) => [
      t.tag_id,
      `"${t.title || ''}"`,
      t.distribution_method,
      t.target_type,
      t.target_destination,
      t.total_scans || 0,
      t.members_joined_count || 0,
      `"${t.partner_business_name || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_physical_tags_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header Card */}
      <div className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏷️</span>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">
              Physical QR Tag & Referral Intake HQ
            </h1>
          </div>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Master control center for managing thousands of printed invitation cards, lanyards, car drops, stickers, and B2B dealership machine tags (e.g. Nielsen&apos;s Enterprises).
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/join?tag=250"
            target="_blank"
            className="px-3.5 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
          >
            📱 Test Card #250 Intake →
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Physical Tags Tracked</span>
          <span className="text-2xl font-black text-neutral-900">{tags.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Total Physical Scans</span>
          <span className="text-2xl font-black text-[#ff3b30]">{totalScansSum}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Members Joined</span>
          <span className="text-2xl font-black text-emerald-600">{totalJoinedSum}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">Conversion Rate</span>
          <span className="text-2xl font-black text-blue-600">{conversionRate}%</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider block">B2B Dealership Tags</span>
          <span className="text-2xl font-black text-purple-600">
            {tags.filter((t) => t.distribution_method.includes('dealership') || t.partner_business_id).length}
          </span>
        </div>
      </div>

      {/* Main ExcelWorksheetTable */}
      <ExcelWorksheetTable
        title="Gridpass Physical Card & Tag Registry"
        data={filteredTags}
        columns={columns}
        idKey="id"
        filterCategories={[
          { label: 'All Tags', key: 'all', count: tags.length },
          { label: '🎴 Handout Cards', key: 'handout', count: tags.filter((t) => t.distribution_method === 'handout').length },
          { label: '🏎️ Car Drops', key: 'car_drop', count: tags.filter((t) => t.distribution_method === 'car_drop').length },
          { label: '🏷️ Lanyard Hangs', key: 'lanyard', count: tags.filter((t) => t.distribution_method === 'lanyard').length },
          { label: '🚽 Guerrilla Stickers', key: 'sticker', count: tags.filter((t) => t.distribution_method === 'sticker').length },
          { label: '🏬 B2B Dealerships', key: 'dealership', count: tags.filter((t) => t.distribution_method.includes('dealership') || t.partner_business_id).length },
        ]}
        activeFilter={activeTab}
        onFilterChange={setActiveTab}
        searchPlaceholder="Search Card #, title, partner business, or destination..."
        onExportCSV={exportCSV}
        loading={loading}
        actionRenderer={(row) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedTag(row);
                setEditTargetType(row.target_type);
                setEditTargetDest(row.target_destination);
                setEditMethod(row.distribution_method);
                setEditPartnerName(row.partner_business_name || '');
              }}
              className="text-[10px] font-black uppercase bg-neutral-900 hover:bg-black text-white px-2.5 py-1 rounded shadow-xs transition"
            >
              ⚡ Bind / Re-route ↗
            </button>
          </div>
        )}
      />

      {/* Tag Edit & Re-route Modal */}
      {selectedTag && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl font-sans">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h2 className="font-black text-sm uppercase text-neutral-900 flex items-center gap-2">
                  <span>⚡ DYNAMIC TAG CONTROLLER</span>
                  <span className="font-mono text-[#ff3b30]">#{selectedTag.tag_id}</span>
                </h2>
                <p className="text-[10px] text-neutral-500 font-mono">Re-route physical card destination & persona lifecycle rules.</p>
              </div>
              <button onClick={() => setSelectedTag(null)} className="text-neutral-400 font-bold hover:text-neutral-900">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTagTarget} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Distribution Method</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as DistributionMethod)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none"
                >
                  <option value="handout">🎴 In-Person Business Card Handout</option>
                  <option value="car_drop">🏎️ Car Drop (Windshield Wiper / Interior)</option>
                  <option value="lanyard">🏷️ Rearview Mirror Lanyard Hang</option>
                  <option value="sticker">🚽 Guerrilla Sticker (Porta-potty / Venue Stall)</option>
                  <option value="dealership_intake">🏬 B2B Dealership Machine Intake (Nielsen&apos;s)</option>
                  <option value="service_bay">🔧 B2B Dealership Service Bay</option>
                  <option value="sales_floor">🏷️ B2B Dealership Sales Floor</option>
                  <option value="shop_stack">📦 Auto Shop Counter Stack</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Target Persona Type</label>
                <select
                  value={editTargetType}
                  onChange={(e) => setEditTargetType(e.target.value as TagTargetType)}
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none"
                >
                  <option value="intake_join">🌐 Default /join Intake & Signup</option>
                  <option value="vehicle">🏎️ Vehicle Passport Spec Sheet</option>
                  <option value="business">🏢 Business / Vendor Exhibit</option>
                  <option value="event">🏁 Event Hub & Gate Check-in</option>
                  <option value="driver">👤 Driver Card & Resume</option>
                  <option value="dealership_service">🔧 Dealership Service Log & Work Orders</option>
                  <option value="dealership_sales">🏬 Dealership Sales Floor Spec & Price Alert</option>
                  <option value="custom_url">🔗 Custom URL Redirect</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">Target Destination Path / URL</label>
                <input
                  type="text"
                  required
                  value={editTargetDest}
                  onChange={(e) => setEditTargetDest(e.target.value)}
                  placeholder="/join or /v/corvette-z06"
                  className="w-full text-xs font-mono font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-700 mb-1">B2B Partner Business Name (Optional)</label>
                <input
                  type="text"
                  value={editPartnerName}
                  onChange={(e) => setEditPartnerName(e.target.value)}
                  placeholder="e.g. Nielsen's Enterprises (Lake Villa, IL)"
                  className="w-full text-xs font-bold p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="px-3 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold uppercase rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm"
                >
                  Save Target Route ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
