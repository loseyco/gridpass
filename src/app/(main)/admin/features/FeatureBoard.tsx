'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KanbanSquare, Plus } from 'lucide-react';
import FeatureDialog from '@/components/FeatureDialog';
import FeatureCardClient from '@/components/FeatureCardClient';
import { addFeature, updateFeature } from './actions';

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

export default function FeatureBoard({ features }: { features: Feature[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [selectedFeature, setSelectedFeature] = useState<Feature | undefined>(undefined);

    const columns = {
        idea: features.filter(f => f.status === 'idea'),
        backlog: features.filter(f => f.status === 'backlog'),
        planned: features.filter(f => f.status === 'planned'),
        in_progress: features.filter(f => f.status === 'in_progress'),
        completed: features.filter(f => f.status === 'completed')
    };

    function handleCreate() {
        setSelectedFeature(undefined);
        setDialogMode('create');
        setIsDialogOpen(true);
    }

    function handleEdit(feature: Feature) {
        setSelectedFeature(feature);
        setDialogMode('edit');
        setIsDialogOpen(true);
    }

    async function handleSubmit(formData: FormData) {
        if (dialogMode === 'create') {
            await addFeature(formData);
        } else if (selectedFeature) {
            // Reconstruct data object for update
            const data = {
                title: formData.get('title'),
                status: formData.get('status'),
                priority: formData.get('priority'),
                isPaid: formData.get('isPaid') === 'on',
                sponsor: formData.get('sponsor'),
                description: formData.get('description'),
                aiNotes: formData.get('aiNotes'),
                category: formData.get('category')
            };
            await updateFeature(selectedFeature.id, data);
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 font-sans">
            {isDialogOpen && (
                <FeatureDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSave={handleSubmit}
                    mode={dialogMode}
                    feature={selectedFeature}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/admin" className="text-neutral-500 hover:text-white transition-colors text-sm">
                            ← Back to Admin
                        </Link>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <KanbanSquare className="w-6 h-6 md:w-8 md:h-8 text-indigo-500" />
                        Feature Roadmap
                    </h1>
                    <p className="text-neutral-400 text-sm md:text-base">Prioritize based on votes, payment, or executive override.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="w-full md:w-auto bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5"
                >
                    <Plus className="w-5 h-5" /> New Feature
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-6">
                <Column
                    title="Brainstorm 💡"
                    status="idea"
                    features={columns.idea}
                    onEdit={handleEdit}
                    isBrainstorm={true}
                    headerColor="text-indigo-400"
                    borderColor="border-indigo-500/20"
                />
                <Column title="Backlog" status="backlog" features={columns.backlog} onEdit={handleEdit} headerColor="text-neutral-400" />
                <Column title="Planned" status="planned" features={columns.planned} onEdit={handleEdit} headerColor="text-blue-400" />
                <Column title="In Progress" status="in_progress" features={columns.in_progress} onEdit={handleEdit} headerColor="text-amber-400" />
                <Column title="Completed" status="completed" features={columns.completed} onEdit={handleEdit} headerColor="text-emerald-400" />
            </div>
        </div>
    );
}

function Column({ title, status, features, onEdit, isBrainstorm = false, headerColor = 'text-neutral-400', borderColor = 'border-white/5' }: {
    title: string,
    status: string,
    features: Feature[],
    onEdit: (f: Feature) => void,
    isBrainstorm?: boolean,
    headerColor?: string,
    borderColor?: string
}) {
    const sorted = [...features].sort((a, b) => {
        if (a.manualOverride && !b.manualOverride) return -1;
        if (!a.manualOverride && b.manualOverride) return 1;
        if (a.isPaid && !b.isPaid) return -1;
        if (!a.isPaid && b.isPaid) return 1;
        return (b.votes || 0) - (a.votes || 0);
    });

    return (
        <div className={`border rounded-xl flex flex-col bg-neutral-900/50 ${borderColor} h-[600px] md:h-auto`}>
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10 rounded-t-xl`}>
                <h3 className={`font-bold uppercase tracking-widest text-xs ${headerColor}`}>
                    {title}
                </h3>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-xs text-neutral-500 font-mono">
                    {features.length}
                </span>
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {isBrainstorm && (
                    <form action={async (formData) => {
                        // We need to call a server action here directly or wrap this. 
                        // Since we can't pass server actions directly to form action in client component easily without closure
                        // We will rely on the fact this is a client component but we can call the imported server action.
                        const title = formData.get('brainstorm') as string;
                        if (!title) return;

                        // We need to construct formData compliant with addFeature
                        const submission = new FormData();
                        submission.append('title', title);
                        submission.append('description', 'Quick idea from brainstorm board.');
                        submission.append('category', 'General');
                        submission.append('status', 'idea');

                        await addFeature(submission);
                        // Reset form? React 19 might handle this, or we rely on toggle.
                    }} className="mb-4">
                        <input
                            name="brainstorm"
                            className="w-full bg-neutral-950/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-indigo-500/50"
                            placeholder="+ Quick Idea..."
                            autoComplete="off"
                        />
                    </form>
                )}

                {sorted.map(f => (
                    <div key={f.id} onClick={() => onEdit(f)} className="cursor-pointer">
                        <FeatureCardClient feature={f} onEdit={onEdit} />
                    </div>
                ))}
            </div>
        </div>
    );
}
