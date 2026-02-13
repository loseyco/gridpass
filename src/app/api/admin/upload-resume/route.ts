import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const leadId = formData.get('leadId') as string;

        if (!file || !leadId) {
            return NextResponse.json(
                { success: false, error: 'Missing file or leadId' },
                { status: 400 }
            );
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { success: false, error: 'Only PDF files are allowed' },
                { status: 400 }
            );
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, error: 'File size must be less than 10MB' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Create filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${leadId}_resume.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { success: false, error: uploadError.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

        // Update resume_leads with URL
        const { error: updateError } = await supabase
            .from('resume_leads')
            .update({ resume_url: publicUrl })
            .eq('id', leadId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Upload failed' },
            { status: 500 }
        );
    }
}
