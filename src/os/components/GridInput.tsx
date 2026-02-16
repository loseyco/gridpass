'use client'

import React from 'react'

interface GridInputProps {
    label: string
    name: string
    type?: string
    value?: string | number
    placeholder?: string
    onChange?: (value: string | number) => void
    disabled?: boolean
    required?: boolean
    className?: string
}

export function GridInput({
    label,
    name,
    type = 'text',
    value,
    placeholder,
    onChange,
    disabled = false,
    required = false,
    className = ''
}: GridInputProps) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = type === 'number' ? parseFloat(e.target.value) : e.target.value
        if (onChange) {
            onChange(val)
        }
    }

    return (
        <div className={`grid-input-wrapper ${className}`} style={{ marginBottom: '1rem' }}>
            <label
                htmlFor={name}
                style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--v2-text-secondary, #888)',
                    fontWeight: 500
                }}
            >
                {label} {required && <span style={{ color: 'var(--v2-accent-primary, #ff4444)' }}>*</span>}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={handleChange}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--v2-bg-secondary, rgba(255,255,255,0.05))',
                    border: '1px solid var(--v2-border, rgba(255,255,255,0.1))',
                    borderRadius: 'var(--v2-radius-md, 8px)',
                    color: 'var(--v2-text-primary, #fff)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = 'var(--v2-accent-primary, #ff4444)'
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = 'var(--v2-border, rgba(255,255,255,0.1))'
                }}
            />
        </div>
    )
}
