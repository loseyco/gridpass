'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResumeBuilderRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.push('/')
    }, [router])

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: 'white'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1>Redirecting...</h1>
                <p>Taking you back to the home page</p>
            </div>
        </div>
    )
}
