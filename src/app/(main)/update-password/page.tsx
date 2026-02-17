'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function V2UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Verify session on mount (Supabase handles the code exchange in the background due to the link structure)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setError('Invalid or expired reset link. Please try again.')
            }
        }
        checkSession()
    }, [supabase.auth])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setMessage('Password updated successfully! Redirecting...')
            setTimeout(() => {
                router.push('/?welcome=true')
            }, 2000)
        }
    }

    return (
        <div className="v2-container v2-auth-container">
            {/* Header Background */}
            <div className="v2-auth-hero" />

            <div className="v2-content v2-auth-content">
                {/* Logo/Title */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="v2-title" style={{ fontSize: '2rem', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        <span className="v2-text-white">GRID</span>
                        <span className="v2-text-accent">PASS</span>
                    </h1>
                    <p className="v2-text-secondary v2-italic" style={{ fontSize: '0.9rem' }}>Secure Your Account.</p>
                </div>

                {/* Update Card */}
                <div className="v2-card v2-auth-card">
                    <h2 className="v2-text-white v2-italic" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>New Password</h2>

                    {error && (
                        <div className="v2-error-banner">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="v2-success-banner">
                            {message}
                        </div>
                    )}

                    {!message && (
                        <form onSubmit={handleUpdatePassword}>
                            <div className="v2-form-group">
                                <label className="v2-label">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="v2-input"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
                                disabled={loading}
                                style={{ padding: '1rem', fontSize: '1.1rem' }}
                            >
                                {loading ? 'Updating...' : 'UPDATE PASSWORD'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Links */}
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link href="/login" className="v2-link" style={{ fontSize: '0.9rem' }}>
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
