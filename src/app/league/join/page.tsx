'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LeagueJoinPage() {
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        setLoading(true);
        try {
            // 1. Get Active Season
            const seasonRes = await fetch('/api/league/test');
            const seasonData = await seasonRes.json();
            const activeSeason = seasonData.seasons?.find((s: any) => s.is_active);

            if (!activeSeason) {
                alert('No active season found.');
                setLoading(false);
                return;
            }

            // 2. Join League (Free)
            const res = await fetch('/api/league/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seasonId: activeSeason.id })
            });

            const data = await res.json();
            if (data.success) {
                window.location.href = '/league/driver';
            } else {
                alert(data.error || 'Failed to join');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            alert('Error joining league');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">

            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">

                {/* Left: Value Prop */}
                <div className="space-y-6">
                    <Link href="/league" className="text-cyan-500 hover:text-cyan-400 font-medium mb-4 inline-block">&larr; Back to League</Link>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold uppercase tracking-wider mb-4 border border-yellow-500/20">
                        🚧 Alpha Release
                    </div>
                    <h1 className="text-5xl font-black tracking-tight">
                        Race for glory.<br />
                        <span className="text-cyan-500">Build the future.</span>
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        Join the GridPass Official League (Alpha). Help us test the platform and shape the future of sim racing.
                        Free entry for all testers during this phase.
                    </p>

                    <ul className="space-y-4 pt-4">
                        <BenefitItem text="12 Official Championship Rounds" />
                        <BenefitItem text="Community Setups & Tips" />
                        <BenefitItem text="Live Broadcasts on YouTube" />
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
                        <Button
                            onClick={handleJoin}
                            disabled={loading}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 text-lg shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-shadow hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                            <Zap className="mr-2 h-5 w-5" />
                            {loading ? 'Joining...' : 'Join Now (Free)'}
                        </Button>
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
