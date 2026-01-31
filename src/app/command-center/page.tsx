import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CommandCenterDashboard from '@/components/command-center/CommandCenterDashboard';
import { hasRole, ROLES } from '@/utils/rbac';

export default async function CommandCenterPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const isLinking = params.action === 'link';
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login?next=/command-center');
    }

    // Role Check
    const isAllowed = await hasRole(ROLES.SUPERADMIN);
    if (!isAllowed) {
        return redirect('/');
    }

    // Fetch Devices
    const { data: devices } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen_at', { ascending: false });

    // REVERTING this tool call idea. I will write a NEW component `CommandCenterDashboard` instead,
    // then update the page to use it.
    // The page remains a Server Component, fetches data, and renders the client component.
    return (
        <CommandCenterDashboard initialDevices={devices || []} autoOpenLinking={isLinking} />
    );
}
