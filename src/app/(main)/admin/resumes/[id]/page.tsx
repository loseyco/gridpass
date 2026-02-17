import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updateResumeLeadStatus, updatePaymentLink, updatePaymentStatus } from '@/app/actions/resume';
import { capturePreAuthPayment, grantVerifiedBadge } from '@/app/actions/stripe-capture';
import { syncToProfile } from '@/app/actions/admin-resume';
import ResumeTools from '@/components/admin/ResumeTools';
import ResumeFieldChecklist from '@/components/admin/ResumeFieldChecklist';
import ResumeUploader from '@/components/admin/ResumeUploader';
import { ProfilePhotoUploader } from '@/components/admin/ProfilePhotoUploader';
import { BackgroundImageUploader } from '@/components/admin/BackgroundImageUploader';
import { AIVerificationPanel } from '@/components/admin/AIVerificationPanel';
import { ArrowLeft, User, Briefcase, Mail, Phone, ExternalLink, Calendar, CreditCard, CheckCircle, Save, DollarSign, Award, RefreshCw, Send } from 'lucide-react';
import { AIAutoPilot } from '@/components/admin/AIAutoPilot';
import { generateAndSendPaymentLink } from '@/app/actions/resume';

export const dynamic = 'force-dynamic';

export default async function ResumeLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: lead, error } = await supabase
        .from('resume_leads')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !lead) {
        return <div className="p-8 text-red-500">Lead not found</div>;
    }

    // Fetch Shadow Profile (Lead)
    // We need this to link to the editor
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resume Lead Email -> Real User Profile
    // We want to find the user profile associated with this lead email
    let userProfile = null;
    let existingToken = '';

    // First try by user_id if we store it (we should add it to resume_leads schema if not present, but for now scan profiles)
    // Actually, let's just look up the user by email in public.profiles or auth
    // We can use the admin client to find the user ID from the email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const match = users.users.find(u => u.email === lead.email);

    if (match) {
        // Fetch the full profile to get the username
        const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .eq('id', match.id)
            .single();

        userProfile = { id: match.id, email: match.email, username: profileData?.username }; // minimal info

        const { data: tokenData } = await supabaseAdmin
            .from('claim_tokens')
            .select('token')
            .eq('entity_id', match.id)
            .eq('entity_type', 'lead') // Changed to 'lead' (hack)
            .limit(1)
            .single();
        if (tokenData) existingToken = tokenData.token;
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-mono p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/admin/resumes" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to List
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Auto-Pilot Section - Full Width */}
                    <div className="lg:col-span-3">
                        <AIAutoPilot
                            leadId={lead.id}
                            leadName={lead.name}
                            resumeUrl={lead.resume_url}
                        />
                    </div>

                    {/* Left Column - Field Checklist */}
                    <div className="lg:col-span-2">
                        <ResumeFieldChecklist leadId={lead.id} leadData={lead} />
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">

                        {/* Status Manager */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <h3 className="font-bold mb-4 text-neutral-300">Workflow Status</h3>
                            <form action={async (formData) => {
                                'use server';
                                await updateResumeLeadStatus(lead.id, formData.get('status') as string);
                            }}>
                                <select
                                    name="status"
                                    defaultValue={lead.status || 'new'}
                                    className="w-full bg-neutral-800 border-white/10 rounded-lg p-2 text-white mb-4"
                                >
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="paid">Paid</option>
                                    <option value="built">Built</option>
                                    <option value="live">Live</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <button type="submit" className="w-full bg-white text-black font-bold py-2 rounded hover:bg-neutral-200 transition-colors">
                                    Update Status
                                </button>
                            </form>
                        </div>

                        {/* Payment & Verification */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <h3 className="font-bold mb-4 text-neutral-300 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Payment & Verification
                            </h3>

                            {/* Payment Status Badge */}
                            <div className="mb-4">
                                {lead.payment_status === 'authorized' && (
                                    <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                        Pre-Authorized - Ready to Capture
                                    </div>
                                )}
                                {lead.payment_status === 'paid' && (
                                    <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Payment Complete
                                    </div>
                                )}
                                {(!lead.payment_status || lead.payment_status === 'unpaid') && (
                                    <div className="bg-neutral-800 text-neutral-400 border border-white/10 px-3 py-2 rounded-lg text-sm font-bold">
                                        Awaiting Payment
                                    </div>
                                )}
                            </div>

                            {/* Contextual Action Buttons */}
                            <div className="space-y-3">
                                {/* Capture Pre-Auth Payment */}
                                {lead.payment_status === 'authorized' && (
                                    <form action={async () => {
                                        'use server';
                                        const result = await capturePreAuthPayment(lead.id);
                                        if (!result.success) {
                                            console.error('Capture failed:', result.error);
                                        }
                                    }}>
                                        <button
                                            type="submit"
                                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            Capture Payment ($20)
                                        </button>
                                    </form>
                                )}

                                {/* Grant Verified Badge */}
                                {lead.payment_status === 'paid' && (
                                    <form action={async () => {
                                        'use server';
                                        const result = await grantVerifiedBadge(lead.id);
                                        if (!result.success) {
                                            console.error('Badge grant failed:', result.error);
                                        }
                                    }}>
                                        <button
                                            type="submit"
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                                        >
                                            <Award className="w-4 h-4" />
                                            Grant Verified Badge
                                        </button>
                                    </form>
                                )}\n\n                                {/* Send Payment Link */}
                                {(!lead.payment_status || lead.payment_status === 'unpaid') && (
                                    <form action={async () => {
                                        'use server';
                                        const result = await generateAndSendPaymentLink(lead.id);
                                        if (!result.success) {
                                            console.error('Failed to send payment link:', result.error);
                                        }
                                    }}>
                                        <button
                                            type="submit"
                                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send Payment Link via Email
                                        </button>
                                    </form>
                                )}

                                {/* Manual Override Controls (collapsed) */}
                                <details className="mt-4">
                                    <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-400">
                                        Manual Overrides
                                    </summary>
                                    <div className="flex gap-2 mt-2">
                                        {lead.payment_status !== 'authorized' && lead.payment_status !== 'paid' && (
                                            <form action={async () => {
                                                'use server';
                                                await updatePaymentStatus(lead.id, 'authorized');
                                            }}>
                                                <button type="submit" className="text-[10px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/20">
                                                    Force Auth
                                                </button>
                                            </form>
                                        )}
                                        {lead.payment_status !== 'paid' && (
                                            <form action={async () => {
                                                'use server';
                                                await updatePaymentStatus(lead.id, 'paid');
                                            }}>
                                                <button type="submit" className="text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/20">
                                                    Mark Paid
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </details>
                            </div>
                        </div>

                        {/* AI Verification */}
                        <AIVerificationPanel
                            leadId={lead.id}
                            resumeUrl={lead.resume_url}
                            currentData={lead}
                        />

                        {/* Resume Upload */}
                        <ResumeUploader leadId={lead.id} currentResumeUrl={lead.resume_url} />

                        {/* Profile Photo */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <h3 className="font-bold mb-4 text-neutral-300">Profile Photo</h3>
                            <ProfilePhotoUploader
                                leadId={lead.id}
                                currentPhotoUrl={lead.photo_url}
                            />
                        </div>

                        {/* Background Image */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <h3 className="font-bold mb-4 text-neutral-300">Background Image</h3>
                            <BackgroundImageUploader
                                leadId={lead.id}
                                currentBackgroundUrl={lead.metadata?.background_url}
                            />
                        </div>

                        {/* Sync to Profile */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <h3 className="font-bold mb-4 text-neutral-300 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Profile Sync
                            </h3>
                            <form action={async () => {
                                'use server';
                                const result = await syncToProfile(lead.id);
                                if (!result.success) {
                                    console.error('Sync failed:', result.error);
                                }
                            }}>
                                <button
                                    type="submit"
                                    disabled={lead.payment_status !== 'paid'}
                                    className={`
                                        w-full flex items-center justify-center gap-2 font-bold py-3 rounded-lg transition-all
                                        ${lead.payment_status === 'paid'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                                            : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Push Data to Profile
                                </button>
                                {lead.payment_status !== 'paid' && (
                                    <p className="text-xs text-neutral-500 mt-2 text-center">
                                        Payment must be captured first
                                    </p>
                                )}
                            </form>
                        </div>

                        {/* Resume Tools (Research + Claim) */}
                        <ResumeTools
                            name={lead.name}
                            email={lead.email}
                            jobTitle={lead.job_title}
                            userId={userProfile?.id}
                            username={userProfile?.username}
                            leadStatus={lead.status}
                            initialToken={existingToken}
                        />

                    </div>

                </div>
            </div>
        </div >
    );
}
