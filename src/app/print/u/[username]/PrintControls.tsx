'use client'

import { Printer } from 'lucide-react'
import Link from 'next/link'

interface PrintControlsProps {
    username: string
}

export default function PrintControls({ username }: PrintControlsProps) {
    return (
        <div className="mb-8 flex justify-between items-center no-print">
            <Link href={`/u/${username}`} className="text-sm text-gray-500 hover:text-black">
                ← Back to Profile
            </Link>
            <button
                onClick={() => window.print()}
                className="bg-black text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
                <Printer size={18} />
                Print Resume
            </button>
        </div>
    )
}
