'use client'
import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, Move, ChevronUp, ChevronDown, Settings, GripVertical } from 'lucide-react'

interface StudioBlockProps {
    id: string
    selected: boolean
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onMove: (id: string, direction: 'up' | 'down') => void
    children: React.ReactNode
    label?: string
}

export function StudioBlock({ id, selected, onSelect, onDelete, onMove, children, label }: StudioBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 1,
    }

    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative rounded-lg transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 bg-zinc-900/50' : 'hover:bg-zinc-900/30'
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation()
                onSelect(id)
            }}
        >
            {/* Hover/Selection Toolbar */}
            {(selected || isHovered) && !isDragging && (
                <div className="absolute -top-7 left-0 flex items-center gap-1 bg-zinc-800 rounded px-1.5 py-0.5 shadow-lg border border-zinc-700 z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                    <div className="flex items-center text-xs text-zinc-400 font-medium px-1 mr-1 border-r border-zinc-700 select-none">
                        {label || 'Block'}
                    </div>

                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white cursor-grab active:cursor-grabbing"
                        title="Drag to reorder"
                    >
                        <GripVertical size={12} />
                    </button>

                    <div className="w-[1px] h-3 bg-zinc-700 mx-0.5" />

                    <button
                        onClick={(e) => { e.stopPropagation(); onMove(id, 'up') }}
                        className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                        title="Move Up"
                    >
                        <ChevronUp size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMove(id, 'down') }}
                        className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                        title="Move Down"
                    >
                        <ChevronDown size={12} />
                    </button>

                    <div className="w-[1px] h-3 bg-zinc-700 mx-0.5" />

                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(id) }}
                        className="p-1 hover:bg-red-900/50 hover:text-red-400 rounded text-zinc-400 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="p-2 min-h-[40px]">
                {children}
            </div>

            {/* Outline for Drop Target (Optional visual cue) */}
            {selected && (
                <div className="absolute inset-0 border border-blue-500/20 rounded-lg pointer-events-none" />
            )}
        </div>
    )
}
