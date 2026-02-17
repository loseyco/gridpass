
import { createClient } from '@/utils/supabase/server';

export default async function TestProfilePage({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const supabase = await createClient();

    // Mock fetching user
    const { data: user } = await supabase.from('users').select('*').eq('username', slug).single();

    return (
        <div>
            <h1>{user?.full_name || 'Racer'}</h1>
            <p>@{user?.username}</p>
            <div className="bio">{user?.bio}</div>
        </div>
    );
}
