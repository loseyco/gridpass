import { getLeaderboardData } from '@/app/actions/analytics';
import Leaderboard from '@/components/Leaderboard';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Leaderboards | GridPass",
    description: "See who is leading the pack on GridPass.",
};

export default async function LeaderboardPage() {
    const data = await getLeaderboardData();

    return (
        <div className="min-h-screen bg-neutral-950 text-white pt-32 pb-12 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">Leaderboards</h1>
                    <p className="text-xl text-neutral-400">Top performers across the Grid.</p>
                </div>

                <Leaderboard initialData={data} />
            </div>
        </div>
    );
}
