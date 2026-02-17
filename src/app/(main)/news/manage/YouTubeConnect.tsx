'use client';

import { Youtube } from 'lucide-react';

export default function YouTubeConnect() {
    const handleConnect = () => {
        // Redirect to our auth endpoint
        window.location.href = '/api/auth/youtube';
    };

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <Youtube className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">YouTube Automation</h3>
                        <p className="text-zinc-400 text-xs">Connect channel to enable auto-uploads</p>
                    </div>
                </div>
                <button
                    onClick={handleConnect}
                    className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors"
                >
                    Connect Channel
                </button>
            </div>
        </div>
    );
}
