'use server';

import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type AffiliateStats = {
    clicks: number;
    signups: number;
    earnings: number;
    pending_commission: number;
};

export async function getAffiliateStatus() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!affiliate) return null;

    // TODO: Fetch real stats from referrals table once populated
    const stats: AffiliateStats = {
        clicks: 0, // Need to implement click tracking first
        signups: 0,
        earnings: 0,
        pending_commission: 0
    };

    // Get referral counts
    const { count: signupCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', affiliate.id);

    stats.signups = signupCount || 0;

    // Check Stripe Connect status if account exists
    let stripeStatus = 'pending';
    if (affiliate.stripe_account_id && stripe) {
        try {
            const account = await stripe.accounts.retrieve(affiliate.stripe_account_id);
            if (account.payouts_enabled && account.charges_enabled) {
                stripeStatus = 'active';
            } else if (account.requirements?.currently_due?.length) {
                stripeStatus = 'restricted';
            }
        } catch (e) {
            console.error('Error fetching Stripe account:', e);
        }
    }

    return {
        ...affiliate,
        stripe_status: stripeStatus,
        stats
    };
}

export async function createAffiliateAccount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // 1. Generate unique referral code (username + random string or just random)
    // Fetch profile to get username
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    const baseCode = profile?.username || 'user';
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const referralCode = `${baseCode}-${randomSuffix}`;

    // 2. Create Stripe Express Account
    if (!stripe) {
        return { error: 'Stripe not configured' };
    }

    try {
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'US', // TODO: Make dynamic or ask user? Defaulting to US for now.
            email: user.email,
            capabilities: {
                transfers: { requested: true },
            },
            business_type: 'individual',
        });

        // 3. Insert into Supabase
        const { error } = await supabase
            .from('affiliates')
            .insert({
                user_id: user.id,
                referral_code: referralCode,
                stripe_account_id: account.id,
                status: 'pending'
            });

        if (error) {
            console.error('Error creating affiliate record:', error);
            return { error: 'Failed to create affiliate record' };
        }

        // 4. Create Account Link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/affiliate`, // Return to dashboard to retry
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/affiliate?setup=complete`,
            type: 'account_onboarding',
        });

        return { url: accountLink.url };

    } catch (e: any) {
        console.error('Stripe/Affiliate Error:', e);
        return { error: e.message };
    }
}

export async function getLoginLink(stripeAccountId: string) {
    if (!stripe) return { error: 'Stripe not configured' };

    try {
        const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
        return { url: loginLink.url };
    } catch (e: any) {
        return { error: e.message };
    }
}
