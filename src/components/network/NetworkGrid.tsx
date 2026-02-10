import Link from 'next/link';
import { MapPin, Globe, Trophy, Wrench, User, Flag } from 'lucide-react';
import { NetworkEntity } from '@/app/actions/network';

export default function NetworkGrid({ entities }: { entities: NetworkEntity[] }) {
    if (!entities || entities.length === 0) {
        return (
            <div className="text-center py-20 border border-white/5 rounded-2xl bg-neutral-900/50">
                <p className="text-neutral-500">No results found.</p>
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'track': return <Flag className="w-5 h-5 text-indigo-500" />;
            case 'shop': return <Wrench className="w-5 h-5 text-indigo-500" />;
            case 'team': return <Trophy className="w-5 h-5 text-indigo-500" />;
            case 'expert': return <User className="w-5 h-5 text-emerald-500" />;
            default: return <Globe className="w-5 h-5 text-neutral-500" />;
        }
    };

    const getLink = (entity: NetworkEntity) => {

        // For now, if expert has no separate username field, this might be fragile. 
        // But getNetworkEntities maps name to full_name||username. 
        // If it's a username (no space), /u/username works. If full name, might not.
        // Let's assume for Verified Experts we use their username or ID? 
        // The action sets name: full_name || username. 
        // Use ID for orgs, but for profiles /u/[username] is best.
        // Let's rely on the entity.id which is the uuid for orgs or profiles.
        // Orgs have /organization/[id]. Profiles have /u/[username].

        if ((entity.type as string) === 'expert') {
            const fallback = entity.name.toLowerCase().replace(/\s+/g, '-');
            return `/u/${entity.username || fallback}`;
        }

        return `/organization/${entity.id}`;
    };

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map((entity) => (
                <div key={entity.id} className="group relative bg-neutral-900/50 border border-white/5 p-6 rounded-2xl hover:border-indigo-500/30 transition-all hover:bg-neutral-900 overflow-hidden">
                    <div className="absolute top-0 right-0 p-20 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-all"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-neutral-800 rounded-xl border border-white/5">
                                {getIcon(entity.type)}
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${entity.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-neutral-800 text-neutral-500 border-white/5'}`}>
                                {entity.type}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors truncate">{entity.name}</h3>

                        {entity.description && (
                            <p className="text-neutral-400 text-sm mb-4 line-clamp-2 flex-grow">{entity.description}</p>
                        )}

                        <div className="space-y-3 mb-6">
                            {entity.location && (
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <MapPin className="w-3 h-3" />
                                    {entity.location}
                                </div>
                            )}
                            {entity.website && (
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <Globe className="w-3 h-3" />
                                    <a href={entity.website} target="_blank" rel="noreferrer" className="hover:text-indigo-400 underline decoration-indigo-500/30 underline-offset-2 transition-colors truncate max-w-[200px]">
                                        {entity.website}
                                    </a>
                                </div>
                            )}
                        </div>

                        <Link href={getLink(entity)} className="block w-full py-2.5 text-center text-sm font-bold bg-white text-black rounded-lg hover:bg-indigo-50 transition-colors mt-auto">
                            View Profile
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}
