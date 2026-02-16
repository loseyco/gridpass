import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Type, ToggleLeft, Box, List, Award, TrendingUp, Map } from 'lucide-react'

// Simple list of available components
const COMPONENTS = [
    { type: 'GridInput', label: 'Input Field', icon: Type },
    { type: 'GridToggle', label: 'Switch / Toggle', icon: ToggleLeft },
    { type: 'Container', label: 'Container', icon: Box },
    { type: 'Row', label: 'Row Layout', icon: List },
    { type: 'GridBadgePicker', label: 'Badge Picker', icon: Award },
    { type: 'GridChart', label: 'Chart', icon: TrendingUp },
    { type: 'GridMap', label: 'Map', icon: Map },
]

// Wrapper for draggable item
function DraggableItem({ comp }: { comp: any }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `palette-${comp.type}`,
        data: { type: comp.type } // Pass the component type as data
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        padding: '0.75rem',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'grab',
        fontSize: '0.75rem',
        textAlign: 'center' as const,
        zIndex: transform ? 100 : 1, // Bring to front when dragging
        position: 'relative' as const
    }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <comp.icon size={20} color="#888" />
            <span>{comp.label}</span>
        </div>
    )
}

export function ComponentPalette() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #333', fontSize: '0.8rem', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
                Components
            </div>
            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', overflowY: 'auto' }}>
                {COMPONENTS.map((comp) => (
                    <DraggableItem key={comp.type} comp={comp} />
                ))}
            </div>
        </div>
    )
}
