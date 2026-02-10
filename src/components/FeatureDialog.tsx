'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import FeatureLogs from './FeatureLogs';

type FeatureDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: FormData) => Promise<void>;
    feature?: any;
    mode: 'create' | 'edit';
};

export default function FeatureDialog({ isOpen, onClose, onSave, feature, mode }: FeatureDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget); // capture form data first

        try {
            // Append missing fields if controlled/unchecked
            if (!formData.has('isPaid')) formData.append('isPaid', 'off');

            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting feature:', error);
            alert('Failed to save feature.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 z-10 shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {mode === 'create' ? <><span className="text-indigo-500">+</span> New Feature Request</> : 'Edit Feature'}
                    </h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Title</label>
                            <input
                                name="title"
                                defaultValue={feature?.title}
                                required
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 ring-1 ring-transparent focus:ring-indigo-500/20 transition-all placeholder-neutral-700 font-medium"
                                placeholder="e.g. Dark Mode Support"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Status</label>
                                <div className="relative">
                                    <select
                                        name="status"
                                        defaultValue={feature?.status || 'backlog'}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:border-neutral-700 transition-colors"
                                    >
                                        <option value="idea">Idea 💡</option>
                                        <option value="backlog">Backlog</option>
                                        <option value="planned">Planned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">▼</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Category</label>
                                <div className="relative">
                                    <select
                                        name="category"
                                        defaultValue={feature?.category || 'General'}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:border-neutral-700 transition-colors"
                                    >
                                        <option value="General">General</option>
                                        <option value="Frontend">Frontend</option>
                                        <option value="Backend">Backend</option>
                                        <option value="Database">Database</option>
                                        <option value="DevOps">DevOps</option>
                                        <option value="UI/UX">UI/UX</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Career">Career</option>
                                        <option value="Community">Community</option>
                                        <option value="Network">Network</option>
                                        <option value="Tools">Tools</option>
                                        <option value="Business">Business</option>
                                        <option value="Racing">Racing</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">▼</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Priority</label>
                            <div className="flex gap-2">
                                {/* Simple radio-like buttons logic could handle this, but for native form ease we stick to select or radio inputs */}
                                <select
                                    name="priority"
                                    defaultValue={feature?.priority || 'medium'}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical 🔥</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/50 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isPaid"
                                        id="isPaid"
                                        defaultChecked={feature?.isPaid}
                                        className="peer w-5 h-5 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                                    />
                                </div>
                                <label htmlFor="isPaid" className="text-sm font-bold text-amber-500 cursor-pointer select-none">Paid / Sponsored Feature</label>
                            </div>
                            <input
                                name="sponsor"
                                defaultValue={feature?.sponsor}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 focus:bg-neutral-900/80 transition-all"
                                placeholder="Sponsor Name (Optional)"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                name="description"
                                defaultValue={feature?.description}
                                rows={4}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none"
                                placeholder="Describe the feature requirement..."
                            />
                        </div>

                        <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-4">
                            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                                AI Context / Instructions
                            </label>
                            <textarea
                                name="aiNotes"
                                defaultValue={feature?.aiNotes || feature?.ai_notes}
                                rows={3}
                                className="w-full bg-neutral-900/50 border border-indigo-500/10 rounded-lg px-3 py-2 text-indigo-100 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm placeholder-indigo-500/30 font-mono text-xs leading-relaxed"
                                placeholder="// Technical implementation details or agent instructions..."
                            />
                        </div>

                        {mode === 'edit' && feature?.id && (
                            <div className="pt-2 border-t border-neutral-800">
                                <FeatureLogs featureId={feature.id} />
                            </div>
                        )}

                        {/* Hidden submit button to allow Enter key submission if needed, but sticky button below handles click */}
                        <button type="submit" hidden disabled={loading} />
                    </form>
                </div>

                <div className="p-4 border-t border-neutral-800 bg-neutral-900 shrink-0">
                    <button
                        onClick={() => document.querySelector('form')?.requestSubmit()}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <><Save className="w-5 h-5" /> {mode === 'create' ? 'Create Feature' : 'Save Changes'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
