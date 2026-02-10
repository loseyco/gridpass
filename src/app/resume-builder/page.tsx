'use client';

import { useState } from 'react';
import { submitResumeLead } from '@/app/actions/resume';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ResumeBuilderPage() {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setSubmitting(true);
        setError(null);

        try {
            const result = await submitResumeLead(formData);
            if (result.error) {
                setError(result.error);
            } else {
                setSubmitted(true);
            }
        } catch (e) {
            setError('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-neutral-900 border border-white/10 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Request Received!</h2>
                    <p className="text-neutral-400 mb-8">
                        We've got your details. PJ will review your info and reach out shortly with next steps to build your pro racing resume.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
            {/* Hero Section */}
            <div className="relative py-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Get a <span className="text-indigo-500">Pro Racing Resume</span> <br />
                        That Gets You Hired.
                    </h1>
                    <p className="text-lg text-neutral-400 mb-8 max-w-2xl mx-auto">
                        Stop sending PDFs that nobody reads. Get a live, shareable GridPass profile that showcases your stats, experience, and availability perfectly on any device.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-sm font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Limited Time Offer: Custom Build for $20
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="max-w-2xl mx-auto px-4 pb-24 relative z-10">
                <form action={handleSubmit} className="space-y-8">

                    {/* Contact Info */}
                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            1. Contact Info
                        </h3>
                        <div className="grid gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-neutral-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="e.g. Lewis Hamilton"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-neutral-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        required
                                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="lewis@mercedesamg.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-400 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Details */}
                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            2. Racing Experience
                        </h3>
                        <div className="grid gap-6">

                            {/* File Uploads */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="resume_file" className="block text-sm font-medium text-neutral-400 mb-2">Upload Resume (PDF)</label>
                                    <input
                                        type="file"
                                        name="resume_file"
                                        id="resume_file"
                                        accept=".pdf"
                                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="photo_file" className="block text-sm font-medium text-neutral-400 mb-2">Profile Photo (Optional)</label>
                                    <input
                                        type="file"
                                        name="photo_file"
                                        id="photo_file"
                                        accept="image/*"
                                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="job_title" className="block text-sm font-medium text-neutral-400 mb-2">Primary Role</label>
                                <select
                                    name="job_title"
                                    id="job_title"
                                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                >
                                    <option value="driver">Driver (Club/Pro)</option>
                                    <option value="mechanic">Mechanic / Crew</option>
                                    <option value="engineer">Engineer / Data</option>
                                    <option value="media">Media / Content</option>
                                    <option value="sim">Sim Racer</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="experience_years" className="block text-sm font-medium text-neutral-400 mb-2">Years of Experience</label>
                                <select
                                    name="experience_years"
                                    id="experience_years"
                                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                >
                                    <option value="0-2">Rookie (0-2 Years)</option>
                                    <option value="3-5">Intermediate (3-5 Years)</option>
                                    <option value="5-10">Experienced (5-10 Years)</option>
                                    <option value="10+">Veteran (10+ Years)</option>
                                </select>
                            </div>

                            {/* New Fields: Skills & Logistics */}
                            <div>
                                <label htmlFor="skills" className="block text-sm font-medium text-neutral-400 mb-2">Top Skills (Comma Separated)</label>
                                <input
                                    type="text"
                                    name="skills"
                                    id="skills"
                                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="e.g. Data Analysis, Fabrication, Setup, Coaching"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="helmet_size" className="block text-sm font-medium text-neutral-400 mb-2">Helmet Size</label>
                                    <select
                                        name="helmet_size"
                                        id="helmet_size"
                                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select Size</option>
                                        <option value="XS">XS (53-54cm)</option>
                                        <option value="S">S (55-56cm)</option>
                                        <option value="M">M (57-58cm)</option>
                                        <option value="L">L (59-60cm)</option>
                                        <option value="XL">XL (61-62cm)</option>
                                        <option value="XXL">XXL (63-64cm)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="home_airport" className="block text-sm font-medium text-neutral-400 mb-2">Home Airport Code</label>
                                    <input
                                        type="text"
                                        name="home_airport"
                                        id="home_airport"
                                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase"
                                        placeholder="e.g. LHR, LAX, MEL"
                                        maxLength={4}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="looking_for" className="block text-sm font-medium text-neutral-400 mb-2">Work Preference</label>
                                    <select
                                        name="looking_for"
                                        id="looking_for"
                                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select Preference</option>
                                        <option value="Full-time">Full-time Team Member</option>
                                        <option value="Contract">Contract / Fly-in</option>
                                        <option value="Weekend">Weekend Warrior</option>
                                        <option value="Internship">Internship</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="salary_expectations" className="block text-sm font-medium text-neutral-400 mb-2">Salary / Day Rate (Optional)</label>
                                    <input
                                        type="text"
                                        name="salary_expectations"
                                        id="salary_expectations"
                                        className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="e.g. $500/day or Negotiable"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-neutral-400 mb-2">Short Bio / Highlights</label>
                                <textarea
                                    name="bio"
                                    id="bio"
                                    rows={4}
                                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Tell us about your biggest wins, championships, or key skills..."
                                />
                            </div>

                            {/* URLs & Socials */}
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Links & Socials</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="linkedin_url" className="block text-sm font-medium text-neutral-400 mb-2">LinkedIn URL</label>
                                        <input
                                            type="url"
                                            name="linkedin_url"
                                            id="linkedin_url"
                                            className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="indeed_url" className="block text-sm font-medium text-neutral-400 mb-2">Indeed Profile</label>
                                        <input
                                            type="url"
                                            name="indeed_url"
                                            id="indeed_url"
                                            className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="https://indeed.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="portfolio_url" className="block text-sm font-medium text-neutral-400 mb-2">Portfolio / Website</label>
                                        <input
                                            type="url"
                                            name="portfolio_url"
                                            id="portfolio_url"
                                            className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="instagram_url" className="block text-sm font-medium text-neutral-400 mb-2">Instagram URL</label>
                                        <input
                                            type="url"
                                            name="instagram_url"
                                            id="instagram_url"
                                            className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="https://instagram.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="twitter_url" className="block text-sm font-medium text-neutral-400 mb-2">Twitter/X URL</label>
                                        <input
                                            type="url"
                                            name="twitter_url"
                                            id="twitter_url"
                                            className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="https://x.com/..."
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Request
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-neutral-500 text-sm">
                        By submitting, you agree to be contacted by GridPass regarding your profile build.
                    </p>
                </form>
            </div>
        </div>
    );
}
