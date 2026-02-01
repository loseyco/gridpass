'use client';

import { useFormState } from 'react-dom';
import { submitFeature } from './actions';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const initialState = {
    message: null as string | null,
    error: null as string | null,
    success: false
};

export default function FeatureSubmitForm() {
    // Adapter for server action to match useFormState signature
    const [state, formAction] = useFormState(async (prevState: any, formData: FormData) => {
        const result = await submitFeature(formData);
        if (result.error) {
            return { error: result.error, success: false, message: null };
        }
        return { success: true, error: null, message: "Feature request submitted successfully!" };
    }, initialState);

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset();
            // Optional: Toast notification if you have a toast library, or rely on the visible message
        }
    }, [state.success]);

    return (
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-white/5 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Lightbulb className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Have a better idea?</h2>
            </div>

            {state.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-bold">
                    {state.message}
                </div>
            )}

            {state.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-bold">
                    {state.error}
                </div>
            )}

            <form ref={formRef} action={formAction} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Feature Title</label>
                        <input
                            name="title"
                            type="text"
                            required
                            placeholder="e.g. Mobile App Team Chat"
                            className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white focus:border-indigo-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Category</label>
                        <select
                            name="category"
                            className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white focus:border-indigo-500 outline-none transition-colors appearance-none"
                        >
                            <option value="General">General</option>
                            <option value="Jobs">Jobs</option>
                            <option value="Profile">Profile</option>
                            <option value="Team">Team Management</option>
                            <option value="Integrations">Integrations</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Description</label>
                    <textarea
                        name="description"
                        required
                        rows={4}
                        placeholder="Explain how this would help you..."
                        className="w-full bg-neutral-950 border border-white/10 p-3 rounded-lg text-white focus:border-indigo-500 outline-none transition-colors resize-none"
                    />
                </div>

                <SubmitButton />

                <p className="text-center text-xs text-neutral-500 pt-2">
                    Note: You must be logged in to submit.
                </p>
            </form>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    // useFormStatus must be used inside the form, but wait, useFormStatus hook is from react-dom.
    // It reads the status of the parent <form>. Since this component is inside the form, it works.

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
        >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? 'Submitting...' : 'Submit Request'}
        </button>
    );
}

// Helper for useFormStatus
import { useFormStatus } from 'react-dom';
