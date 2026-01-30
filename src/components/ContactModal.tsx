'use client';

import { useState } from 'react';
import { X, Send, Loader2, Mail } from 'lucide-react';
import { sendContactEmail } from '@/app/actions/contact';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientUsername: string;
}

export default function ContactModal({ isOpen, onClose, recipientName, recipientUsername }: ContactModalProps) {
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    async function handleSubmit(formData: FormData) {
        setIsSending(true);
        setStatus('idle');

        // Append recipient info so server knows who to email
        formData.append('recipientUsername', recipientUsername);

        const result = await sendContactEmail(formData);

        if (result.success) {
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setErrorMessage('');
            }, 2000);
        } else {
            setStatus('error');
            setErrorMessage(result.error || 'Unknown error');
        }
        setIsSending(false);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-neutral-900 border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Hire {recipientName}</h2>
                    <p className="text-neutral-400 mt-1">Send a direct message regarding work opportunities.</p>
                </div>

                {status === 'success' ? (
                    <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-xl text-center border border-emerald-500/20 py-12">
                        <p className="font-bold text-lg mb-2">Message Sent!</p>
                        <p className="text-sm opacity-80">{recipientName} will get back to you shortly.</p>
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                                Your Name
                            </label>
                            <input
                                name="name"
                                required
                                className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="Team Manager / Recruiter"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                                Your Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="you@team.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                                Message
                            </label>
                            <textarea
                                name="message"
                                required
                                rows={4}
                                className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white focus:border-indigo-500 outline-none resize-none transition-colors"
                                placeholder={`Hi ${recipientName}, I'd like to discuss a role...`}
                            />
                        </div>

                        {status === 'error' && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-400 text-sm text-center">
                                <p className="font-bold">Error:</p>
                                {errorMessage || "Failed to send. Please try again."}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSending}
                            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Message
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
