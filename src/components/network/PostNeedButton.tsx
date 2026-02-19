
'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import PostNeedModal from './PostNeedModal'

export default function PostNeedButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-white hover:text-blue-400 text-sm font-bold flex items-center justify-center gap-2 mx-auto mt-6 transition-colors"
            >
                <Plus size={16} /> Post a Need
            </button>
            <PostNeedModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
