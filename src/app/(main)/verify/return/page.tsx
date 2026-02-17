'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ReturnPage() {
    const [status, setStatus] = useState<string | null>(null)
    const [customerEmail, setCustomerEmail] = useState('')
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')

    useEffect(() => {
        if (sessionId) {
            // We could verify the session status here via an API route if needed
            // For now, presence of session_id implies return from Stripe
            setStatus('complete')
        }
    }, [sessionId])

    if (status === 'complete') {
        return (
            <div className="v2-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="v2-card v2-text-center">
                    <div className="verified-badge-large" style={{ margin: '0 auto 20px' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#E10600" />
                        </svg>
                    </div>
                    <h2 className="v2-heading-2">Verification Submitted!</h2>
                    <p className="v2-text-secondary v2-mb-6">
                        We have received your request. Our team will review your profile credentials.
                        <br />
                        You will be notified once your Verified status is active.
                    </p>
                    <Link href="/profile" className="v2-btn v2-btn-primary">
                        Return to Profile
                    </Link>
                </div>
            </div>
        )
    }

    return null
}
