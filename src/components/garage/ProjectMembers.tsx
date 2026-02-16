'use client';

import { useState } from 'react';
import { GarageProject, ProjectMember } from '@/types/garage';
import { addMemberByUserId, removeMember } from '@/app/actions/project'; // inviteMember not implemented yet fully
import { Plus, User, Trash2, Shield, Wrench, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProjectMembersProps {
    project: GarageProject;
    initialMembers: ProjectMember[];
}

export default function ProjectMembers({ project, initialMembers }: ProjectMembersProps) {
    const [members, setMembers] = useState(initialMembers);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const router = useRouter();

    const handleAddMember = () => {
        // Placeholder simple prompt for MVP
        const userId = prompt("Enter User ID to add (placeholder for viral invite):");
        if (userId) {
            addMemberByUserId(project.id, userId, 'mechanic')
                .then(() => router.refresh())
                .catch(err => alert('Failed to add member: ' + err.message));
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Remove this member?')) return;
        try {
            await removeMember(project.id, userId);
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown className="w-3 h-3 text-amber-400" />;
            case 'admin': return <Shield className="w-3 h-3 text-blue-400" />;
            case 'mechanic': return <Wrench className="w-3 h-3 text-neutral-400" />;
            default: return <User className="w-3 h-3 text-neutral-500" />;
        }
    };

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm uppercase text-neutral-500 tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Team
                </h3>
                <button
                    onClick={handleAddMember}
                    className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3">
                {members.length === 0 ? (
                    <p className="text-sm text-neutral-600 italic">No members yet.</p>
                ) : (
                    members.map(member => (
                        <div key={member.id} className="flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                                    {(member as any).profiles?.full_name?.[0] || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white leading-none">
                                        {(member as any).profiles?.full_name || 'User'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {getRoleIcon(member.role)}
                                        <span className="text-[10px] uppercase font-bold text-neutral-500">{member.role}</span>
                                    </div>
                                </div>
                            </div>

                            {member.role !== 'owner' && (
                                <button
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <button className="text-xs text-neutral-500 hover:text-white font-bold uppercase tracking-wider">
                    Generate Invite Link
                </button>
            </div>
        </div>
    );
}
