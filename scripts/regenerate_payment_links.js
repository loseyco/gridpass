const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function regeneratePaymentLinks() {
    console.log('💳 Regenerating payment links for unpaid resume submissions...\n');

    // 1. Get all unpaid resume leads
    const { data: unpaidLeads, error: fetchError } = await supabase
        .from('resume_leads')
        .select('*')
        .eq('payment_status', 'unpaid')
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('Error fetching resume leads:', fetchError);
        return;
    }

    if (!unpaidLeads || unpaidLeads.length === 0) {
        console.log('✅ No unpaid resume submissions found!');
        return;
    }

    console.log(`Found ${unpaidLeads.length} unpaid resume submissions:\n`);
    unpaidLeads.forEach(lead => {
        console.log(`  - ${lead.name} (${lead.email})`);
    });
    console.log('');

    // 3. Generate new payment link for each
    for (const lead of unpaidLeads) {
        console.log(`\n💳 Generating payment link for ${lead.name}...`);

        try {
            // Get dynamic price from services table
            const { data: service } = await supabase
                .from('services')
                .select('price, title')
                .ilike('title', '%Resume Review%')
                .single();

            const unitAmount = service?.price ? Math.round(service.price * 100) : 2000; // Default $20
            const productName = service?.title || 'Resume Review & Career Consultation';

            // Create Stripe checkout session with dynamic pricing
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                payment_intent_data: {
                    capture_method: 'manual',
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
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/resume/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/resume`,
                customer_email: lead.email,
                client_reference_id: lead.id,
                metadata: {
                    leadId: lead.id,
                    type: 'resume_review',
                    name: lead.name,
                    email: lead.email,
                },
            });

            // Update the resume lead with new payment link
            const { error: updateError } = await supabase
                .from('resume_leads')
                .update({
                    stripe_payment_link: session.url,
                })
                .eq('id', lead.id);

            if (updateError) {
                console.error('  ❌ Error updating payment link:', updateError.message);
                continue;
            }

            console.log('  ✅ Payment link generated');
            console.log(`  🔗 ${session.url}`);

        } catch (error) {
            console.error('  ❌ Stripe error:', error.message);
        }
    }

    console.log(`\n✅ Complete! Regenerated payment links for ${unpaidLeads.length} submissions.`);
}

regeneratePaymentLinks().catch(console.error);
