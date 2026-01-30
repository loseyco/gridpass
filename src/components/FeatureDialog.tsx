'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import FeatureLogs from './FeatureLogs';

type FeatureDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    initialData?: any;
    mode: 'create' | 'edit';
};

export default function FeatureDialog({ isOpen, onClose, onSubmit, initialData, mode }: FeatureDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting feature:', error);
            alert('Failed to save feature.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center sticky top-0 bg-neutral-900 z-10">
                    <h2 className="text-lg font-bold text-white">
                        {mode === 'create' ? 'Neuer Feature Request' : 'Feature bearbeiten'}
                    </h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Title</label>
                        <input
                            name="title"
                            defaultValue={initialData?.title}
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g. Dark Mode Support"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Status</label>
                            <select
                                name="status"
                                defaultValue={initialData?.status || 'backlog'}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="backlog">Backlog</option>
                                <option value="planned">Planned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Category</label>
                            <select
                                name="category"
                                defaultValue={initialData?.category || 'general'}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="frontend">Frontend</option>
                                <option value="backend">Backend</option>
                                <option value="database">Database</option>
                                <option value="devops">DevOps</option>
                                <option value="ui_ux">UI/UX</option>
                                <option value="marketing">Marketing</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Priority</label>
                        <select
                            name="priority"
                            defaultValue={initialData?.priority || 'medium'}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isPaid"
                                id="isPaid"
                                defaultChecked={initialData?.isPaid}
                                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                            />
                            <label htmlFor="isPaid" className="text-sm font-bold text-amber-500">Paid Sponsorship</label>
                        </div>
                        <input
                            name="sponsor"
                            defaultValue={initialData?.sponsor}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                            placeholder="Sponsor Name (if paid)"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Description</label>
                        <textarea
                            name="description"
                            defaultValue={initialData?.description}
                            rows={3}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                            placeholder="What should this feature do?"
                        />
                    </div>

                    <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-lg p-3">
                        <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            AI Instructions (Private)
                        </label>
                        <textarea
                            name="aiNotes"
                            defaultValue={initialData?.aiNotes || initialData?.ai_notes}
                            rows={2}
                            className="w-full bg-neutral-950/50 border border-indigo-500/20 rounded px-3 py-2 text-indigo-200 focus:outline-none focus:border-indigo-500 transition-colors text-sm placeholder-indigo-500/50"
                            placeholder="Instructions for the AI workforce (e.g. 'Use the new schema', 'Fix the SEO tag')..."
                        />
                    </div>

                    {mode === 'edit' && initialData?.id && (
                        <div className="pt-2">
                            <FeatureLogs featureId={initialData.id} />
                        </div>
                    )}

                    <div className="pt-2 sticky bottom-0 bg-neutral-900 border-t border-neutral-800">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-bold py-2 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Feature</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
