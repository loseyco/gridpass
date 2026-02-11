'use client';

import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

export default function MobileInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isStandalone) return;

        // Simple heuristic for mobile
        const ua = window.navigator.userAgent;
        const isMobile = /iphone|ipad|ipod|android/i.test(ua);
        const isIOSDevice = /iphone|ipad|ipod/i.test(ua);

        if (isMobile) {
            setIsIOS(isIOSDevice);

            // Check if user dismissed it recently
            const dismissed = localStorage.getItem('install-prompt-dismissed');
            if (!dismissed) {
                // Show after a delay
                const timer = setTimeout(() => setShowPrompt(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const dismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('install-prompt-dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 shadow-2xl safe-area-pb">
                <button
                    onClick={dismiss}
                    className="absolute top-2 right-2 text-neutral-400 hover:text-white p-1"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4 pr-6">
                    <img src="/logo-square.png" alt="GridPass" className="w-12 h-12 rounded-lg bg-black" />
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-sm mb-1">Install GridPass</h3>
                        <p className="text-neutral-400 text-xs mb-3">
                            Install the app for a better experience and quick access.
                        </p>

                        {isIOS ? (
                            <div className="flex items-center gap-2 text-xs text-neutral-300 bg-white/5 p-2 rounded border border-white/5">
                                <span>Tap</span>
                                <Share className="w-4 h-4 text-blue-400" />
                                <span>then &quot;Add to Home Screen&quot;</span>
                                <PlusSquare className="w-4 h-4" />
                            </div>
                        ) : (
                            <div className="text-xs text-neutral-500 italic">
                                Tap browser menu and select &quot;Install App&quot; or &quot;Add to Home Screen&quot;
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
