'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function V2LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            const next = new URLSearchParams(window.location.search).get('next');
            router.push(next || '/')
            router.refresh()
        }
    }

    const handleOAuthLogin = async (provider: 'google') => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/`,
            },
        })
    }

    return (
        <div className="v2-container v2-auth-container">
            {/* Header Background */}
            <div className="v2-auth-hero" />

            <div className="v2-content v2-auth-content">

                {/* Logo/Title */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 className="v2-title" style={{ fontSize: '2.5rem', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        <span className="v2-text-white">GRID</span>
                        <span className="v2-text-accent">PASS</span>
                    </h1>
                    <p className="v2-text-secondary v2-italic" style={{ fontSize: '1rem' }}>Join the Grid.</p>
                </div>

                {/* Login Card */}
                <div className="v2-card v2-auth-card">

                    <h2 className="v2-text-white v2-italic" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Login</h2>

                    {error && (
                        <div className="v2-error-banner">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
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
                            {loading ? 'Starting Engine...' : 'ENTER THE GRID'}
                        </button>
                    </form>



                </div>

                {/* Footer Links */}
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p className="v2-text-secondary">
                        New to the track?{' '}
                        <Link href="/join" className="v2-link-accent">
                            Register
                        </Link>
                    </p>
                    <Link href="/reset-password" className="v2-link" style={{ display: 'block', marginTop: '1rem', fontSize: '0.9rem' }}>
                        Forgot Grid Key?
                    </Link>
                </div>

            </div>
        </div>
    )
}
