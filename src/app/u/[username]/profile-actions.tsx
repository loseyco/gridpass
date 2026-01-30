'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Printer, Mail, Share2 } from 'lucide-react';
import ContactModal from '@/components/ContactModal';

interface ProfileActionsProps {
    isOwner: boolean;
    recipientName: string;
    recipientUsername: string;
}

export default function ProfileActions({ isOwner, recipientName, recipientUsername }: ProfileActionsProps) {
    const [isContactOpen, setIsContactOpen] = useState(false);

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

                {/* Owner: Edit Profile */}
                {isOwner ? (
                    <Link
                        href="/dashboard/profile"
                        className="inline-flex items-center gap-2 bg-neutral-800 text-neutral-300 px-4 py-2 rounded-lg font-bold hover:bg-neutral-700 border border-white/5 transition-colors"
                    >
                        <Briefcase className="w-4 h-4" /> Edit Profile
                    </Link>
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
        </>
    );
}
