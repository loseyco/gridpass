'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Newspaper, MessageSquare, User, LogIn, Flag, Trophy, Info, Mail, Briefcase } from 'lucide-react'
import ShareButton from './ShareButton'

export default function DesktopNavbar({ isLoggedIn, referralUser }: { isLoggedIn: boolean, referralUser?: string }) {
    const pathname = usePathname()
    if (pathname?.startsWith('/studio')) return null

    interface NavItem {
        label: string
        href: string
        icon: React.ReactNode
        badge?: string
    }

    const navItems: NavItem[] = [
        { label: 'Dashboard', href: '/', icon: <Home className="w-4 h-4" /> },
        { label: 'Services', href: '/services', icon: <Briefcase className="w-4 h-4" /> },
        { label: 'News', href: '/news', icon: <Newspaper className="w-4 h-4" /> },
        { label: 'About', href: '/about', icon: <Info className="w-4 h-4" /> },
        {
            label: isLoggedIn ? 'You' : 'Login',
            href: isLoggedIn ? '/profile' : '/login',
            icon: isLoggedIn ? <User className="w-4 h-4" /> : <LogIn className="w-4 h-4" />
        }
    ]

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/10 z-50 px-8 items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded flex items-center justify-center transform -skew-x-12">
                    <Flag className="w-4 h-4 text-white transform skew-x-12" />
                </div>
                <span className="font-black text-xl italic tracking-tighter text-white">GRID<span className="text-red-500">PASS</span></span>
            </div>

            <div className="flex items-center gap-8">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                            {item.badge && (
                                <span className="ml-1 px-1.5 py-0.5 text-[0.5rem] font-bold bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                                    {item.badge}
                                </span>
                            )}
                            {isActive && (
                                <span className="absolute bottom-0 h-0.5 w-full bg-red-500"></span>
                            )}
                        </Link>
                    )
                })}
            </div>

            <div className="w-32 flex justify-end">
                <ShareButton referralUser={referralUser} variant="icon" />
            </div>
        </nav>
    )
}
