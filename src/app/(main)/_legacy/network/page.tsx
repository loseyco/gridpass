
import Link from 'next/link';
import { Search } from 'lucide-react';
import { getNetworkEntities, findOpportunities } from '@/app/actions/network';
import NetworkGrid from '@/components/network/NetworkGrid';

export const metadata = {
    title: 'Racing Network | GridPass',
    description: 'The open directory of racing industry tracks, shops, teams, and experts.',
};

export default async function NetworkPage({ searchParams }: { searchParams: Promise<{ type?: string, search?: string, mode?: string }> }) {
    const params = await searchParams;
    const type = params.type || 'all';
    const search = params.search || '';
    const mode = params.mode || 'browse';

    let entities = [];
    let title = "The Racing Network";
    let subtitle = "Connect with the industry from grassroots to top tier.";

    if (mode === 'opportunities') {
        entities = await findOpportunities();
        title = "Your Opportunities";
        subtitle = "Side work matches based on your services and skills.";
    } else {
        entities = await getNetworkEntities({
            type: type === 'all' ? undefined : type,
            search
        });
    }

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'track', label: 'Tracks' },
        { id: 'shop', label: 'Shops' },
        { id: 'team', label: 'Teams' },
        { id: 'expert', label: 'Experts' },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 font-sans">
            {/* Nav (Simplified for now, assumes Layout handles main nav, but this page has its own flavor) */}
            <div className="fixed top-0 w-full z-40 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
                {/* This would normally be the main nav, assuming it is rendered by layout.tsx. 
                    We'll add a contextual sub-nav here if needed or just rely on the page content. 
                */}
            </div>

            <section className="pt-32 pb-12 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 leading-[0.9]">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500 py-1">INDUSTRY</span> <br />
                        <span className="text-indigo-500 py-1">NETWORK</span>
                    </h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        {subtitle}
                    </p>

                    {/* Search & Action */}
                    <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4">
                        <form action="/network" method="GET" className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-neutral-500" />
                            </div>
                            <input
                                type="hidden"
                                name="type"
                                value={type}
                            />
                            <input
                                type="text"
                                name="search"
                                defaultValue={search}
                                placeholder={`Search ${type === 'all' ? 'tracks, shops, people' : type + 's'}...`}
                                className="block w-full pl-11 pr-4 py-4 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                            />
                        </form>

                        <Link
                            href="/network?mode=opportunities"
                            className={`px-8 py-4 rounded-xl font-bold transition-all border ${mode === 'opportunities' ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'bg-white text-black hover:bg-neutral-200 border-white'}`}
                        >
                            Find Work
                        </Link>
                    </div>
                </div>
            </section>

            {/* Filter Tabs */}
            {mode !== 'opportunities' && (
                <div className="px-6 pb-8 sticky top-20 z-30">
                    <div className="flex justify-center flex-wrap gap-2 max-w-3xl mx-auto p-1.5 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/5">
                        {tabs.map(tab => (
                            <Link
                                key={tab.id}
                                href={`/network?type=${tab.id}&search=${search}`}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${type === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Grid */}
            <section className="px-6 pb-24 max-w-7xl mx-auto">
                {mode === 'opportunities' && (
                    <div className="mb-8 flex items-center gap-2 text-indigo-400">
                        <Link href="/network" className="hover:underline text-sm font-bold">← Back to Directory</Link>
                    </div>
                )}
                <NetworkGrid entities={entities} />
            </section>
        </div>
    );
}
