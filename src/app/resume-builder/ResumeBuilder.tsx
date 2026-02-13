'use client';

import { useState } from 'react';
import { submitResumeLead } from '@/app/actions/resume';
import VideoGuide from '@/components/VideoGuide';
import FeatureStatusBadge from '@/components/FeatureStatusBadge';
import { useTour } from '@/hooks/useTour';
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Calendar, MapPin, Globe, Award, Shield, Plane, Upload, User, Plus, X, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { event } from '@/lib/analytics';
import { DonationCard } from '@/components/launch/DonationCard';

// Initial State for Form Data
const INITIAL_DATA = {
    // Step 1: Contact
    name: '',
    email: '',
    phone: '',
    dob: '',
    nationality: '',
    home_airport: '',
    password: '',
    confirmPassword: '',

    // Step 2: Role
    job_title: 'driver',
    experience_years: '0-2',
    bio: '',
    skills: '', // stored as string, split on submit

    // Step 3: Motorsports
    licenses: [] as { type: string; number: string; expiry: string }[],
    series_experience: [] as string[], // We'll handle this as a comma-sep string in UI for simplicity or tags
    helmet_size: '',
    passport_valid: false,
    visa_status: '',
    looking_for: '',
    availability: '',
    salary_expectations: '',

    // Step 4: Socials & Files
    linkedin_url: '',
    indeed_url: '',
    portfolio_url: '',
    instagram_url: '',
    twitter_url: '',
    resume_file: null as File | null,
    photo_file: null as File | null,
    references: [] as { name: string; role: string; contact: string }[]
};

const STEPS = [
    { id: 1, title: 'Identity', icon: User },
    { id: 2, title: 'Role & Bio', icon: Award },
    { id: 3, title: 'Logistics', icon: Plane },
    { id: 4, title: 'Files & Socials', icon: Upload }
];

export default function ResumeBuilder() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(INITIAL_DATA);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [claimPath, setClaimPath] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [wantsPremiumService, setWantsPremiumService] = useState(false);
    const { startTour } = useTour();

    const startResumeTour = () => {
        startTour([
            { popover: { title: 'Welcome to Resume Builder', description: 'Let\'s create a professional racing resume in minutes. Follow this guide to get started.' } },
            { element: '#rb-header', popover: { title: 'Track Your Progress', description: 'You can see which step you are on here. You can save your progress by creating an account later.' } },
            { element: '#rb-videoguide', popover: { title: 'Watch a Video', description: 'Prefer to watch? Click here to see a video walkthrough of the entire process.' } },
            { element: '#rb-form-area', popover: { title: 'Fill In Your Details', description: 'Enter your information here. We will format it perfectly for teams.' } },
            { element: '#rb-next-btn', popover: { title: 'Next Step', description: 'Click here to proceed to the next section when you are done.' } },
        ]);
    };

    // Helper to update simple fields
    const updateField = (field: keyof typeof INITIAL_DATA, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Helper for array fields (licenses)
    const addLicense = () => {
        setFormData(prev => ({
            ...prev,
            licenses: [...prev.licenses, { type: '', number: '', expiry: '' }]
        }));
    };

    const updateLicense = (index: number, field: string, value: string) => {
        const newLicenses = [...formData.licenses];
        newLicenses[index] = { ...newLicenses[index], [field as any]: value };
        setFormData(prev => ({ ...prev, licenses: newLicenses }));
    };

    const removeLicense = (index: number) => {
        setFormData(prev => ({
            ...prev,
            licenses: prev.licenses.filter((_, i) => i !== index)
        }));
    };

    // Helper for references
    const addReference = () => {
        setFormData(prev => ({
            ...prev,
            references: [...prev.references, { name: '', role: '', contact: '' }]
        }));
    };

    const updateReference = (index: number, field: string, value: string) => {
        const newRefs = [...formData.references];
        newRefs[index] = { ...newRefs[index], [field as any]: value };
        setFormData(prev => ({ ...prev, references: newRefs }));
    };

    const removeReference = (index: number) => {
        setFormData(prev => ({
            ...prev,
            references: prev.references.filter((_, i) => i !== index)
        }));
    };

    const validateStep = (step: number) => {
        setError(null);
        if (step === 1) {
            if (!formData.name || !formData.email) return 'Name and Email are required.';
            if (!formData.password || formData.password.length < 8) return 'Password must be at least 8 characters.';
            if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
        }
        if (step === 2) {
            if (!formData.bio) return 'A short bio is required.';
        }
        return null;
    };

    const nextStep = () => {
        const errorMsg = validateStep(currentStep);
        if (errorMsg) {
            setError(errorMsg);
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => {
        setError(null);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const router = useRouter();

    async function handleSubmit() {
        // Final validation
        const errorMsg = validateStep(currentStep);
        if (errorMsg) {
            setError(errorMsg);
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const data = new FormData();
            // Append all simple fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'licenses' || key === 'references') {
                    data.append(key, JSON.stringify(value));
                } else if (key === 'resume_file' || key === 'photo_file') {
                    if (value) data.append(key, value as File);
                } else if (key === 'passport_valid') {
                    data.append(key, value ? 'true' : 'false');
                } else if (key === 'series_experience') {
                    data.append(key, JSON.stringify(value));
                } else {
                    data.append(key, String(value));
                }
            });

            // Add premium service flag
            data.append('wants_premium_service', wantsPremiumService ? 'true' : 'false');

            const result = await submitResumeLead(data);
            if (result.error) {
                setError(result.error);
                setSubmitting(false);
            } else {
                event({
                    action: 'submit',
                    category: 'resume_builder',
                    label: wantsPremiumService ? 'submission_with_premium' : 'submission_free',
                    value: wantsPremiumService ? 20 : 0
                });

                // If user wants premium service, redirect to checkout
                if (wantsPremiumService && result.checkoutPath) {
                    router.push(result.checkoutPath);
                } else if (result.claimPath) {
                    // Free profile - redirect to profile
                    router.push(result.claimPath);
                } else {
                    // Fallback success state
                    setSubmitted(true);
                    setClaimPath(result.claimPath || null);
                    setSubmitting(false);
                }
            }
        } catch (e) {
            setError('An unexpected error occurred.');
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-md w-full bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-500 shadow-2xl shadow-indigo-500/10">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/20">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Profile Request Received!</h2>
                    <p className="text-neutral-400 mb-8 leading-relaxed">
                        We've received your data. Our team will manually review your credentials and build your professional GridPass profile.
                    </p>

                    {/* Donation Section */}
                    <div className="mb-8 flex justify-center">
                        <DonationCard userEmail={formData.email} />
                    </div>

                    {/* Profile Preview - NEW */}
                    {claimPath && (
                        <div className="mb-8">
                            <h3 className="text-white font-bold mb-3 flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                Your Profile is Ready!
                            </h3>
                            <a
                                href={claimPath}
                                className="block w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mb-2"
                            >
                                <ExternalLink className="w-5 h-5" /> View Your Profile
                            </a>
                            <p className="text-xs text-neutral-500">
                                This is a private link. You can enable public access after verifying your account.
                            </p>
                        </div>
                    )}

                    {/* Create Account CTA - CLARIFICATION FOR USERS */}
                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/10 rounded-xl p-6 mb-8 text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>

                        <div className="relative z-10">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                                <User className="w-5 h-5 text-emerald-400" /> Save Your Profile
                            </h3>
                            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                                You haven't created an account yet. <strong>Claim this profile</strong> to save your data, make edits later, and apply for jobs.
                            </p>

                            <Link
                                href="/register"
                                className="flex items-center justify-center w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors gap-2"
                            >
                                <User className="w-4 h-4" /> Create Free Account
                            </Link>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="text-neutral-500 hover:text-white text-sm font-medium transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 pb-20 font-sans">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent" />
            </div>

            {/* Header / Progress */}
            <div className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                GridPass <span className="bg-white text-black px-1.5 py-0.5 rounded text-xs font-extrabold uppercase tracking-wider">Pro</span>
                            </h1>
                            <FeatureStatusBadge status="beta" />
                            <div id="rb-videoguide">
                                <VideoGuide title="Resume Guide" videoSrc="/guides/resume-builder.webp" className="hidden md:flex" />
                            </div>
                            <button onClick={startResumeTour} className="hidden md:flex text-xs font-bold text-neutral-500 hover:text-white transition-colors border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-full">
                                Tour
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <VideoGuide title="Guide" videoSrc="/guides/resume-builder.webp" className="md:hidden" triggerLabel="Help" />
                            <span className="text-sm font-medium text-neutral-400">Step {currentStep} of 4</span>
                        </div>
                    </div>
                    <div id="rb-header" className="relative h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${(currentStep / 4) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-medium text-neutral-500">
                        {STEPS.map((step) => (
                            <div key={step.id} className={`${step.id <= currentStep ? 'text-indigo-400' : ''} transition-colors`}>
                                {step.title}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-12 relative z-10">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">
                        {STEPS[currentStep - 1].title}
                    </h2>
                    <p className="text-lg text-neutral-400">
                        {currentStep === 1 && "Let's start with your professional identity."}
                        {currentStep === 2 && "Tell teams what you do best."}
                        {currentStep === 3 && "Logistics and availability are key for pro teams."}
                        {currentStep === 4 && "Show proof of your work."}
                    </p>
                </div>

                <div id="rb-form-area" key={currentStep} className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">

                    {/* STEP 1: IDENTITY */}
                    {currentStep === 1 && (
                        <div className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Full Name *</label>
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="e.g. Ayrton Senna"
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Email Address *</label>
                                    <input
                                        type="email"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="driver@example.com"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.dob}
                                        onChange={(e) => updateField('dob', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Nationality</label>
                                <input
                                    type="text"
                                    className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Brazilian"
                                    value={formData.nationality}
                                    onChange={(e) => updateField('nationality', e.target.value)}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 border-t border-white/5 pt-6 mt-6">
                                <div className="md:col-span-2 mb-2">
                                    <p className="text-sm text-neutral-400 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-indigo-400" />
                                        Create a password to secure your account
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Password *</label>
                                    <input
                                        type="password"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Min 8 characters"
                                        value={formData.password}
                                        onChange={(e) => updateField('password', e.target.value)}
                                        minLength={8}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Confirm Password *</label>
                                    <input
                                        type="password"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ROLE & BIO */}
                    {currentStep === 2 && (
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Primary Discipline</label>
                                    <select
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.job_title}
                                        onChange={(e) => updateField('job_title', e.target.value)}
                                    >
                                        <option value="driver">Driver (Professional)</option>
                                        <option value="driver_am">Driver (Amateur/Club)</option>
                                        <option value="mechanic">Mechanic / Technician</option>
                                        <option value="engineer">Race Engineer</option>
                                        <option value="data">Data Engineer</option>
                                        <option value="team_manager">Team Manager</option>
                                        <option value="spotter">Spotter</option>
                                        <option value="media">Media / Content</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Years Active</label>
                                    <select
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.experience_years}
                                        onChange={(e) => updateField('experience_years', e.target.value)}
                                    >
                                        <option value="0-2">Rookie (0-2 Years)</option>
                                        <option value="3-5">Intermediate (3-5 Years)</option>
                                        <option value="5-10">Experienced (5-10 Years)</option>
                                        <option value="10+">Veteran (10+ Years)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Professional Bio *</label>
                                <textarea
                                    rows={5}
                                    className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    placeholder="Summarize your career highlights, championships won, and what makes you a valuable team member..."
                                    value={formData.bio}
                                    onChange={(e) => updateField('bio', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">Core Skills (Comma separated)</label>
                                <input
                                    type="text"
                                    className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Telemetry Analysis, Suspension Setup, MIG Welding, sponsorship management"
                                    value={formData.skills}
                                    onChange={(e) => updateField('skills', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: LOGISTICS */}
                    {currentStep === 3 && (
                        <div className="grid gap-8">

                            {/* Licenses Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-neutral-300">Racing Licenses</label>
                                    <button
                                        type="button"
                                        onClick={addLicense}
                                        className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                                    >
                                        <Plus className="w-3 h-3" /> Add License
                                    </button>
                                </div>
                                {formData.licenses.map((lic, idx) => (
                                    <div key={idx} className="flex gap-2 items-start animate-in slide-in-from-top-2">
                                        <input
                                            placeholder="Sanctioning Body (e.g. FIA, IMSA)"
                                            className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={lic.type}
                                            onChange={(e) => updateLicense(idx, 'type', e.target.value)}
                                        />
                                        <input
                                            placeholder="License (e.g. Gold)"
                                            className="w-32 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={lic.number}
                                            onChange={(e) => updateLicense(idx, 'number', e.target.value)}
                                        />
                                        <button
                                            onClick={() => removeLicense(idx)}
                                            className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {formData.licenses.length === 0 && (
                                    <div className="text-sm text-neutral-600 italic px-2">No licenses added.</div>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Home Airport Code</label>
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                                        placeholder="e.g. LHR"
                                        maxLength={4}
                                        value={formData.home_airport}
                                        onChange={(e) => updateField('home_airport', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Helmet Size</label>
                                    <select
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.helmet_size}
                                        onChange={(e) => updateField('helmet_size', e.target.value)}
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
                            </div>

                            <div className="bg-neutral-900/30 p-4 rounded-xl border border-white/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="passport_valid"
                                        checked={formData.passport_valid}
                                        onChange={(e) => updateField('passport_valid', e.target.checked)}
                                        className="w-5 h-5 rounded border-white/10 bg-neutral-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                                    />
                                    <label htmlFor="passport_valid" className="text-sm text-neutral-300 cursor-pointer select-none">
                                        I have a valid Passport for international travel
                                    </label>
                                </div>

                                {formData.passport_valid && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <label className="text-sm font-medium text-neutral-300">Visa Status (Optional)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="e.g. US B1/B2, Schengen, etc."
                                            value={formData.visa_status}
                                            onChange={(e) => updateField('visa_status', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Availability</label>
                                    <select
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.availability}
                                        onChange={(e) => updateField('availability', e.target.value)}
                                    >
                                        <option value="">Select...</option>
                                        <option value="immediate">Immediate</option>
                                        <option value="2_weeks">2 Weeks Notice</option>
                                        <option value="contract">Per Contract</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Salary Expectation</label>
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="e.g. $500/day or Negotiable"
                                        value={formData.salary_expectations}
                                        onChange={(e) => updateField('salary_expectations', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: FILES & SOCIALS */}
                    {currentStep === 4 && (
                        <div className="grid gap-8">

                            {/* File Uploads - Premium Look */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Resume PDF</label>
                                    <div className="relative group">
                                        <div className={`absolute inset-0 bg-indigo-500/5 rounded-xl border-2 border-dashed ${formData.resume_file ? 'border-indigo-500/50' : 'border-white/10 group-hover:border-indigo-500/30'} transition-all pointer-events-none`} />
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => updateField('resume_file', e.target.files?.[0] || null)}
                                            className="w-full h-32 opacity-0 cursor-pointer z-10 relative"
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                                            {formData.resume_file ? (
                                                <>
                                                    <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                                                    <span className="text-sm font-medium text-white break-all line-clamp-1">{formData.resume_file.name}</span>
                                                    <span className="text-xs text-neutral-500 mt-1">Click to replace</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                                                        <Upload className="w-5 h-5 text-indigo-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-neutral-300">Upload Resume PDF</span>
                                                    <span className="text-xs text-neutral-500 mt-1">Drag & drop or click to browse</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300">Headshot (Optional)</label>
                                    <div className="relative group">
                                        <div className={`absolute inset-0 bg-indigo-500/5 rounded-xl border-2 border-dashed ${formData.photo_file ? 'border-indigo-500/50' : 'border-white/10 group-hover:border-indigo-500/30'} transition-all pointer-events-none`} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => updateField('photo_file', e.target.files?.[0] || null)}
                                            className="w-full h-32 opacity-0 cursor-pointer z-10 relative"
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                                            {formData.photo_file ? (
                                                <>
                                                    <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                                                    <span className="text-sm font-medium text-white break-all line-clamp-1">{formData.photo_file.name}</span>
                                                    <span className="text-xs text-neutral-500 mt-1">Click to replace</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-neutral-700 transition-colors">
                                                        <User className="w-5 h-5 text-neutral-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-neutral-300">Upload Headshot</span>
                                                    <span className="text-xs text-neutral-500 mt-1">Drag & drop or click to browse</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reference Links */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Online Presence
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="url"
                                        placeholder="LinkedIn URL"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-neutral-700"
                                        value={formData.linkedin_url}
                                        onChange={(e) => updateField('linkedin_url', e.target.value)}
                                    />
                                    <input
                                        type="url"
                                        placeholder="Portfolio / Website"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-neutral-700"
                                        value={formData.portfolio_url}
                                        onChange={(e) => updateField('portfolio_url', e.target.value)}
                                    />
                                    <input
                                        type="url"
                                        placeholder="Instagram URL"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-neutral-700"
                                        value={formData.instagram_url}
                                        onChange={(e) => updateField('instagram_url', e.target.value)}
                                    />
                                    <input
                                        type="url"
                                        placeholder="Twitter / X URL"
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-neutral-700"
                                        value={formData.twitter_url}
                                        onChange={(e) => updateField('twitter_url', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Premium Service Offering */}
                            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-sm border border-indigo-500/40 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="bg-indigo-500/20 p-3 rounded-xl">
                                            <Shield className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Upgrade to Verified Profile</h3>
                                            <p className="text-neutral-300 leading-relaxed">
                                                Get your resume professionally evaluated with our AI tools and earn a <strong className="text-indigo-300">verified badge</strong> on your profile for just <strong className="text-white">$20</strong>.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-neutral-300">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>AI Resume Analysis</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-neutral-300">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>Verified Badge</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-neutral-300">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>Stand Out to Teams</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setWantsPremiumService(true)}
                                            className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${wantsPremiumService
                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                                                : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20'
                                                }`}
                                        >
                                            {wantsPremiumService && <CheckCircle2 className="w-5 h-5" />}
                                            Yes, Add Verified Badge — $20
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWantsPremiumService(false)}
                                            className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${!wantsPremiumService
                                                ? 'bg-neutral-700 text-white'
                                                : 'bg-neutral-800/50 text-neutral-400 border border-white/10 hover:bg-neutral-800'
                                                }`}
                                        >
                                            Skip — Continue with Free Profile
                                        </button>
                                    </div>

                                    {!wantsPremiumService && (
                                        <p className="mt-4 text-center text-sm text-neutral-500">
                                            You can always upgrade later from your dashboard
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* References */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-4 h-4" /> References
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addReference}
                                        className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 bg-indigo-500/10 rounded-full hover:bg-indigo-500/20 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Add Reference
                                    </button>
                                </div>
                                {formData.references.map((ref, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 animate-in slide-in-from-top-2 relative bg-neutral-900/50 p-3 rounded-xl border border-white/5">
                                        <input
                                            placeholder="Name"
                                            className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={ref.name}
                                            onChange={(e) => updateReference(idx, 'name', e.target.value)}
                                        />
                                        <input
                                            placeholder="Role"
                                            className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={ref.role}
                                            onChange={(e) => updateReference(idx, 'role', e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                placeholder="Contact (Email/Phone)"
                                                className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={ref.contact}
                                                onChange={(e) => updateReference(idx, 'contact', e.target.value)}
                                            />
                                            <button
                                                onClick={() => removeReference(idx)}
                                                className="p-2 text-neutral-500 hover:text-red-500 transition-colors hover:bg-white/5 rounded-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {formData.references.length === 0 && (
                                    <div className="text-center py-6 bg-neutral-900/30 rounded-xl border border-white/5 border-dashed">
                                        <p className="text-sm text-neutral-500">No references added yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center animate-in shake">
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-white/10">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={submitting}
                                className="flex-1 px-6 py-4 bg-neutral-800 text-white font-bold rounded-xl hover:bg-neutral-700 transition-all flex items-center justify-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" /> Back
                            </button>
                        )}

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                id="rb-next-btn"
                                onClick={nextStep}
                                className="flex-1 px-6 py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                            >
                                Next Step <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 px-6 py-4 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Profile <CheckCircle2 className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

