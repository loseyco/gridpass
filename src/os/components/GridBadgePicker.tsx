'use client'

import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'

interface GridBadgePickerProps {
    label: string
    name: string
    value?: string[]
    options?: string[]
    allowCustom?: boolean
    onChange?: (value: string[]) => void
    placeholder?: string
}

export function GridBadgePicker({
    label,
    name,
    value = [],
    options = [],
    allowCustom = true,
    onChange,
    placeholder = "Add a tag..."
}: GridBadgePickerProps) {
    const [inputValue, setInputValue] = useState('')

    const handleAdd = (tag: string) => {
        const trimmed = tag.trim()
        if (trimmed && !value.includes(trimmed)) {
            if (onChange) {
                onChange([...value, trimmed])
            }
        }
        setInputValue('')
    }

    const handleRemove = (tag: string) => {
        if (onChange) {
            onChange(value.filter(t => t !== tag))
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd(inputValue)
        }
    }

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--v2-text-secondary, #888)' }}>
                {label}
            </label>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'var(--v2-bg-secondary, rgba(255,255,255,0.05))',
                border: '1px solid var(--v2-border, rgba(255,255,255,0.1))',
                borderRadius: 'var(--v2-radius-md, 8px)',
                minHeight: '48px'
            }}>
                {value.map(tag => (
                    <span key={tag} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(255, 68, 68, 0.2)',
                        color: '#ff4444',
                        borderRadius: '16px',
                        fontSize: '0.875rem',
                        border: '1px solid rgba(255, 68, 68, 0.3)'
                    }}>
                        {tag}
                        <button
                            onClick={() => handleRemove(tag)}
                            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}

                <div style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center' }}>
                    {allowCustom ? (
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                    ) : (
                        // If strictly selection from options, we'd render a dropdown/select here
                        // For now simplest is text input that matches options if provided logic was added
                        <select
                            onChange={(e) => handleAdd(e.target.value)}
                            value=""
                            style={{
                                background: 'transparent', border: 'none', color: '#888', width: '100%', outline: 'none'
                            }}
                        >
                            <option value="">Select option...</option>
                            {options.filter(o => !value.includes(o)).map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
        </div>
    )
}
