'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, addDoc, query, orderBy, setDoc, doc } from 'firebase/firestore';
import { INITIAL_PLATFORM_CHANGELOGS } from '@/lib/seed/platformSeedData';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';

export type ChangelogCategory = 'feature' | 'bugfix' | 'design' | 'security' | 'refactor';

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  category: ChangelogCategory;
  description: string;
  timestamp: string;
  author: string;
  route_affected?: string;
}

export default function AdminChangelogPage() {
  const [logs, setLogs] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Modal State
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [version, setVersion] = useState('v4.2.0');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChangelogCategory>('feature');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('antigravity');
  const [routeAffected, setRouteAffected] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-seed initial platform release logs if empty
  const seedChangelogs = async () => {
    try {
      for (const logItem of INITIAL_PLATFORM_CHANGELOGS) {
        const id = `log_${logItem.version.replace('.', '_')}_${logItem.category}_${Date.now()}`;
        await setDoc(doc(db, 'changelogs', id), logItem, { merge: true });
      }
    } catch (err) {
      console.error('Failed to seed initial changelogs:', err);
    }
  };

  // Live real-time listener for changelogs collection with seamless code merge
  useEffect(() => {
    const q = query(collection(db, 'changelogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ChangelogEntry[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ChangelogEntry);
        });

        // Merge any code-defined changelogs that aren't yet in Firestore
        INITIAL_PLATFORM_CHANGELOGS.forEach((codeLog, idx) => {
          const exists = list.some(
            (l) => l.version === codeLog.version && l.title === codeLog.title
          );
          if (!exists) {
            list.unshift({ id: `code_${codeLog.version}_${idx}`, ...codeLog });
          }
        });

        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setLogs(list);
        setLoading(false);
      },
      (err) => {
        setLogs(INITIAL_PLATFORM_CHANGELOGS.map((item, idx) => ({ id: `init_${idx}`, ...item })));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleInlineSave = async (id: string, key: string, newValue: any) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [key]: newValue } : l))
    );

    try {
      await setDoc(doc(db, 'changelogs', id), { [key]: newValue }, { merge: true });
    } catch (err) {}
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'changelogs'), {
        version: version.trim() || 'v4.2.0',
        title: title.trim(),
        category,
        description: description.trim(),
        author: author.trim() || 'antigravity',
        route_affected: routeAffected.trim() || undefined,
        timestamp: new Date().toISOString(),
      });

      setTitle('');
      setDescription('');
      setRouteAffected('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to publish changelog entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Version', 'Category', 'Title', 'Description', 'Author', 'Route Affected', 'Timestamp'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.version,
      l.category,
      `"${l.title || ''}"`,
      `"${l.description || ''}"`,
      l.author,
      l.route_affected || '',
      l.timestamp,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gridpass_changelogs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<ChangelogEntry>[] = [
    {
      key: 'version',
      label: 'VERSION',
      editable: true,
      render: (row) => <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">{row.version}</span>,
    },
    {
      key: 'category',
      label: 'CATEGORY',
      render: (row) => (
        <span
          className={`font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded border ${
            row.category === 'feature'
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : row.category === 'bugfix'
              ? 'bg-red-100 text-red-950 border-red-300'
              : row.category === 'design'
              ? 'bg-purple-100 text-purple-950 border-purple-300'
              : row.category === 'security'
              ? 'bg-blue-100 text-blue-950 border-blue-300'
              : 'bg-amber-100 text-amber-950 border-amber-300'
          }`}
        >
          {row.category}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'RELEASE SUMMARY TITLE',
      editable: true,
      render: (row) => <span className="font-bold text-neutral-900">{row.title}</span>,
    },
    {
      key: 'author',
      label: 'AUTHOR / AGENT',
      editable: true,
      render: (row) => <span className="text-neutral-700 font-mono text-[11px]">{row.author}</span>,
    },
    {
      key: 'route_affected',
      label: 'ROUTE AFFECTED',
      editable: true,
      render: (row) => <code className="text-[11px] font-mono text-neutral-500">{row.route_affected || 'Site-Wide'}</code>,
    },
    {
      key: 'timestamp',
      label: 'TIMESTAMP',
      render: (row) => <span className="text-neutral-500 font-mono text-[10px]">{row.timestamp ? new Date(row.timestamp).toLocaleDateString() : '—'}</span>,
    },
  ];

  const filterCategories = [
    { label: 'All', key: 'all', count: logs.length },
    { label: 'Features', key: 'feature' },
    { label: 'Bug Fixes', key: 'bugfix' },
    { label: 'UI Design', key: 'design' },
    { label: 'Security & Rules', key: 'security' },
    { label: 'Refactor', key: 'refactor' },
  ];

  return (
    <div className="space-y-4 font-sans">
      <ExcelWorksheetTable
        title="System Release Changelog & Audit Log"
        data={filteredLogs}
        columns={columns}
        idKey="id"
        filterCategories={filterCategories}
        activeFilter={categoryFilter}
        onFilterChange={(key) => setCategoryFilter(key)}
        searchPlaceholder="Search changelogs by title, version, author..."
        onAddRow={() => setShowAddModal(true)}
        onExportCSV={exportCSV}
        onInlineSave={handleInlineSave}
        loading={loading}
      />

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-xl font-sans">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
              <h3 className="text-sm font-black text-neutral-900 uppercase">Publish Changelog Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">Version Tag</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v4.2.0"
                    required
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-bold text-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ChangelogCategory)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-bold text-neutral-900"
                  >
                    <option value="feature">Feature</option>
                    <option value="bugfix">Bug Fix</option>
                    <option value="design">UI Design</option>
                    <option value="security">Security &amp; Rules</option>
                    <option value="refactor">Refactor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deployed Monorepo Turborepo Architecture & RBAC Engine"
                  required
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">Route / Component Affected</label>
                <input
                  type="text"
                  value={routeAffected}
                  onChange={(e) => setRouteAffected(e.target.value)}
                  placeholder="/admin/changelog"
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 uppercase block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what changed and why..."
                  rows={2}
                  required
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded text-xs font-medium text-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-neutral-600 uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase rounded shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
