import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { requireRole, ROLES } from '@/utils/rbac';
import PermissionMatrix from './PermissionMatrix';

export default async function RolesPage() {
    const isSuperAdmin = await requireRole(ROLES.SUPERADMIN);
    if (!isSuperAdmin) redirect('/');

    const supabase = await createClient();

    // Fetch all active permissions
    const { data: permissions } = await supabase
        .from('role_permissions')
        .select('*');

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Role Permissions</h1>
                    <p className="text-neutral-400">Manage fine-grained capabilities for each user role.</p>
                </header>

                <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden p-1">
                    <PermissionMatrix permissions={permissions || []} />
                </div>

                <p className="mt-4 text-xs text-neutral-500 text-center">
                    Note: Superadmins have all permissions by default.
                </p>
            </div>
        </div>
    );
}
