import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
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

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-neutral-950">
            <AdminSidebar />
            <main className="flex-1 w-full md:w-auto bg-neutral-950 min-h-screen">
                {children}
            </main>
        </div>
    );
}
