import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { RosterTable } from '@/components/teams/RosterTable';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { InviteMemberModal } from '@/components/teams/InviteMemberModal';

export default async function TeamDashboard({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Get Team
    const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !team) notFound();

    // 2. Auth Check + Membership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/login?next=/team/${slug}/dashboard`);
    }

    const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', team.id)
        .eq('user_id', user.id)
        .maybeSingle();

    if (!member) {
        redirect(`/team/${slug}`);
    }

    // 3. Fetch Roster with Profiles
    const { data: members, error: rosterError } = await supabase
        .from('team_members')
        .select(`
        *,
        profiles (
            full_name,
            username,
            avatar_url
        )
    `)
        .eq('team_id', team.id)
        .order('joined_at', { ascending: false });

    if (rosterError) {
        console.error('Roster error', rosterError);
    }

    const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard: {team.name}</h1>
                    <Link href={`/team/${slug}`} className="text-sm underline text-muted-foreground hover:text-foreground">
                        View Public Page
                    </Link>
                </div>
                {isOwnerOrAdmin && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline">Settings</Button>
                        <InviteMemberModal teamId={team.id} slug={team.slug} />
                    </div>
                )}
            </div>

            {isOwnerOrAdmin && team.invite_code && (
                <div className="bg-muted p-4 rounded-md mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold">Team Invite Code</h3>
                        <code className="text-sm bg-background px-2 py-1 rounded border">{team.invite_code}</code>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Share this code with drivers to execute a join request.
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-card rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Team Members</h3>
                    <p className="text-4xl font-bold">{members?.length || 0}</p>
                </div>
                {/* Placeholder for future stats */}
                <div className="p-6 bg-card rounded-lg border shadow-sm opacity-50">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Upcoming Events</h3>
                    <p className="text-4xl font-bold">0</p>
                </div>
                <div className="p-6 bg-card rounded-lg border shadow-sm opacity-50">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Logistics Items</h3>
                    <p className="text-4xl font-bold">0</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Team Roster</h2>
            <RosterTable members={members || []} />
        </div>
    );
}
