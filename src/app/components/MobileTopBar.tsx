'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ShareButton from './ShareButton'

export default function MobileTopBar({ referralUser }: { referralUser?: string }) {
    const pathname = usePathname()
    const params = useParams()
    const [isTransparent, setIsTransparent] = useState(false)

    // Check if we are on a profile page (/u/[username])
    const isProfilePage = pathname?.startsWith('/u/') && params?.username

    useEffect(() => {
        if (isProfilePage) {
            const handleScroll = () => {
                const scrollPosition = window.scrollY
                setIsTransparent(scrollPosition < 50)
            }

            window.addEventListener('scroll', handleScroll)
            // Initial check
            handleScroll()
            return () => window.removeEventListener('scroll', handleScroll)
        } else {
            setIsTransparent(false)
        }
    }, [isProfilePage])

    return (
        <div
            className={`
        md:hidden fixed top-0 left-0 right-0 z-50 
        flex items-center justify-between px-4 h-[60px]
        transition-all duration-300 ease-in-out
        ${isTransparent ? 'bg-transparent border-transparent' : 'bg-black/80 backdrop-blur-md border-b border-white/10'}
      `}
        >
            <Link href="/" className="flex items-center gap-1 group">
                <span className={`
           font-black text-xl italic tracking-tighter transition-colors duration-300
           ${isTransparent ? 'text-white drop-shadow-md' : 'text-white'}
         `}>
                    GRID<span className="text-red-500">PASS</span>
                </span>
            </Link>

            <div className="flex items-center gap-2">
                <ShareButton
                    referralUser={referralUser}
                    variant="icon"
                    className={isTransparent ? 'bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm border-white/20' : ''}
                />
            </div>
        </div>
    )
}
