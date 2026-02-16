'use client'
import React from 'react'
import { GridInput } from '@/os/components/GridInput'

import { GridToggle } from '@/os/components/GridToggle'
import { GridBadgePicker } from '@/os/components/GridBadgePicker'
import { GridStepWizard } from '@/os/components/GridStepWizard'
import { GridGauge } from '@/os/components/GridGauge'
import { GridMap } from '@/os/components/GridMap'
import { GridChart } from '@/os/components/GridChart'
import { GridButton } from '@/os/components/GridButton'
import { GridServiceCard } from '@/os/components/GridServiceCard'
import { GridBookingForm } from '@/os/components/GridBookingForm'
import { GridGallery } from '@/os/components/GridGallery'
import { GridBusinessHours } from '@/os/components/GridBusinessHours'

// Component Registry
export const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
    'GridInput': GridInput,
    'GridToggle': GridToggle,
    'GridButton': GridButton,
    'GridBadgePicker': GridBadgePicker,
    'GridStepWizard': GridStepWizard,
    'GridGauge': GridGauge,
    'GridMap': GridMap,
    'GridChart': GridChart,
    'GridServiceCard': GridServiceCard,
    'GridBookingForm': GridBookingForm,
    'GridGallery': GridGallery,
    'GridBusinessHours': GridBusinessHours,
    'BookingButton': GridButton, // Alias for now
    // Add more components here as we build them
    'Container': ({ children, style, className }: any) => (
        <div className={`os-container ${className || ''}`} style={{ boxSizing: 'border-box', ...style }}>{children}</div>
    ),
    'Row': ({ children, style }: any) => (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', ...style }}>{children}</div>
    ),
    'Col': ({ children, span = 1, style }: any) => (
        <div style={{ flex: span, minWidth: '200px', ...style }}>{children}</div>
    )
}

export interface ComponentSchema {
    id?: string
    component: string // Key in COMPONENT_MAP
    props?: Record<string, any>
    children?: ComponentSchema[]
    bind?: string // Database binding (table.column) - For future use
    onAction?: string
}

interface GridRendererProps {
    schema: ComponentSchema | ComponentSchema[]
    data?: Record<string, any> // Data to populate forms
    onChange?: (binding: string, value: any) => void
    onAction?: (action: string, payload?: any) => void
    wrapper?: (node: ComponentSchema, children: React.ReactNode, index: number) => React.ReactNode
}

export function GridRenderer({ schema, data = {}, onChange, onAction, wrapper }: GridRendererProps) {

    const renderComponent = (node: ComponentSchema, index: number): React.ReactNode => {
        const Component = COMPONENT_MAP[node.component]

        if (!Component) {
            console.warn(`GridRenderer: Component "${node.component}" not found in registry.`)
            return null
        }

        // Handle props and bindings
        const props = { ...node.props }

        // If bound, inject value from data
        if (node.bind) {
            // Support nested bindings: "table.column" or "table[index].column"
            // Simple implementation for "a.b" or "a[0].b"
            const getNestedValue = (obj: any, path: string) => {
                try {
                    // Convert "a[0].b" -> "a.0.b" -> ["a", "0", "b"]
                    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.')
                    return keys.reduce((o, k) => (o || {})[k], obj)
                } catch (e) {
                    return undefined
                }
            }

            const val = getNestedValue(data, node.bind)

            // For display components (arrays), pass the data directly as props
            if (Array.isArray(val)) {
                // Check component type for special handling
                if (node.component === 'GridServiceCard') {
                    props.services = val
                } else if (node.component === 'GridGallery') {
                    props.images = val
                } else if (node.component === 'GridBusinessHours') {
                    props.hours = val
                } else if (node.component === 'GridBookingForm') {
                    props.services = val
                } else {
                    // Generic array pass-through
                    props.data = val
                }
            } else {
                // For form inputs, use value/onChange pattern
                props.value = val !== undefined ? val : (props.value || '') // Ensure controlled input

                props.onChange = (val: any) => {
                    if (onChange && node.bind) {
                        onChange(node.bind, val)
                    }
                }
            }
        }

        // Inject Action Handler
        if (node.component === 'GridButton') {
            // Map generic node event to component prop if needed
            if (node.onAction) {
                props.action = node.onAction
            }

            props.onAction = (actionName: string) => {
                if (onAction) onAction(actionName, data)
            }
        }

        // Recursively render children
        const childrenRequest = node.children
            ? node.children.map((child, i) => renderComponent(child, i))
            : props.children // Allow children passed via props if any (rare for JSON)

        const componentNode = (
            <Component key={node.id || index} {...props}>
                {childrenRequest}
            </Component>
        )

        return wrapper ? wrapper(node, componentNode, index) : componentNode
    }

    if (Array.isArray(schema)) {
        return <>{schema.map((node, i) => renderComponent(node, i))}</>
    }

    return <>{renderComponent(schema, 0)}</>
}
