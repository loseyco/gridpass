import { getPublicFeatures, submitFeature, getDeniedFeatures, getCompletedFeatures } from './actions';
import FeatureList from './FeatureList';
import FeatureSubmitForm from './FeatureSubmitForm';
import { Plus, Lightbulb, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const metadata = {
    title: 'Features | GridPass',
    description: 'Vote on the future of GridPass. Submit ideas and track our progress.'
};

import { getUserRole } from '@/utils/rbac';

export default async function FeaturesPage() {
    const supabase = await createClient();

    // Check role using RBAC utility (respects impersonation)
    const role = await getUserRole();
    const isAdmin = role === 'admin' || role === 'superadmin';

    const features = await getPublicFeatures();
    const completedFeatures = await getCompletedFeatures();
    const deniedFeatures = isAdmin ? await getDeniedFeatures() : [];

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <div className="bg-neutral-900/50 border-b border-white/5 py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black italic tracking-tighter text-white mb-2">
                                FEATURE <span className="text-indigo-500">REQUESTS</span>
                            </h1>
                            <p className="text-neutral-400 max-w-lg">
                                Help us build the operating system for racing. Vote on your favorite ideas or suggest new ones.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                {/* <Link href="/changelog" className="text-neutral-400 hover:text-white font-medium text-sm transition-colors border-b border-transparent hover:border-white/20 pb-0.5">
                                    View Changelog
                                </Link> */}
                                <a href="#submit" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5">
                                    <Plus className="w-5 h-5" />
                                    Submit Idea
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

                {/* 1. Feature List */}
                <section>
                    <FeatureList features={features} isAdmin={isAdmin} />
                </section>

                {/* 2. Submit Form */}
                <section id="submit" className="pt-8 border-t border-white/5 space-y-16">
                    <FeatureSubmitForm />

                    {/* 3. Completed Features (Visible to All) */}
                    {completedFeatures.length > 0 && (
                        <div className="pt-8 border-t border-white/5 opacity-75">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Completed Features</h2>
                            </div>
                            <FeatureList features={completedFeatures} isAdmin={isAdmin} />
                        </div>
                    )}

                    {/* 4. Denied Features (Admin Only) */}
                    {isAdmin && deniedFeatures.length > 0 && (
                        <div className="pt-8 border-t border-white/5 opacity-75">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                    <ShieldAlert className="w-5 h-5 text-red-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Denied Requests</h2>
                            </div>
                            <FeatureList features={deniedFeatures} isAdmin={isAdmin} />
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
