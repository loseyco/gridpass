'use server'

import { createClient } from '@/utils/supabase/server';
import { requireRole, ROLES } from '@/utils/rbac';
import { UserRole } from '@/utils/rbac-shared';
import { revalidatePath } from 'next/cache';

export async function togglePermission(role: UserRole, permission: string, grant: boolean) {
    // 1. Security Check
    const isSuperAdmin = await requireRole(ROLES.SUPERADMIN);
    if (!isSuperAdmin) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    if (grant) {
        // Insert if not exists
        const { error } = await supabase
            .from('role_permissions')
            .upsert({ role, permission }, { onConflict: 'role, permission' });

        if (error) throw new Error(error.message);
    } else {
        // Delete
        const { error } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role', role)
            .eq('permission', permission);

        if (error) throw new Error(error.message);
    }

    revalidatePath('/admin/roles');
    return { success: true };
}
