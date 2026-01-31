import { createClient } from '@/utils/supabase/server';
import ImpersonationBar from './ImpersonationBar';
import { getUserRole } from '@/utils/rbac';

export default async function ImpersonationBarWrapper() {
    // 1. Check if user is LOGGED IN first
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // 2. Check if REAL user is Superadmin
    // We cannot use `getUserRole` directly because it might return the impersonated role!
    // We need to bypass the override logic to check permission to SHOW the bar.

    // Fallback logic duplicated from access control for safety
    const SUPER_ADMIN_EMAILS = ['pjlosey@gmail.com', 'admin@gridpass.io', 'pjlosey@outlook.com'];
    let isRealSuperAdmin = false;

    if (user.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
        isRealSuperAdmin = true;
    } else {
        const { data: realProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (realProfile?.role === 'superadmin') {
            isRealSuperAdmin = true;
        }
    }

    if (!isRealSuperAdmin) return null;

    // 3. Get Current Effective Role (to show in UI)
    const currentRole = await getUserRole();

    return <ImpersonationBar currentRole={currentRole || 'user'} />;
}
