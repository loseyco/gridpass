"use client";

import { Share2, Copy, Check, Twitter, Facebook, Linkedin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function SocialShareWidget({ username }: { username: string }) {
    const [copied, setCopied] = useState(false);
    const profileUrl = `https://gridpass.app/u/${username}`;
    const shareText = `Check out my racing profile on GridPass! 🏎️💨`;

    const handleCopy = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        toast.success("Profile link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = [
        {
            name: "X (Twitter)",
            icon: Twitter,
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`,
            color: "hover:text-sky-400"
        },
        {
            name: "Facebook",
            icon: Facebook,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
            color: "hover:text-blue-500"
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
            color: "hover:text-blue-600"
        }
    ];

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Share2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-white">Share Your Profile</h3>
                    <p className="text-neutral-400 text-sm">Grow your reputation in the community.</p>
                </div>
            </div>

            {/* OG Image Preview */}
            <div className="relative aspect-[1200/630] w-full bg-neutral-950 rounded-lg overflow-hidden border border-white/10 mb-6 group-hover:border-indigo-500/30 transition-colors">
                {/* 
                    We use a direct img tag here instead of Next Image to ensure we hit the dynamic route correctly without caching issues during dev 
                    and because opengraph-image is generated on the fly.
                 */}
                <img
                    src={`/u/${username}/opengraph-image`}
                    alt="Social Card Preview"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-xs font-bold text-white uppercase tracking-widest bg-black/50 backdrop-blur px-2 py-1 rounded">
                        Social Card Preview
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm text-neutral-300 font-mono truncate">
                        {profileUrl}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="bg-white hover:bg-neutral-200 text-black font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="hidden sm:inline">Copy</span>
                    </button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Share directly:</span>
                    <div className="flex gap-4">
                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`text-neutral-400 transition-colors ${link.color}`}
                                title={`Share on ${link.name}`}
                            >
                                <link.icon className="w-5 h-5" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
