'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/utils/rbac-shared';
import { randomBytes } from 'crypto';

function generateToken(length = 12) {
    return randomBytes(length).toString('hex').slice(0, length);
}

export async function createInvite(role: UserRole, note: string) {
    const supabase = await createClient();
    const token = generateToken(16);

    // Get current user (creator)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase.from('invites').insert({
        token,
        role,
        note,
        created_by: user.id
    }).select().single();

    if (error) throw new Error(error.message);
    revalidatePath('/admin/invites');
    return data;
}

export async function getInvites() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('invites')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getInvites Error:', error);
        return [];
    }
    return data || [];
}

export async function validateInvite(token: string) {
    const supabase = await createClient();
    // Retrieve invite details without RLS restrictions if possible, 
    // but since we enabled RLS, regular users can't see it.
    // We must use a service role client OR strict RLS policy.
    // BUT, for security, let's use the current client and assume we might need 
    // a "Public can read by token" policy OR use a service role here.
    // Given the constraints, a Service Role client is safer for "finding by exact token" 
    // without exposing the list.

    // HOWEVER, standard supabase client here is user-scoped.
    // Let's create a specific function or use a policy.
    // Actually, creating a policy "Public can view invite IF token matches" is hard in standard RLS without exposure.
    // Recommended: Use an RPC or Service Role.
    // For now, let's assume the user is logged in (to claim).
    // If not logged in, we can't really "validate" it securely without exposing data.
    // Let's rely on the claim action mostly.

    // For the UI "Preview", we might need a workaround.
    // Let's try standard query first. If RLS blocks it, we know why.

    // wait, I can use the same pattern as `admin` tools if I verify capabilities.
    // But this is for the PUBLIC page.
    // I'll stick to: User logs in -> Then we validate.

    // TEMPORARY: Just return basic info if found.
    // We will need `supabaseAdmin` (service role) to fetch this confidently for public pages.
    // Since I don't have direct service role client exported easily (usually), 
    // I will use `createClient` and if it fails, I'll need to adjust.
    // Actually, I can use `createClient` and rely on a new Policy:
    // "Anyone can select invite WHERE token = passed_token" 
    // But Postgres RLS doesn't easily support "passed token".
    // Let's proceed with the admin actions first.
    return null;
}
