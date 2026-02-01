import Link from 'next/link';
import { Flag, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/10 rounded-3xl mb-8 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                    <Flag className="w-10 h-10 text-amber-500" />
                </div>

                <h1 className="text-6xl font-black italic text-white mb-4 tracking-tighter">
                    YELLOW FLAG
                </h1>

                <p className="text-xl text-neutral-400 max-w-md mx-auto mb-10">
                    We've lost traction on this sector. The page you are looking for has been retired or moved.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Return to Pits
                </Link>
            </div>

            <div className="absolute bottom-8 text-neutral-600 font-mono text-xs uppercase tracking-widest">
                Error Code: 404_OFF_TRACK
            </div>
        </div>
    );
}
