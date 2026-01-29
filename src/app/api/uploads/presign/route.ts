
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { filename, filetype } = await request.json();

        // Mocking a presigned response
        const mockUploadId = Math.random().toString(36).substring(7);

        return NextResponse.json({
            success: true,
            data: {
                upload_url: `https://storage.gridpass.app/upload/${mockUploadId}`,
                fields: {
                    key: `users/${user.id}/${filename}`,
                    "Content-Type": filetype
                },
                media_id: mockUploadId
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
