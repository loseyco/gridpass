'use client';

import { useState, useTransition, useEffect } from 'react';
import { submitRecommendation } from '@/app/actions/recommendations'; // Adjust import if needed
import { Loader2, Send, Star, User, Lock, CheckCircle, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function WriteRecommendation({ targetUserId, targetName, autoOpen = false }: { targetUserId: string, targetName: string, autoOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Client-side auth check
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (autoOpen) {
            setIsOpen(true);
        }
    }, [autoOpen]);

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();
    }, []);


    const handleSubmit = async (formData: FormData) => {
        setError('');
        startTransition(async () => {
            try {
                // Determine if we need to append targetUserId here or if action handles it from form hidden field
                // The form will have a hidden input for targetUserId

                await submitRecommendation(formData);
                setSubmitted(true);
            } catch (e) {
                console.error(e);
                setError('Failed to submit. Please try again.');
            }
        });
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">Recommendation Sent!</h3>
                        <p className="text-neutral-400 mb-8">
                            Thanks for vouching for {targetName}. Your recommendation is pending approval and will appear on their profile soon.
                        </p>

                        {!user ? (
                            <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/5 mb-6">
                                <h4 className="text-white font-bold mb-2">Join the Grid</h4>
                                <p className="text-sm text-neutral-400 mb-4">
                                    Create your own professional racing profile to showcase your career and get discovered.
                                </p>
                                <Link
                                    href="/register"
                                    className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
                                >
                                    Create My Profile
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-neutral-800/50 rounded-xl p-6 border border-white/5 mb-6">
                                <h4 className="text-white font-bold mb-2">Recommendation Submitted</h4>
                                <p className="text-sm text-neutral-400 mb-4">
                                    You can view your submitted recommendations in your dashboard.
                                </p>
                                <Link
                                    href="/dashboard/recommendations"
                                    className="block w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-lg transition-colors"
                                >
                                    Go to Dashboard
                                </Link>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setSubmitted(false);
                            }}
                            className="text-neutral-500 hover:text-white text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-lg hover:bg-indigo-600/20 transition-all text-sm font-bold uppercase tracking-wider"
            >
                <Star className="w-4 h-4" />
                Write Recommendation
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                >
                    ✕
                </button>

                <div className="p-6 border-b border-white/5 bg-neutral-800/30">
                    <h3 className="text-xl font-bold text-white">Recommend {targetName}</h3>
                    <p className="text-sm text-neutral-400">Share your professional experience working with {targetName}.</p>
                </div>

                <form action={handleSubmit} className="p-6 space-y-4">
                    <input type="hidden" name="targetUserId" value={targetUserId} />

                    {/* Relationship Context */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Relationship</label>
                        <select
                            name="relationship"
                            required
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="" disabled selected>Select relationship...</option>
                            <option value="Teammate">Teammate</option>
                            <option value="Team Principal">Team Principal / Manager</option>
                            <option value="Mechanic">Mechanic / Crew</option>
                            <option value="Client">Client</option>
                            <option value="Fellow Racer">Fellow Racer</option>
                            <option value="Mentor">Mentor</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Your Recommendation</label>
                        <textarea
                            name="content"
                            required
                            rows={4}
                            placeholder={`e.g. ${targetName} is an incredibly fast and consistent driver...`}
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                        />
                    </div>

                    {/* Author Info (Optional/Conditional - handled by backend if logged in, but we can ask always or hide if logged in. For simplicity, we'll ask generic inputs that get ignored if authed, or just ask always for unauthed.) 
                        Actually, to keep it simple for public users, we need these.
                    */}
                    {/* Author Info - Conditional */}
                    {user ? (
                        <div className="bg-neutral-800/50 border border-white/5 rounded-lg p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-xs text-white">
                                {user.user_metadata?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                            </div>
                            <div className="text-sm">
                                <div className="text-neutral-400 text-xs">Posting as</div>
                                <div className="font-bold text-white">{user.user_metadata?.full_name || user.email}</div>
                            </div>
                            <div className="ml-auto text-xs text-green-400 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    name="authorName"
                                    required
                                    placeholder="John Doe"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Your Email (Private)</label>
                                <input
                                    type="email"
                                    name="authorEmail"
                                    required
                                    placeholder="john@example.com"
                                    className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Submit Recommendation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
