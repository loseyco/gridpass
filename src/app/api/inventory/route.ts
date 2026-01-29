
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            meta: { total: data.length }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
        }

        const itemData = {
            user_id: user.id,
            name: body.name,
            sku: body.sku || '',
            quantity: body.quantity || 0,
            location: body.location || ''
        };

        const query = (body.sku)
            ? supabase.from('inventory').upsert(itemData, { onConflict: 'sku' })
            : supabase.from('inventory').insert(itemData);

        const { data, error } = await query.select().single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Item Added to Inventory"
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
