import { createClient } from '@/utils/supabase/server';
import { getCollection, getCollectionVehicles } from '../actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Plus, Settings, MapPin, Building2, User, Lock, Users } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
// Reuse VehicleCard from garage if possible, or create a new one. 
// For now, I'll inline a simple card or check if I can import it.
// Garage VehicleCard was not exported. I'll make a new one or duplicate for now.
import CollectionActions from '@/components/collections/CollectionActions';

export default async function CollectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Parallel
    const collectionData = getCollection(id);
    const vehiclesData = getCollectionVehicles(id);

    const [collection, vehicles] = await Promise.all([collectionData, vehiclesData]);

    if (!collection) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            {/* Header / Hero */}
            <div className="relative bg-neutral-900 border-b border-neutral-800 pt-24 pb-8 px-6 sm:px-12">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Link href="/collections" className="inline-flex items-center text-neutral-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Collections
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-1 bg-neutral-800 rounded text-xs font-mono text-neutral-400 uppercase tracking-wider">
                                    {collection.type || 'Collection'}
                                </span>
                                {collection.visibility !== 'Public' && (
                                    <div className={`
                                        px-2 py-1 rounded text-xs font-bold border flex items-center gap-1
                                        ${collection.visibility === 'Private' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            collection.visibility === 'Team' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-neutral-800 text-neutral-400 border-neutral-700'}
                                    `}>
                                        {collection.visibility === 'Private' && <Lock className="w-3 h-3" />}
                                        {collection.visibility === 'Team' && <Users className="w-3 h-3" />}
                                        {collection.visibility}
                                    </div>
                                )}
                                {collection.location && (
                                    <div className="flex items-center gap-1 text-neutral-400 text-xs">
                                        <MapPin className="w-3 h-3" />
                                        <span>{collection.location}</span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                                {collection.name}
                            </h1>
                            <p className="text-neutral-400 max-w-2xl text-lg">
                                {collection.description || "No description provided."}
                            </p>

                            <div className="flex items-center gap-2 mt-4 text-sm text-neutral-500">
                                {collection.owner_type === 'team' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                <span>Owned by {collection.owner_type === 'user' ? 'You' : 'Team'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <CollectionActions collection={collection} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Car className="w-6 h-6 text-emerald-500" />
                        Inventory
                        <span className="bg-neutral-800 text-neutral-400 text-sm font-bold px-2 py-1 rounded-full">
                            {vehicles.length}
                        </span>
                    </h2>
                </div>

                {vehicles.length === 0 ? (
                    <EmptyState
                        icon={Car}
                        title="No Vehicles in Collection"
                        description="Start tracking your fleet by adding your first vehicle."
                        actionLabel="Add Vehicle"
                        actionLink={`/garage/add?collection_id=${collection.id}`}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map((vehicle: any) => (
                            <Link
                                key={vehicle.id}
                                href={`/garage/${vehicle.id}`} // Reuse garage details page for now
                                className="group bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col"
                            >
                                <div className="h-48 bg-neutral-950 relative overflow-hidden">
                                    {vehicle.photo_url || vehicle.image_url ? (
                                        <img
                                            src={vehicle.photo_url || vehicle.image_url}
                                            alt={vehicle.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-800 bg-neutral-950">
                                            <Car className="w-16 h-16 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                                        {vehicle.year} {vehicle.make}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                                        {vehicle.name}
                                    </h3>
                                    <p className="text-neutral-400 text-sm">
                                        {vehicle.model}
                                    </p>

                                    <div className="mt-4 flex items-center gap-2">
                                        {vehicle.status && (
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${vehicle.status === 'Ready' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                                                vehicle.status === 'Service Scheduled' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' :
                                                    'border-neutral-700 text-neutral-400 bg-neutral-800'
                                                }`}>
                                                {vehicle.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main >
    );
}
