'use client'

import React from 'react'
import { GridInput } from '@/os/components/GridInput'
import { OS_SCHEMA_METADATA } from '@/os/core/schema-metadata'

interface PropertyInspectorProps {
    selectedId: string | null
    schema: any
    onChange: (schema: any) => void
    osData?: any
}

export function PropertyInspector({ selectedId, schema, onChange, osData }: PropertyInspectorProps) {
    if (!selectedId) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
                Select a component to edit its properties.
            </div>
        )
    }

    // Recursive find helper
    const findNode = (id: string, nodes: any[]): any => {
        for (const node of nodes) {
            if (node.id === id) return node
            if (node.children) {
                const found = findNode(id, node.children)
                if (found) return found
            }
        }
        return null
    }

    // Recursive update helper
    const updateNode = (id: string, nodes: any[], updates: any): any[] => {
        return nodes.map(node => {
            if (node.id === id) {
                return { ...node, ...updates }
            }
            if (node.children) {
                return { ...node, children: updateNode(id, node.children, updates) }
            }
            return node
        })
    }

    // Find the selected node
    const selectedNode = schema.children ? findNode(selectedId, schema.children) : null

    // Flatten props for easier editing
    // We treat 'label' and 'name' as top-level for convenience, but they might be in props
    const label = selectedNode?.props?.label || selectedNode?.label || ''
    const bind = selectedNode?.bind || ''

    const handleChange = (field: string, value: any) => {
        if (!selectedNode) return

        let updates = {}
        if (field === 'bind') {
            updates = { bind: value }
        } else if (field === 'label') {
            // Update both top-level and props to be safe for now
            updates = {
                props: { ...selectedNode.props, label: value }
            }
        } else {
            // Generic prop update
            updates = {
                props: { ...selectedNode.props, [field]: value }
            }
        }

        const newChildren = updateNode(selectedId, schema.children || [], updates)
        onChange({ ...schema, children: newChildren })
    }

    // Flatten available bindings
    const availableBindings = React.useMemo(() => {
        const bindings: string[] = []
        Object.entries(OS_SCHEMA_METADATA).forEach(([table, columns]) => {
            columns.forEach((col) => {
                bindings.push(`${table}.${col}`)
            })
        })
        return bindings
    }, [])

    const handleDelete = () => {
        if (!selectedId) return

        // Recursive delete
        const deleteNode = (id: string, nodes: any[]): any[] => {
            return nodes.filter(node => {
                if (node.id === id) return false
                if (node.children) {
                    node.children = deleteNode(id, node.children)
                }
                return true
            })
        }

        const newChildren = deleteNode(selectedId, schema.children || [])
        onChange({ ...schema, children: newChildren })
        // Deselect
        // implied by parent state update? no, parent keeps selectedId.
        // We can't clear selectedId from here easily without a prop, but the UI will just show "Not found"
    }

    if (!selectedNode) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
                Component not found.
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #333', fontSize: '0.8rem', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
                Properties: <span style={{ color: 'white' }}>{selectedNode.component}</span>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>

                <GridInput
                    label="Label"
                    name="props.label"
                    value={label}
                    onChange={(val) => handleChange('label', val)}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#888' }}>Data Binding</label>
                    <select
                        value={bind}
                        onChange={(e) => handleChange('bind', e.target.value)}
                        style={{
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            color: 'white',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                        }}
                    >
                        <option value="">No Binding</option>
                        {availableBindings.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                {selectedNode.component === 'GridButton' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#888' }}>Action</label>
                        <select
                            value={selectedNode.props?.action || 'submit'}
                            onChange={(e) => handleChange('action', e.target.value)}
                            style={{
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                color: 'white',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                            }}
                        >
                            <option value="submit">Save / Submit</option>
                            <option value="reset">Clear / Reset</option>
                            <option value="delete">Delete Record</option>
                            <option value="navigate">Navigate (Link)</option>
                        </select>
                    </div>
                )}

                {/* Dynamic Props based on component type could go here */}

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#444' }}>ID: {selectedNode.id}</div>
                    <button
                        onClick={handleDelete}
                        className="v2-btn"
                        style={{
                            background: 'rgba(220, 38, 38, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(220, 38, 38, 0.2)',
                            width: '100%',
                            justifyContent: 'center'
                        }}
                    >
                        Delete Component
                    </button>
                </div>
            </div>
        </div>
    )
}
