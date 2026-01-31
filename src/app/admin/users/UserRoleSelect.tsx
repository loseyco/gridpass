'use client'

import { useState } from 'react';
import { updateUserRole } from './actions';
import { UserRole } from '@/utils/rbac-shared';
import { Loader2, ChevronDown } from 'lucide-react';

export default function UserRoleSelect({ userId, currentRole }: { userId: string, currentRole: string }) {
    const [isPending, setIsPending] = useState(false);

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as UserRole;
        if (newRole === currentRole) return;

        const confirm = window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`);
        if (!confirm) {
            e.target.value = currentRole; // Reset UI
            return;
        }

        setIsPending(true);
        try {
            await updateUserRole(userId, newRole);
        } catch (error) {
            alert('Failed to update role');
            console.error(error);
            e.target.value = currentRole; // Reset UI
        } finally {
            setIsPending(false);
        }
    };

    const roleColors: Record<string, string> = {
        superadmin: 'text-red-400',
        admin: 'text-orange-400',
        founder: 'text-purple-400',
        member: 'text-emerald-400',
        user: 'text-neutral-400'
    };

    return (
        <div className="relative inline-block w-32">
            <select
                defaultValue={currentRole}
                disabled={isPending}
                onChange={handleChange}
                className={`w-full bg-neutral-900 border border-white/10 rounded px-3 py-1.5 text-xs font-bold uppercase appearance-none cursor-pointer hover:bg-neutral-800 transition-colors focus:ring-1 focus:ring-white/20 outline-none ${roleColors[currentRole] || 'text-white'}`}
            >
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="founder">Founder</option>
                <option value="member">Member</option>
                <option value="user">User</option>
            </select>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white/50" />
                ) : (
                    <ChevronDown className="w-3 h-3 text-white/30" />
                )}
            </div>
        </div>
    );
}
