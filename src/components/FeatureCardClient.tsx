'use client';

import { useState } from 'react';
import {
    Users,
    DollarSign,
    ArrowUp,
    Crown,
    MoreHorizontal,
    Trash2,
    Edit,
    Bot,
    CheckCircle,
    Clock
} from 'lucide-react';
import { updateFeatureStatus, deleteFeature, assignExpert } from '@/app/admin/features/actions';

type Feature = {
    id: string;
    title: string;
    status: 'idea' | 'backlog' | 'planned' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    votes: number;
    isPaid: boolean;
    sponsor?: string;
    manualOverride: boolean;
    assignedExpert?: string;
    createdAt: string;
    description?: string;
    aiNotes?: string;
    category?: string;
};

export default function FeatureCardClient({ feature, onEdit }: { feature: Feature, onEdit: (f: Feature) => void }) {
    const [actionOpen, setActionOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);

    async function handleStatusChange(newStatus: string) {
        await updateFeatureStatus(feature.id, newStatus);
        setActionOpen(false);
    }

    async function handleDelete() {
        if (confirm('Are you sure you want to delete this feature?')) {
            await deleteFeature(feature.id);
        }
    }

    async function handleAssign(expert: string) {
        // Just trigger the server action
        await assignExpert(feature.id, expert);
        setAssignOpen(false);
        setActionOpen(false);
    }

    const isOpen = actionOpen || assignOpen;

    return (
        <div
            onClick={() => onEdit(feature)}
            className={`
            p-4 rounded-lg border relative group cursor-pointer transition-all hover:-translate-y-1
            ${feature.isPaid
                    ? 'bg-gradient-to-br from-amber-900/20 to-neutral-900 border-amber-500/50 shadow-lg shadow-amber-900/10'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'}
            ${isOpen ? 'z-50' : 'z-0'}
        `}>
            {/* Action Menu Trigger */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); setActionOpen(!actionOpen); }}
                    className="p-1 hover:bg-white/10 rounded"
                >
                    <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                </button>
            </div>

            {/* Action Menu */}
            {actionOpen && (
                <div
                    className="absolute top-8 right-2 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20 w-48 text-sm overflow-hidden"
                    onMouseLeave={() => setActionOpen(false)}
                >
                    <button onClick={(e) => { e.stopPropagation(); onEdit(feature); setActionOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-neutral-800 flex items-center gap-2 text-neutral-300">
                        <Edit className="w-4 h-4" /> Edit Feature
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setAssignOpen(true); }} className="w-full text-left px-4 py-2 hover:bg-neutral-800 flex items-center gap-2 text-indigo-400">
                        <Bot className="w-4 h-4" /> Assign AI
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="w-full text-left px-4 py-2 hover:bg-neutral-800 flex items-center gap-2 text-red-400">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>

                    <div className="border-t border-neutral-800 my-1"></div>

                    <div className="px-2 py-1 text-xs text-neutral-600 uppercase font-bold">Move To</div>
                    <button onClick={() => handleStatusChange('backlog')} className="w-full text-left px-4 py-1 hover:bg-neutral-800 text-neutral-400">Backlog</button>
                    <button onClick={() => handleStatusChange('planned')} className="w-full text-left px-4 py-1 hover:bg-neutral-800 text-neutral-400">Planned</button>
                    <button onClick={() => handleStatusChange('in_progress')} className="w-full text-left px-4 py-1 hover:bg-neutral-800 text-neutral-400">In Progress</button>
                    <button onClick={() => handleStatusChange('completed')} className="w-full text-left px-4 py-1 hover:bg-neutral-800 text-neutral-400">Completed</button>
                </div>
            )}

            {/* Assign Menu */}
            {assignOpen && (
                <div
                    className="absolute top-8 right-52 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-30 w-48 text-sm overflow-hidden"
                    onMouseLeave={() => setAssignOpen(false)}
                >
                    <div className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase">Select Expert</div>
                    <button onClick={() => handleAssign('backend')} className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-neutral-300">Backend Expert</button>
                    <button onClick={() => handleAssign('frontend')} className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-neutral-300">Frontend Expert</button>
                    <button onClick={() => handleAssign('seo')} className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-neutral-300">SEO Expert</button>
                    <button onClick={() => handleAssign('repair')} className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-neutral-300">Repair Agent</button>
                </div>
            )}


            {feature.manualOverride && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    FORCED
                </div>
            )}

            <div className="flex justify-between items-start mb-2 pr-6">
                <h4 className={`font-bold text-sm ${feature.isPaid ? 'text-amber-100' : 'text-neutral-200'}`}>
                    {feature.title}
                </h4>
                {feature.isPaid && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                        <Users className="w-3 h-3" /> {feature.votes}
                    </span>
                    {feature.isPaid && (
                        <span className="flex items-center gap-1 text-amber-500/80">
                            <DollarSign className="w-3 h-3" /> {feature.sponsor || 'Sponsor'}
                        </span>
                    )}
                </div>
                {feature.priority === 'critical' && (
                    <ArrowUp className="w-3 h-3 text-red-500" />
                )}
            </div>

            {feature.aiNotes && (
                <div className="mt-2 text-[10px] text-indigo-300/70 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 truncate">
                    🤖 {feature.aiNotes}
                </div>
            )}

            {feature.category && feature.category !== 'general' && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-neutral-400 font-mono tracking-tighter uppercase border border-white/5">
                    {feature.category}
                </div>
            )}

            {feature.assignedExpert && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                        <Bot className="w-3 h-3" /> {feature.assignedExpert.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Auto-Working
                    </span>
                </div>
            )}
        </div>
    );
}
