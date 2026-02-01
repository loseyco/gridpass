"use client";

import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton() {
    const [copied, setCopied] = useState(false);

    const shareData = {
        title: 'GridPass: The Universal Motorsports OS',
        text: 'Built by Racers. Funded by Believers. GridPass is free to use because the racing world needs a standard. Check out the Founder Program:',
        url: 'https://gridpass.app/founder'
    };

    const handleShare = async () => {
        // Try Native Share First (Mobile/Safari)
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                console.log('Share canceled or failed', err);
            }
        }

        // Fallback to Clipboard (Desktop)
        try {
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 rounded-full transition-all font-bold text-sm shadow-lg hover:shadow-white/5 active:scale-95"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-400">Link Copied!</span>
                </>
            ) : (
                <>
                    <Share2 className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Share the Mission</span>
                </>
            )}
        </button>
    );
}
