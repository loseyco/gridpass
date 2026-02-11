import Link from 'next/link';
import { Plus, FolderOpen, Car, Building2, User, Globe } from 'lucide-react';
import { getPublicCollections } from '../actions';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
    title: 'Explore Collections | GridPass',
    description: 'Discover automotive collections from the GridPass community.',
};

export default async function PublicCollectionsPage() {
    const collections = await getPublicCollections();

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <div className="relative bg-neutral-900 border-b border-neutral-800 pt-24 pb-12 px-6 sm:px-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Globe className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-white">
                                EXPLORE COLLECTIONS
                            </h1>
                        </div>
                        <p className="text-neutral-400 max-w-xl text-lg">
                            Discover portfolios, museum exhibits, and racing fleets from the community.
                        </p>
                    </div>
                    <Link
                        href="/collections"
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-bold transition-all border border-neutral-700 hover:border-neutral-600"
                    >
                        <FolderOpen className="w-5 h-5" />
                        Manage My Collections
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
                {collections.length === 0 ? (
                    <EmptyState
                        icon={Globe}
                        title="No Public Collections"
                        description="Be the first to share a collection with the community!"
                        actionLabel="Create Collection"
                        actionLink="/collections/add"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {collections.map((collection: any) => (
                            <Link
                                key={collection.id}
                                href={`/collections/${collection.id}`}
                                className="group bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-full"
                            >
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-3 bg-neutral-800 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                                {collection.owner_type === 'team' ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                            </div>
                                            {collection.visibility !== 'Public' && (
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${collection.visibility === 'Private' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    collection.visibility === 'Team' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-neutral-800 text-neutral-400 border-neutral-700'
                                                    }`}>
                                                    {collection.visibility}
                                                </span>
                                            )}
                                        </div>
                                        {collection.location && (
                                            <span className="text-xs font-mono text-neutral-500 border border-neutral-800 px-2 py-1 rounded">
                                                {collection.location}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                        {collection.name}
                                    </h3>
                                    <p className="text-neutral-400 text-sm line-clamp-2 mb-6 flex-1">
                                        {collection.description || "No description provided."}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-neutral-800 flex items-center justify-between text-xs font-medium text-neutral-500">
                                        <span className="uppercase tracking-wider">{collection.type || 'Collection'}</span>
                                        <div className="flex items-center gap-1 group-hover:text-white transition-colors">
                                            <span>View Details</span>
                                            <Car className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
