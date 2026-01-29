import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('gp_orgs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        const body = await request.json();
        const { name, type } = body;

        // Basic Validation
        if (!name || !type) {
            return NextResponse.json(
                { success: false, error: 'Name and Type are required.' },
                { status: 400 }
            );
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const { data, error } = await supabase
            .from('gp_orgs')
            .upsert({
                name,
                type,
                slug,
                status: 'active'
            }, { onConflict: 'slug', ignoreDuplicates: false })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
