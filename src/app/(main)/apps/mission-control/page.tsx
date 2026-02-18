import { redirect } from 'next/navigation';
import { getUserRole } from '@/utils/rbac';
import MissionControlClient from './MissionControlClient';

export const metadata = {
    title: 'Mission Control | GridPass OS',
};

export default async function MissionControlPage() {
    const role = await getUserRole();

    if (role !== 'superadmin') {
        redirect('/');
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">My Mission Control</h1>
            <p className="text-zinc-400 mb-8">Manage local automation bots and site interactions.</p>
            <MissionControlClient />
        </div>
    );
}
