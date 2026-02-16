'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface GridGaugeProps {
    label: string
    value: number // 0 to 100
    min?: number
    max?: number
    units?: string
    color?: string
    size?: 'sm' | 'md' | 'lg'
}

export function GridGauge({
    label,
    value,
    min = 0,
    max = 100,
    units = '%',
    color = '#ff4444',
    size = 'md'
}: GridGaugeProps) {

    // Normalize value to percentage
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100)

    const sizeMap = {
        sm: 120,
        md: 200,
        lg: 300
    }

    const width = sizeMap[size]
    const strokeWidth = width / 10
    const radius = (width - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ position: 'relative', width, height: width }}>
                {/* Background Circle */}
                <svg width={width} height={width} style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        cx={width / 2}
                        cy={width / 2}
                        r={radius}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        cx={width / 2}
                        cy={width / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Value Text */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span style={{ fontSize: width * 0.2, fontWeight: 'bold', color: '#fff' }}>{Math.round(value)}</span>
                    <span style={{ fontSize: width * 0.08, color: '#888' }}>{units}</span>
                </div>
            </div>

            {label && (
                <div style={{ marginTop: '1rem', fontSize: '1rem', fontWeight: 500, color: '#aaa', letterSpacing: '0.05em' }}>
                    {label.toUpperCase()}
                </div>
            )}
        </div>
    )
}
