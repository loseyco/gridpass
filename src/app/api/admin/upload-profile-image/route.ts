import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const leadId = formData.get('leadId') as string;
        const fileType = formData.get('fileType') as 'photo' | 'background';

        if (!file || !leadId || !fileType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            );
        }

        // Validate file size
        const maxSize = fileType === 'photo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: `File size must be less than ${maxSize / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get file extension
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${leadId}_${fileType}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true, // Replace if exists
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);

        // Update resume_leads table
        const fieldName = fileType === 'photo' ? 'photo_url' : 'metadata';

        if (fileType === 'photo') {
            const { error: updateError } = await supabase
                .from('resume_leads')
                .update({ photo_url: publicUrl })
                .eq('id', leadId);

            if (updateError) {
                console.error('Database update error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update database' },
                    { status: 500 }
                );
            }
        } else {
            // For background, update metadata
            const { data: leadData } = await supabase
                .from('resume_leads')
                .select('metadata')
                .eq('id', leadId)
                .single();

            const updatedMetadata = {
                ...(leadData?.metadata || {}),
                background_url: publicUrl,
            };

            const { error: updateError } = await supabase
                .from('resume_leads')
                .update({ metadata: updatedMetadata })
                .eq('id', leadId);

            if (updateError) {
                console.error('Database update error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update database' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error) {
        console.error('Error in upload endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { leadId, fileType } = await request.json();

        if (!leadId || !fileType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Update database to remove URL
        if (fileType === 'photo') {
            await supabase
                .from('resume_leads')
                .update({ photo_url: null })
                .eq('id', leadId);
        } else {
            const { data: leadData } = await supabase
                .from('resume_leads')
                .select('metadata')
                .eq('id', leadId)
                .single();

            const updatedMetadata = {
                ...(leadData?.metadata || {}),
                background_url: null,
            };

            await supabase
                .from('resume_leads')
                .update({ metadata: updatedMetadata })
                .eq('id', leadId);
        }

        // Note: We don't delete from storage to keep history
        // Files will be overwritten on next upload

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in delete endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
