'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import ContactModal from '@/components/ContactModal';

interface ContactSellerButtonProps {
    recipientName: string;
    recipientUsername: string;
}

export default function ContactSellerButton({ recipientName, recipientUsername }: ContactSellerButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors"
            >
                <Mail className="w-4 h-4 mr-2" /> Message Seller
            </button>

            <ContactModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                recipientName={recipientName}
                recipientUsername={recipientUsername}
            />
        </>
    );
}
