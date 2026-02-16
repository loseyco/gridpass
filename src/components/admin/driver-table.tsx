'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Member = {
    id: string;
    user_id: string;
    role: string;
    status: string;
    iracing_customer_id: number | null;
    car_number: string | null;
    user: {
        email: string;
        user_metadata: any;
    };
    joined_at: string;
};

export function DriverTable({ members }: { members: Member[] }) {
    const [driverList, setDriverList] = useState(members);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempIracingId, setTempIracingId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const startEdit = (member: Member) => {
        setEditingId(member.id);
        setTempIracingId(member.iracing_customer_id?.toString() || '');
    };

    const saveEdit = async (memberId: string) => {
        setLoading(true);
        const newId = parseInt(tempIracingId);

        if (isNaN(newId)) {
            alert('Invalid ID');
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('os_league_members')
            .update({ iracing_customer_id: newId })
            .eq('id', memberId);

        if (error) {
            console.error(error);
            alert('Failed to update');
        } else {
            setDriverList(prev => prev.map(m =>
                m.id === memberId ? { ...m, iracing_customer_id: newId } : m
            ));
            setEditingId(null);
        }
        setLoading(false);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-white">League Members</h3>
                <Badge variant="outline">{driverList.length} Drivers</Badge>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400">User / Email</TableHead>
                        <TableHead className="text-gray-400">Role</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">iRacing ID</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {driverList.map((member) => (
                        <TableRow key={member.id} className="border-white/5 hover:bg-white/5">
                            <TableCell>
                                <div className="font-medium text-white">
                                    {member.user?.user_metadata?.full_name || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-500">{member.user?.email}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="bg-white/10 text-gray-300 capitalize">
                                    {member.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${member.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="capitalize text-gray-400">{member.status}</span>
                            </TableCell>
                            <TableCell>
                                {editingId === member.id ? (
                                    <Input
                                        value={tempIracingId}
                                        onChange={(e) => setTempIracingId(e.target.value)}
                                        className="h-8 w-32 bg-black border-white/20"
                                        autoFocus
                                    />
                                ) : (
                                    <span className={`font-mono ${!member.iracing_customer_id ? 'text-red-500' : 'text-cyan-500'}`}>
                                        {member.iracing_customer_id || 'Not Mapped'}
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {editingId === member.id ? (
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={loading}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" className="bg-cyan-500 text-black font-bold" onClick={() => saveEdit(member.id)} disabled={loading}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => startEdit(member)}>
                                        Edit ID
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {driverList.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No members found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
