import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { requireRole, ROLES } from '@/utils/rbac';
import UserRoleSelect from './UserRoleSelect';

export default async function UsersPage() {
    const isSuperAdmin = await requireRole(ROLES.SUPERADMIN);
    if (!isSuperAdmin) redirect('/');

    const supabase = await createClient();

    // Fetch all profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">User Management</h1>
                        <p className="text-neutral-400">View and manage system users.</p>
                    </div>
                </header>

                <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-950 text-neutral-400 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {profiles?.map((profile: any) => (
                                <tr key={profile.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg font-bold text-neutral-500">
                                                        {(profile.full_name || profile.username || '?')[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold">{profile.full_name || 'Anonymous'}</div>
                                                <div className="text-sm text-neutral-400">@{profile.username || 'no-username'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <RoleBadge role={profile.role} />
                                    </td>
                                    <td className="p-4 text-sm text-neutral-400">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <UserRoleSelect userId={profile.id} currentRole={profile.role} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const colors: Record<string, string> = {
        superadmin: 'bg-red-500/20 text-red-400 border-red-500/30',
        admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        founder: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        member: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        user: 'bg-neutral-800 text-neutral-400 border-white/10'
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-bold border ${colors[role] || colors.user} uppercase`}>
            {role}
        </span>
    );
}
