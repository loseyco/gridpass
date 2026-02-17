import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Plus, Car, Gamepad2, Wrench, Settings, ChevronRight } from 'lucide-react';
import { Vehicle } from '@/types/garage';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
    title: 'My Garage | GridPass',
    description: 'Manage your real and virtual racing fleet.',
};

export default async function GaragePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Please log in to view your garage.</h1>
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                    Go to Login
                </Link>
            </div>
        );
    }

    const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching vehicles:', error);
    }

    const simVehicles = vehicles?.filter(v => v.type === 'sim') || [];
    const realVehicles = vehicles?.filter(v => v.type === 'real') || [];

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <div className="relative bg-neutral-900 border-b border-neutral-800 pt-24 pb-12 px-6 sm:px-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                            MY GARAGE
                        </h1>
                        <p className="text-neutral-400 max-w-xl text-lg">
                            Manage your fleet, track component mileage, and organize setups for both simulation and reality.
                        </p>
                    </div>
                    <Link
                        href="/garage/add"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Add Vehicle
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 space-y-16">

                {/* Real Vehicles Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Car className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Real World</h2>
                        <span className="bg-neutral-800 text-neutral-400 text-xs font-bold px-2 py-1 rounded-full">
                            {realVehicles.length}
                        </span>
                    </div>

                    {realVehicles.length === 0 ? (
                        <EmptyState
                            icon={Car}
                            title="No Real Vehicles"
                            description="Add your track car, kart, or daily driver to track maintenance and parts."
                            actionLabel="Add Real Vehicle"
                            actionLink="/garage/add?type=real"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {realVehicles.map((vehicle) => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Sim Vehicles Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Gamepad2 className="w-6 h-6 text-purple-500" />
                        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Simulation</h2>
                        <span className="bg-neutral-800 text-neutral-400 text-xs font-bold px-2 py-1 rounded-full">
                            {simVehicles.length}
                        </span>
                    </div>

                    {simVehicles.length === 0 ? (
                        <EmptyState
                            icon={Gamepad2}
                            title="No Sim Vehicles"
                            description="Add your virtual cars from iRacing, ACC, or F1 to manage setups and liveries."
                            actionLabel="Add Sim Vehicle"
                            actionLink="/garage/add?type=sim"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {simVehicles.map((vehicle) => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function VehicleCard({ vehicle }: { vehicle: any }) {
    return (
        <Link
            href={`/garage/${vehicle.id}`}
            className="group bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col"
        >
            {/* Image / Placeholder */}
            <div className="h-48 bg-neutral-950 relative overflow-hidden">
                {vehicle.image_url ? (
                    <img
                        src={vehicle.image_url}
                        alt={vehicle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-800 bg-neutral-950 pattern-grid-lg">
                        {vehicle.type === 'real' ? <Car className="w-16 h-16 opacity-20" /> : <Gamepad2 className="w-16 h-16 opacity-20" />}
                    </div>
                )}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                    {vehicle.make} {vehicle.model}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {vehicle.name}
                </h3>
                <p className="text-neutral-400 text-sm line-clamp-2 mb-6 flex-1">
                    {vehicle.description || "No description provided."}
                </p>

                {/* Stats Row */}
                <div className="flex items-center gap-4 border-t border-neutral-800 pt-4 text-xs font-medium text-neutral-500">
                    <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Maintenance</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Setups</span>
                    </div>
                    <div className="ml-auto text-indigo-500 group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
