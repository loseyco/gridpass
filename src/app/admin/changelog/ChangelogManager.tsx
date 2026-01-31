'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Edit, X, RefreshCw } from 'lucide-react';
import { saveChangelog, deleteChangelog } from './actions';
import { useRouter } from 'next/navigation';

interface ChangeItem {
    type: 'feature' | 'fix' | 'improvement';
    text: string;
}

interface FormData {
    id?: string;
    version: string;
    title: string;
    summary: string;
    published_at?: string; // Added published_at
    is_public: boolean; // Add field
    changes: ChangeItem[];
}

export default function ChangelogManager({ initialLogs }: { initialLogs: any[] }) {
    const router = useRouter();
    const [logs, setLogs] = useState(initialLogs);
    const [editingLog, setEditingLog] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<FormData>({
        id: 'new',
        version: '',
        title: '',
        summary: '',
        is_public: true, // Initialize is_public to true
        changes: [{ type: 'feature', text: '' }]
    });

    const handleEdit = (log: any) => {
        setEditingLog(log);
        setFormData({
            id: log.id,
            version: log.version,
            title: log.title,
            summary: log.summary || '',
            published_at: log.published_at || '', // Load published_at
            is_public: log.is_public ?? true, // Load existing value, default to true
            changes: Array.isArray(log.changes) ? log.changes : []
        });
    };

    const handleNew = () => {
        setEditingLog({ id: 'new' });
        setFormData({
            id: 'new',
            version: '',
            title: '',
            summary: '',
            is_public: true, // Initialize is_public to true for new
            changes: [{ type: 'feature', text: '' }]
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('id', formData.id || '');
            data.append('version', formData.version);
            data.append('title', formData.title);
            data.append('summary', formData.summary);
            if (formData.published_at) { // Append published_at if it exists
                data.append('published_at', formData.published_at);
            }
            data.append('is_public', String(formData.is_public)); // Append is_public
            data.append('changes', JSON.stringify(formData.changes));

            await saveChangelog(data);

            // Refresh local state (simplified, better to re-fetch via router)
            router.refresh();
            setEditingLog(null); // Close editor
        } catch (e) {
            alert('Failed to save');
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            await deleteChangelog(id);
            setLogs(logs.filter(l => l.id !== id));
            router.refresh();
        } catch (e: any) {
            console.error(e);
            alert('Failed to delete: ' + e.message);
        }
    };

    const addChangeItem = () => {
        setFormData({
            ...formData,
            changes: [...formData.changes, { type: 'feature', text: '' }]
        });
    };

    const updateChangeItem = (index: number, field: string, value: string) => {
        const newChanges = [...formData.changes];
        newChanges[index] = { ...newChanges[index], [field]: value };
        setFormData({ ...formData, changes: newChanges });
    };

    const removeChangeItem = (index: number) => {
        const newChanges = formData.changes.filter((_, i) => i !== index);
        setFormData({ ...formData, changes: newChanges });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* List Column */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">History</h2>
                    <button onClick={handleNew} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-sm font-bold flex items-center gap-1">
                        <Plus className="w-4 h-4" /> New Update
                    </button>
                </div>

                <div className="space-y-3">
                    {initialLogs.map(log => (
                        <div key={log.id} onClick={() => handleEdit(log)} className={`p-4 rounded-lg border cursor-pointer transition-all ${editingLog?.id === log.id ? 'bg-indigo-900/20 border-indigo-500' : 'bg-neutral-900 border-white/5 hover:border-white/20'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-amber-500 font-mono font-bold">{log.version}</span>
                                        <span className="text-neutral-500 text-xs">{(new Date(log.published_at)).toLocaleDateString()}</span>
                                        {!log.is_public && ( // Display 'Hidden' if not public
                                            <span className="text-[10px] uppercase bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-bold">{log.title}</div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }} className="text-neutral-600 hover:text-red-500 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {initialLogs.length === 0 && (
                        <div className="text-neutral-500 italic p-4 text-center">No logs found. Create one!</div>
                    )}
                </div>
            </div>

            {/* Editor Column */}
            <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 h-fit sticky top-24">
                {!editingLog ? (
                    <div className="text-neutral-500 flex items-center justify-center h-48">Select an entry to edit or create new</div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">{formData.id === 'new' ? 'New Update' : 'Editing Update'}</h3>
                            <button onClick={() => setEditingLog(null)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Version</label>
                                <input value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-sm" placeholder="v1.0.0" />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Title</label>
                                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-sm" placeholder="Update Title" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-neutral-400 mb-1">Summary (Public)</label>
                            <textarea value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-sm h-20" placeholder="Brief high-impact summary..." />
                        </div>

                        {/* Visibility Toggle */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_public"
                                checked={formData.is_public}
                                onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                                className="w-4 h-4 rounded border-neutral-800 bg-black text-indigo-500 focus:ring-indigo-500 focus:ring-offset-black"
                            />
                            <label htmlFor="is_public" className="text-sm text-neutral-400 select-none cursor-pointer">
                                Publicly Visible
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs text-neutral-400 mb-2">Changes</label>
                            <div className="space-y-2">
                                {formData.changes.map((change, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <select
                                            value={change.type}
                                            onChange={e => updateChangeItem(idx, 'type', e.target.value)}
                                            className="bg-neutral-950 border border-white/10 rounded p-2 text-sm w-32 shrink-0"
                                        >
                                            <option value="feature">Feature</option>
                                            <option value="fix">Fix</option>
                                            <option value="improvement">Improvement</option>
                                        </select>
                                        <input
                                            value={change.text}
                                            onChange={e => updateChangeItem(idx, 'text', e.target.value)}
                                            className="bg-neutral-950 border border-white/10 rounded p-2 text-sm w-full"
                                            placeholder="Description..."
                                        />
                                        <button onClick={() => removeChangeItem(idx)} className="text-neutral-600 hover:text-red-500 px-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={addChangeItem} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-2">
                                    <Plus className="w-3 h-3" /> Add Item
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
                            <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Update
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
