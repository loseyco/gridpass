import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import JoinFlow from '@/components/auth/JoinFlow';
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import '../../app//.css'; // Import V2 styles

interface Props {
    searchParams: Promise<{
        id?: string;
        token?: string;
        team?: string;
        code?: string;
        email?: string;
    }>;
}

export const metadata: Metadata = {
    title: 'Join GridPass',
    description: 'The Business Operating System for Racing.',
};

export default async function JoinPage(props: Props) {
    const searchParams = await props.searchParams;
    const { id, token, team, code, email } = searchParams as any;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Invite Logic
    let invite = null;

    if (token) {
        const { data: inviteData, error: inviteError } = await supabase.rpc('get_invite_by_token', { lookup_token: token });
        if (inviteData && !inviteData.used_at) {
            invite = inviteData;
        }
    }

    // Redirect logged in users IF no invite
    if (user && !invite) {
        redirect('/');
    }

    return (
        <div className="v2-container flex flex-col min-h-screen">
            <div className="v2-header profile-nav">
                <Link href="/" className="v2-title-link">
                    <h1 className="v2-title">
                        <span className="v2-text-white">GRID</span>
                        <span className="v2-text-accent">PASS</span>
                    </h1>
                </Link>
            </div>

            <div className="v2-content flex flex-col items-center justify-center flex-1">
                <div className="w-full max-w-lg">
                    <JoinFlow
                        user={user}
                        invite={invite}
                        trackingId={id}
                        teamSlug={team}
                        inviteCode={code}
                        initialEmail={email}
                        hideFounder={true}
                        theme="v2"
                        defaultToRegister={true}
                        loginUrl="/login"
                    />
                </div>
            </div>
        </div>
    );
}
