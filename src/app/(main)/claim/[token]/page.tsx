import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, ArrowRight, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

export default async function ClaimProfilePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const supabase = await createClient();

    // 1. Verify token
    const { data: lead } = await supabase
        .from('resume_leads')
        .select('*')
        .eq('verification_token', token)
        .single();

    if (!lead) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>

            <div className="w-full max-w-3xl relative z-10">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/20">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        Profile Verified
                    </h1>
                    <p className="text-lg text-neutral-400">
                        GridPass AI has discovered and verified your professional profile.
                    </p>
                </div>

                {/* Profile Card */}
                <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl hover:shadow-indigo-500/10 transition-shadow duration-500">
                    {/* Cover Photo */}
                    <div className="h-48 relative bg-neutral-800 group">
                        {lead.metadata?.background_url ? (
                            <img
                                src={lead.metadata.background_url}
                                alt="Cover"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-neutral-700"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-90"></div>

                        {/* Profile Photo */}
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 rounded-full border-4 border-neutral-900 bg-neutral-800 overflow-hidden shadow-xl ring-2 ring-white/10">
                                {lead.photo_url ? (
                                    <img src={lead.photo_url} alt={lead.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                        <User className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-8">
                        {/* Name & Title */}
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-white mb-1">{lead.name}</h2>
                            <p className="text-indigo-400 font-medium text-lg flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                {lead.job_title || 'Professional'}
                            </p>

                            {/* Bio */}
                            {lead.metadata?.ai_enhanced_bio ? (
                                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5 relative">
                                    <div className="absolute -top-2 left-4 px-2 bg-neutral-900 text-xs text-indigo-400 font-bold uppercase tracking-wider border border-white/10 rounded">
                                        AI Enhanced Bio
                                    </div>
                                    <p className="text-neutral-300 leading-relaxed text-sm italic">
                                        "{lead.metadata.ai_enhanced_bio}"
                                    </p>
                                </div>
                            ) : (
                                lead.metadata?.professional_bio && (
                                    <p className="mt-4 text-neutral-300 leading-relaxed text-sm">
                                        {lead.metadata.professional_bio}
                                    </p>
                                )
                            )}
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3 text-sm text-neutral-400 bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                <Mail className="w-4 h-4 text-indigo-400" />
                                <span>{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-neutral-400 bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                <Phone className="w-4 h-4 text-indigo-400" />
                                <span>{lead.phone || 'Not verified'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-neutral-400 bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                <MapPin className="w-4 h-4 text-indigo-400" />
                                <span>{lead.city || 'Not verified'}</span>
                            </div>
                        </div>

                        {/* Skills Section */}
                        {lead.metadata?.skills && lead.metadata.skills.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white mb-3">Skills & Expertise</h3>
                                <div className="flex flex-wrap gap-2">
                                    {lead.metadata.skills.map((skill: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-lg text-sm border border-indigo-500/20"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Experience Section */}
                        {lead.metadata?.series_experience && lead.metadata.series_experience.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-white mb-3">Experience</h3>
                                <div className="space-y-3">
                                    {lead.metadata.series_experience.map((exp: any, idx: number) => (
                                        <div key={idx} className="border-l-2 border-indigo-500/30 pl-4 py-2">
                                            <h4 className="font-semibold text-white">{exp.series || exp.role}</h4>
                                            {exp.team && <p className="text-sm text-neutral-400">{exp.team}</p>}
                                            {exp.years && <p className="text-xs text-neutral-500">{exp.years}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Professional Details Grid */}
                        {(lead.experience_years || lead.metadata?.salary_expectations || lead.metadata?.availability || lead.metadata?.nationality) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-sm">
                                {lead.experience_years && (
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="text-neutral-500 text-xs mb-1">Experience</div>
                                        <div className="text-white font-medium">{lead.experience_years} years</div>
                                    </div>
                                )}
                                {lead.metadata?.salary_expectations && (
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="text-neutral-500 text-xs mb-1">Salary Expectations</div>
                                        <div className="text-white font-medium">{lead.metadata.salary_expectations}</div>
                                    </div>
                                )}
                                {lead.metadata?.availability && (
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="text-neutral-500 text-xs mb-1">Availability</div>
                                        <div className="text-white font-medium capitalize">{lead.metadata.availability}</div>
                                    </div>
                                )}
                                {lead.metadata?.nationality && (
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="text-neutral-500 text-xs mb-1">Nationality</div>
                                        <div className="text-white font-medium">{lead.metadata.nationality}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
                            <Link
                                href={`/dashboard/profile?claim_token=${token}`}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-indigo-600/20 text-lg group"
                            >
                                Confirm & Claim Profile
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <div className="flex items-center justify-center gap-4 mt-2">
                                <button className="text-sm text-neutral-500 hover:text-neutral-300 underline decoration-neutral-700 hover:decoration-neutral-500 underline-offset-4">
                                    Report an issue
                                </button>
                            </div>

                            <p className="text-center text-xs text-neutral-600 mt-2">
                                By claiming this profile, you agree to GridPass Terms of Service & Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
