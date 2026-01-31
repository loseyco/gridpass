import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Check Auth
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        redirect('/login');
    }

    // Check Founder Status
    const { data: roles } = await supabase
        .from('gp_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role_type', 'Founder')
        .single();

    const isFounder = !!roles;

    return (
        <div className="flex min-h-screen bg-neutral-950 text-white font-sans">
            {/* Responsive Sidebar */}
            <DashboardSidebar userEmail={user.email} isFounder={isFounder} />

            {/* Main Content */}
            <main className="flex-1 overflow-auto w-full md:w-auto">
                <div className="p-4 md:p-8 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
