'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft } from 'lucide-react'

interface StepMeta {
    title: string
    description?: string
}

interface GridStepWizardProps {
    children: React.ReactNode[] // These should be the step contents
    steps?: (string | StepMeta)[] // Labels for the steps
    onComplete?: () => void
    className?: string
}

export function GridStepWizard({
    children,
    steps = [],
    onComplete,
    className = ''
}: GridStepWizardProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const totalSteps = React.Children.count(children)

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            if (onComplete) onComplete()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const getStepTitle = (step: string | StepMeta) => {
        return typeof step === 'string' ? step : step.title
    }

    const getStepDescription = (step: string | StepMeta) => {
        return typeof step === 'string' ? '' : step.description
    }

    const currentStepMeta = steps[currentStep]

    return (
        <div className={`grid-step-wizard ${className}`} style={{ width: '100%' }}>

            {/* Step Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
                {/* Progress Bar Background */}
                <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />

                {/* Active Progress Bar */}
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
                    style={{ position: 'absolute', top: '20px', left: 0, height: '2px', background: 'var(--v2-accent-primary, #ff4444)', zIndex: 0 }}
                />

                {Array.from({ length: totalSteps }).map((_, idx) => (
                    <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <motion.div
                            animate={{
                                backgroundColor: idx <= currentStep ? 'var(--v2-accent-primary, #ff4444)' : 'var(--v2-bg-secondary, #1a1a1a)',
                                borderColor: idx <= currentStep ? 'var(--v2-accent-primary, #ff4444)' : 'rgba(255,255,255,0.2)'
                            }}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: '2px solid',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.5rem',
                                color: '#fff',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                background: '#1a1a1a'
                            }}
                        >
                            {idx < currentStep ? <Check size={18} /> : idx + 1}
                        </motion.div>
                        {steps[idx] && (
                            <span style={{
                                position: 'absolute', top: '48px', fontSize: '0.75rem',
                                color: idx <= currentStep ? '#fff' : '#666',
                                width: '120px', textAlign: 'center',
                                fontWeight: idx === currentStep ? 'bold' : 'normal'
                            }}>
                                {getStepTitle(steps[idx])}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Current Step Header */}
            {currentStepMeta && (
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {getStepTitle(currentStepMeta)}
                    </h2>
                    {getStepDescription(currentStepMeta) && (
                        <p style={{ color: '#888' }}>{getStepDescription(currentStepMeta)}</p>
                    )}
                </div>
            )}

            {/* Step Content */}
            <div style={{ minHeight: '300px', position: 'relative' }}>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {React.Children.toArray(children)[currentStep]}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: currentStep === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--v2-radius-md, 8px)',
                        cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <ChevronLeft size={16} /> Back
                </button>

                <button
                    onClick={handleNext}
                    style={{
                        background: 'var(--v2-accent-primary, #ff4444)',
                        border: 'none',
                        color: '#fff',
                        padding: '0.75rem 2rem',
                        borderRadius: 'var(--v2-radius-md, 8px)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontWeight: 600
                    }}
                >
                    {currentStep === totalSteps - 1 ? 'Complete' : 'Next'} <ChevronRight size={16} />
                </button>
            </div>

        </div>
    )
}
