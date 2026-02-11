import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import VehicleDetails from '../components/VehicleDetails';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch Vehicle
    const { data: vehicle, error: vehicleError } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
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

    // Fetch Setups (Placeholder for now)
    const { data: setups } = await supabase
        .from('setups')
        .select('*')
        .eq('vehicle_id', id)
        .order('created_at', { ascending: false });

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/garage" className="flex items-center text-neutral-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Garage
                </Link>
                <VehicleDetails
                    vehicle={vehicle}
                    parts={parts || []}
                    logs={logs || []}
                    setups={setups || []}
                />
            </div>
        </main>
    );
}
