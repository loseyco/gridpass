import { TeamMember } from '@/types/teams';
import { Badge } from '@/components/ui/badge';

interface RosterTableProps {
    members: any[]; // Using any for now to avoid strict type issues with join, or define extended type
}

export function RosterTable({ members }: RosterTableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Member</th>
                        <th scope="col" className="px-6 py-3">Role</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {members.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center">No members found.</td>
                        </tr>
                    ) : (
                        members.map((member) => (
                            <tr key={member.user_id || member.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                        {member.profiles?.avatar_url ? (
                                            <img src={member.profiles.avatar_url} alt={member.profiles.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                {member.profiles?.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{member.profiles?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">@{member.profiles?.username}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                                        {member.role}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(member.joined_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
