import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import LeadEditor from '@/components/admin/LeadEditor';

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch Lead (Bypass RLS to be safe, although admins should have access)
    // Using Admin client ensures we get the record even if RLS is strict for 'leads'
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: lead, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !lead) {
        return <div className="p-8 text-red-500">Lead not found</div>;
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-mono">
            <LeadEditor lead={lead} />
        </div>
    );
}
