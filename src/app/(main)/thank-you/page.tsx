import Link from 'next/link';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/utils/supabase/admin';
import { randomBytes } from 'crypto';

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
    const { session_id } = await searchParams;

    if (!session_id) {
        redirect('/');
    }

    let customerName = 'Candidate';
    let customerEmail = '';
    let amount = 0;
    let claimToken = '';

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        customerName = session.customer_details?.name || 'Candidate';
        customerEmail = session.customer_details?.email || '';
        amount = session.amount_total ? session.amount_total / 100 : 0;

        const leadId = session.client_reference_id;

        if (leadId) {
            const supabaseAdmin = createAdminClient();

            // UPDATE PAYMENT STATUS
            // We use the leadId (which is the resume_lead.id) to update the record
            const paymentStatus = session.payment_intent
                ? (typeof session.payment_intent === 'string' ? 'authorized' : session.payment_intent.status) // Simply mark as authorized if intent exists for manual capture
                : 'unpaid';

            const paymentIntentId = typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id;

            // Update the resume_lead record
            await supabaseAdmin
                .from('resume_leads')
                .update({
                    payment_status: 'authorized', // We know it's authorized if they got here via success_url with manual capture
                    stripe_payment_intent: paymentIntentId,
                    status: 'paid' // Move workflow status to ready/paid
                })
                .eq('id', leadId);

            // 1. Check for existing token
            const { data: existingToken } = await supabaseAdmin
                .from('claim_tokens')
                .select('token')
                .eq('entity_id', leadId)
                .eq('entity_type', 'lead')
                .limit(1)
                .single();

            if (existingToken) {
                claimToken = existingToken.token;
            } else {
                // 2. Create new token
                // Find a system user to attribute creation to (or use the lead itself if allowed, but usually needs a user)
                // We'll try to find the first admin user
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
                const systemUserId = users?.[0]?.id;

                if (systemUserId) {
                    const newToken = randomBytes(16).toString('hex');
                    const { error: insertError } = await supabaseAdmin
                        .from('claim_tokens')
                        .insert({
                            token: newToken,
                            entity_type: 'lead',
                            entity_id: leadId,
                            created_by: systemUserId
                        });

                    if (!insertError) {
                        claimToken = newToken;
                    } else {
                        console.error('Error creating token:', insertError);
                    }
                }
            }
        }

    } catch (e) {
        console.error('Error fetching stripe session or generating token', e);
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-center font-sans">
            <div className="bg-neutral-900/50 border border-white/10 p-8 rounded-2xl max-w-md w-full backdrop-blur-sm shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 animate-in zoom-in duration-300">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Payment Authorized!</h1>
                <p className="text-neutral-400 mb-8">
                    We have received your authorization of <span className="text-white font-bold">${amount}</span> covering the Resume Review.
                </p>

                <div className="bg-white/5 rounded-xl p-6 mb-8 text-left border border-white/5">
                    <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Order Summary</h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Service</span>
                            <span className="text-white font-medium">Resume Review & Consultation</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Candidate</span>
                            <span className="text-white font-medium">{customerName}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-white/5">
                            <span className="text-neutral-500">Email</span>
                            <span className="text-neutral-400 font-mono text-xs">{customerEmail}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-neutral-500">Status</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Processing
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {claimToken ? (
                        <Link
                            href={`/claim/${claimToken}`}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                        >
                            View Order Status <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <Link
                            href="/"
                            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                        >
                            Return to Home
                        </Link>
                    )}

                    <p className="text-xs text-neutral-600 mt-4">
                        Order Ref: <span className="font-mono">{session_id.slice(-8)}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
