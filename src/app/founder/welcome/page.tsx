import Link from 'next/link';
import { Check, Shield, ArrowRight } from 'lucide-react';

export default function WelcomeFounderPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col items-center justify-center p-6 text-center">

            <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
                <Check className="w-12 h-12 text-black" />
            </div>

            <h1 className="text-5xl font-black mb-4 tracking-tighter">You're In.</h1>
            <p className="text-xl text-neutral-400 mb-8 max-w-lg">
                Welcome to the inner circle. Your <span className="text-amber-500 font-bold">Founder Status</span> has been activated.
            </p>

            <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl max-w-sm w-full mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                        <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold">Founder Pass</div>
                        <div className="text-xs text-neutral-500">Lifetime Access • Verified</div>
                    </div>
                </div>
                <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full animate-pulse" />
                </div>
                <div className="mt-2 text-right text-xs text-emerald-500 font-mono">ACTIVE</div>
            </div>

            <Link href="/" className="bg-white hover:bg-neutral-200 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center gap-2">
                Enter GridPass <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
