'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inviteMember } from '@/actions/invites';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface InviteMemberModalProps {
    teamId: string;
    slug: string;
}

export function InviteMemberModal({ teamId, slug }: InviteMemberModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            formData.append('teamId', teamId);
            formData.append('slug', slug);
            await inviteMember(formData);
            toast.success('Invite sent successfully');
            setIsOpen(false);
        } catch (e: any) {
            toast.error(e.message || 'Failed to send invite');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Invite Member</Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-border rounded-lg shadow-lg w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-2">Invite Team Member</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Send an invitation to a new member. They must have a GridPass account.
                        </p>

                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="colleague@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    name="role"
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue="member"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="driver">Driver</option>
                                    <option value="member">Member</option>
                                    <option value="mechanic">Mechanic</option>
                                    <option value="spotter">Spotter</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Invite'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
