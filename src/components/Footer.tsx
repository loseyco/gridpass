import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-900 py-12 px-6 bg-[#060608] mt-auto w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-2 items-center md:items-start">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo className="w-6 h-6" textClassName="text-sm" />
          </Link>
          <p className="text-xs text-neutral-500 max-w-sm text-center md:text-left">
            Transforming physical vehicles into connected, monetizable digital assets.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold text-neutral-500">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/u/pjlosey" className="hover:text-white transition-colors">Founder</Link>
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/join" className="hover:text-white transition-colors">Scan Tag</Link>
          <Link href="/roadmap" className="hover:text-white transition-colors">Roadmap</Link>
          <Link href="/tasks" className="hover:text-white transition-colors">Tasks</Link>
          <Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link>
          <Link href="/feedback" className="hover:text-white transition-colors">Dispatch</Link>
          <Link href="/login" className="hover:text-white transition-colors">Portal</Link>
        </div>
        <p className="text-xs text-neutral-500 text-center md:text-right">
          © 2026 Losey.co Architecture. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
