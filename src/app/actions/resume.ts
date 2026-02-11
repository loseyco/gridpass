'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize Supabase Admin client for Storage operations (bypassing RLS)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function submitResumeLead(formData: FormData) {
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

    // 3. Insert into DB (Resume Leads)
    // Use Admin client to bypass RLS for insert + select
    const { data: leadDataResponse, error } = await supabaseAdmin
        .from('resume_leads')
        .insert([rawData])
        .select()
        .single();

    if (error || !leadDataResponse) {
        console.error('Error submitting resume lead:', error);
        return { error: 'Failed to submit form. Please try again.' };
    }

    // 4. Create Shadow Profile (Leads Table)
    // We use supabaseAdmin to bypass RLS if needed, or just to be safe.
    try {
        const username = rawData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

        const leadData = {
            name: rawData.name,
            role: rawData.job_title || 'Member',
            source: 'resume_builder',
            contact_info: {
                username: username,
                email: rawData.email,
                phone: rawData.phone,
                bio: rawData.bio,
                avatar_url: photoUrl,
                resume_url: resumeUrl,
                linkedin: rawData.linkedin_url,
                website: rawData.portfolio_url,
                location: rawData.metadata.home_airport || 'Unknown',
                social_links: rawData.social_links,
                experience_years: rawData.experience_years,
                physical_info: {
                    helmet_size: rawData.metadata.helmet_size
                },
                logistics_info: {
                    home_airport: rawData.metadata.home_airport
                },
                job_preferences: {
                    looking_for: rawData.metadata.looking_for,
                    salary_expectations: rawData.metadata.salary_expectations
                }
            },
            skills: rawData.metadata.skills,
            status: 'new'
        };

        const { error: leadError } = await supabaseAdmin
            .from('leads')
            .insert([leadData]);

        if (leadError) {
            console.error('Error creating shadow profile:', leadError);
            // We don't fail the whole request since the resume lead is saved
        }
    } catch (e) {
        console.error('Error in shadow profile logic:', e);
    }

    // 5. Send Notification (Payment removed, now donation based)
    try {
        const { sendResumeNotification } = await import('@/lib/email');

        if (leadDataResponse) {
            // Send Email
            await sendResumeNotification({
                name: rawData.name,
                email: rawData.email,
                role: rawData.job_title || 'N/A',
                resumeId: leadDataResponse.id
            });
        }
    } catch (e) {
        console.error('Notification failed:', e);
    }

    revalidatePath('/admin/resumes');
    return { success: true };
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


