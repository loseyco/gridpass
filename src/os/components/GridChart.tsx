'use client'

import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface GridChartProps {
    label?: string
    data: Array<Record<string, any>>
    xKey: string
    yKey: string
    color?: string
    height?: number
}

export function GridChart({
    label,
    data,
    xKey,
    yKey,
    color = '#ff4444',
    height = 300
}: GridChartProps) {
    return (
        <div style={{ width: '100%', background: 'var(--v2-bg-secondary, #111)', borderRadius: '16px', padding: '1rem' }}>
            {label && <div style={{ marginBottom: '1rem', fontWeight: 'bold', color: '#888' }}>{label}</div>}

            <div style={{ width: '100%', height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey={xKey} stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey={yKey} stroke={color} fillOpacity={1} fill="url(#colorY)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
