'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia', // Use latest API version or 2024-12-18
})

// 1. Create a Stripe Express Account for the organization
export async function createStripeConnectAccount(orgId: string) {
    const supabase = await createClient()

    // Verify user is owner/admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

    if (!org) throw new Error('Organization not found')
    // TODO: rigorous permission check (is owner?)

    // If already has account, return it
    if (org.stripe_account_id) {
        return { accountId: org.stripe_account_id }
    }

    try {
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'US', // Default to US for now
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: 'company',
            business_profile: {
                name: org.name,
                url: org.website || undefined
            }
        })

        // Save account ID to DB
        await supabase
            .from('organizations')
            .update({ stripe_account_id: account.id })
            .eq('id', orgId)

        return { accountId: account.id }
    } catch (error) {
        console.error('Stripe Account Creation Error:', error)
        throw new Error('Failed to create Stripe account')
    }
}

// 2. Generate an Account Link for onboarding
export async function createStripeAccountLink(orgId: string) {
    const supabase = await createClient()

    const { data: org } = await supabase
        .from('organizations')
        .select('stripe_account_id')
        .eq('id', orgId)
        .single()

    if (!org?.stripe_account_id) {
        throw new Error('No Stripe account found for this organization')
    }

    try {
        const accountLink = await stripe.accountLinks.create({
            account: org.stripe_account_id,
            refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/manage/${orgId}/payouts?refresh=true`,
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/manage/${orgId}/payouts?return=true`,
            type: 'account_onboarding',
        })

        return { url: accountLink.url }
    } catch (error) {
        console.error('Stripe Account Link Error:', error)
        throw new Error('Failed to create account link')
    }
}

// 3. Create a Login Link for the Express Dashboard (for viewing payouts)
export async function createStripeLoginLink(orgId: string) {
    const supabase = await createClient()

    const { data: org } = await supabase
        .from('organizations')
        .select('stripe_account_id')
        .eq('id', orgId)
        .single()

    if (!org?.stripe_account_id) {
        throw new Error('No Stripe account found')
    }

    try {
        const loginLink = await stripe.accounts.createLoginLink(org.stripe_account_id)
        return { url: loginLink.url }
    } catch (error) {
        console.error('Stripe Login Link Error:', error)
        throw new Error('Failed to create login link')
    }
}

// 4. Create Payment Intent with Application Fee
export async function createPaymentIntent(
    amount: number, // in cents
    orgId: string,
    bookingId: string
) {
    const supabase = await createClient()

    const { data: org } = await supabase
        .from('organizations')
        .select('stripe_account_id')
        .eq('id', orgId)
        .single()

    if (!org?.stripe_account_id) {
        throw new Error('Organization checks unavailable')
    }

    // Platform Fee: 10%
    const applicationFee = Math.round(amount * 0.10)

    try {
        const session = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            application_fee_amount: applicationFee,
            transfer_data: {
                destination: org.stripe_account_id,
            },
            metadata: {
                bookingId: bookingId,
                orgId: orgId
            }
        })

        return { clientSecret: session.client_secret }
    } catch (error) {
        console.error('Payment Intent Error:', error)
        throw new Error('Failed to create payment intent')
    }
}

// 5. Check Onboarding Status
export async function checkStripeOnboardingStatus(orgId: string) {
    const supabase = await createClient()
    const { data: org } = await supabase
        .from('organizations')
        .select('stripe_account_id, stripe_onboarding_completed')
        .eq('id', orgId)
        .single()

    if (!org?.stripe_account_id) return { completed: false }

    try {
        const account = await stripe.accounts.retrieve(org.stripe_account_id)
        const completed = account.details_submitted

        if (completed && !org.stripe_onboarding_completed) {
            await supabase
                .from('organizations')
                .update({ stripe_onboarding_completed: true })
                .eq('id', orgId)
        }

        return { completed }
    } catch (error) {
        console.error('Error checking status:', error)
        return { completed: false }
    }
}
