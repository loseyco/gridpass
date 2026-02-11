import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getButtonClasses } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !team) {
        // console.error('Team fetch error:', error); // Keep logs clean
        return notFound();
    }

    const { data: { user } } = await supabase.auth.getUser();
    let isMember = false;

    if (user) {
        const { data: member } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', team.id)
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle to avoid error if not found

        if (member) isMember = true;
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">{team.name}</h1>
                    {team.logo_url && (
                        <div className="relative mb-4 w-32 h-32 rounded-full overflow-hidden border-2 border-border">
                            <img src={team.logo_url} alt={`${team.name} Logo`} className="object-cover w-full h-full" />
                        </div>
                    )}
                </div>

                {isMember && (
                    <Link href={`/team/${slug}/dashboard`} className={getButtonClasses('default', 'default')}>
                        Team Dashboard
                    </Link>
                )}
            </div>

            <div className="prose dark:prose-invert max-w-none">
                <p className="text-xl text-muted-foreground leading-relaxed">
                    {team.description || "No description provided."}
                </p>
            </div>

            <div className="mt-12 border-t pt-8">
                <h2 className="text-2xl font-bold mb-4">Team Roster</h2>
                <div className="bg-muted/50 p-6 rounded-lg text-center text-muted-foreground">
                    {/* Placeholder for public roster if needed */}
                    <p>Roster visibility is restricted to team members.</p>
                </div>
            </div>
        </div>
    );
}
