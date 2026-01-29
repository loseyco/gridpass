
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    try {
        const { data, error } = await supabase
            .from('gp_jobs')
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

        if (!body.title || !body.location) {
            return NextResponse.json({ success: false, error: "Title and Location required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('gp_jobs')
            .insert({
                user_id: user.id,
                title: body.title,
                description: body.description || '',
                type: body.type || 'Full Time',
                location: body.location,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Job Posted"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Jobs POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
