import { createClient } from '@/utils/supabase/server';
import Link from "next/link";
import Image from "next/image";
import { redirect } from 'next/navigation';
import JoinFlow from '@/components/auth/JoinFlow';
import { Metadata } from "next";

interface Props {
    searchParams: Promise<{
        id?: string;
        token?: string;
        team?: string;
        code?: string;
        email?: string;
    }>;
}

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
            images: [`/join/opengraph-image?token=${token}`]
        }
    };
}

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
        <>
            <div className="v2-header profile-nav">
                <Link href="/" className="v2-title-link">
                    <h1 className="v2-title">
                        <span className="v2-text-white">GRID</span>
                        <span className="v2-text-accent">PASS</span>
                    </h1>
                </Link>
            </div>

            <div className="v2-content flex flex-col items-center justify-center min-h-[80vh]">
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
        </>
    );
}
