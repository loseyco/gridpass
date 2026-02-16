'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User, ShieldCheck } from 'lucide-react'

interface UserCardProps {
    username: string
    displayName: string
    photoUrl?: string | null
    role?: string
    variant?: 'default' | 'compact' | 'minimal'
    className?: string
}

export default function UserCard({
    username,
    displayName,
    photoUrl,
    role,
    variant = 'default',
    className = ''
}: UserCardProps) {

    const href = `/u/${username}`

    if (variant === 'minimal') {
        return (
            <Link
                href={href}
                className={`flex items-center gap-2 group hover:opacity-80 transition-opacity ${className}`}
            >
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-neutral-800 border border-white/10">
                    {photoUrl ? (
                        <Image
                            src={photoUrl}
                            alt={displayName}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                            <User size={12} />
                        </div>
                    )}
                </div>
                <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
                    {displayName}
                </span>
            </Link>
        )
    }

    return (
        <Link
            href={href}
            className={`
        flex items-center gap-3 p-3 rounded-xl 
        bg-neutral-900/50 border border-white/5 
        hover:bg-neutral-800 hover:border-white/10 
        transition-all duration-200 group
        ${className}
      `}
        >
            {/* Avatar */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 border-2 border-transparent group-hover:border-v2-accent-primary/50 transition-colors">
                {photoUrl ? (
                    <Image
                        src={photoUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                        <User size={18} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white group-hover:text-v2-accent-primary transition-colors">
                        {displayName}
                    </span>
                    {/* Optional Verified/Role Badge could go here */}
                    <ShieldCheck size={12} className="text-v2-accent-primary" />
                </div>
                {role && (
                    <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                        {role}
                    </span>
                )}
                {!role && (
                    <span className="text-xs text-neutral-500">
                        @{username}
                    </span>
                )}
            </div>
        </Link>
    )
}
