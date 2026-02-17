'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Trash2, Edit2, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ResultsUpload } from './results-upload';

type Event = {
    id: string;
    name: string;
    track_name: string;
    config_name: string | null;
    start_time: string;
    status: string;
    season_id: string;
};

export function EventList({ events: initialEvents, leagueId, activeSeason, members }: { events: Event[], leagueId: string, activeSeason: any, members: any[] }) {
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    // Sync props to state
    useState(() => {
        setEvents(initialEvents);
    });

    // Form State
    const [name, setName] = useState('');
    const [trackName, setTrackName] = useState('');
    const [configName, setConfigName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [status, setStatus] = useState('scheduled');

    const supabase = createClient();

    const resetForm = () => {
        setName('');
        setTrackName('');
        setConfigName('');
        setStartTime('');
        setStatus('scheduled');
        setEditingEvent(null);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) resetForm();
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setName(event.name);
        setTrackName(event.track_name);
        setConfigName(event.config_name || '');
        // Format for datetime-local input: YYYY-MM-DDTHH:mm
        const date = new Date(event.start_time);
        // Adjust for timezone offset to show correct local time in input
        const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setStartTime(localIso);
        setStatus(event.status);
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        setLoading(true);
        const { error } = await supabase.from('os_league_events').delete().eq('id', id);

        if (error) {
            toast.error('Failed to delete event: ' + error.message);
            console.error(error);
        } else {
            setEvents(prev => prev.filter(e => e.id !== id));
            toast.success('Event deleted');
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!seasonId) {
            toast.error('No active season found');
            return;
        }

        setLoading(true);

        try {
            const eventData = {
                name,
                track_name: trackName,
                config_name: configName || null,
                start_time: new Date(startTime).toISOString(),
                status,
                league_id: leagueId,
                season_id: seasonId
            };

            if (editingEvent) {
                // Update
                const { error, data } = await supabase
                    .from('os_league_events')
                    .update(eventData)
                    .eq('id', editingEvent.id)
                    .select()
                    .single();

                if (error) throw error;

                setEvents(prev => prev.map(e => e.id === editingEvent.id ? data : e));
                toast.success('Event updated');
                setIsOpen(false);
            } else {
                // Create
                const { error, data } = await supabase
                    .from('os_league_events')
                    .insert([eventData])
                    .select()
                    .single();

                if (error) throw error;

                setEvents(prev => [...prev, data].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
                toast.success('Event created');
                setIsOpen(false);
            }
        } catch (err: any) {
            toast.error('Operation failed: ' + (err.message || 'Unknown error'));
            console.error('Event submit error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                <div>
                    <h3 className="font-bold text-white">Season Schedule</h3>
                    <p className="text-sm text-gray-400">Manage race events for the active season</p>
                </div>
                <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="bg-cyan-500 text-black hover:bg-cyan-400">
                            <Plus className="w-4 h-4 mr-2" /> Add Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Event Name</Label>
                                <Input
                                    placeholder="e.g. Round 1: Daytona"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="bg-black border-zinc-700"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Track Name</Label>
                                    <Input
                                        placeholder="e.g. Daytona Intl Speedway"
                                        value={trackName}
                                        onChange={e => setTrackName(e.target.value)}
                                        className="bg-black border-zinc-700"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Config (Optional)</Label>
                                    <Input
                                        placeholder="e.g. Road Course"
                                        value={configName}
                                        onChange={e => setConfigName(e.target.value)}
                                        className="bg-black border-zinc-700"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="bg-black border-zinc-700"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="bg-black border-zinc-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                            <SelectItem value="scheduled">Scheduled</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-cyan-500 text-black w-full" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingEvent ? 'Update Event' : 'Create Event')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-gray-400">Date & Time</TableHead>
                            <TableHead className="text-gray-400">Event Details</TableHead>
                            <TableHead className="text-gray-400">Track</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                    No events scheduled yet. Click "Add Event" to start the season.
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => (
                                <TableRow key={event.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-mono text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-cyan-500" />
                                            {format(new Date(event.start_time), 'MMM d, yyyy HH:mm')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-white">{event.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <span>{event.track_name}</span>
                                            {event.config_name && <Badge variant="outline" className="text-xs ml-2 border-white/10">{event.config_name}</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={event.status === 'completed' ? 'secondary' : event.status === 'active' ? 'default' : 'outline'} className="capitalize">
                                            {event.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center space-x-2">
                                            <ResultsUpload
                                                eventId={event.id}
                                                seasonId={event.season_id}
                                                members={members}
                                                pointsConfig={activeSeason?.metadata?.points_system}
                                                onSuccess={() => {
                                                    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'completed' } : e));
                                                }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDelete(event.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
