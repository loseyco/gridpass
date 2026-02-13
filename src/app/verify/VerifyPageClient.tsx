'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { createVerificationCheckoutSession } from '@/app/actions/stripe-verification'

// Initialize Stripe outside component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)

interface VerifyPageClientProps {
    user: any
}

export default function VerifyPageClient({ user }: VerifyPageClientProps) {
    const [loading, setLoading] = useState(false)
    const [clientSecret, setClientSecret] = useState<string | null>(null)

    const handleUpgrade = async () => {
        setLoading(true)
        try {
            const returnUrl = `${window.location.origin}//verify/return`
            const { clientSecret } = await createVerificationCheckoutSession(returnUrl)
            setClientSecret(clientSecret)
        } catch (error) {
            console.error('Failed to start session', error)
            alert('Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div id="checkout">
            <div className="v2-header">
                <Link href="/profile/edit" className="v2-link">
                    Cancel
                </Link>
                <h1 className="v2-title">
                    <span className="v2-text-white">GET</span>
                    <span className="v2-text-accent"> VERIFIED</span>
                </h1>
                <div style={{ width: '40px' }} />
            </div>

            <div className="v2-content">
                {clientSecret ? (
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={{ clientSecret }}
                    >
                        <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                ) : (
                    <>
                        <div className="pro-hero">
                            <div className="verified-badge-large">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#E10600" />
                                </svg>
                            </div>
                            <h2 className="hero-title">Official Racer Status</h2>
                            <p className="hero-subtitle">Join the ranks of verified drivers, teams, and industry professionals.</p>
                        </div>

                        <div className="v2-card pricing-card">
                            <div className="price-header">
                                <span className="currency">$</span>
                                <span className="amount">20</span>
                                <span className="period"> one-time</span>
                            </div>

                            <ul className="benefit-list">
                                <li className="benefit-item">
                                    <span className="check">✓</span>
                                    <span>Official Verified Badge</span>
                                </li>
                                <li className="benefit-item">
                                    <span className="check">✓</span>
                                    <span>Rank Higher in Search</span>
                                </li>
                                <li className="benefit-item">
                                    <span className="check">✓</span>
                                    <span>Unlimited Garage Spots</span>
                                </li>
                                <li className="benefit-item">
                                    <span className="check">✓</span>
                                    <span>Priority Support</span>
                                </li>
                            </ul>

                            <button
                                className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
                                onClick={handleUpgrade}
                                disabled={loading}
                                style={{ height: '50px', fontSize: '1.2rem' }}
                            >
                                {loading ? 'Processing...' : 'UPGRADE NOW'}
                            </button>
                            <p className="guarantee">Secure 256-bit SSL Encrypted Payment.</p>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                .pro-hero {
                    text-align: center;
                    padding: var(--v2-space-6) 0;
                }

                .verified-badge-large {
                    margin-bottom: var(--v2-space-4);
                    filter: drop-shadow(0 0 20px rgba(225, 6, 0, 0.4));
                }

                .hero-title {
                    font-size: 2rem;
                    font-weight: 900;
                    color: white;
                    font-style: italic;
                    text-transform: uppercase;
                    margin: 0 0 0.5rem 0;
                    letter-spacing: -0.02em;
                    font-family: var(--v2-font-racing);
                }

                .hero-subtitle {
                    font-size: var(--v2-text-base);
                    color: var(--v2-text-secondary);
                    max-width: 280px;
                    margin: 0 auto;
                    line-height: 1.5;
                }

                .pricing-card {
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    padding: var(--v2-space-6) var(--v2-space-4);
                }

                /* Shine effect */
                .pricing-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.05),
                        transparent
                    );
                    transform: skewX(-15deg);
                    animation: shine 6s infinite;
                    pointer-events: none;
                }

                @keyframes shine {
                    0% { left: -100%; }
                    20% { left: 200%; }
                    100% { left: 200%; }
                }

                .price-header {
                    display: flex;
                    justify-content: center;
                    align-items: baseline;
                    margin-bottom: var(--v2-space-6);
                    color: white;
                }

                .currency {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-right: 4px;
                }

                .amount {
                    font-size: 3.5rem;
                    font-weight: 900;
                    font-style: italic;
                    letter-spacing: -0.03em;
                    font-family: var(--v2-font-racing);
                }

                .period {
                    font-size: var(--v2-text-sm);
                    color: var(--v2-text-secondary);
                    margin-left: 8px;
                    font-weight: 500;
                }

                .benefit-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 var(--v2-space-6) 0;
                    text-align: left;
                    display: inline-block;
                }

                .benefit-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                    color: var(--v2-text-primary);
                    font-size: var(--v2-text-base);
                }

                .check {
                    color: var(--v2-accent-primary);
                    font-weight: bold;
                    font-size: 1.2rem;
                }

                .guarantee {
                    margin-top: var(--v2-space-3);
                    font-size: var(--v2-text-xs);
                    color: var(--v2-text-tertiary);
                }
            `}</style>
        </div>
    )
}
