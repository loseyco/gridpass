
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { JoinButton } from '@/components/league/join-button';
import { notFound } from 'next/navigation';

async function getJoinData(slug: string) {
    const supabase = await createClient();

    const { data: league, error } = await supabase
        .from('os_leagues')
        .select(`
            *,
            seasons:os_league_seasons(
                id, is_active, metadata
            )
        `)
        .eq('slug', slug)
        .single();

    if (error || !league) return null;

    const activeSeason = league.seasons?.find((s: any) => s.is_active) || league.seasons?.[0]; // Fallback to *any* season if no active one? Ideally strict.

    return { league, activeSeason };
}

export default async function LeagueJoinPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const data = await getJoinData(params.slug);

    if (!data) notFound();

    const { league, activeSeason } = data;

    if (!activeSeason) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">No Active Season</h1>
                    <p className="text-gray-400 mb-4">This league currently has no active season to join.</p>
                    <Link href={`/league/${league.slug}`} className="text-cyan-500 hover:underline">
                        Return to League Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">

            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">

                {/* Left: Value Prop */}
                <div className="space-y-6">
                    <Link href={`/league/${league.slug}`} className="text-cyan-500 hover:text-cyan-400 font-medium mb-4 inline-block">&larr; Back to League</Link>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold uppercase tracking-wider mb-4 border border-yellow-500/20">
                        🚧 Alpha Release
                    </div>
                    <h1 className="text-5xl font-black tracking-tight">
                        Race for glory in<br />
                        <span className="text-cyan-500">{league.name}.</span>
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        Join the {league.name} (Alpha). {league.description || 'Compete against the best drivers.'}
                        Free entry for all testers during this phase.
                    </p>

                    <ul className="space-y-4 pt-4">
                        <BenefitItem text="Official Championship Rounds" />
                        <BenefitItem text="Community Setups & Tips" />
                        <BenefitItem text="Live Broadcasts" />
                        <BenefitItem text="Stewarding & Incident Review" />
                        <BenefitItem text="Test Driver Status" />
                    </ul>
                </div>

                {/* Right: Pricing Card */}
                <Card className="bg-zinc-900 border-zinc-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                        Free Entry
                    </div>
                    <CardHeader className="text-center pt-10 pb-2">
                        <CardTitle className="text-lg font-medium text-gray-400 uppercase tracking-widest">Alpha Tester</CardTitle>
                        <div className="flex items-center justify-center gap-1 mt-4 mb-2">
                            <span className="text-5xl font-bold text-white">$0</span>
                            <span className="text-xl text-gray-500">/mo</span>
                        </div>
                        <CardDescription className="text-gray-500">Limited time free access.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <JoinButton seasonId={activeSeason.id} />
                        <p className="text-xs text-center text-gray-500 mt-4">
                            No credit card required. Instant access.
                        </p>
                    </CardContent>
                    <CardFooter className="bg-black/20 border-t border-white/5 p-4 flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                            <span>Verified League</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span>Instant Access</span>
                        </div>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-lg text-gray-300">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Check className="h-4 w-4 text-cyan-500" />
            </div>
            {text}
        </li>
    );
}
