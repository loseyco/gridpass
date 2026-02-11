'use client';

import { useState } from 'react';
import { updateCollection, archiveCollection } from '@/app/collections/actions';
import { Collection } from '@/types/garage';
import { X, Loader2, Lock, Globe, Users, Archive, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CollectionSettingsModalProps {
    collection: any; // Using any for now to avoid strict type issues if Collection isn't fully defined in types yet
    onClose: () => void;
}

export default function CollectionSettingsModal({ collection, onClose }: CollectionSettingsModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: collection.name,
        description: collection.description || '',
        visibility: collection.visibility || 'Private', // Default to Private if undefined
        location: collection.location || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateCollection(collection.id, formData);
            router.refresh(); // Refresh server components
            onClose();
        } catch (error) {
            console.error('Failed to update collection', error);
            // Could add toast here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white">Collection Settings</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Collection Name</label>
                        <input
                            type="text"
                            className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Description</label>
                        <textarea
                            className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white h-24 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Tell us about this collection..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Location</label>
                        <input
                            type="text"
                            className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. Los Angeles, CA"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-3">Visibility</label>
                        <div className="grid grid-cols-1 gap-3">
                            <label className={`
                                flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                                ${formData.visibility === 'Private'
                                    ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/50'
                                    : 'bg-neutral-950 border-white/5 hover:border-white/10'}
                            `}>
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="Private"
                                    checked={formData.visibility === 'Private'}
                                    onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                    className="hidden"
                                />
                                <div className={`p-2 rounded-lg ${formData.visibility === 'Private' ? 'bg-indigo-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Private</div>
                                    <div className="text-xs text-neutral-400">Only visible to you (and team members if applicable).</div>
                                </div>
                            </label>

                            <label className={`
                                flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                                ${formData.visibility === 'Public'
                                    ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/50'
                                    : 'bg-neutral-950 border-white/5 hover:border-white/10'}
                            `}>
                                <input
                                    type="radio"
                                    name="visibility"
                                    value="Public"
                                    checked={formData.visibility === 'Public'}
                                    onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                    className="hidden"
                                />
                                <div className={`p-2 rounded-lg ${formData.visibility === 'Public' ? 'bg-indigo-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Public</div>
                                    <div className="text-xs text-neutral-400">Visible on your public profile.</div>
                                </div>
                            </label>

                            {collection.owner_type === 'team' && (
                                <label className={`
                                    flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                                    ${formData.visibility === 'Team'
                                        ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/50'
                                        : 'bg-neutral-950 border-white/5 hover:border-white/10'}
                                `}>
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="Team"
                                        checked={formData.visibility === 'Team'}
                                        onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                        className="hidden"
                                    />
                                    <div className={`p-2 rounded-lg ${formData.visibility === 'Team' ? 'bg-indigo-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">Team Only</div>
                                        <div className="text-xs text-neutral-400">Visible to all members of this team.</div>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-neutral-800 rounded text-neutral-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>

                {/* Archive Section */}
                {!collection.is_default && (
                    <div className="p-6 border-t border-white/10 bg-red-950/10 rounded-b-xl">
                        <h4 className="text-red-500 font-bold mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Danger Zone
                        </h4>
                        <p className="text-xs text-neutral-400 mb-4">
                            Archiving this collection will hide it from your main list. You can restore it later, but it won't be visible on your profile.
                        </p>
                        <button
                            onClick={async () => {
                                if (confirm('Are you sure you want to archive this collection?')) {
                                    setIsLoading(true);
                                    await archiveCollection(collection.id);
                                    router.refresh(); // Refresh to update list
                                    onClose(); // Close modal
                                    // Optional: Redirect if we were on the collection page
                                    if (window.location.pathname.includes(collection.id)) {
                                        router.push('/collections');
                                    }
                                }
                            }}
                            disabled={isLoading}
                            className="w-full py-3 border border-red-900/50 text-red-500 hover:bg-red-950/30 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <Archive className="w-4 h-4" />
                            Archive Collection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
