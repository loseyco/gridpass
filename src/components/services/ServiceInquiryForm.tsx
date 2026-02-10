'use client';

import { useState } from 'react';
import { submitInquiry } from '@/app/actions/inquiries';
import { Loader2, Send, CheckCircle, AlertCircle } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';

// Using standard Tailwind for portability if UI lib is missing, or user prefers custom.
// But given the high aesthetic requirement, I will style it to match the premium dark theme.

interface ServiceInquiryFormProps {
    serviceId: string;
    serviceTitle: string;
}

export default function ServiceInquiryForm({ serviceId, serviceTitle }: ServiceInquiryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        formData.append('service_id', serviceId);

        try {
            // @ts-ignore
            const result = await submitInquiry(null, formData);

            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setSuccess(true);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (success) {
        return (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Inquiry Sent!</h3>
                <p className="text-neutral-400">
                    We've received your request for <span className="text-white font-medium">{serviceTitle}</span>.
                    The provider has been notified and will be in touch shortly.
                </p>
                <div className="mt-6">
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-sm text-green-400 hover:text-green-300 underline underline-offset-4"
                    >
                        Send another inquiry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900/50 border border-white/5 rounded-xl p-6 md:p-8">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Interested in this service?</h3>
                <p className="text-neutral-400 text-sm">Fill out the form below to contact the provider directly.</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3 text-sm text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="sender_name" className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            id="sender_name"
                            name="sender_name"
                            type="text"
                            placeholder="John Doe"
                            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="sender_email" className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            id="sender_email"
                            name="sender_email"
                            type="email"
                            placeholder="john@example.com"
                            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="sender_phone" className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Phone (Optional)
                    </label>
                    <input
                        id="sender_phone"
                        name="sender_phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                        Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        id="message"
                        name="message"
                        rows={4}
                        placeholder="Tell me about your project needs, timeline, and any specific requirements..."
                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                </div>

                {/* Hidden Project Details for now, or could serve as budget field */}
                {/* <input type="hidden" name="project_details" value="{}" /> */}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Send Inquiry
                    </>
                )}
            </button>
            <p className="text-center text-xs text-neutral-500">
                You'll receive a confirmation email once sent.
            </p>
        </form>
    );
}
