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
            .from('vehicles')
            .select('*')
            .eq('user_id', user.id);

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

        // Basic Validation
        if (!body.year || !body.make || !body.model) {
            return NextResponse.json({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Year, Make, and Model are required." }
            }, { status: 400 });
        }

        // Insert logic
        // Prepare insert data
        const vehicleData = {
            user_id: user.id,
            year: body.year,
            make: body.make,
            model: body.model,
            vin: body.vin || null,
            nickname: body.nickname || null
        };

        // If VIN is present, upsert. Otherwise insert.
        const query = (body.vin)
            ? supabase.from('vehicles').upsert(vehicleData, { onConflict: 'vin' })
            : supabase.from('vehicles').insert(vehicleData);

        const { data, error } = await query.select().single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Vehicle added to Garage"
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
