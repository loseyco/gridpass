import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, ChevronRight, Flag, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LeagueDashboardPage() {
    const supabase = await createClient();

    // Fetch Recent Results (Real Data)
    const { data: recentResults } = await supabase
        .from('os_league_race_results')
        .select(`
            id,
            position,
            points_earned,
            event:os_league_events(name, start_time)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    // Fetch Active Season
    const { data: activeSeason } = await supabase
        .from('os_league_seasons')
        .select('name')
        .eq('is_active', true)
        .single();


    // Fetch Total Points (Aggregation - mocked for now or sum if possible)
    const totalRaces = recentResults?.length || 0;

    let apiStatus = 'Unknown';
    let dbInfo = '';
    try {
        const res = await fetch('http://localhost:3000/api/league/test', { cache: 'no-store' });
        const json = await res.json();
        apiStatus = json.message || 'Error';
        dbInfo = `Seasons: ${json.seasonCount}, Leagues: ${json.leagues?.length}`;
    } catch (e) {
        apiStatus = `Failed: ${e}`;
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 md:pt-28">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Driver Dashboard</h1>
                        <p className="text-gray-400">{activeSeason?.name || 'No Active Season'} &bull; 2026</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className="flex gap-3">
                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                <User className="mr-2 h-4 w-4" /> My Driver Profile
                            </Button>
                            <Link href="/league">
                                <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                                    League Hub
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard label="Championship Rank" value="-" icon={<Trophy className="text-yellow-500" />} />
                    <StatCard label="Total Points" value="0" icon={<Flag className="text-cyan-500" />} />
                    <StatCard label="Races Run" value="0" icon={<User className="text-green-500" />} />
                    <StatCard label="Next Race" value="TBD" icon={<Calendar className="text-purple-500" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Standings */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Championship Standings</CardTitle>
                                <Button variant="ghost" size="sm" className="text-cyan-500">View Full Table</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-gray-400 w-16">Pos</TableHead>
                                            <TableHead className="text-gray-400">Driver</TableHead>
                                            <TableHead className="text-gray-400 text-right">Points</TableHead>
                                            <TableHead className="text-gray-400 text-right">Wins</TableHead>
                                            <TableHead className="text-gray-400 text-right">Top 5</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="border-white/5 hover:bg-white/5">
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                No standings available yet. Season starting soon.
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Recent Results */}
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle>Recent Results</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentResults && recentResults.length > 0 ? recentResults.map((result: any, i: number) => (
                                        <div key={result.id} className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-1 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <h4 className="font-bold text-white">{result.event?.name || 'Unknown Event'}</h4>
                                                    <p className="text-xs text-gray-400">Finished: P{result.position} (+{result.points_earned} pts)</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-gray-500"><ChevronRight /></Button>
                                        </div>
                                    )) : (
                                        <p className="text-gray-500 italic">No race results found yet. Run the simulation!</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: Next Event & Setup */}
                    <div className="space-y-6">
                        <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/20 border-indigo-500/30 overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541334057-fa4c585b78f4?q=80&w=1000&auto=format&fit=crop')] bg-cover opacity-10"></div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-indigo-300">
                                    <Calendar className="h-5 w-5" /> Next Event
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <h3 className="text-2xl font-black uppercase italic mb-1">Daytona Int'l</h3>
                                <p className="text-sm text-indigo-200 mb-6">Feb 16 @ 8:00 PM EST</p>

                                <div className="space-y-3">
                                    <Button className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold">
                                        View Session Info
                                    </Button>
                                    <Button variant="outline" className="w-full border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/50">
                                        Download Setup
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle>Notifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm text-gray-400 border-l-2 border-yellow-500 pl-3">
                                    <p className="font-bold text-gray-300">Protest File Open</p>
                                    <p className="text-xs">You have 24h to respond to incident #492 from Sebring.</p>
                                </div>
                                <div className="text-sm text-gray-400 border-l-2 border-cyan-500 pl-3">
                                    <p className="font-bold text-gray-300">New Livery Available</p>
                                    <p className="text-xs">Team Red Bull has updated the paint scheme.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: any }) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                    {icon}
                </div>
            </CardContent>
        </Card>
    )
}
