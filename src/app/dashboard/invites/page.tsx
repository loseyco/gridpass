import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { acceptInvite, declineInvite } from '@/actions/invites';
import { Button } from '@/components/ui/button';

export default async function InvitesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: invites } = await supabase
        .from('team_members')
        .select(`
            id,
            role,
            created_at,
            teams (
                id,
                name,
                logo_url,
                description
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'invited');

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Team Invitations</h1>

            {!invites || invites.length === 0 ? (
                <div className="p-12 text-center bg-muted/50 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">You have no pending invitations.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {invites.map((invite: any) => (
                        <div key={invite.id} className="p-6 bg-card rounded-lg border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {invite.teams.logo_url ? (
                                    <img src={invite.teams.logo_url} alt={invite.teams.name} className="w-16 h-16 rounded-full object-cover bg-muted" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
                                        {invite.teams.name[0]}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-semibold">{invite.teams.name}</h3>
                                    <p className="text-sm text-muted-foreground">Invited as <span className="font-medium text-foreground capitalize">{invite.role}</span></p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <form action={declineInvite.bind(null, invite.teams.id)}>
                                    <Button variant="outline" type="submit">Decline</Button>
                                </form>
                                <form action={acceptInvite.bind(null, invite.teams.id)}>
                                    <Button type="submit">Accept</Button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
