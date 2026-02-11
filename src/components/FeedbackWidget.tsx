'use client';

import { useState, useEffect } from 'react';
import { MessageSquarePlus, X, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedback } from '@/app/actions/feedback'; // Import the server action

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'feature' | 'bug' | 'contact'>('feature');
    const [showNudge, setShowNudge] = useState(false);

    // Periodic nudge logic
    useEffect(() => {
        // Don't show nudge if widget is already open
        if (isOpen) {
            setShowNudge(false);
            return;
        }

        const NUDGE_DURATION = 6000; // 6 seconds
        const NUDGE_INTERVAL = 300000; // 5 minutes
        const INITIAL_DELAY = 10000; // 10 seconds

        let nudgeTimer: NodeJS.Timeout;
        let hideTimer: NodeJS.Timeout;

        // Function to show nudge and auto-hide
        const triggerNudge = () => {
            // Double check if open before showing
            if (!isOpen) {
                setShowNudge(true);
                hideTimer = setTimeout(() => {
                    setShowNudge(false);
                }, NUDGE_DURATION);
            }
        };

        // Initial delay
        const initialTimer = setTimeout(() => {
            triggerNudge();
            // Start the interval after the initial delay
            nudgeTimer = setInterval(triggerNudge, NUDGE_INTERVAL);
        }, INITIAL_DELAY);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(nudgeTimer);
            clearTimeout(hideTimer);
        };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        // Add additional fields not in the form directly if needed, or rely on hidden inputs
        formData.append('type', type);
        formData.append('page_url', window.location.href);

        try {
            const result = await submitFeedback(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Feedback submitted successfully!');
                setIsOpen(false);
                (e.target as HTMLFormElement).reset();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setShowNudge(false);
        }
    };

    return (
        <>
            {/* Nudge Tooltip */}
            <div
                className={`fixed bottom-8 right-24 z-40 transition-all duration-300 transform pointer-events-none ${showNudge ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
            >
                <div className="bg-white text-neutral-900 px-4 py-2 rounded-xl shadow-xl font-medium text-sm whitespace-nowrap relative">
                    👋 Hey! I'm down here if you need me!
                    {/* Arrow/Triangle */}
                    <div className="absolute top-1/2 -right-1 w-3 h-3 bg-white transform -translate-y-1/2 rotate-45 rotate-y-6" />
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={toggleOpen}
                className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center group"
                aria-label="Submit Feedback"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageSquarePlus className="w-6 h-6" />
                )}
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:pl-2">
                    {isOpen ? 'Close' : 'Feedback'}
                </span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Content */}
                    <div
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-200"
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-2">
                            Share your thoughts
                        </h2>
                        <p className="text-neutral-400 text-sm mb-6">
                            Found a bug, have a feature idea, or want to contact us?
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type Selection */}
                            <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setType('feature')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'feature'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                        }`}
                                >
                                    Feature
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('bug')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'bug'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                        }`}
                                >
                                    Bug
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('contact')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'contact'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                        }`}
                                >
                                    Contact
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
                                    Title / Subject
                                </label>
                                <input
                                    name="title"
                                    required
                                    placeholder={type === 'feature' ? "e.g. Dark Mode" : type === 'bug' ? "e.g. Login Error" : "e.g. Partnership Inquiry"}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
                                    Details
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    rows={4}
                                    placeholder="Tell us more..."
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2.5 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${type === 'feature'
                                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                                    : type === 'bug'
                                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Submit Feedback
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
