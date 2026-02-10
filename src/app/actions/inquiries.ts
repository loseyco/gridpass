'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const inquirySchema = z.object({
    service_id: z.string().uuid(),
    sender_name: z.string().min(2, 'Name is required'),
    sender_email: z.string().email('Invalid email address'),
    sender_phone: z.string().optional(),
    message: z.string().min(10, 'Message must be at least 10 characters'),
    project_details: z.string().optional(), // JSON string or text
});

export async function submitInquiry(prevState: any, formData: FormData) {
    const supabase = await createClient();

    const rawData = {
        service_id: formData.get('service_id'),
        sender_name: formData.get('sender_name'),
        sender_email: formData.get('sender_email'),
        sender_phone: formData.get('sender_phone') || undefined,
        message: formData.get('message'),
        project_details: formData.get('project_details') || undefined,
    };

    // Validate
    const validated = inquirySchema.safeParse(rawData);

    if (!validated.success) {
        return {
            error: 'Validation failed',
            fieldErrors: validated.error.flatten().fieldErrors
        };
    }

    const { service_id, sender_name, sender_email, sender_phone, message, project_details } = validated.data;

    // Insert
    const { error } = await supabase
        .from('service_inquiries')
        .insert({
            service_id,
            sender_name,
            sender_email,
            sender_phone,
            message,
            project_details: project_details ? { details: project_details } : {},
            status: 'pending'
        });

    if (error) {
        console.error('Error submitting inquiry:', error);
        return { error: 'Failed to submit inquiry. Please try again.' };
    }

    revalidatePath(`/u`); // Revalidate generally, or detailed if possible
    return { success: true, message: 'Inquiry sent successfully! The provider will contact you shortly.' };
}

export async function getInquiries() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('service_inquiries')
        .select(`
            *,
            user_services (
                title
            )
        `)
        .eq('user_services.user_id', user.id) // This relies on a join, but RLS might handle it better if we filter by service_id in user_services
        .order('created_at', { ascending: false });

    // Since we can't easily filter by joined table column in simple view without RLS policy or embedding, 
    // let's rely on the RLS policy "Service Owners can view their inquiries" which we created.
    // It filters by: exists (select 1 from user_services where id = service_id and user_id = auth.uid())
    // So a simple select * should work and return only relevant inquiries.

    // However, we need to make sure we actually select the related service title.

    if (error) {
        console.error('Error fetching inquiries:', error);
        return [];
    }

    return data;
}

export async function updateInquiryStatus(inquiryId: string, status: 'read' | 'replied' | 'archived' | 'pending') {
    const supabase = await createClient();

    const { error } = await supabase
        .from('service_inquiries')
        .update({ status })
        .eq('id', inquiryId);

    if (error) {
        console.error('Error updating inquiry status:', error);
        return { error: 'Failed to update status' };
    }

    revalidatePath('/dashboard/inquiries');
    return { success: true };
}
