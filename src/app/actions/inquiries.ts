'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_for_build');

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

    // Send Email Notification to Service Owner
    try {
        // 1. Get Service Owner's Email
        const { data: service } = await supabase
            .from('user_services')
            .select(`
                title,
                profiles:user_id (
                    email,
                    full_name
                )
            `)
            .eq('id', service_id)
            .single();

        // @ts-ignore
        const ownerEmail = service?.profiles?.email;
        // @ts-ignore
        const ownerName = service?.profiles?.full_name || 'Partner';
        const serviceTitle = service?.title || 'Service';

        if (ownerEmail) {
            await resend.emails.send({
                from: 'GridPass Inquiries <inquiries@gridpass.app>', // Ensure this domain is verified or use 'onboarding@resend.dev' for testing if not
                to: [ownerEmail], // For testing properly, this must be your verified email if assuming prod, or use user's email mechanism
                subject: `New Inquiry for ${serviceTitle}`,
                html: `
                    <h1>New Inquiry Received</h1>
                    <p><strong>${sender_name}</strong> has inquired about <strong>${serviceTitle}</strong>.</p>
                    <hr />
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                    <hr />
                    <p><strong>Contact Details:</strong></p>
                    <ul>
                        <li>Email: ${sender_email}</li>
                        <li>Phone: ${sender_phone || 'N/A'}</li>
                    </ul>
                    <br />
                    <a href="https://gridpass.app/dashboard/inquiries" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Inquiry</a>
                `
            });
        }
    } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the whole action if email fails, just log it.
    }

    revalidatePath(`/u`);
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

export async function getUnreadInquiryCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    // We need to count inquiries for services owned by this user where status = 'pending' (or 'unread')
    // Ideally status is 'pending' for new ones.

    // First get user's service IDs
    const { data: services } = await supabase
        .from('user_services')
        .select('id')
        .eq('user_id', user.id);

    if (!services || services.length === 0) return 0;

    const serviceIds = services.map(s => s.id);

    const { count, error } = await supabase
        .from('service_inquiries')
        .select('*', { count: 'exact', head: true })
        .in('service_id', serviceIds)
        .eq('status', 'pending');

    if (error) {
        console.error('Error counting inquiries:', error);
        return 0;
    }

    return count || 0;
}

