'use client';

import { useState, useRef } from 'react';
import { CareerEntry } from '@/types/career';
import { Plus, Trash2, Calendar, MapPin, Briefcase, Pencil, Upload, Loader2, FileText, Sparkles, Check, X, ArrowRight } from 'lucide-react';

export default function CareerHistoryEditor({
    entries = [],
    onChange
}: {
    entries: CareerEntry[],
    onChange: (entries: CareerEntry[]) => void
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [newEntry, setNewEntry] = useState<Partial<CareerEntry>>({
        type: 'employment',
        is_current: false
    });

    // Optimization State
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [reviewIndex, setReviewIndex] = useState(0);

    const handleOptimize = async (targetEntries: CareerEntry[] = entries) => {
        setIsOptimizing(true);
        try {
            // Only optimize entries with descriptions
            const validEntries = targetEntries.filter(e => e.description && e.description.length > 10);
            if (validEntries.length === 0) {
                alert("Add a detailed description first so I can optimize it!");
                setIsOptimizing(false);
                return;
            }

            const res = await fetch('/api/career/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: validEntries })
            });
            const data = await res.json();

            // Filter out null suggestions or identical ones
            const usefulSuggestions = data.suggestions.filter((s: any) => s.better_version && s.better_version !== s.original);

            if (usefulSuggestions.length === 0) {
                alert("This one is already rock solid! No improvements found.");
            } else {
                setSuggestions(usefulSuggestions);
                setReviewIndex(0);
                // Scroll to top to see results
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (e) {
            console.error(e);
            alert("Failed to reach the AI coach.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const applySuggestion = (suggestion: any) => {
        const updatedEntries = entries.map(e => {
            if (e.id === suggestion.id) {
                return { ...e, description: suggestion.better_version };
            }
            return e;
        });
        onChange(updatedEntries);
        nextSuggestion();
    };

    const nextSuggestion = () => {
        if (reviewIndex < suggestions.length - 1) {
            setReviewIndex(reviewIndex + 1);
        } else {
            setSuggestions([]); // Done
            alert("All optimized! Great work.");
        }
    };

    const handleAdd = () => {
        setValidationError(null);

        // Validation
        if (!newEntry.title) {
            setValidationError('Title / Role is required.');
            return;
        }
        if (!newEntry.organization) {
            setValidationError('Organization / Team is required.');
            return;
        }
        if (!newEntry.start_date) {
            setValidationError('Start Date is required.');
            return;
        }

        const entry: CareerEntry = {
            id: editingId || crypto.randomUUID(),
            title: newEntry.title!,
            organization: newEntry.organization!,
            type: newEntry.type as any || 'employment',
            start_date: newEntry.start_date!,
            end_date: newEntry.end_date,
            is_current: newEntry.is_current,
            location: newEntry.location,
            event_name: newEntry.event_name,
            vehicle_info: newEntry.vehicle_info,
            description: newEntry.description,
            highlights: newEntry.highlights || []
        };

        if (editingId) {
            onChange(entries.map(e => e.id === editingId ? entry : e));
        } else {
            onChange([...entries, entry]);
        }

        setNewEntry({ type: 'employment', is_current: false });
        setEditingId(null);
        setIsAdding(false);
    };

    const formRef = useRef<HTMLDivElement>(null);

    const handleEdit = (entry: CareerEntry) => {
        setNewEntry(entry);
        setEditingId(entry.id);
        setValidationError(null);
        setIsAdding(true);
        // Wait for state update and render, then scroll
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const handleDelete = (id: string) => {
        onChange(entries.filter(e => e.id !== id));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/career/parse-resume', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to parse resume');

            if (data.entries && Array.isArray(data.entries)) {
                // Merge new entries
                const newEntries = data.entries.map((e: any) => ({
                    ...e,
                    // Ensure defaults
                    highlights: e.highlights || [],
                    is_current: !!e.is_current
                }));
                onChange([...entries, ...newEntries]);
            }

        } catch (error: any) {
            console.error('Upload error', error);
            setUploadError(error.message);
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-800 rounded-lg">
                        <Briefcase className="w-5 h-5 text-neutral-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Career & Race History</h3>
                        <p className="text-sm text-neutral-400">Add your jobs, contracts, and race events.</p>
                    </div>
                </div>
                {!isAdding && (
                    <div className="flex gap-2">
                        <label className={`flex items-center gap-2 text-sm bg-neutral-800 text-neutral-300 px-4 py-2 rounded hover:bg-neutral-700 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {isUploading ? 'Parsing...' : 'Import Resume'}
                        </label>
                        <button
                            onClick={() => {
                                setNewEntry({ type: 'employment', is_current: false });
                                setEditingId(null);
                                setValidationError(null);
                                setIsAdding(true);
                            }}
                            className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Experience
                        </button>
                    </div>
                )}
            </div>

            {/* Optimization Review Overlay */}
            {suggestions.length > 0 && (
                <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl relative overflow-hidden animate-fade-in">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${((reviewIndex + 1) / suggestions.length) * 100}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold">
                            <Sparkles className="w-5 h-5" />
                            AI Coach Recommendation ({reviewIndex + 1}/{suggestions.length})
                        </div>
                        <button onClick={() => setSuggestions([])} className="text-neutral-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="p-4 bg-black/40 rounded-lg border border-red-500/20">
                            <div className="text-xs text-red-400 uppercase font-bold mb-2">Original</div>
                            <p className="text-sm text-neutral-300 line-through decoration-red-500/50 decoration-2">
                                "{suggestions[reviewIndex].original}"
                            </p>
                        </div>
                        <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/40 relative">
                            <div className="text-xs text-indigo-400 uppercase font-bold mb-2 flex justify-between">
                                <span>Better Version</span>
                                <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                                    {suggestions[reviewIndex].reason}
                                </span>
                            </div>
                            <p className="text-sm text-white font-medium">
                                "{suggestions[reviewIndex].better_version}"
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={nextSuggestion}
                            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            Skip / Keep Original
                        </button>
                        <button
                            onClick={() => applySuggestion(suggestions[reviewIndex])}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            <Check className="w-4 h-4" /> Accept Improvement
                        </button>
                    </div>
                </div>
            )}

            {uploadError && (
                <div className="mb-6 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg flex items-center gap-2 border border-red-500/20">
                    <FileText className="w-4 h-4" />
                    {uploadError}
                </div>
            )}

            <div className="space-y-4">
                {entries.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-neutral-500 italic border border-dashed border-white/10 rounded-xl">
                        No history added yet.
                    </div>
                )}

                {/* List Existing Entries */}
                {entries.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()).map(entry => (
                    <div key={entry.id} className="p-4 bg-black/20 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between group">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded 
                                    ${entry.type === 'event' ? 'bg-amber-500/20 text-amber-500' :
                                        entry.type === 'contract' ? 'bg-purple-500/20 text-purple-500' :
                                            'bg-blue-500/20 text-blue-500'}`}>
                                    {entry.type}
                                </span>
                                <span className="text-xs text-neutral-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {entry.start_date} {entry.is_current ? '- Present' : entry.end_date ? `- ${entry.end_date}` : ''}
                                </span>
                            </div>
                            <h4 className="font-bold text-lg">{entry.title}</h4>
                            <div className="text-neutral-300 flex flex-wrap gap-x-4 gap-y-1 mb-2">
                                <span className="font-medium text-white">{entry.organization}</span>
                                {entry.event_name && <span className="text-amber-400">@ {entry.event_name}</span>}
                                {entry.location && <span className="text-neutral-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {entry.location}</span>}
                            </div>
                            {entry.description && (
                                <p className="text-sm text-neutral-400 line-clamp-2">{entry.description}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1 self-start items-end">
                            {deleteConfirmId === entry.id ? (
                                <div className="flex flex-col gap-2 bg-neutral-900 border border-red-500/30 p-2 rounded-lg animate-fade-in z-10 w-24">
                                    <p className="text-[10px] text-red-400 font-medium text-center">Delete this?</p>
                                    <button
                                        onClick={() => {
                                            handleDelete(entry.id);
                                            setDeleteConfirmId(null);
                                        }}
                                        className="w-full px-2 py-1 text-xs bg-red-600 text-white font-bold rounded hover:bg-red-500"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="w-full px-2 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleOptimize([entry])}
                                        disabled={isOptimizing}
                                        className="p-2 text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 rounded-lg hover:bg-purple-500/20 border border-purple-500/20"
                                        title="AI Optimize This Entry"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(entry)}
                                        className="p-2 text-neutral-600 hover:text-indigo-500 transition-colors bg-white/5 rounded-lg hover:bg-white/10"
                                        title="Edit Entry"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(entry.id)}
                                        className="p-2 text-neutral-600 hover:text-red-500 transition-colors hover:bg-white/5 rounded-lg"
                                        title="Delete Entry"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add New Entry Form */}
                {isAdding && (
                    <div ref={formRef} className="p-6 bg-neutral-950/50 border border-indigo-500/30 rounded-xl animate-fade-in">
                        <h4 className="font-bold mb-4 text-indigo-400">{editingId ? 'Edit Experience' : 'New Experience'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-xs text-neutral-500 uppercase">Type</label>
                                <select
                                    className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white"
                                    value={newEntry.type}
                                    onChange={e => setNewEntry({ ...newEntry, type: e.target.value as any })}
                                >
                                    <option value="employment">Employment (Full-time/Part-time)</option>
                                    <option value="contract">Contract (Project based)</option>
                                    <option value="event">Race Event (Weekend/One-off)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-neutral-500 uppercase">Title / Role</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Crew Chief"
                                    className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white"
                                    value={newEntry.title || ''}
                                    onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-neutral-500 uppercase">Organization / Team</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Wayne Taylor Racing"
                                    className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white"
                                    value={newEntry.organization || ''}
                                    onChange={e => setNewEntry({ ...newEntry, organization: e.target.value })}
                                />
                            </div>

                            {newEntry.type === 'event' && (
                                <div className="space-y-1">
                                    <label className="text-xs text-neutral-500 uppercase">Event Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Indy 500"
                                        className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white"
                                        value={newEntry.event_name || ''}
                                        onChange={e => setNewEntry({ ...newEntry, event_name: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Vehicle / Equipment Info - Conditional */}
                            {(newEntry.type === 'event' || newEntry.vehicle_info) ? (
                                <div className="space-y-1 relative">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-neutral-500 uppercase">
                                            {newEntry.type === 'event' ? 'Vehicle / Car' : 'Key Equipment / Vehicle'}
                                        </label>
                                        {newEntry.type !== 'event' && (
                                            <button
                                                onClick={() => setNewEntry({ ...newEntry, vehicle_info: undefined })}
                                                className="text-[10px] text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={newEntry.type === 'event' ? "e.g. Porsche 911 GT3 R" : "e.g. Proton Accelerator or Car Model"}
                                        className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white"
                                        value={newEntry.vehicle_info || ''}
                                        onChange={e => setNewEntry({ ...newEntry, vehicle_info: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="pt-6">
                                    <button
                                        onClick={() => setNewEntry({ ...newEntry, vehicle_info: '' })}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Vehicle or Equipment Details
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs text-neutral-500 uppercase">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white"
                                    value={newEntry.start_date || ''}
                                    onChange={e => setNewEntry({ ...newEntry, start_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-neutral-500 uppercase">End Date</label>
                                <input
                                    type="date"
                                    disabled={newEntry.is_current}
                                    className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white disabled:opacity-50"
                                    value={newEntry.end_date || ''}
                                    onChange={e => setNewEntry({ ...newEntry, end_date: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newEntry.is_current}
                                        onChange={e => setNewEntry({ ...newEntry, is_current: e.target.checked })}
                                        className="rounded bg-neutral-800"
                                    />
                                    <span className="text-sm text-neutral-300">Currently working here</span>
                                </label>
                            </div>

                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs text-neutral-500 uppercase">Description / Highlights</label>
                                <textarea
                                    className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white h-20"
                                    placeholder="Brief description of duties..."
                                    value={newEntry.description || ''}
                                    onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            {validationError && (
                                <p className="text-xs text-red-500 font-medium animate-pulse">
                                    {validationError}
                                </p>
                            )}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setValidationError(null);
                                        setEditingId(null);
                                        setNewEntry({ type: 'employment', is_current: false });
                                    }}
                                    className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="px-4 py-2 text-sm bg-white text-black font-bold rounded hover:bg-neutral-200 transition-colors"
                                >
                                    {editingId ? 'Update Entry' : 'Save Entry'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
