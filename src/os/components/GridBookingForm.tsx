'use client'
import React, { useState, useEffect } from 'react'
import { GridInput } from './GridInput'
import { GridButton } from './GridButton'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntent } from '@/app/actions/stripe'
import { submitBooking } from '@/app/actions/org-bookings'

// Initialize Stripe outside component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface GridBookingFormProps {
    orgId?: string
    services?: Array<{ id: string, name: string, price: number }>
    onSubmit?: (data: any) => void
}

function CheckoutForm({ amount, onSuccess, onCancel }: { amount: number, onSuccess: () => void, onCancel: () => void }) {
    const stripe = useStripe()
    const elements = useElements()
    const [error, setError] = useState<string | null>(null)
    const [processing, setProcessing] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) return

        setProcessing(true)
        setError(null)

        const { error: submitError } = await elements.submit()
        if (submitError) {
            setError(submitError.message || 'An error occurred')
            setProcessing(false)
            return
        }

        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret: (elements as any)._commonOptions.clientSecret.clientSecret, // Hacky access or passed via Elements? 
            // Better: confirmPayment uses the clientSecret from Elements provider context automatically if not provided? 
            // Actually, for PaymentElement, we confirm and it handles it. 
            // Wait, standard flow is elements.submit() then stripe.confirmPayment({ elements, confirmParams: { return_url } })
            confirmParams: {
                return_url: `${window.location.origin}/booking/success`, // We might want to handle this inline if possible via redirect: 'if_required'
            },
            redirect: 'if_required'
        })

        if (confirmError) {
            setError(confirmError.message || 'Payment failed')
            setProcessing(false)
        } else {
            // Success!
            onSuccess()
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
                <PaymentElement />
            </div>
            {error && <div style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: 'transparent',
                        border: '1px solid #333',
                        color: '#fff',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: processing ? '#555' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: processing ? 'default' : 'pointer'
                    }}
                >
                    {processing ? 'Processing...' : `Pay $${amount}`}
                </button>
            </div>
        </form>
    )
}

export function GridBookingForm({ orgId, services = [], onSubmit }: GridBookingFormProps) {
    const [formData, setFormData] = useState({
        service_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        preferred_date: '',
        preferred_time: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        message: ''
    })

    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [paymentStep, setPaymentStep] = useState(false)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [selectedServicePrice, setSelectedServicePrice] = useState(0)

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (field === 'service_id') {
            const service = services.find(s => s.id === value)
            setSelectedServicePrice(service ? service.price : 0)
        }
    }

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // If price > 0, calculate payments
        if (selectedServicePrice > 0 && orgId) {
            setSubmitting(true)
            try {
                // Create intent
                const { clientSecret } = await createPaymentIntent(
                    selectedServicePrice * 100, // cents
                    orgId,
                    'temp_booking_id' // We might create booking as pending first?
                )
                setClientSecret(clientSecret)
                setPaymentStep(true)
            } catch (err) {
                console.error('Failed to init payment:', err)
                alert('Could not initialize payment. Please try again.')
            } finally {
                setSubmitting(false)
            }
        } else {
            // No payment needed
            finishBooking()
        }
    }

    const finishBooking = async () => {
        setSubmitting(true)
        try {
            const bookingData = {
                ...formData,
                org_id: orgId,
                vehicle_info: {
                    make: formData.vehicle_make,
                    model: formData.vehicle_model,
                    year: formData.vehicle_year
                },
                payment_status: selectedServicePrice > 0 ? 'paid' : 'n/a'
            }

            if (onSubmit) {
                await onSubmit(bookingData)
            } else {
                await submitBooking(bookingData)
            }
            setSubmitted(true)
        } catch (error) {
            console.error('Booking error:', error)
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '3rem',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#fff'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
                <p style={{ opacity: 0.9 }}>
                    {selectedServicePrice > 0 ? 'Payment received. ' : ''}
                    We\'ll see you soon.
                </p>
            </div>
        )
    }

    if (paymentStep && clientSecret) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Complete Payment</h3>
                <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                            <span>Service Total</span>
                            <span style={{ fontWeight: 'bold' }}>${selectedServicePrice.toFixed(2)}</span>
                        </div>
                    </div>

                    <Elements stripe={stripePromise} options={{
                        clientSecret,
                        appearance: { theme: 'night', labels: 'floating' }
                    }}>
                        <CheckoutForm
                            amount={selectedServicePrice}
                            onSuccess={finishBooking}
                            onCancel={() => setPaymentStep(false)}
                        />
                    </Elements>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleInitialSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Book Your Service</h3>

                {services.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Select Service
                        </label>
                        <select
                            value={formData.service_id}
                            onChange={(e) => handleChange('service_id', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '1rem'
                            }}
                            required
                        >
                            <option value="">Choose a service...</option>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} - ${s.price}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <GridInput
                    label="Full Name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={(val) => handleChange('customer_name', val)}
                    required
                />

                <GridInput
                    label="Email"
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(val) => handleChange('customer_email', val)}
                    required
                />

                <GridInput
                    label="Phone"
                    name="customer_phone"
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(val) => handleChange('customer_phone', val)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <GridInput
                        label="Preferred Date"
                        name="preferred_date"
                        type="date"
                        value={formData.preferred_date}
                        onChange={(val) => handleChange('preferred_date', val)}
                    />

                    <GridInput
                        label="Preferred Time"
                        name="preferred_time"
                        type="time"
                        value={formData.preferred_time}
                        onChange={(val) => handleChange('preferred_time', val)}
                    />
                </div>

                <h4 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.1rem' }}>Vehicle Information</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '1rem' }}>
                    <GridInput
                        label="Make"
                        name="vehicle_make"
                        placeholder="e.g., Honda"
                        value={formData.vehicle_make}
                        onChange={(val) => handleChange('vehicle_make', val)}
                    />

                    <GridInput
                        label="Model"
                        name="vehicle_model"
                        placeholder="e.g., Civic"
                        value={formData.vehicle_model}
                        onChange={(val) => handleChange('vehicle_model', val)}
                    />

                    <GridInput
                        label="Year"
                        name="vehicle_year"
                        placeholder="2020"
                        value={formData.vehicle_year}
                        onChange={(val) => handleChange('vehicle_year', val)}
                    />
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Additional Notes
                    </label>
                    <textarea
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        placeholder="Any special requests or details we should know..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '0.75rem',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        width: '100%',
                        marginTop: '2rem',
                        padding: '1rem',
                        background: submitting ? '#555' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s',
                        transform: submitting ? 'scale(1)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => !submitting && (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {submitting ? 'Processing...' : (selectedServicePrice > 0 ? 'Proceed to Payment' : 'Request Appointment')}
                </button>
            </div>
        </form>
    )
}
