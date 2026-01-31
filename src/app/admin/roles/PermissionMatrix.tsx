'use client'

import { useState } from 'react';
import { togglePermission } from './actions';
import { ROLES, KNOWN_PERMISSIONS, UserRole, Permission } from '@/utils/rbac-shared';
import { Loader2, Check } from 'lucide-react';

type PermissionMatrixProps = {
    permissions: { role: UserRole; permission: string }[];
};

export default function PermissionMatrix({ permissions }: PermissionMatrixProps) {
    // Local state for optimistic updates could be complex, relying on server revalidation for now
    // but we track loading states per cell
    const [loading, setLoading] = useState<string | null>(null);

    const hasPerm = (role: UserRole, perm: string) => {
        return permissions.some(p => p.role === role && p.permission === perm);
    };

    const handleToggle = async (role: UserRole, perm: string, current: boolean) => {
        const id = `${role}-${perm}`;
        setLoading(id);
        try {
            await togglePermission(role, perm, !current);
        } catch (e) {
            console.error(e);
            alert('Failed to update permission');
        } finally {
            setLoading(null);
        }
    };

    const roles = Object.values(ROLES).filter(r => r !== 'superadmin'); // Superadmin has everything by default

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="p-4 bg-neutral-900 border border-white/10 text-neutral-400 font-bold text-xs uppercase sticky left-0 z-10 w-48">
                            Permission
                        </th>
                        {roles.map(role => (
                            <th key={role} className="p-4 bg-neutral-900 border border-white/10 text-neutral-400 font-bold text-xs uppercase text-center min-w-[100px]">
                                {role}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {KNOWN_PERMISSIONS.map(perm => (
                        <tr key={perm} className="hover:bg-white/5">
                            <td className="p-4 border border-white/10 bg-neutral-950 font-mono text-xs text-neutral-300 sticky left-0 z-10">
                                {perm}
                            </td>
                            {roles.map(role => {
                                const isGranted = hasPerm(role, perm);
                                const isLoading = loading === `${role}-${perm}`;

                                return (
                                    <td key={`${role}-${perm}`} className="p-4 border border-white/10 text-center">
                                        <button
                                            onClick={() => handleToggle(role, perm, isGranted)}
                                            disabled={isLoading}
                                            className={`w-6 h-6 rounded border flex items-center justify-center transition-all mx-auto ${isGranted
                                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                                : 'bg-neutral-900 border-white/20 text-transparent hover:border-white/40'
                                                }`}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Check className={`w-4 h-4 ${isGranted ? 'opacity-100' : 'opacity-0'}`} />
                                            )}
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
