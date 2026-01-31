'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, User, Image as ImageIcon, MapPin, Briefcase, FileText } from 'lucide-react';

interface Profile {
    full_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    cover_image_url?: string | null;
    location?: string | null;
    career_history?: any[] | null;
}

export default function ProfileCompletionWidget({ profile }: { profile: Profile | null }) {
    if (!profile) return null;

    const checks = [
        {
            label: 'Set Display Name',
            isComplete: !!profile.full_name,
            href: '/dashboard/profile',
            icon: User
        },
        {
            label: 'Upload Avatar',
            isComplete: !!profile.avatar_url,
            href: '/dashboard/profile',
            icon: ImageIcon
        },
        {
            label: 'Add Bio',
            isComplete: !!profile.bio && profile.bio.length > 10,
            href: '/dashboard/profile',
            icon: FileText
        },
        {
            label: 'Set Location',
            isComplete: !!profile.location,
            href: '/dashboard/profile',
            icon: MapPin
        },
        {
            label: 'Add Career History',
            isComplete: Array.isArray(profile.career_history) && profile.career_history.length > 0,
            href: '/dashboard/profile',
            icon: Briefcase
        },
        {
            label: 'Upload Cover Image',
            isComplete: !!profile.cover_image_url,
            href: '/dashboard/profile',
            icon: ImageIcon
        }
    ];

    const completedCount = checks.filter(c => c.isComplete).length;
    const progress = Math.round((completedCount / checks.length) * 100);
    const nextAction = checks.find(c => !c.isComplete);

    if (progress === 100) return null; // Hide if fully complete? Or maybe show a "Great Job" state.

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-white">Complete Your Profile</h3>
                        <p className="text-neutral-400 text-sm">Boost your visibility in the GridPass directory.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-indigo-400">{progress}%</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-neutral-800 h-2 rounded-full mb-6 overflow-hidden">
                    <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="space-y-3">
                    {checks.map((check, idx) => (
                        <div key={idx} className={`flex items-center justify-between text-sm ${check.isComplete ? 'text-neutral-600' : 'text-white font-medium'}`}>
                            <div className="flex items-center gap-3">
                                {check.isComplete ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                                ) : (
                                    <Circle className="w-5 h-5 text-neutral-600" />
                                )}
                                <span className={check.isComplete ? 'line-through decoration-neutral-700' : ''}>
                                    {check.label}
                                </span>
                            </div>
                            {!check.isComplete && (
                                <Link
                                    href={check.href}
                                    className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                                >
                                    Fix <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
