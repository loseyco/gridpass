'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createResumeCheckoutSession } from './stripe-payment';

// Initialize Supabase Admin client for Storage operations (bypassing RLS)
// const supabaseAdmin = createAdminClient(...);

export async function submitResumeLead(formData: FormData) {
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const supabase = await createClient();

    // 1. Handle File Uploads
    const resumeFile = formData.get('resume_file') as File | null;
    const photoFile = formData.get('photo_file') as File | null;

    let resumeUrl = null;
    let photoUrl = null;

    // We need a unique ID for the folder structure before inserting the row? 
    // Or we can just use a timestamp + random string for the path.
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const basePath = `${timestamp}_${uniqueId}`;

    if (resumeFile && resumeFile.size > 0) {
        const { data, error } = await supabaseAdmin.storage
            .from('resumes')
            .upload(`docs/${basePath}_${resumeFile.name}`, resumeFile, {
                contentType: resumeFile.type,
                upsert: false
            });

        if (error) {
            console.error('Error uploading resume:', error);
            return { error: 'Failed to upload resume file.' };
        }

        // Construct Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('resumes')
            .getPublicUrl(data.path);

        resumeUrl = publicUrl;
    }

    if (photoFile && photoFile.size > 0) {
        const { data, error } = await supabaseAdmin.storage
            .from('resumes')
            .upload(`photos/${basePath}_${photoFile.name}`, photoFile, {
                contentType: photoFile.type,
                upsert: false
            });

        if (error) {
            console.error('Error uploading photo:', error);
            return { error: 'Failed to upload photo.' };
        }

        // Construct Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('resumes')
            .getPublicUrl(data.path);

        photoUrl = publicUrl;
    }

    // 2. Prepare Data
    // 2. Prepare Data
    const rawData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        job_title: formData.get('job_title') as string,
        experience_years: formData.get('experience_years') as string,
        bio: formData.get('bio') as string,
        linkedin_url: formData.get('linkedin_url') as string,
        portfolio_url: formData.get('portfolio_url') as string,
        indeed_url: formData.get('indeed_url') as string,
        resume_url: resumeUrl,
        photo_url: photoUrl,
        social_links: {
            instagram: formData.get('instagram_url') as string,
            twitter: formData.get('twitter_url') as string,
            facebook: formData.get('facebook_url') as string,
            tiktok: formData.get('tiktok_url') as string,
            youtube: formData.get('youtube_url') as string,
        },
        metadata: {
            skills: formData.get('skills') ? (formData.get('skills') as string).split(',').map(s => s.trim()) : [],
            helmet_size: formData.get('helmet_size') as string,
            home_airport: formData.get('home_airport') as string,
            looking_for: formData.get('looking_for') as string,
            salary_expectations: formData.get('salary_expectations') as string,

            // New Fields
            licenses: formData.get('licenses') ? JSON.parse(formData.get('licenses') as string) : [],
            series_experience: formData.get('series_experience') ? JSON.parse(formData.get('series_experience') as string) : [],
            passport_valid: formData.get('passport_valid') === 'true',
            visa_status: formData.get('visa_status') as string,
            availability: formData.get('availability') as string, // e.g., "Immediate", "2 weeks notice"
            references: formData.get('references') ? JSON.parse(formData.get('references') as string) : [],
            dob: formData.get('dob') as string, // Date of Birth (optional but good for drivers)
            nationality: formData.get('nationality') as string,
        }
    };

    // 3. Insert into DB (Resume Leads) with pending payment status
    const { data: leadDataResponse, error } = await supabaseAdmin
        .from('resume_leads')
        .insert([{
            ...rawData,
            payment_status: 'unpaid', // User must authorize payment for work to begin
        }])
        .select()
        .single();

    if (error || !leadDataResponse) {
        console.error('Error submitting resume lead:', error);
        return { error: 'Failed to submit form. Please try again.' };
    }

    // 4. Create User Account (FREE - No payment required for account)
    let claimPath = null;
    let userId = null;

    try {
        // Try to create the user with password
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: rawData.email,
            password: formData.get('password') as string, // From form
            email_confirm: true,
            user_metadata: { full_name: rawData.name }
        });

        if (userData?.user) {
            userId = userData.user.id;
        } else if (createError?.message?.includes('already registered')) {
            // User exists - look them up
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const match = users.users.find(u => u.email === rawData.email);
            if (match) userId = match.id;
        }

        if (userId) {
            // 4a. Create Profile
            const username = rawData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

            const profileUpdates = {
                username: username,
                full_name: rawData.name,
                bio: rawData.bio,
                avatar_url: photoUrl,
                resume_url: resumeUrl,
                driver_info: {
                    status: 'active',
                },
                logistics_info: {
                    home_airport: rawData.metadata.home_airport
                },
                physical_info: {
                    helmet_size: rawData.metadata.helmet_size
                },
                social_links: rawData.social_links,
                website: rawData.portfolio_url,
                skills: rawData.metadata.skills,
                location: rawData.metadata.home_airport
            };

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userId,
                    ...profileUpdates,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error('Profile Upsert Error:', profileError);
            }

            // 4b. Link Lead to User
            await supabaseAdmin
                .from('resume_leads')
                .update({ user_id: userId })
                .eq('id', leadDataResponse.id);

            // 4c. Generate Claim Token (for immediate access)
            const { randomBytes } = await import('crypto');
            const token = randomBytes(16).toString('hex');

            const { error: tokenError } = await supabaseAdmin
                .from('claim_tokens')
                .insert({
                    token,
                    entity_type: 'lead',
                    entity_id: userId,
                });

            if (!tokenError) {
                claimPath = `/u/${username}?secret=${token}`;
            }

            // Check if user wants premium service
            const wantsPremiumService = formData.get('wants_premium_service') === 'true';

            // Only create checkout session if user wants premium service
            if (wantsPremiumService) {
                const sessionData = await createResumeCheckoutSession(
                    leadDataResponse.id,
                    rawData.email,
                    rawData.name
                );

                if (sessionData && sessionData.clientSecret) {
                    // Update lead with payment session info
                    await supabaseAdmin
                        .from('resume_leads')
                        .update({
                            stripe_payment_link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/resume-builder/checkout?session_id=${sessionData.sessionId}`,
                        })
                        .eq('id', leadDataResponse.id);

                    // Return checkout redirect for premium service
                    return {
                        success: true,
                        checkoutPath: `/resume-builder/checkout?session_id=${sessionData.sessionId}&lead_id=${leadDataResponse.id}`,
                        leadId: leadDataResponse.id,
                        clientSecret: sessionData.clientSecret
                    };
                }
            } else {
                // Free profile - mark as free tier and return claim path
                await supabaseAdmin
                    .from('resume_leads')
                    .update({
                        payment_status: 'free', // Mark as free tier
                    })
                    .eq('id', leadDataResponse.id);

                // Return claim path directly for free profile
                return {
                    success: true,
                    claimPath: claimPath
                };
            }
        }

    } catch (e) {
        console.error('Error in user creation logic:', e);
        return { error: 'An unexpected error occurred during account creation.' };
    }

    // 5. Send Notification
    try {
        const { sendResumeNotification } = await import('@/lib/email');

        if (leadDataResponse) {
            // Construct full URL for the email button
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gridpass.app';
            const actionUrl = claimPath ? `${baseUrl}${claimPath}` : undefined;

            // Send Email
            await sendResumeNotification({
                name: rawData.name,
                email: rawData.email,
                role: rawData.job_title || 'N/A',
                resumeId: leadDataResponse.id,
                paymentLink: actionUrl // Direct them to the profile to pay
            });
        }
    } catch (e) {
        console.error('Notification failed:', e);
    }

    revalidatePath('/admin/resumes');
    return { success: true, claimPath };
}

export async function updateResumeLeadStatus(id: string, status: string) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('resume_leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error updating status:', error);
        return { error: 'Failed to update status' };
    }

    revalidatePath(`/admin/resumes/${id}`);
    revalidatePath('/admin/resumes');
    return { success: true };
}

export async function updatePaymentLink(id: string, link: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('resume_leads')
        .update({ stripe_payment_link: link, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error updating payment link:', error);
        return { error: 'Failed to update payment link' };
    }

    revalidatePath(`/admin/resumes/${id}`);
    return { success: true };
}

export async function updatePaymentStatus(id: string, status: 'authorized' | 'paid' | 'unpaid') {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('resume_leads')
        .update({
            payment_status: status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating payment status:', error);
        return { error: 'Failed to update payment status' };
    }

    revalidatePath(`/admin/resumes/${id}`);
    revalidatePath('/admin/resumes');
    return { success: true };
}

export async function getNewResumeCount() {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('resume_leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

    if (error) {
        console.error('Error fetching resume count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Generate a Stripe payment link and send it to the applicant via email
 */
export async function generateAndSendPaymentLink(leadId: string) {
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch the lead
    const { data: lead, error: fetchError } = await supabaseAdmin
        .from('resume_leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (fetchError || !lead) {
        console.error('Error fetching lead:', fetchError);
        return { error: 'Lead not found' };
    }

    // Check if already paid
    if (lead.payment_status === 'paid' || lead.payment_status === 'authorized') {
        return { error: 'Payment already completed or authorized' };
    }

    try {
        // Create Stripe checkout session
        const sessionData = await createResumeCheckoutSession(
            lead.id,
            lead.email,
            lead.name
        );

        if (!sessionData || !sessionData.clientSecret) {
            return { error: 'Failed to create payment session' };
        }

        // Construct payment link
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gridpass.app';
        const paymentLink = `${baseUrl}/resume-builder/checkout?session_id=${sessionData.sessionId}&lead_id=${lead.id}`;

        // Update lead with payment link
        await supabaseAdmin
            .from('resume_leads')
            .update({
                stripe_payment_link: paymentLink,
                status: 'contacted',
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        // Send email with payment link
        const { sendPaymentLinkEmail } = await import('@/lib/email');
        await sendPaymentLinkEmail({
            to: lead.email,
            name: lead.name,
            paymentLink: paymentLink
        });

        revalidatePath(`/admin/resumes/${leadId}`);
        revalidatePath('/admin/resumes');

        return {
            success: true,
            message: `Payment link sent to ${lead.email}`,
            paymentLink
        };
    } catch (error) {
        console.error('Error generating payment link:', error);
        return { error: 'Failed to generate and send payment link' };
    }
}


