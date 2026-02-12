'use client';

import { useState } from 'react';
import { createClaimLink, researchCandidate } from '@/app/actions/resume-tools';
import { convertToMember } from '@/app/actions/lead-conversion';
import { Loader2, Link as LinkIcon, Sparkles, UserPlus, ExternalLink } from 'lucide-react';

import { Pencil } from 'lucide-react';
import Link from 'next/link';

export default function ResumeTools({ name, email, jobTitle, userId, username, leadStatus, initialToken }: { name: string, email: string, jobTitle: string, userId?: string, username?: string, leadStatus?: string, initialToken?: string }) {
    const [generating, setGenerating] = useState(false);
    // ... (keep state if needed for other tools, but we are simplifying)

    // Construct Direct Profile Link
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const initialLink = initialToken && username
        ? `${baseUrl}/u/${username}?secret=${initialToken}`
        : initialToken // Fallback if no username (shouldn't happen for real users)
            ? `${baseUrl}/claim/${initialToken}`
            : '';

    const [claimLink, setClaimLink] = useState(initialLink);

    // ... (handlers)

    // Simplified copy function
    const copyLink = () => {
        if (!claimLink) return;
        navigator.clipboard.writeText(claimLink);
        alert('Copied!');
    };

    return (
        <div className="space-y-6">

            {/* Research Tool (Keep as is if compatible, otherwise hide for now) */}
            {/* ... we can keep it ... */}

            {/* Instant Access & Admin Edit */}
            <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
                <h3 className="font-bold mb-4 text-neutral-300 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Profile Access
                </h3>

                <div className="space-y-4">
                    {/* 1. Instant Access Link (for User) */}
                    <div>
                        <label className="text-xs text-neutral-500 uppercase tracking-widest block mb-2">User Instant Access Link</label>
                        {claimLink ? (
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={claimLink}
                                    className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-neutral-400 font-mono"
                                />
                                <button onClick={copyLink} className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded text-sm font-bold">
                                    Copy
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500 italic">No access token found.</p>
                        )}
                        <p className="text-[10px] text-neutral-600 mt-1">
                            Share this *private* link with the user to let them claim/view their profile.
                        </p>
                    </div>

                    {/* 2. Admin Edit Link */}
                    {userId && (
                        <div>
                            <label className="text-xs text-neutral-500 uppercase tracking-widest block mb-2">Admin Controls</label>
                            <Link
                                href={`/admin/users/${userId}`}
                                className="inline-flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded font-bold hover:bg-indigo-600/30 transition-colors w-full justify-center"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Edit Generic Profile (Admin)
                            </Link>
                            <p className="text-[10px] text-neutral-600 mt-1 text-center">
                                Modify profile details directly without logging in as the user.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
