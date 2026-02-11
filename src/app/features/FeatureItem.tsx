'use client';

import { useOptimistic, useState, useRef } from 'react';
import { toggleVote, updateFeature } from './actions';
import { Loader2, ThumbsUp, Trash2, RotateCcw, CheckCircle, Pencil, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Feature {
    id: string;
    title: string;
    description: string;
    status: string;
    votes: number;
    hasVoted: boolean;
    category: string;
}

const statusColors: Record<string, string> = {
    'planned': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'in_progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'backlog': 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    'denied': 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusLabels: Record<string, string> = {
    'planned': 'Planned',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'backlog': 'Under Review',
    'denied': 'Denied',
};

function VoteButton({ feature }: { feature: Feature }) {
    const [optimisticVotes, addOptimisticVote] = useOptimistic(
        feature.votes,
        (state, newVote: number) => state + newVote
    );
    const [optimisticHasVoted, toggleOptimisticHasVoted] = useOptimistic(
        feature.hasVoted,
        (state) => !state
    );

    return (
        <form action={async () => {
            addOptimisticVote(optimisticHasVoted ? -1 : 1);
            toggleOptimisticHasVoted(null);
            await toggleVote(feature.id);
        }}>
            <button
                type="submit"
                className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all w-16 h-16",
                    optimisticHasVoted
                        ? "bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        : "bg-neutral-900 border-white/10 text-neutral-400 hover:border-white/30 hover:text-white"
                )}
            >
                <ThumbsUp className={cn("w-5 h-5 mb-1", optimisticHasVoted && "fill-black")} />
                <span className="text-xs font-bold">{optimisticVotes}</span>
            </button>
        </form>
    );
}

export default function FeatureItem({ feature: initialFeature, isAdmin }: { feature: Feature, isAdmin: boolean }) {
    const [feature, setFeature] = useState(initialFeature);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(formRef.current!);

        const updates = {
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
            category: formData.get('category')
        };

        const result = await updateFeature(feature.id, updates);

        if (result.success) {
            setFeature({ ...feature, ...updates } as Feature);
            setIsEditing(false);
            router.refresh();
        } else {
            alert('Failed to update feature');
        }
        setIsSaving(false);
    };

    const quickStatusUpdate = async (newStatus: string) => {
        const result = await updateFeature(feature.id, { status: newStatus });
        if (result.success) {
            setFeature({ ...feature, status: newStatus });
            router.refresh();
        }
    };

    if (isEditing) {
        return (
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-indigo-500/30 ring-1 ring-indigo-500/20">
                <form ref={formRef} onSubmit={handleSave} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Title</label>
                            <input
                                name="title"
                                defaultValue={feature.title}
                                className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white text-sm focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Status</label>
                                <select
                                    name="status"
                                    defaultValue={feature.status}
                                    className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white text-sm focus:border-indigo-500 outline-none appearance-none"
                                >
                                    <option value="backlog">Under Review</option>
                                    <option value="planned">Planned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="denied">Denied (Hidden)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Category</label>
                                <select
                                    name="category"
                                    defaultValue={feature.category}
                                    className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white text-sm focus:border-indigo-500 outline-none appearance-none"
                                >
                                    <option value="General">General</option>
                                    <option value="Jobs">Jobs</option>
                                    <option value="Profile">Profile</option>
                                    <option value="Team">Team Management</option>
                                    <option value="Integrations">Integrations</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Description</label>
                        <textarea
                            name="description"
                            defaultValue={feature.description}
                            rows={3}
                            className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white text-sm focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-xs font-bold hover:bg-white/5 rounded text-neutral-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className={cn(
            "flex gap-4 p-6 rounded-2xl border transition-colors relative group",
            feature.status === 'denied'
                ? "bg-red-500/5 border-red-500/10 opacity-75 grayscale hover:grayscale-0"
                : "bg-neutral-900/50 border-white/5 hover:border-white/10"
        )}>
            {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded bg-neutral-950/50 border border-white/10"
                        title="Edit Feature"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>

                    {feature.status !== 'denied' ? (
                        <>
                            {feature.status !== 'completed' && (
                                <button
                                    onClick={() => quickStatusUpdate('completed')}
                                    className="p-2 text-emerald-500 hover:bg-emerald-500/20 rounded bg-neutral-950/50 border border-white/10"
                                    title="Mark Completed"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => quickStatusUpdate('denied')}
                                className="p-2 text-red-500 hover:bg-red-500/20 rounded bg-neutral-950/50 border border-white/10"
                                title="Deny Feature"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => quickStatusUpdate('backlog')}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/20 rounded bg-neutral-950/50 border border-white/10"
                            title="Restore Feature"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Vote Box */}
            <div className="shrink-0 pt-1">
                <VoteButton feature={feature} />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                            {feature.title}
                            {feature.status === 'completed' && (feature as any).link && (
                                <a
                                    href={(feature as any).link}
                                    className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider rounded-full border border-emerald-500/20 transition-all hover:scale-105"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View Feature
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold border tracking-wider", statusColors[feature.status] || statusColors['backlog'])}>
                                {statusLabels[feature.status] || feature.status}
                            </span>
                            <span className="text-xs text-neutral-500 font-medium px-2 py-0.5 border border-white/5 rounded bg-white/5">
                                {feature.category}
                            </span>
                        </div>
                    </div>
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
        </div>
    );
}
