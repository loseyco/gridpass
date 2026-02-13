import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, User, Clock, CheckCircle, ExternalLink, Mail, ArrowRight, Send } from 'lucide-react';
import { generateAndSendPaymentLink } from '@/app/actions/resume';

export default async function ResumeLeadsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch leads
    const { data: leads, error } = await supabase
        .from('resume_leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'contacted': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'built': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'live': return 'bg-green-500/10 text-green-500 border-green-500/20';
            default: return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-mono p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 border-b border-white/10 pb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-indigo-500" />
                            Resume Requests
                        </h1>
                        <p className="text-neutral-400">Manage incoming resume build requests.</p>
                    </div>
                    <Link href="/admin" className="text-sm text-neutral-500 hover:text-white transition-colors">
                        &larr; Back to Command Center
                    </Link>
                </header>

                <div className="border border-white/10 rounded-xl overflow-hidden bg-neutral-900/30">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 font-medium text-neutral-400 text-sm">Status</th>
                                <th className="p-4 font-medium text-neutral-400 text-sm">Name</th>
                                <th className="p-4 font-medium text-neutral-400 text-sm">Role</th>
                                <th className="p-4 font-medium text-neutral-400 text-sm">Contact</th>
                                <th className="p-4 font-medium text-neutral-400 text-sm">Date</th>
                                <th className="p-4 font-medium text-neutral-400 text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads?.map((lead) => (
                                <tr key={lead.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(lead.status || 'new')}`}>
                                            {(lead.status || 'new').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-white">
                                        {lead.name}
                                    </td>
                                    <td className="p-4 text-neutral-400 text-sm">
                                        {lead.job_title}
                                    </td>
                                    <td className="p-4 text-neutral-400 text-sm">
                                        <div className="flex flex-col">
                                            <span>{lead.email}</span>
                                            <span className="text-xs opacity-50">{lead.phone}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-neutral-500 text-xs">
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/admin/resumes/${lead.id}`}
                                                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                            >
                                                View
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            {(lead.payment_status === 'unpaid' || !lead.payment_status) && (
                                                <form action={async () => {
                                                    'use server';
                                                    const result = await generateAndSendPaymentLink(lead.id);
                                                    if (!result.success) {
                                                        console.error('Failed to send payment link:', result.error);
                                                    }
                                                }}>
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                                                        title="Send payment link via email"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                        Pay
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {leads?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-neutral-500 italic">
                                        No resume requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
