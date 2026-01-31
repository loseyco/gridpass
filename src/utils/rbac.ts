import { createClient } from '@/utils/supabase/server';
import { UserRole, Permission, ROLES } from './rbac-shared';

// Export Shared Types/Constants so Server Components can import everything from here
export * from './rbac-shared';

const ROLE_HIERARCHY: Record<UserRole, number> = {
    superadmin: 100,
    admin: 80,
    founder: 60,
    member: 40,
    user: 20
};

export async function getUserRole(): Promise<UserRole | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fallback for hardcoded superadmins until database is fully synced
    // This ensures you don't lose access even if DB query fails or is empty
    const SUPER_ADMIN_EMAILS = ['pjlosey@gmail.com', 'admin@gridpass.io', 'pjlosey@outlook.com'];
    if (user.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
        return 'superadmin';
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role || 'user';
}

export async function hasRole(requiredRole: UserRole): Promise<boolean> {
    const currentRole = await getUserRole();
    if (!currentRole) return false;

    return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
}

export async function requireRole(requiredRole: UserRole): Promise<boolean> {
    return hasRole(requiredRole);
}

export async function hasPermission(requiredPermission: Permission): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // Superadmin override (optional, but good for safety)
    if (await hasRole('superadmin')) return true;

    // 1. Get User Role
    const userRole = await getUserRole();
    if (!userRole) return false;

    // 2. Check DB for specific permission
    const { data } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role', userRole)
        .eq('permission', requiredPermission)
        .single();

    return !!data;
}
