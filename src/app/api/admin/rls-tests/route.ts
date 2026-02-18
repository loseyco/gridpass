import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();

    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: 'Not authenticated', details: userError }, { status: 401 });
    }

    // 1.5 Security Check
    const { getUserRole } = await import('@/utils/rbac');
    const role = await getUserRole();

    if (role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized: Superadmin only' }, { status: 403 });
    }

    // 2. Check is_admin() function directly
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');

    // 3. Try to fetch Zach Shaw's profile
    const targetUserId = '3394ba01-c40a-4bde-bb0a-c50a7d2c8c89'; // Zach Shaw
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

    // 4. Try to UPDATE Zach Shaw's profile
    const updatePayload = { bio: `RLS Verified at ${new Date().toISOString()}` };
    const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', targetUserId)
        .select();

    // 5. Try to TOGGLE BAN Status
    const banPayload = { is_banned: true };
    const { data: banData, error: banError } = await supabase
        .from('profiles')
        .update(banPayload)
        .eq('id', targetUserId)
        .select();

    // Revert ban immediately if successful to avoid side effects
    if (!banError) {
        await supabase.from('profiles').update({ is_banned: false }).eq('id', targetUserId);
    }

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
        },
        checks: {
            isAdminFunction: {
                success: !rpcError,
                value: isAdmin,
                error: rpcError
            },
            fetchProfile: {
                success: !fetchError,
                data: profile,
                error: fetchError
            },
            updateProfile: {
                success: !updateError,
                data: updateData,
                error: updateError,
                payload: updatePayload
            },
            toggleBan: {
                success: !banError,
                data: banData,
                error: banError,
                payload: banPayload
            }
        }
    });
}
