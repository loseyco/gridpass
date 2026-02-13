'use client'
import React from 'react'
import { StudioGridRenderer } from './StudioGridRenderer'

interface VisualCanvasProps {
    schema: any
    selectedId: string | null
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onMove: (id: string, direction: 'up' | 'down') => void
    onInsert: (parentId: string | null, index: number, type: string) => void
}

export function VisualCanvas(props: VisualCanvasProps) {
    return (
        <div className="w-full max-w-4xl mx-auto pb-40">
            <StudioGridRenderer {...props} />
        </div>
    )
}
