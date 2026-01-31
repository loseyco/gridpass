'use server'

import { createClient } from '@/utils/supabase/server';
import { requireRole, ROLES } from '@/utils/rbac';
import { UserRole } from '@/utils/rbac-shared';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(targetUserId: string, newRole: UserRole) {
    // 1. Verify Requestor is Superadmin
    const isSuperAdmin = await requireRole(ROLES.SUPERADMIN);
    if (!isSuperAdmin) {
        throw new Error('Unauthorized: Superadmin access required');
    }

    // 2. Validate Role
    // We trust TypeScript and the UI, but a runtime check is good practice
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role specified');
    }

    // 3. Update Database
    const supabase = await createClient();
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', targetUserId);

    if (error) {
        console.error('Role update error:', error);
        throw new Error(`Failed to update role: ${error.message}`);
    }

    // 4. Revalidate
    revalidatePath('/admin/users');
    return { success: true };
}
