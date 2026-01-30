
import { getFeatures } from './actions';
import FeatureBoard from './FeatureBoard';

// Types
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

async function getData(): Promise<Feature[]> {
    const data = await getFeatures();
    return data.map((f: any) => ({
        ...f,
        isPaid: f.is_paid,
        manualOverride: f.manual_override,
        assignedExpert: f.assigned_expert,
        createdAt: f.created_at,
        description: f.description,
        aiNotes: f.ai_notes,
        category: f.category
    }));
}

export default async function FeaturesPage() {
    const features = await getData();
    return <FeatureBoard features={features} />;
}
