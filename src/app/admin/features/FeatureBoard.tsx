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
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
            <FeatureDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={handleSubmit}
                mode={dialogMode}
                initialData={selectedFeature}
            />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/admin" className="text-neutral-500 hover:text-white transition-colors text-sm">
                            ← Back to Admin
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <KanbanSquare className="w-8 h-8 text-indigo-500" />
                        Feature Roadmap v2.0
                    </h1>
                    <p className="text-neutral-400">Prioritize based on votes, payment, or executive override.</p>
                </div>
                <button onClick={handleCreate} className="bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors">
                    <Plus className="w-5 h-5" /> New Feature
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Column
                    title="Brainstorm 💡"
                    features={columns.idea}
                    onEdit={handleEdit}
                    isBrainstorm={true}
                />
                <Column title="Backlog" features={columns.backlog} onEdit={handleEdit} />
                <Column title="Planned" features={columns.planned} onEdit={handleEdit} />
                <Column title="In Progress" features={columns.in_progress} onEdit={handleEdit} />
                <Column title="Completed" features={columns.completed} onEdit={handleEdit} />
            </div>
        </div>
    );
}

function Column({ title, features, onEdit, isBrainstorm = false }: { title: string, features: Feature[], onEdit: (f: Feature) => void, isBrainstorm?: boolean }) {
    const sorted = [...features].sort((a, b) => {
        if (a.manualOverride && !b.manualOverride) return -1;
        if (!a.manualOverride && b.manualOverride) return 1;
        if (a.isPaid && !b.isPaid) return -1;
        if (!a.isPaid && b.isPaid) return 1;
        return b.votes - a.votes;
    });

    return (
        <div className={`border rounded-xl p-4 min-h-[500px] flex flex-col ${isBrainstorm ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-neutral-900/50 border-white/5'}`}>
            <h3 className={`font-bold uppercase tracking-widest text-xs mb-4 flex justify-between ${isBrainstorm ? 'text-indigo-400' : 'text-neutral-400'}`}>
                {title} <span className="bg-neutral-800 px-2 rounded text-neutral-500">{features.length}</span>
            </h3>

            {isBrainstorm && (
                <div className="mb-4">
                    <form action={async (formData) => {
                        formData.append('status', 'idea');
                        formData.append('title', formData.get('brainstorm') as string);
                        await addFeature(formData);
                    }}>
                        <input
                            name="brainstorm"
                            className="w-full bg-neutral-950/80 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder-indigo-500/50"
                            placeholder="+ Quick Idea..."
                            autoComplete="off"
                        />
                    </form>
                </div>
            )}

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-neutral-800">
                {sorted.map(f => (
                    <FeatureCardClient key={f.id} feature={f} onEdit={onEdit} />
                ))}
            </div>
        </div>
    );
}
