import { createClient } from '@/utils/supabase/server';
import CollectionForm from '../components/CollectionForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AddCollectionPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch teams the user is an owner/admin of
    const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id, role, teams(id, name)')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);

    const teams = teamMembers?.map((tm: any) => tm.teams).filter(Boolean) || [];

    return (
        <main className="min-h-screen bg-black text-white pb-20 pt-24 px-6">
            <div className="max-w-2xl mx-auto">
                <Link href="/collections" className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Collections
                </Link>

                <h1 className="text-3xl font-bold mb-2">Create New Collection</h1>
                <p className="text-neutral-400 mb-8">
                    Organize vehicles under a personal portfolio or a team entity.
                </p>

                <CollectionForm teams={teams} userId={user.id} />
            </div>
        </main>
    );
}
