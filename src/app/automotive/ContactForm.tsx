'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { submitConsultingInquiry } from '@/actions/submit-consulting-inquiry';

export function ContactForm() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        setStatus('submitting');
        setMessage('');

        // Add service type hidden field manually if not in DOM, or ensure it's in the form
        formData.set('serviceType', 'automotive');

        const result = await submitConsultingInquiry({ message: '' }, formData);

        if (result.success) {
            setStatus('success');
            setMessage(result.message);
            // Optional: Reset form
            const form = document.getElementById('consulting-form') as HTMLFormElement;
            if (form) form.reset();
        } else {
            setStatus('error');
            setMessage(result.message || 'Something went wrong.');
            console.error(result.errors);
        }
    }

    return (
        <form id="consulting-form" action={handleSubmit} className="grid gap-4">
            {status === 'success' ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-center">
                    <h3 className="text-lg font-bold mb-2">Message Sent</h3>
                    <p>{message}</p>
                    <Button
                        variant="outline"
                        onClick={() => setStatus('idle')}
                        className="mt-4 border-emerald-500/30 hover:bg-emerald-500/20"
                    >
                        Send Another
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none text-slate-400">Name</label>
                            <input
                                required
                                name="name"
                                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-slate-950 text-white"
                                id="name"
                                placeholder="Name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none text-slate-400">Email</label>
                            <input
                                required
                                type="email"
                                name="email"
                                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-slate-950 text-white"
                                id="email"
                                placeholder="project@example.com"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="message" className="text-sm font-medium leading-none text-slate-400">How can I help?</label>
                        <textarea
                            required
                            name="message"
                            className="flex min-h-[80px] w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-slate-950 text-white"
                            id="message"
                            placeholder="I have a collection that needs oversight..."
                        />
                    </div>

                    {status === 'error' && (
                        <div className="text-sm text-red-400 bg-red-900/10 p-2 rounded border border-red-900/20">
                            {message}
                        </div>
                    )}

                    <Button
                        disabled={status === 'submitting'}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                    >
                        {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </Button>
                </>
            )}
        </form>
    );
}
