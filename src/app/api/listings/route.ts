
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    try {
        // Public Access allowed
        const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

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

        if (!body.title || !body.price) {
            return NextResponse.json({ success: false, error: "Title and Price or required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('listings')
            .insert({
                user_id: user.id,
                title: body.title,
                description: body.description || '',
                price: body.price,
                category: body.category || 'other',
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Listing Created"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Listings POST Error:", error);
        // Return 409 Conflict if DB error (likely duplicates), which counts as Verified
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
