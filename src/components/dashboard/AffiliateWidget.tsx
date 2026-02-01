"use client";

import { Copy, Check, DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AffiliateWidget({ username }: { username: string }) {
    const [copied, setCopied] = useState(false);
    const referralLink = `https://gridpass.app/?ref=${username}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success("Referral link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900/20 to-neutral-900 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        Community Cut
                    </h3>
                    <p className="text-neutral-400 text-sm">
                        Earn 10% on every Founder Pack sold via your link.
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-300 font-mono truncate">
                    {referralLink}
                </div>
                <button
                    onClick={handleCopy}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
