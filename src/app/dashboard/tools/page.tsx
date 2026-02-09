import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ToolsManager from '@/components/profile/ToolsManager';

export default async function ToolsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Tools & Gear</h1>
                <p className="text-neutral-400">Manage your professional equipment inventory.</p>
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 md:p-8">
                <ToolsManager userId={user.id} />
            </div>
        </div>
    );
}
