import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // LIST all users (Admin only)
        // For now, allow logged in users to simulate access, or check for admin role
        return NextResponse.json({
            success: true,
            data: [
                { id: "user_1", email: "bob@garage.com", role: "owner" },
                { id: "user_2", email: "alice@racer.com", role: "driver" }
            ],
            meta: { total: 2 }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
