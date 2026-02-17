import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import VehicleManager from '@/components/profile/VehicleManager';

export default async function VehiclesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Vehicles</h1>
                <p className="text-neutral-400">Manage your fleet of race cars and transport.</p>
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 md:p-8">
                <VehicleManager userId={user.id} />
            </div>
        </div>
    );
}
