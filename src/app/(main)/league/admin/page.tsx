import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Settings, Trophy, Plus } from 'lucide-react';
import Link from 'next/link';
import { DriverTable } from '@/components/admin/driver-table';
import { EventList } from '@/components/admin/event-list';
import { PointsSystem } from '@/components/admin/points-system';

export const dynamic = 'force-dynamic';

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

    // Fetch Members (Base Data)
    const { data: members, error: membersError } = await supabase
        .from('os_league_members')
        .select('*')
        .eq('league_id', league.id)
        .order('joined_at', { ascending: false });

    // Fetch User Details via Admin (Service Role) to bypass RLS/Join limits
    let formattedMembers = members || [];
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // Auto-fix: If league has no owner, assign to current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (league && !league.owner_id && currentUser) {
        console.log(`[Admin] Claiming league ${league.id} for user ${currentUser.id}`);
        await adminSupabase
            .from('os_leagues')
            .update({ owner_id: currentUser.id })
            .eq('id', league.id);
    }

    if (members && members.length > 0) {
        // Map user details
        formattedMembers = await Promise.all(members.map(async (m) => {
            let userDetails = null;
            if (m.user_id) {
                const { data: { user } } = await adminSupabase.auth.admin.getUserById(m.user_id);
                if (user) {
                    userDetails = {
                        email: user.email,
                        user_metadata: user.user_metadata
                    };
                }
            }
            return {
                ...m,
                user: userDetails
            };
        }));
    }

    // Fetch Events for Active Season
    let events: any[] = [];
    if (activeSeason) {
        const { data: seasonEvents } = await supabase
            .from('os_league_events')
            .select('*')
            .eq('season_id', activeSeason.id)
            .order('start_time', { ascending: true });
        events = seasonEvents || [];
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">League Administration</h1>
                        <p className="text-gray-400">Manage {league.name}</p>
                    </div>
                    <Button variant="outline" className="border-white/10">
                        <Settings className="mr-2 h-4 w-4" /> Global Settings
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Active Season</CardTitle>
                            <Trophy className="h-4 w-4 text-cyan-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeSeason?.name || 'No Active Season'}</div>
                            <p className="text-xs text-gray-500">{activeSeason?.slug}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total Members</CardTitle>
                            <Users className="h-4 w-4 text-cyan-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{members?.length || 0}</div>
                            <p className="text-xs text-gray-500">Drivers registered</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Next Event</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {events.find(e => new Date(e.start_time) > new Date())?.name || 'None Scheduled'}
                            </div>
                            <Button variant="link" className="text-cyan-500 p-0 h-auto text-xs">
                                + Add Event
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="drivers" className="space-y-4">
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="schedule">Schedule & Events</TabsTrigger>
                        <TabsTrigger value="drivers">Drivers & Members</TabsTrigger>
                        <TabsTrigger value="scoring">Points & Scoring</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card className="bg-zinc-900 border-zinc-800 text-white">
                            <CardHeader>
                                <CardTitle>Seasons</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {league.seasons.map((season: any) => (
                                    <div key={season.id} className="flex items-center justify-between p-4 border border-zinc-800 rounded mb-2">
                                        <div>
                                            <div className="font-bold">{season.name}</div>
                                            <div className="text-xs text-gray-500">{season.slug}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {season.is_active && <div className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Active</div>}
                                            <Button size="sm" variant="ghost">Edit</Button>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="ghost" className="w-full mt-4 border border-zinc-800 border-dashed text-gray-400 hover:text-white">
                                    <Plus className="h-4 w-4 mr-2" /> Create New Season
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="schedule" className="space-y-4">
                        <EventList events={events} leagueId={league.id} activeSeason={activeSeason} members={formattedMembers} />
                    </TabsContent>

                    <TabsContent value="drivers" className="space-y-4">
                        <DriverTable members={formattedMembers} />
                    </TabsContent>

                    <TabsContent value="scoring" className="space-y-4">
                        <PointsSystem season={activeSeason} />
                    </TabsContent>
                </Tabs>
            </div >
        </div >
    );
}
