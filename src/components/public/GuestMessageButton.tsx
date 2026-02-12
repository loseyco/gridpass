'use client';

import { useState } from 'react';
import { sendGuestMessage } from '@/app/actions/messaging';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';

export default function GuestMessageButton({ token }: { token: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!message.trim()) return;
        setSending(true);
        setError('');

        const res = await sendGuestMessage(token, message);

        setSending(false);
        if (res.error) {
            setError(res.error);
        } else {
            setSent(true);
            setTimeout(() => {
                setIsOpen(false);
                setSent(false); // Reset for next time if they open again (but maybe hide button?)
                setMessage('');
            }, 2000);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors text-sm font-medium border border-white/5"
            >
                <MessageCircle className="w-4 h-4" />
                Message Team
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-indigo-500" />
                            Send Message
                        </h3>
                        <p className="text-sm text-neutral-400 mb-6">
                            Have questions or updates? Send a direct message to the admin team.
                        </p>

                        {!sent ? (
                            <div className="space-y-4">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full h-32 bg-neutral-950 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500/50 resize-none"
                                />

                                {error && <p className="text-red-400 text-sm">{error}</p>}

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 text-neutral-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={sending || !message.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Send
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center space-y-3">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                                    <Send className="w-6 h-6" />

                                </div>
                                <h4 className="text-white font-bold">Message Sent!</h4>
                                <p className="text-neutral-500 text-sm">We'll get back to you shortly.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
