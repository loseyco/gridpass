'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface GridToggleProps {
    label: string
    name: string
    value?: boolean
    onChange?: (value: boolean) => void
    disabled?: boolean
    className?: string
}

export function GridToggle({
    label,
    name,
    value = false,
    onChange,
    disabled = false,
    className = ''
}: GridToggleProps) {

    const handleToggle = () => {
        if (!disabled && onChange) {
            onChange(!value)
        }
    }

    return (
        <div className={`grid-toggle-wrapper ${className}`} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--v2-bg-secondary, rgba(255,255,255,0.05))', borderRadius: 'var(--v2-radius-md, 8px)', border: '1px solid var(--v2-border, rgba(255,255,255,0.1))' }}>
            <label
                htmlFor={name}
                style={{
                    fontSize: '1rem',
                    color: 'var(--v2-text-primary, #fff)',
                    fontWeight: 500,
                    cursor: disabled ? 'default' : 'pointer'
                }}
                onClick={handleToggle}
            >
                {label}
            </label>

            <div
                onClick={handleToggle}
                style={{
                    width: '48px',
                    height: '28px',
                    background: value ? 'var(--v2-accent-primary, #ff4444)' : 'rgba(255,255,255,0.2)',
                    borderRadius: '14px',
                    position: 'relative',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'background 0.3s',
                    opacity: disabled ? 0.5 : 1
                }}
            >
                <motion.div
                    animate={{ x: value ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                        width: '24px',
                        height: '24px',
                        background: '#fff',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                />
            </div>
        </div>
    )
}
