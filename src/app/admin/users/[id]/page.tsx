import { requireRole, ROLES } from '@/utils/rbac';
import { redirect } from 'next/navigation';
import ProfileEditor from '@/components/profile/ProfileEditor';

export default async function AdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isSuperAdmin = await requireRole(ROLES.SUPERADMIN);
    if (!isSuperAdmin) redirect('/');

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <a href="/admin/users" className="text-sm text-neutral-400 hover:text-white mb-4 block">&larr; Back to Users</a>
                </div>
                <ProfileEditor targetUserId={id} />
            </div>
        </div>
    );
}
