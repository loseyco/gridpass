import { getFeedbackSubmissions } from '@/app/actions/feedback';
import FeedbackTable from './FeedbackTable';
import { MessageSquarePlus } from 'lucide-react';

export const metadata = {
    title: 'Feedback | Admin | GridPass',
    description: 'Manage user feedback and bug reports.'
};

export default async function FeedbackPage() {
    // Fetch all feedback, maybe limit to recent 100 or something if it gets large
    const submissions = await getFeedbackSubmissions();

    // Calculate stats
    const newCount = submissions?.filter(s => s.status === 'new').length || 0;
    const bugCount = submissions?.filter(s => s.type === 'bug').length || 0;
    const featureCount = submissions?.filter(s => s.type === 'feature').length || 0;

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white flex items-center gap-3">
                        <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                            <MessageSquarePlus className="w-8 h-8" />
                        </span>
                        USER FEEDBACK
                    </h1>
                    <p className="text-neutral-400 mt-2">
                        Review and manage bug reports, feature requests, and inquiries.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-lg">
                        <div className="text-xs font-bold text-neutral-500 uppercase">New</div>
                        <div className="text-2xl font-bold text-white">{newCount}</div>
                    </div>
                    <div className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-lg">
                        <div className="text-xs font-bold text-neutral-500 uppercase">Bugs</div>
                        <div className="text-2xl font-bold text-rose-500">{bugCount}</div>
                    </div>
                    <div className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-lg">
                        <div className="text-xs font-bold text-neutral-500 uppercase">Features</div>
                        <div className="text-2xl font-bold text-indigo-500">{featureCount}</div>
                    </div>
                </div>
            </div>

            {/* List */}
            <FeedbackTable submissions={submissions || []} />
        </div>
    );
}
