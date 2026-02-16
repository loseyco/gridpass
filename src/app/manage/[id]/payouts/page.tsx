'use client'

import React, { useState, useEffect } from 'react'
import { createStripeConnectAccount, createStripeAccountLink, createStripeLoginLink } from '@/app/actions/stripe'
import { getOrganizationBySlug } from '@/app/actions/organizations' // We need getById actually, creating separate getter or using check status
import { checkStripeOnboardingStatus } from '@/app/actions/stripe'
import { Loader2, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'

export default function PayoutsPage({ params }: { params: { id: string } }) {
    const orgId = params.id
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState<{ completed: boolean, accountId?: string }>({ completed: false })
    const [error, setError] = useState('')

    useEffect(() => {
        checkStatus()
    }, [])

    const checkStatus = async () => {
        try {
            const res = await checkStripeOnboardingStatus(orgId)
            setStatus(res) // res should return completed status
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async () => {
        setLoading(true)
        setError('')
        try {
            // 1. Create Account
            const { accountId } = await createStripeConnectAccount(orgId)

            // 2. Create Onboarding Link
            const { url } = await createStripeAccountLink(orgId) // This action uses stored account ID

            // 3. Redirect
            window.location.href = url
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to connect Stripe')
            setLoading(false)
        }
    }

    const handleLogin = async () => {
        setLoading(true)
        try {
            const { url } = await createStripeLoginLink(orgId)
            window.open(url, '_blank')
        } catch (err: any) {
            console.error(err)
            setError('Failed to open dashboard')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !status.completed) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        )
    }

    return (
        <div className="payouts-page">
            <h1 className="page-title">Payouts & Banking</h1>
            <p className="page-subtitle">Connect your bank account to receive payments from bookings.</p>

            {error && (
                <div className="error-box">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="connect-card">
                <div className="card-header">
                    <div className="stripe-badge">Stripe Connect</div>
                </div>

                {status.completed ? (
                    <div className="connected-state">
                        <div className="success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h3>You are connected!</h3>
                        <p>Your bank account is linked and ready to receive payouts.</p>

                        <button onClick={handleLogin} className="dashboard-btn" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> :
                                <>
                                    <span>View Payouts Dashboard</span>
                                    <ExternalLink size={16} />
                                </>
                            }
                        </button>
                    </div>
                ) : (
                    <div className="connect-state">
                        <h3>Connect with Stripe</h3>
                        <p>GridPass partners with Stripe to ensure secure, fast payouts directly to your bank account.</p>
                        <p className="fee-note">GridPass takes a 10% platform fee on bookings. You receive 90%.</p>

                        <button onClick={handleConnect} className="connect-btn" disabled={loading}>
                            {loading ? 'Connecting...' : 'Setup Payouts'}
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .payouts-page {
                    max-width: 800px;
                }

                .page-title {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    color: #888;
                    margin-bottom: 2rem;
                }

                .error-box {
                    background: rgba(255, 0, 0, 0.1);
                    border: 1px solid rgba(255, 0, 0, 0.3);
                    color: #ff4d4d;
                    padding: 1rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .connect-card {
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 12px;
                    padding: 2rem;
                }

                .stripe-badge {
                    background: #635bff;
                    color: white;
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 100px;
                    font-weight: 700;
                    font-size: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .connected-state {
                    text-align: center;
                    padding: 2rem 0;
                }

                .success-icon {
                    color: #4ade80;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: center;
                }

                .connected-state h3 {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                }

                .connected-state p {
                    color: #888;
                    margin-bottom: 2rem;
                }

                .dashboard-btn {
                    background: #333;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                }

                .dashboard-btn:hover {
                    background: #444;
                }

                .connect-state h3 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                }

                .connect-state p {
                    color: #888;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }

                .fee-note {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 0.75rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    color: #ccc !important;
                }

                .connect-btn {
                    background: #635bff;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    margin-top: 1rem;
                    width: 100%;
                    max-width: 300px;
                    transition: all 0.2s;
                }

                .connect-btn:hover {
                    background: #7a73ff;
                    transform: translateY(-2px);
                }

                .connect-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }
            `}</style>
        </div>
    )
}
