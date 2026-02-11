import Link from 'next/link';
import { Heart, Twitter, Instagram, Linkedin, MessageSquare } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-neutral-950 border-t border-white/5 py-12 px-6 relative z-10">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

                {/* Brand & Copy */}
                <div className="text-center md:text-left">
                    <div className="font-bold text-white mb-1">GridPass</div>
                    <p className="text-neutral-500 text-sm">
                        &copy; {currentYear} The Business Operating System for Racing.
                    </p>
                </div>

                {/* Links */}
                <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium">
                    <Link href="/features" className="text-neutral-500 hover:text-white transition-colors">
                        Roadmap
                    </Link>
                    <Link href="/changelog" className="text-neutral-500 hover:text-white transition-colors">
                        Changelog
                    </Link>
                    <Link href="/founder" className="text-neutral-500 hover:text-white transition-colors">
                        Founding 100
                    </Link>

                    {/* Socials */}
                    <Link href="https://discord.gg/gridpass" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-indigo-400 transition-colors" title="Join our Discord">
                        <MessageSquare className="w-5 h-5" />
                    </Link>
                    <Link href="https://twitter.com/gridpassapp" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-sky-400 transition-colors" title="GridPass on X">
                        <Twitter className="w-5 h-5" />
                    </Link>
                    <Link href="https://instagram.com/gridpass" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-pink-500 transition-colors" title="GridPass on Instagram">
                        <Instagram className="w-5 h-5" />
                    </Link>
                    <Link href="https://linkedin.com/company/gridpass" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-blue-600 transition-colors" title="GridPass on LinkedIn">
                        <Linkedin className="w-5 h-5" />
                    </Link>

                    <span className="h-4 w-px bg-white/10 mx-2 hidden md:block"></span>

                    <Link href="/founder/welcome?type=donation" className="flex items-center gap-2 text-indigo-500 hover:text-indigo-400 transition-colors font-bold">
                        <Heart className="w-4 h-4 fill-current" />
                        <span>Support the Mission</span>
                    </Link>
                </div>

            </div>
        </footer>
    );
}
