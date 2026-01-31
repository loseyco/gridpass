import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { UserRole, Permission, ROLES } from './rbac-shared';

// Export Shared Types/Constants so Server Components can import everything from here
export * from './rbac-shared';

const ROLE_HIERARCHY: Record<UserRole, number> = {
    superadmin: 100,
    admin: 80,
    founder: 60,
    member: 40,
    user: 20,
    public: 0
};

export async function getUserRole(): Promise<UserRole | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // 0. Check for Role Override (Impersonation)
    // ONLY allowed if the REAL user is a superadmin.
    // We must first verify they are ACTUALLY a superadmin before honoring the cookie.

    // Fallback for hardcoded superadmins 
    const SUPER_ADMIN_EMAILS = ['pjlosey@gmail.com', 'admin@gridpass.io', 'pjlosey@outlook.com'];
    let isRealSuperAdmin = false;

    if (user.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
        isRealSuperAdmin = true;
    } else {
        // Double check DB payload if not in hardcoded list
        // Ideally we fetch the profile here to be sure
        const { data: realProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (realProfile?.role === 'superadmin') {
            isRealSuperAdmin = true;
        }
    }

    if (isRealSuperAdmin) {
        // Check for override cookie
        const cookieStore = await cookies();
        const overrideRole = cookieStore.get('gridpass_role_override')?.value as UserRole | undefined;

        if (overrideRole && Object.values(ROLES).includes(overrideRole)) {
            return overrideRole;
        }

        // Return real role if no override
        return 'superadmin';
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();


    return profile?.role || 'user';
}

export async function getEffectiveUserId(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Check for superadmin status (real)
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

    if (isRealSuperAdmin) {
        const cookieStore = await cookies();
        const overrideId = cookieStore.get('gridpass_impersonate_user_id')?.value;
        if (overrideId) return overrideId;
    }

    return user.id;
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
