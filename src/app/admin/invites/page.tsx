import { requireRole } from '@/utils/rbac';
import { redirect } from 'next/navigation';
import InviteManager from '@/components/admin/InviteManager';

export default async function AdminInvitesPage() {
    const isAllowed = await requireRole('admin');
    if (!isAllowed) redirect('/dashboard');

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Golden Tickets</h1>
                <p className="text-neutral-400">Generate special invite links to grant roles immediately.</p>
            </header>

            <InviteManager />
        </div>
    );
}
