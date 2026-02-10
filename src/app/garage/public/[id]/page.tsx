import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import VehicleDetails from '../../components/VehicleDetails';
import Link from 'next/link';

// Use admin client to bypass RLS for public view
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function PublicVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Vehicle
    const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

    if (vehicleError || !vehicle) {
        console.error('Vehicle Error:', vehicleError);
        notFound();
    }

    // Fetch Parts
    const { data: parts } = await supabase
        .from('parts')
        .select('*')
        .eq('vehicle_id', id)
        .order('created_at', { ascending: false });

    // Fetch Logs
    const { data: logs } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('vehicle_id', id)
        .order('date', { ascending: false });

    // Fetch Setups
    const { data: setups } = await supabase
        .from('setups')
        .select('*')
        .eq('vehicle_id', id)
        .order('created_at', { ascending: false });

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/garage" className="text-neutral-400 hover:text-white transition-colors text-sm">
                        GridPass Garage
                    </Link>
                    <div className="text-xs text-neutral-500 uppercase font-bold tracking-widest">
                        Public View
                    </div>
                </div>

                <VehicleDetails
                    vehicle={vehicle}
                    parts={parts || []}
                    logs={logs || []}
                    setups={setups || []}
                    readOnly={true}
                />

                <div className="mt-12 pt-8 border-t border-neutral-800 text-center">
                    <p className="text-neutral-500 mb-4">Want to track your own vehicle builds?</p>
                    <Link
                        href="/register"
                        className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105"
                    >
                        Join GridPass
                    </Link>
                </div>
            </div>
        </main>
    );
}
