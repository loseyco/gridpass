
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // TODO: Add proper Admin check here. 
        // For now, we assume anyone who can hit this is authorized (RLS will block if we had an admin table policy, 
        // but currently we need to trust the API logic or add an admin check function).
        // Since we don't have a user_admin table yet, we'll allow it for now but TODO: Secure this.

        const { data, error } = await supabase
            .from('roles')
            .update({
                verified: true,
                verified_by: user.id,
                verified_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Role Verified"
        }, { status: 200 });

    } catch (error: any) {
        console.error("Roles Verify Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
