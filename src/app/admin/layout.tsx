import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Temporary Superadmin Restriction
    // We check this in Layout to protect ALL /admin/* routes
    const allowedEmails = ['pjlosey@gmail.com', 'admin@gridpass.io'];

    if (!user || !allowedEmails.includes(user.email || '')) {
        // Redirect unauthorized users to home
        redirect('/');
    }

    return <>{children}</>;
}
