'use server';

import { stripe } from '@/lib/stripe';

// Default configuration - ideally these should be in a settings table or env vars
const FALLBACK_PRICE = 2000; // $20.00
const PRODUCT_NAME = 'Resume Review & Career Consultation';

export async function createResumeCheckoutSession(leadId: string, email: string, name: string) {
    if (!stripe) {
        console.error('Stripe not initialized');
        return null;
    }

    // Fetch dynamic price
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    // Look for service
    const { data: service } = await supabase
        .from('services')
        .select('price, title')
        .ilike('title', '%Resume Review%')
        .single();

    // Default to fallback if not found, or use service price (converted to cents)
    const unitAmount = service?.price ? Math.round(service.price * 100) : FALLBACK_PRICE;
    const productName = service?.title || PRODUCT_NAME;

    // Affiliate Commission Logic
    let transferData = undefined;
    let applicationFeeAmount = undefined;
    let metadata: any = {
        leadId: leadId,
        type: 'resume_review'
    };

    try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const refCode = cookieStore.get('gridpass_ref')?.value;

        if (refCode) {
            const { data: affiliate } = await supabase
                .from('affiliates')
                .select('id, stripe_account_id, status')
                .eq('referral_code', refCode)
                .single();

            if (affiliate && affiliate.stripe_account_id && affiliate.status === 'active') {
                // 10% Commission
                const commissionRate = 0.10;
                const commission = Math.round(unitAmount * commissionRate);
                const platformFee = unitAmount - commission;

                // Ensure we don't transfer less than 0
                if (commission > 0 && platformFee > 0) {
                    transferData = {
                        destination: affiliate.stripe_account_id,
                    };
                    applicationFeeAmount = platformFee;
                    metadata['affiliateId'] = affiliate.id;
                    console.log(`Applying affiliate commission: ${commission / 100} to ${affiliate.stripe_account_id}`);
                }
            }
        }
    } catch (e) {
        console.warn('Error checking affiliate cookie:', e);
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            payment_intent_data: {
                capture_method: 'manual',
                transfer_data: transferData,
                application_fee_amount: applicationFeeAmount,
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName,
                            description: 'Professional review of your racing resume and career consultation.',
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            ui_mode: 'embedded',
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/resume-builder/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
            customer_email: email,
            client_reference_id: leadId,
            metadata: metadata,
        });

        return { clientSecret: session.client_secret, sessionId: session.id };
    } catch (error) {
        console.error('Error creating Stripe session:', error);
        return null;
    }
}
