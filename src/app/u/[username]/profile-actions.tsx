'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Printer, Mail, Share2, MoreVertical, Flag, X, Wrench } from 'lucide-react';
import ContactModal from '@/components/ContactModal';
import { reportProfile } from '@/app/actions/report';
import ServicesManager from '@/components/profile/ServicesManager';

interface ProfileActionsProps {
    isOwner: boolean;
    recipientName: string;
    recipientUsername: string;
    recipientId?: string; // Added for services
}

export default function ProfileActions({ isOwner, recipientName, recipientUsername, recipientId }: ProfileActionsProps) {
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReportSubmitting, setIsReportSubmitting] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const handleReport = async () => {
        setIsReportSubmitting(true);
        try {
            await reportProfile(recipientUsername, reportReason || 'No reason provided');
            alert('Report submitted. Thank you.');
            setIsReportOpen(false);
            setReportReason('');
        } catch (error) {
            alert('Failed to submit report. Please try again.');
        } finally {
            setIsReportSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: `${recipientName} on GridPass`,
                url: window.location.href
            });
        } catch (e) {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Profile link copied to clipboard!'); // Could be a toast
        }
    };

    return (
        <>
            <div className="flex items-center gap-3 print:hidden">
                {/* Share Button (Mobile friendly) */}
                <button
                    onClick={handleShare}
                    className="p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    title="Share Profile"
                >
                    <Share2 className="w-5 h-5" />
                </button>

                {/* Print Button */}
                <button
                    onClick={handlePrint}
                    className="p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    title="Print / Save PDF"
                >
                    <Printer className="w-5 h-5" />
                </button>
                {!isOwner && (
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            title="More Options"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        setIsReportOpen(true);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                                >
                                    <Flag className="w-4 h-4" /> Report Profile
                                </button>
                            </div>
                        )}

                        {/* Overlay to close menu */}
                        {menuOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
                        )}
                    </div>
                )}

                {/* Owner: Edit Profile */}
                {isOwner ? (
                    <>
                        <Link
                            href="/dashboard/profile"
                            className="inline-flex items-center gap-2 bg-neutral-800 text-neutral-300 px-4 py-2 rounded-lg font-bold hover:bg-neutral-700 border border-white/5 transition-colors"
                        >
                            <Briefcase className="w-4 h-4" /> Edit Profile
                        </Link>
                        <button
                            onClick={() => setIsServicesOpen(true)}
                            className="inline-flex items-center gap-2 bg-neutral-800 text-neutral-300 px-4 py-2 rounded-lg font-bold hover:bg-neutral-700 border border-white/5 transition-colors"
                        >
                            <Wrench className="w-4 h-4" /> Services
                        </button>
                    </>
                ) : (
                    /* Visitor: Hire Me */
                    <button
                        onClick={() => setIsContactOpen(true)}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                    >
                        <Mail className="w-4 h-4" />
                        Hire Me
                    </button>
                )}
            </div>

            <ContactModal
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
                recipientName={recipientName}
                recipientUsername={recipientUsername}
            />

            {/* Simple Report Modal */}
            {isReportOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-scale-up">
                        <button
                            onClick={() => setIsReportOpen(false)}
                            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                            <Flag className="w-5 h-5 text-red-500" />
                            Report Profile
                        </h3>
                        <p className="text-neutral-400 text-sm mb-6">
                            Flag this profile for review. Is it spam, abusive, or fake?
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                                    Reason
                                </label>
                                <textarea
                                    className="w-full bg-neutral-800 border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[100px]"
                                    placeholder="Briefly describe the issue..."
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleReport}
                                disabled={isReportSubmitting}
                                className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isReportSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Services Manager Modal */}
            {isServicesOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-neutral-950 border border-white/10 rounded-2xl w-full max-w-4xl p-6 relative shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsServicesOpen(false)}
                            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        {recipientId ? (
                            <ServicesManager userId={recipientId} isOwnProfile={true} />
                        ) : (
                            <div className="text-red-500">Error: User ID missing</div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
