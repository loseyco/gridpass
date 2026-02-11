import Link from 'next/link';
import { ArrowRight, LayoutDashboard, Car } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

export default async function CollectionsWidget() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch collections count
    const { count: collectionsCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user?.id);

    // Fetch total vehicles count in collections
    // This requires a join or two queries. Let's do a simple count of user_vehicles for now
    // as most vehicles will be in collections if imported.
    const { count: vehiclesCount } = await supabase
        .from('user_vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .not('collection_id', 'is', null);

    if (!collectionsCount) return null;

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">My Collections</h3>
                        <p className="text-neutral-400 text-sm">{collectionsCount} Active Collections</p>
                    </div>
                </div>
                <Link href="/collections" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    Manage <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1 bg-black/20 rounded-lg p-3 border border-white/5">
                    <div className="text-2xl font-bold text-white mb-1">{vehiclesCount || 0}</div>
                    <div className="text-xs text-neutral-500 font-mono uppercase tracking-wide flex items-center gap-2">
                        <Car className="w-3 h-3" />
                        Vehicles Managed
                    </div>
                </div>
            </div>
        </div>
    );
}
