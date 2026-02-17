import { getChangelogs } from './actions';
import ChangelogManager from './ChangelogManager';
import { requireRole, ROLES } from '@/utils/rbac';
import { redirect } from 'next/navigation';

export default async function AdminChangelogPage() {
    const hasAccess = await requireRole(ROLES.ADMIN);
    if (!hasAccess) redirect('/dashboard');

    const logs = await getChangelogs();

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 pl-20 md:pl-28"> {/* Padding for sidebar */}
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Changelog Management</h1>
                    <p className="text-neutral-400">Create and edit public patch notes.</p>
                </div>

                <ChangelogManager initialLogs={logs} />
            </div>
        </div>
    );
}
