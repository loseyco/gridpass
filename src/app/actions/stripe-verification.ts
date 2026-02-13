'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createVerificationCheckoutSession(returnUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    if (!stripe) {
        throw new Error('Stripe not initialized')
    }

    try {
        // Create a verification request record
        // Note: This relies on the 'verification_requests' table existing.
        // We do this before creating the session to have a record ID if needed, 
        // though strictly we might update it after. 
        // For now, let's create the session first to get the ID.

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: 'payment',
            payment_method_types: ['card'],
            payment_intent_data: {
                capture_method: 'manual', // Pre-auth only
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'GridPass Verification',
                            description: 'One-time fee for manual profile verification.',
                        },
                        unit_amount: 2000, // $20.00
                    },
                    quantity: 1,
                },
            ],
            customer_email: user.email,
            client_reference_id: user.id,
            return_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                type: 'verification',
                userId: user.id
            }
        })

        if (!session.client_secret) {
            throw new Error('Failed to create checkout session secret')
        }

        // Record the attempt in DB
        await supabase.from('verification_requests').insert({
            user_id: user.id,
            stripe_session_id: session.id,
            status: 'pending_payment'
        })

        return { clientSecret: session.client_secret }
    } catch (error) {
        console.error('Error creating verification session:', error)
        throw error
    }
}
