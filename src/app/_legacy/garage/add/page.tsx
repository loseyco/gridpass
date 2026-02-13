import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AddVehicleClient from './client';

export default async function AddVehiclePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <div className="max-w-2xl mx-auto px-6 py-12">
                <AddVehicleClient userId={user.id} />
            </div>
        </main>
    );
}
