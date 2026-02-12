'use client';

import { useState } from 'react';
import { updateLead } from '@/app/actions/lead-editor';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LeadEditor({ lead }: { lead: any }) {
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (formData: FormData) => {
        setSaving(true);
        setMessage('');

        const res = await updateLead(lead.id, formData);

        if (res.error) {
            setMessage('Error: ' + res.error);
        } else {
            setMessage('Saved successfully!');
        }
        setSaving(false);
    };

    const contact = lead.contact_info || {};

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Link href="/admin/resumes" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Resumes
            </Link>

            <header className="mb-8 border-b border-white/10 pb-6">
                <h1 className="text-3xl font-bold mb-2">Build Profile: {lead.name}</h1>
                <p className="text-neutral-400">Edit the shadow profile before the user claims it.</p>
            </header>

            <form action={handleSubmit} className="space-y-8">

                {/* Basic Info */}
                <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4 text-indigo-400">Basic Info</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 mb-1">Full Name</label>
                            <input name="name" defaultValue={lead.name} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 mb-1">Role / Job Title</label>
                            <input name="role" defaultValue={lead.role} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs uppercase text-neutral-500 mb-1">Bio</label>
                            <textarea name="bio" defaultValue={contact.bio} rows={4} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 mb-1">Email</label>
                            <input name="email" defaultValue={contact.email} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 mb-1">Phone</label>
                            <input name="phone" defaultValue={contact.phone} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 mb-1">Location</label>
                            <input name="location" defaultValue={contact.location} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4 text-indigo-400">Skills</h2>
                    <label className="block text-xs uppercase text-neutral-500 mb-1">Comma Separated</label>
                    <input
                        name="skills"
                        defaultValue={lead.skills ? lead.skills.join(', ') : ''}
                        className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white"
                        placeholder="e.g. Data Analysis, Pit Stops, Welding"
                    />
                </div>

                {/* Social Links */}
                <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4 text-indigo-400">Socials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 mb-1">LinkedIn URL</label>
                            <input name="linkedin" defaultValue={contact.linkedin} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 mb-1">Instagram URL</label>
                            <input name="instagram" defaultValue={contact.social_links?.instagram} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-neutral-500 mb-1">Website / Portfolio</label>
                            <input name="website" defaultValue={contact.website} className="w-full bg-neutral-950 border border-white/10 rounded p-2 text-white" />
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>

                {message && (
                    <div className={`p-4 rounded border ${message.includes('Error') ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                        {message}
                    </div>
                )}

            </form>
        </div>
    );
}
