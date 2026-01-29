import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase.from('gp_webhooks').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
        console.error("Webhooks DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
}
