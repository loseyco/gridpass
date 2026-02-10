import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updateResumeLeadStatus, updatePaymentLink } from '@/app/actions/resume';
import { ArrowLeft, User, Briefcase, Mail, Phone, ExternalLink, Calendar, CreditCard, CheckCircle, Save } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-mono p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/admin/resumes" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    Back to List
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Header */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <h1 className="text-3xl font-bold mb-2">{lead.name}</h1>
                            <div className="flex items-center gap-4 text-neutral-400 text-sm">
                                <span className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    {lead.email}
                                </span>
                                {lead.phone && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        {lead.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                                    <Briefcase className="w-5 h-5" />
                                    Professional Info
                                </h2>
                                {lead.photo_url && (
                                    <img src={lead.photo_url} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="text-xs text-neutral-500 uppercase tracking-widest block mb-1">Current Role</label>
                                    <p className="font-bold">{lead.job_title || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 uppercase tracking-widest block mb-1">Experience</label>
                                    <p className="font-bold">{lead.experience_years}</p>
                                </div>
                            </div>

                            {/* Metadata Display */}
                            {lead.metadata && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-white/5">
                                    {lead.metadata.home_airport && (
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Home Airport</label>
                                            <p className="font-mono text-sm">{lead.metadata.home_airport}</p>
                                        </div>
                                    )}
                                    {lead.metadata.helmet_size && (
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Helmet</label>
                                            <p className="font-mono text-sm">{lead.metadata.helmet_size}</p>
                                        </div>
                                    )}
                                    {lead.metadata.looking_for && (
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Seeking</label>
                                            <p className="font-bold text-sm text-indigo-400">{lead.metadata.looking_for}</p>
                                        </div>
                                    )}
                                    {lead.metadata.salary_expectations && (
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Rate</label>
                                            <p className="font-mono text-sm text-emerald-400">{lead.metadata.salary_expectations}</p>
                                        </div>
                                    )}
                                    {lead.metadata.skills && lead.metadata.skills.length > 0 && (
                                        <div className="col-span-2 md:col-span-4 mt-2 pt-2 border-t border-white/5">
                                            <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-2">Skills</label>
                                            <div className="flex flex-wrap gap-2">
                                                {lead.metadata.skills.map((skill: string, i: number) => (
                                                    <span key={i} className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-300 border border-white/5">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="text-xs text-neutral-500 uppercase tracking-widest block mb-1">Bio / Notes</label>
                                <p className="text-neutral-300 bg-black/20 p-4 rounded-lg whitespace-pre-wrap">
                                    {lead.bio || 'No bio provided.'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs text-neutral-500 uppercase tracking-widest border-b border-white/5 pb-1">Links & Files</h3>

                                {lead.resume_url && (
                                    <a href={lead.resume_url} target="_blank" className="flex items-center gap-2 text-white bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-colors border border-white/10">
                                        <Save className="w-4 h-4 text-orange-400" />
                                        Download Resume (PDF)
                                    </a>
                                )}

                                {lead.linkedin_url && (
                                    <a href={lead.linkedin_url} target="_blank" className="flex items-center gap-2 text-blue-400 hover:underline">
                                        <ExternalLink className="w-4 h-4" />
                                        LinkedIn Profile
                                    </a>
                                )}
                                {lead.indeed_url && (
                                    <a href={lead.indeed_url} target="_blank" className="flex items-center gap-2 text-blue-600 hover:underline">
                                        <ExternalLink className="w-4 h-4" />
                                        Indeed Profile
                                    </a>
                                )}
                                {lead.portfolio_url && (
                                    <a href={lead.portfolio_url} target="_blank" className="flex items-center gap-2 text-emerald-400 hover:underline">
                                        <ExternalLink className="w-4 h-4" />
                                        Portfolio URL
                                    </a>
                                )}

                                {/* Social Links */}
                                {lead.social_links && (
                                    <div className="pt-2 flex flex-wrap gap-3">
                                        {Object.entries(lead.social_links).map(([key, value]) => {
                                            if (!value) return null;
                                            return (
                                                <a key={key} href={value as string} target="_blank" className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-400 hover:text-white capitalize">
                                                    {key}
                                                </a>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Actions */}
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

                        {/* Payment Link */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <h3 className="font-bold mb-4 text-neutral-300 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Stripe Payment
                            </h3>
                            <form action={async (formData) => {
                                'use server';
                                await updatePaymentLink(lead.id, formData.get('link') as string);
                            }}>
                                <input
                                    name="link"
                                    type="url"
                                    defaultValue={lead.stripe_payment_link || ''}
                                    placeholder="https://buy.stripe.com/..."
                                    className="w-full bg-neutral-800 border border-white/10 rounded-lg p-2 text-white text-sm mb-4"
                                />
                                <button type="submit" className="w-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold py-2 rounded hover:bg-indigo-600/30 transition-colors flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Save Link
                                </button>
                            </form>
                        </div>

                        {/* Create User Hint */}
                        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                            <h3 className="font-bold mb-2 text-neutral-300">Next Steps</h3>
                            <p className="text-xs text-neutral-500 mb-4">
                                Once paid, generate the profile manually or send an invite link.
                            </p>

                            <Link href={`/admin/invites?email=${encodeURIComponent(lead.email)}`} className="block w-full text-center bg-neutral-800 text-neutral-300 py-2 rounded text-sm hover:bg-neutral-700">
                                Go to Invite User &rarr;
                            </Link>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
