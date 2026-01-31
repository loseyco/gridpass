'use client';

import { useState, useTransition } from 'react';
import { setImpersonationRole } from '@/app/actions/impersonate';
import { ROLES, UserRole } from '@/utils/rbac-shared';
import { Eye, X, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ImpersonationBar({ currentRole }: { currentRole: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSetRole = (role: UserRole | 'clear') => {
        startTransition(async () => {
            await setImpersonationRole(role);
            router.refresh();
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 bg-red-600/90 text-white p-3 rounded-full shadow-lg hover:bg-red-500 transition-all border border-white/10 group"
                title="Impersonate Role"
            >
                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl p-4 w-72 animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-3 h-3 text-red-500" />
                    View As
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-neutral-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-2">
                <div className="text-xs text-neutral-500 mb-2">
                    Current View: <span className="text-white font-bold uppercase">{currentRole}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {Object.values(ROLES).map((role) => (
                        <button
                            key={role}
                            disabled={isPending}
                            onClick={() => handleSetRole(role)}
                            className={`px-3 py-2 text-xs font-bold rounded border transition-all ${currentRole === role
                                    ? 'bg-white text-black border-white'
                                    : 'bg-neutral-800 text-neutral-400 border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            {role.toUpperCase()}
                        </button>
                    ))}
                </div>

                <button
                    disabled={isPending}
                    onClick={() => handleSetRole('clear')}
                    className="w-full mt-2 px-3 py-2 text-xs font-bold rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Reset to Verified Superadmin
                </button>
            </div>
        </div>
    );
}
