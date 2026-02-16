'use server';

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { stripe } from '@/lib/stripe';

// const stripe = ...
// const supabaseAdmin = ...

/**
 * Capture a pre-authorized payment for a resume lead
 */
export async function capturePreAuthPayment(leadId: string) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    try {
        // 1. Fetch the resume lead
        const { data: lead, error: fetchError } = await supabaseAdmin
            .from('resume_leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (fetchError || !lead) {
            return { success: false, error: 'Resume lead not found' };
        }

        // 2. Verify payment is in authorized state
        if (lead.payment_status !== 'authorized') {
            return {
                success: false,
                error: `Cannot capture payment. Current status: ${lead.payment_status || 'unpaid'}`
            };
        }

        // 3. Verify we have a payment intent ID
        if (!lead.stripe_payment_intent_id) {
            return {
                success: false,
                error: 'No Stripe payment intent ID found for this lead'
            };
        }

        // 4. Capture the payment via Stripe API
        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.capture(
                lead.stripe_payment_intent_id
            );
        } catch (stripeError: any) {
            console.error('Stripe capture error:', stripeError);

            // Handle specific Stripe errors
            if (stripeError.code === 'payment_intent_unexpected_state') {
                // Payment might already be captured
                const intent = await stripe.paymentIntents.retrieve(lead.stripe_payment_intent_id);
                if (intent.status === 'succeeded') {
                    // Already captured, just update our database
                    paymentIntent = intent;
                } else {
                    return {
                        success: false,
                        error: `Payment in unexpected state: ${intent.status}`
                    };
                }
            } else {
                return {
                    success: false,
                    error: `Stripe error: ${stripeError.message}`
                };
            }
        }

        // 5. Update database to mark as paid
        const { error: updateError } = await supabaseAdmin
            .from('resume_leads')
            .update({
                payment_status: 'paid',
                status: lead.status === 'new' ? 'paid' : lead.status // Update workflow status if still new
            })
            .eq('id', leadId);

        if (updateError) {
            console.error('Database update error:', updateError);
            return {
                success: false,
                error: 'Payment captured but failed to update database'
            };
        }

        // 6. Revalidate the admin page
        revalidatePath(`/admin/resumes/${leadId}`);

        // TODO: Send email notification to user

        return {
            success: true,
            message: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} captured successfully`,
            paymentIntentId: paymentIntent.id
        };

    } catch (error: any) {
        console.error('Unexpected error in capturePreAuthPayment:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred'
        };
    }
}

/**
 * Grant verified badge to a user after payment is complete
 */
export async function grantVerifiedBadge(leadId: string) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    try {
        // 1. Fetch the resume lead
        const { data: lead, error: fetchError } = await supabaseAdmin
            .from('resume_leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (fetchError || !lead) {
            return { success: false, error: 'Resume lead not found' };
        }

        // 2. Verify payment is complete
        if (lead.payment_status !== 'paid') {
            return {
                success: false,
                error: `Payment must be completed first. Current status: ${lead.payment_status || 'unpaid'}`
            };
        }

        // 3. Find the user profile
        let userId = lead.user_id;

        if (!userId) {
            // Try to find by email
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const match = users.users.find(u => u.email === lead.email);
            if (match) {
                userId = match.id;
                // Update the lead with the user_id for future reference
                await supabaseAdmin
                    .from('resume_leads')
                    .update({ user_id: userId })
                    .eq('id', leadId);
            }
        }

        if (!userId) {
            return {
                success: false,
                error: 'No user account found for this resume lead'
            };
        }

        // 4. Fetch the user's profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('driver_info')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return {
                success: false,
                error: 'User profile not found'
            };
        }

        // 5. Update driver_info to include verified badge
        const updatedDriverInfo = {
            ...profile.driver_info,
            verified: true,
            verified_at: new Date().toISOString(),
            verified_by: 'admin' // Could pass admin user ID here
        };

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ driver_info: updatedDriverInfo })
            .eq('id', userId);

        if (updateError) {
            console.error('Profile update error:', updateError);
            return {
                success: false,
                error: 'Failed to grant verified badge'
            };
        }

        // 6. Update resume lead status to 'live'
        await supabaseAdmin
            .from('resume_leads')
            .update({ status: 'live' })
            .eq('id', leadId);

        // 7. Revalidate pages
        revalidatePath(`/admin/resumes/${leadId}`);
        const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();

        if (profileData?.username) {
            revalidatePath(`/u/${profileData.username}`);
        }

        // TODO: Send congratulations email to user

        return {
            success: true,
            message: 'Verified badge granted successfully!',
            userId
        };

    } catch (error: any) {
        console.error('Unexpected error in grantVerifiedBadge:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred'
        };
    }
}

/**
 * Upload final resume PDF for a lead
 */
export async function uploadFinalResume(leadId: string, resumeUrl: string) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    try {
        // Update the resume URL and status
        const { error } = await supabaseAdmin
            .from('resume_leads')
            .update({
                resume_url: resumeUrl,
                status: 'built' // Mark as built when final resume is uploaded
            })
            .eq('id', leadId);

        if (error) {
            return { success: false, error: 'Failed to update resume URL' };
        }

        // Also update the user's profile if they exist
        const { data: lead } = await supabaseAdmin
            .from('resume_leads')
            .select('user_id, email')
            .eq('id', leadId)
            .single();

        if (lead?.user_id) {
            await supabaseAdmin
                .from('profiles')
                .update({ resume_url: resumeUrl })
                .eq('id', lead.user_id);
        }

        revalidatePath(`/admin/resumes/${leadId}`);

        return {
            success: true,
            message: 'Resume uploaded successfully'
        };

    } catch (error: any) {
        console.error('Error in uploadFinalResume:', error);
        return {
            success: false,
            error: error.message || 'An unexpected error occurred'
        };
    }
}
