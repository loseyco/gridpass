import { createClient } from '@/utils/supabase/server';
import SuspendedBanner from '@/components/SuspendedBanner';

export default async function SuspendedBannerWrapper() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', user.id)
        .single();

    return <SuspendedBanner isBanned={!!profile?.is_banned} />;
}
