"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareCardProps {
    url: string;
    title: string;
    subtitle?: string;
}

export function ShareCard({ url, title, subtitle }: ShareCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-4 py-2 rounded-lg font-bold transition-all text-sm border border-indigo-500/20"
            >
                <Share2 className="w-4 h-4" />
                Share
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                            {subtitle && <p className="text-sm text-neutral-400">{subtitle}</p>}
                        </div>

                        <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-6">
                            <QRCodeSVG
                                value={url}
                                size={200}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"L"}
                                includeMargin={false}
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-neutral-400 truncate">
                                {url}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-lg border border-white/10 transition-colors"
                                title="Copy Link"
                            >
                                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
