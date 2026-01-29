import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        // Return 409/404 as handled error for verification purposes if not found/error
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        const { data, error } = await supabase
            .from('inventory')
            .update({
                name: body.name,
                sku: body.sku,
                quantity: body.quantity,
                location: body.location
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data, message: 'Item Updated' }, { status: 200 });
    } catch (error: any) {
        console.error("Inventory PUT Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('gp_inventory')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Item Deleted' }, { status: 200 });
    } catch (error: any) {
        console.error("Inventory DELETE Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
