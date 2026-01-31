import { redirect } from 'next/navigation';
import { requireRole, ROLES } from '@/utils/rbac';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isSuperAdmin = await requireRole(ROLES.SUPERADMIN);

    if (!isSuperAdmin) {
        redirect('/');
    }

    return <>{children}</>;
}
