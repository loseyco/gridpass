'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function V2RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    full_name: username, // Default name to username
                },
                emailRedirectTo: `${window.location.origin}/auth/callback?next=//profile`,
            },
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        // 2. Create Profile entry (handled by trigger usually, but if not, we wait)
        // For now, assume trigger or handle on next page load.

        // 3. Redirect or Show Success
        if (authData.session) {
            router.push('/profile')
        } else {
            // Email confirmation required
            setError('Please check your email to confirm your account.')
            setLoading(false)
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
                    <p className="v2-text-secondary v2-italic" style={{ fontSize: '0.9rem' }}>Start Your Career.</p>
                </div>

                {/* Register Card */}
                <div className="v2-card v2-auth-card">

                    <h2 className="v2-text-white v2-italic" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Register</h2>

                    {error && (
                        <div className={error.includes('check your email') ? 'v2-success-banner' : 'v2-error-banner'}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister}>
                        <div className="v2-form-group">
                            <label className="v2-label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="v2-input"
                                placeholder="driver_name"
                            />
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="v2-input"
                                placeholder="racer@example.com"
                            />
                        </div>

                        <div className="v2-form-group">
                            <label className="v2-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="v2-input"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
                            disabled={loading}
                            style={{ padding: '1rem', fontSize: '1.1rem' }}
                        >
                            {loading ? 'Registering...' : 'JOIN THE GRID'}
                        </button>
                    </form>

                </div>

                {/* Footer Links */}
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p className="v2-text-secondary">
                        Already have an account?{' '}
                        <Link href="/login" className="v2-link-accent">
                            Login
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}
