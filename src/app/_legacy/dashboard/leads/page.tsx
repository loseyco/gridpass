import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LeadsManager from './LeadsManager';

export default async function LeadsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Leads & Outreach</h1>
                    <p className="text-neutral-400 mt-2">
                        Manage your racing opportunities and logistics clients.
                    </p>
                </div>
            </div>

            <LeadsManager initialLeads={leads || []} />
        </div>
    );
}
