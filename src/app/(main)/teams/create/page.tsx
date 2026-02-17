import { CreateTeamForm } from '@/components/teams/CreateTeamForm';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function CreateTeamPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?next=/teams/create');
    }

    return (
        <div className="container mx-auto py-12">
            <CreateTeamForm />
        </div>
    );
}
