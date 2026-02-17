
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { updatePaymentStatus } from '@/app/actions/resume';
import { redirect } from 'next/navigation';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client for bypassing RLS to find the lead
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CheckoutReturnPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id: string }>;
}) {
    const { session_id } = await searchParams;

    if (!session_id) {
        return <div>Error: No Session ID</div>;
    }

    if (!stripe) {
        return <div>Error: Stripe not configured</div>;
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        const leadId = session.client_reference_id;
        const status = session.status;

        if (status === 'complete' && leadId) {
            // Update Payment Status
            await updatePaymentStatus(leadId, 'paid');

            // Fetch the lead to get username and token to redirect back
            // We need to find the claim token associated with this lead to keep them in guest mode
            const { data: tokenData } = await supabaseAdmin
                .from('claim_tokens')
                .select('token, entity_id') // entity_id is lead.id
                .eq('entity_id', leadId)
                .single();

            const { data: leadData } = await supabaseAdmin
                .from('leads')
                .select('contact_info')
                .eq('id', leadId)
                .single();

            if (leadData && tokenData) {
                const username = leadData.contact_info?.username;
                const token = tokenData.token;
                if (username && token) {
                    redirect(`/u/${username}?secret=${token}`);
                }
            }
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
                    <p>Redirecting you back to your profile...</p>
                </div>
            </div>
        );

    } catch (error) {
        console.error('Error verifying payment:', error);
        return <div>Error verifying payment. Please contact support.</div>;
    }
}
