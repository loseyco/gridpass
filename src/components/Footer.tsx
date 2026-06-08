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
            Gridpass: The universal key for vehicle spec passports, track waivers, and checked service logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-semibold text-neutral-500">
          <Link href="/guides" className="hover:text-white transition-colors">Guides</Link>
          <Link href="/build-tag" className="hover:text-white transition-colors">Build a Tag</Link>
          <Link href="/scan" className="hover:text-white transition-colors">Scan Tag</Link>
          <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/dash" className="hover:text-white transition-colors">Digital Garage</Link>
        </div>
        <p className="text-xs text-neutral-500 text-center md:text-right">
          © 2026 Gridpass Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
