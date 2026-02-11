import Link from "next/link";
import Image from "next/image";
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import JoinFlow from '@/components/auth/JoinFlow';
import VideoGuide from '@/components/VideoGuide';
import FeatureStatusBadge from '@/components/FeatureStatusBadge';

interface Props {
    searchParams: Promise<{
        id?: string;
        token?: string;
        team?: string;
        code?: string;
    }>;
}

import { Metadata } from "next";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { token } = await searchParams;

    if (!token) {
        return {
            title: "Join GridPass",
            description: "The Business Operating System for Racing. Start your career today."
        };
    }

    const supabase = await createClient();
    const { data } = await supabase.rpc('get_invite_by_token', { lookup_token: token });

    if (!data || data.used_at) {
        return {
            title: "Join GridPass",
            description: "This invite link is invalid or has expired."
        };
    }

    const role = data.role || 'Member';

    return {
        title: `You're invited to join as a ${role} | GridPass`,
        description: `You have been granted exclusive access to join GridPass with the ${role} role. Claim your spot now.`,
        openGraph: {
            images: [`/join/opengraph-image?token=${token}`] // Explicitly point to the generator with the token
        }
    };
}

export default async function JoinPage(props: Props) {
    const searchParams = await props.searchParams;
    const { id, token, team, code } = searchParams;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Invite Logic
    let invite = null;
    let error = null;

    if (token) {
        // ... existing logic ...
    }

    // Redirect logged in users IF no invite (if invite, let JoinFlow handle "Accept" logic)
    if (user && !invite) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-neutral-950 font-sans text-white selection:bg-indigo-500/30 relative">

            {/* Background with Overlay */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/bg-join.png"
                    alt="Racetrack Background"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/40" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="p-6 flex justify-center">
                    <Link href="/" className="relative w-40 h-10 opacity-90 block hover:opacity-100 transition-opacity">
                        <Image
                            src="/logo-text.png"
                            alt="GridPass"
                            fill
                            className="object-contain"
                        />
                    </Link>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-lg mx-auto pb-12">

                    {!invite && (
                        <div className="text-center space-y-3 mb-10">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <FeatureStatusBadge status="v1" />
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl">
                                JOIN THE<br />GRID.
                            </h1>
                            <p className="text-lg text-neutral-400 font-medium max-w-xs mx-auto leading-relaxed">
                                The premium digital identity for the modern motorsport era.
                            </p>
                            <div className="mt-4 flex justify-center">
                                <VideoGuide title="Join GridPass Guide" videoSrc="/guides/join.webp" triggerLabel="See How It Works" />
                            </div>
                        </div>
                    )}

                    <JoinFlow
                        user={user}
                        invite={invite}
                        trackingId={id}
                        teamSlug={team}
                        inviteCode={code}
                    />

                    {/* Quick Login Link in Footer if standard view */}
                    {!invite && !user && (
                        <div className="mt-12 flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                            <div className="h-4 w-12 bg-white/20 rounded-sm"></div>
                            <div className="h-5 w-16 bg-white/20 rounded-sm"></div>
                            <div className="h-3 w-10 bg-white/20 rounded-sm"></div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
