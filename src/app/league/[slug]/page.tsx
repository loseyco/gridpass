import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Trophy, Calendar, Flag, Shield, Zap, TrendingUp, Settings } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { StandingsTable } from '@/components/league/standings-table';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const supabase = await createClient();

    const { data: league } = await supabase
        .from('os_leagues')
        .select('name, description')
        .eq('slug', params.slug)
        .single();

    if (!league) {
        return {
            title: 'League Not Found',
        };
    }

    return {
        title: league.name,
        description: league.description || `Join ${league.name} on GridPass.`,
        openGraph: {
            title: league.name,
            description: league.description || `Join ${league.name} on GridPass.`,
        }
    };
}

async function getLeagueData(slug: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch League
    const { data: league, error: leagueError } = await supabase
        .from('os_leagues')
        .select(`
    *,
    seasons: os_league_seasons(
        id, name, start_date, end_date, is_active, metadata
    )
        `)
        .eq('slug', slug)
        .single();

    if (leagueError) console.error('[LeaguePage] League Error:', leagueError);

    if (!league) return null;

    const isOwner = user?.id === league.owner_id;

    const activeSeason = league.seasons?.find((s: any) => s.is_active) || league.seasons?.[0];

    // If no active season, return early with empty data but still show league info
    if (!activeSeason) return { league, events: [], standings: [], isOwner, activeSeason: null };

    // 2. Fetch Events
    const { data: events, error: eventsError } = await supabase
        .from('os_league_events')
        .select('*')
        .eq('season_id', activeSeason.id)
        .order('start_time', { ascending: true });

    if (eventsError) console.error('[LeaguePage] Events Error:', eventsError);
    console.log('[LeaguePage] Active Season:', activeSeason.name, activeSeason.id);
    console.log('[LeaguePage] Events Found:', events?.length);
    if (events?.length) console.log('[LeaguePage] First Event ID:', events[0].id);

    // 3. Fetch Members & User Data (Admin workaround for public page name visibility)
    // We use the Service Role to list users because foreign key join to auth.users is often hidden.
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

    const { data: { users: allUsers }, error: usersError } = await adminSupabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });
    const userMap = new Map(allUsers?.map(u => [u.id, u]) || []);

    const { data: members, error: membersError } = await supabase
        .from('os_league_members')
        .select(`
id,
    car_number,
    user_id
        `)
        .eq('league_id', league.id);

    if (membersError) console.error('[LeaguePage] Members Error:', membersError);

    // 4. Fetch Results for Standings (Only 'official' results)
    const { data: results, error: resultsError } = await supabase
        .from('os_league_race_results')
        .select(`
points_earned,
    position,
    incidents,
    driver_member_id
        `)
        .eq('status', 'official')
        .in('event_id', (events || []).map(e => e.id));

    if (resultsError) console.error('[LeaguePage] Results Error:', resultsError);
    console.log('[LeaguePage] Results Found (count):', results?.length);

    // 5. Calculate Standings
    const driverMap = new Map();
    const membersMap = new Map(members?.map((m: any) => [m.id, m]));

    if (results) {
        results.forEach((r: any) => {
            const dId = r.driver_member_id;
            if (!driverMap.has(dId)) {
                // Get name safely from pre-fetched members and user map
                const member = membersMap.get(dId);
                const user = member ? userMap.get(member.user_id) : null;

                const fullName = user?.user_metadata?.full_name || 'Unknown Driver';
                const carNum = member?.car_number || '#';

                driverMap.set(dId, {
                    driver_name: fullName,
                    car_number: carNum,
                    points: 0,
                    wins: 0,
                    top5: 0,
                    incidents: 0
                });
            }

            const stats = driverMap.get(dId);
            stats.points += Number(r.points_earned);
            stats.incidents += (r.incidents || 0);
            if (r.position === 1) stats.wins++;
            if (r.position <= 5) stats.top5++;
        });
    }

    const standings = Array.from(driverMap.values())
        .sort((a, b) => b.points - a.points)
        .map((s, index) => ({
            ...s,
            rank: index + 1,
            diff_leader: index === 0 ? 0 : (Array.from(driverMap.values()).sort((x, y) => y.points - x.points)[0].points - s.points)
        }));

    return { league, activeSeason, events: events || [], standings, isOwner };
}

export default async function LeagueLandingPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const data = await getLeagueData(params.slug);

    if (!data) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 text-center">
            <h1 className="text-4xl font-bold mb-4">League Not Found</h1>
            <p className="text-gray-400">Initialize an official league in the admin panel first.</p>
        </div>;
    }

    const { league, activeSeason, events, standings, isOwner } = data;

    // Find next event
    const upcomingEvents = events.filter(e => new Date(e.start_time) > new Date());
    const nextEvent = upcomingEvents[0]; // ordered by start_time ascending

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
            {/* Hero Section */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                {/* Background Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black z-0" />
                    {/* Placeholder for a cool racing video or image */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                </div>

                <div className="container relative z-20 px-4 text-center">
                    {/* Admin Bar */}
                    {isOwner && (
                        <div className="absolute top-0 right-0 p-4 animate-fade-in">
                            <Link href="/league/admin">
                                <Button variant="outline" className="bg-black/50 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black gap-2 backdrop-blur-md">
                                    <Settings className="h-4 w-4" />
                                    Manage League
                                </Button>
                            </Link>
                        </div>
                    )}
                    {activeSeason && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-400 text-sm font-medium mb-6 animate-fade-in-up">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate - ping absolute inline - flex h - full w - full rounded - full bg - cyan - 400 opacity - 75 ${activeSeason.is_active ? '' : 'hidden'} `}></span>
                                <span className={`relative inline - flex rounded - full h - 2 w - 2 ${activeSeason.is_active ? 'bg-cyan-500' : 'bg-gray-500'} `}></span>
                            </span>
                            {activeSeason.name}
                        </div>
                    )}

                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl uppercase">
                        {league.name}
                    </h1>

                    <p className="text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed line-clamp-3">
                        {league.description || "The premium sim racing league ecosystem. Professional stewarding, broadcasted races, and a massive prize pool."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href={`/league/${league.slug}/join`}>
                            <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg px-8 py-6 h-auto rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all hover:scale-105">
                                Join Season
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link >
                        <Link href="#schedule">
                            <Button variant="outline" size="lg" className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-lg px-8 py-6 h-auto rounded-xl backdrop-blur-sm">
                                View Schedule
                            </Button>
                        </Link>
                    </div >
                </div >
            </section >

            {/* Standings Section - New! */}
            {
                standings.length > 0 && (
                    <section id="standings" className="py-24 bg-zinc-950/50 border-t border-white/5 relative">
                        <div className="container px-4">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight flex items-center justify-center gap-4">
                                    <Trophy className="h-10 w-10 text-yellow-400" />
                                    Championship Standings
                                </h2>
                                <p className="text-gray-400 text-lg">Current points battle for the {activeSeason?.name} title.</p>
                            </div>

                            <div className="max-w-5xl mx-auto">
                                <StandingsTable standings={standings} />

                                <div className="mt-8 text-center">
                                    <Button variant="link" className="text-cyan-400 hover:text-cyan-300">View Full Standings &rarr;</Button>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }

            {/* Schedule Preview */}
            <section id="schedule" className="py-24 bg-zinc-900/50 relative border-t border-white/5">
                <div className="container px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div>
                            <h2 className="text-4xl font-bold mb-2">Season Calendar</h2>
                            <p className="text-gray-400">{events.length} Rounds of intense competition across the world's best circuits.</p>
                        </div>
                        <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">Detailed Schedule &rarr;</Button>
                    </div>

                    <div className="grid gap-4 max-w-5xl mx-auto">
                        {events.length === 0 ? (
                            <div className="text-center p-12 bg-white/5 rounded-xl border border-white/10 text-gray-500">
                                No events scheduled yet.
                            </div>
                        ) : (
                            events.map((event, index) => (
                                <div key={event.id} className={`group flex flex - col md: flex - row items - center bg - black / 40 border border - white / 5 p - 6 rounded - 2xl hover: border - cyan - 500 / 30 transition - all hover: bg - white / 5 ${event.status === 'completed' ? 'opacity-75 hover:opacity-100' : ''} `}>
                                    <div className={`flex - shrink - 0 w - 16 h - 16 rounded - xl flex items - center justify - center font - mono text - 2xl font - bold transition - colors mb - 4 md: mb - 0
                                        ${event.status === 'completed' ? 'bg-cyan-900/20 text-cyan-400' : 'bg-zinc-800 text-zinc-500 group-hover:text-white'}
`}>
                                        R{index + 1}
                                    </div>
                                    <div className="md:ml-6 flex-grow text-center md:text-left">
                                        <div className="flex flex-col md:flex-row items-center gap-3 mb-1 justify-center md:justify-start">
                                            <h3 className="text-xl font-bold">{event.name}</h3>
                                            {event.status === 'completed' ? (
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">COMPLETED</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-white/60">UPCOMING</span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm md:text-base flex items-center justify-center md:justify-start gap-2 mt-2 md:mt-0">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(event.start_time), 'MMM d, yyyy @ h:mm a')}
                                            <span className="mx-2 text-zinc-700">|</span>
                                            <Flag className="h-4 w-4" />
                                            {event.track_name}
                                        </p>
                                    </div>
                                    <div className="mt-4 md:mt-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        {event.status === 'completed' ? (
                                            <Button size="sm" variant="default" className="bg-cyan-500 text-black font-bold">Results</Button>
                                        ) : (
                                            <Button size="sm" variant="secondary">Race Info</Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-black relative border-t border-white/5">
                <div className="container px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="h-8 w-8 text-cyan-500" />}
                            title="Pro Stewarding"
                            description="Fair racing guaranteed. Our dedicated stewards review all incidents post-race to ensure clean competition."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8 text-purple-500" />}
                            title="Automated Scoring"
                            description="Instant results. Points, standings, and safety ratings are updated automatically the moment the checkered flag waves."
                        />
                        <FeatureCard
                            icon={<Trophy className="h-8 w-8 text-yellow-500" />}
                            title="Cash Prizes"
                            description="Race for real money. Top finishers in each division take home a share of the season's prize pool."
                        />
                    </div>
                </div>
            </section>
        </div >
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="p-8 bg-zinc-900/50 border-white/5 backdrop-blur hover:bg-zinc-900 transition-colors group">
            <div className="mb-6 p-4 rounded-2xl bg-black w-fit group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-lg">
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">
                {description}
            </p>
        </Card>
    );
}
