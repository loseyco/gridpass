import Link from "next/link";
import Image from "next/image";
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import JoinFlow from '@/components/auth/JoinFlow';

interface Props {
    searchParams: Promise<{
        id?: string;
        token?: string;
    }>;
}

export default async function JoinPage(props: Props) {
    const searchParams = await props.searchParams;
    const { id, token } = searchParams;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Invite Logic
    let invite = null;
    let error = null;

    if (token) {
        // Validate Token using RPC (Safe Public Check)
        const { data, error: rpcError } = await supabase.rpc('get_invite_by_token', { lookup_token: token });

        if (rpcError || !data) {
            // Invalid Token View
            return (
                <div className="min-h-screen flex items-center justify-center bg-black text-white">
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-red-500">Invalid Invite</h1>
                        <p className="text-neutral-400">This link is invalid or has expired.</p>
                        <Link href="/join" className="text-white underline">Join Normally</Link>
                    </div>
                </div>
            );
        }

        if (data.used_at) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-black text-white">
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-amber-500">Already Used</h1>
                        <p className="text-neutral-400">This invite ticket has already been claimed.</p>
                        <Link href="/join" className="text-white underline">Join Normally</Link>
                    </div>
                </div>
            );
        }

        invite = data;
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">Live Beta</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl">
                                JOIN THE<br />GRID.
                            </h1>
                            <p className="text-lg text-neutral-400 font-medium max-w-xs mx-auto leading-relaxed">
                                The premium digital identity for the modern motorsport era.
                            </p>
                        </div>
                    )}

                    <JoinFlow
                        user={user}
                        invite={invite}
                        trackingId={id}
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
