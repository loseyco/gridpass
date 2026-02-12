
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is missing');
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

const FALLBACK_PRICE_CENTS = 2000; // $20.00
const PRODUCT_NAME = 'Resume Review & Career Consultation';

async function backfillLinks() {
    console.log('Starting backfill of payment links...');

    // 1. Fetch leads without payment links
    const { data: leads, error } = await supabase
        .from('resume_leads')
        .select('*')
        .is('stripe_payment_link', null);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Found ${leads.length} leads to update.`);

    // 2. Fetch current price from DB
    let priceCents = FALLBACK_PRICE_CENTS;
    const { data: service } = await supabase
        .from('services')
        .select('price')
        .ilike('title', '%Resume Review%')
        .single();

    if (service?.price) {
        priceCents = Math.round(service.price * 100);
        console.log(`Using dynamic price: $${service.price} (${priceCents} cents)`);
    } else {
        console.log(`Using fallback price: $${FALLBACK_PRICE_CENTS / 100}`);
    }

    // 3. Loop and update
    for (const lead of leads) {
        console.log(`Processing ${lead.name} (${lead.id})...`);

        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: PRODUCT_NAME,
                                description: 'Professional review of your racing resume.',
                            },
                            unit_amount: priceCents,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/`,
                customer_email: lead.email,
                client_reference_id: lead.id,
                metadata: {
                    leadId: lead.id,
                    type: 'resume_review'
                },
            });

            if (session.url) {
                const { error: updateError } = await supabase
                    .from('resume_leads')
                    .update({ stripe_payment_link: session.url })
                    .eq('id', lead.id);

                if (updateError) {
                    console.error(`Failed to update DB for ${lead.name}:`, updateError);
                } else {
                    console.log(`  -> Link created: ${session.url}`);
                }
            }
        } catch (err) {
            console.error(`  -> Failed to create session for ${lead.name}:`, err.message);
        }
    }

    console.log('Backfill complete.');
}

backfillLinks();
