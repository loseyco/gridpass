import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Settings, Trophy, Plus } from 'lucide-react';
import Link from 'next/link';
import { DriverTable } from '@/components/admin/driver-table';

export default async function LeagueAdminPage() {
    const supabase = await createClient();

    // Fetch Official League & Active Season
    const { data: league } = await supabase
        .from('os_leagues')
        .select(`
            *,
            seasons:os_league_seasons(*)
        `)
        .eq('is_official', true)
        .single();

    if (!league) {
        return <div className="p-8 text-white">No Official League Found. Run seed script.</div>;
    }

    const activeSeason = league.seasons.find((s: any) => s.is_active);

    // Fetch Members for Admin
    const { data: members } = await supabase
        .from('os_league_members')
        .select(`
            *,
            user:user_id(email, raw_user_meta_data)
        `)
        .eq('league_id', league.id)
        .order('joined_at', { ascending: false });

    // Transform user metadata for Client Component
    const formattedMembers = members?.map(m => ({
        ...m,
        user: {
            email: m.user?.email,
            user_metadata: m.user?.raw_user_meta_data
        }
    }));

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">League Administration</h1>
                        <p className="text-gray-400">Manage {league.name}</p>
                    </div>
                    <Button>
                        <Settings className="mr-2 h-4 w-4" /> Global Settings
                    </Button>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-zinc-900 border-zinc-800">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="schedule">Schedule & Events</TabsTrigger>
                        <TabsTrigger value="drivers">Drivers & Members</TabsTrigger>
                        <TabsTrigger value="scoring">Points & Scoring</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-400">Active Season</CardTitle>
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{activeSeason?.name || 'None'}</div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {activeSeason ? `${activeSeason.slug}` : 'Create a season to start'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-400">Total Members</CardTitle>
                                    <Users className="h-4 w-4 text-cyan-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">-</div>
                                    <p className="text-xs text-gray-500 mt-1">Drivers registered</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-400">Next Event</CardTitle>
                                    <Calendar className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">None Scheduled</div>
                                    <Button variant="link" className="text-cyan-500 h-auto p-0 text-xs mt-1">
                                        + Add Event
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Seasons List */}
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle>Seasons</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {league.seasons.map((season: any) => (
                                        <div key={season.id} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/5">
                                            <div>
                                                <div className="font-bold">{season.name}</div>
                                                <div className="text-xs text-gray-500">{season.slug}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {season.is_active && <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">Active</span>}
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full border-dashed border-white/10 hover:bg-white/5 text-gray-400">
                                        <Plus className="mr-2 h-4 w-4" /> Create New Season
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SCHEDULE TAB */}
                    <TabsContent value="schedule">
                        <div className="p-12 text-center text-gray-500 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-white">Event Management</h3>
                            <p className="mb-6">Schedule races, practices, and configure track info.</p>
                            <Button className="bg-cyan-500 text-black font-bold">Manage Schedule</Button>
                        </div>
                    </TabsContent>

                    {/* DRIVERS TAB */}
                    <TabsContent value="drivers">
                        <DriverTable members={formattedMembers || []} />
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
