'use client'

import React, { useState, useEffect } from 'react'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, MouseSensor, TouchSensor, DragStartEvent, DragEndEvent, closestCorners } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Palette, Settings, Monitor, Layers, Move, Code, Eye } from 'lucide-react'
import { VisualCanvas } from './VisualCanvas'
import { PropertyInspector } from './PropertyInspector'
import { saveAppSchema } from '@/os/actions/studio-actions'
import { useRouter } from 'next/navigation'

interface VisualEditorRootProps {
    app: any
    initialSchema: any
    osData?: any
}

// Helper to ensure all nodes have IDs
const hydrateSchema = (nodes: any[]): any[] => {
    return nodes.map(node => ({
        ...node,
        id: node.id || `node_${crypto.randomUUID()}`,
        children: node.children ? hydrateSchema(node.children) : undefined
    }))
}

export function VisualEditorRoot({ app, initialSchema, osData }: VisualEditorRootProps) {
    const router = useRouter()

    // Initial hydration of IDs
    const [schema, setSchema] = useState(() => {
        if (!initialSchema) return { children: [] }
        return {
            ...initialSchema,
            children: initialSchema.children ? hydrateSchema(initialSchema.children) : []
        }
    })

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual')
    const [mobilePanel, setMobilePanel] = useState<'canvas' | 'inspector'>('canvas')

    // Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        // active.id
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return

        // Helpers helpers
        const findNodePath = (nodes: any[], id: string, parentId: string | null = null): { node: any, index: number, parentId: string | null, siblings: any[] } | null => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === id) {
                    return { node: nodes[i], index: i, parentId, siblings: nodes }
                }
                if (nodes[i].children) {
                    const found = findNodePath(nodes[i].children, id, nodes[i].id)
                    if (found) return found
                }
            }
            return null
        }

        // Case 2: Reordering (Move)
        if (active.id !== over.id) {
            setSchema((prev: any) => {
                const activeInfo = findNodePath(prev.children, active.id as string)
                const overInfo = findNodePath(prev.children, over.id as string)

                if (!activeInfo || !overInfo) return prev

                // If same parent, simple reorder
                if (activeInfo.parentId === overInfo.parentId) {
                    return {
                        ...prev,
                        children: updateNode(prev.children, activeInfo.parentId, (children) => {
                            return arrayMove(children, activeInfo.index, overInfo.index)
                        })
                    }
                }

                // Moving to different parent (Drag between containers)
                // 1. Remove from old parent
                const withRemoved = updateNode(prev.children, activeInfo.parentId, (children) => {
                    return children.filter(c => c.id !== active.id)
                })

                // 2. Insert into new parent
                // Note: We need to use 'withRemoved' as the basis for the second update, but 'updateNode' works on arrays. 
                // We need to construct the full tree state.
                // Actually `updateNode` returns the modified children array for that level. 
                // We need to apply this sequentially or use a deep clone + mutation approach for complex moves.

                // Let's use a simpler deep clone approach for cross-parent moves to avoid race conditions with immutable helpers
                const nextChildren = JSON.parse(JSON.stringify(prev.children))

                // Remove
                const removeNode = (nodes: any[], id: string): any => {
                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].id === id) {
                            const [removed] = nodes.splice(i, 1)
                            return removed
                        }
                        if (nodes[i].children) {
                            const found = removeNode(nodes[i].children, id)
                            if (found) return found
                        }
                    }
                }
                const movedNode = removeNode(nextChildren, active.id as string)

                // Insert
                const insertNode = (nodes: any[], targetId: string, nodeToInsert: any) => {
                    for (let i = 0; i < nodes.length; i++) {
                        if (nodes[i].id === targetId) {
                            // This is tricky: 'over' is the node we are dropping ON that node.
                            // We should probably insert AFTER it in its parent list? 
                            // Wait, we need to find the parent of 'over' in the NEW tree.
                            return false // Should be handled by finding parent first
                        }
                        if (nodes[i].children) {
                            insertNode(nodes[i].children, targetId, nodeToInsert)
                        }
                    }
                }

                // Re-find over in new tree
                const overInNew = findNodePath(nextChildren, over.id as string)
                if (overInNew && movedNode) {
                    // Insert at new position
                    // Parent of overInNew
                    if (overInNew.parentId === null) {
                        nextChildren.splice(overInNew.index, 0, movedNode)
                    } else {
                        const parentNode = findNodePath(nextChildren, overInNew.parentId)?.node
                        if (parentNode) {
                            parentNode.children.splice(overInNew.index, 0, movedNode)
                        }
                    }
                }

                return { ...prev, children: nextChildren }
            })
        }
    }

    // Helper for deep updates
    const updateNode = (nodes: any[], nodeId: string | null, updateFn: (children: any[]) => any[]): any[] => {
        if (nodeId === null) {
            // Updating root children
            return updateFn(nodes)
        }

        return nodes.map((node) => {
            if (node.id === nodeId) {
                return { ...node, children: updateFn(node.children || []) }
            }
            if (node.children) {
                return { ...node, children: updateNode(node.children, nodeId, updateFn) }
            }
            return node
        })
    }

    const handleMove = (id: string, direction: 'up' | 'down') => {
        // Find parent first
        const findParent = (nodes: any[], targetId: string): string | null => {
            for (const node of nodes) {
                if (node.children?.some((c: any) => c.id === targetId)) return node.id
                const found = findParent(node.children || [], targetId)
                if (found) return found
            }
            return null
        }

        setSchema((prev: any) => {
            // Check if it's at root
            const isRootChild = prev.children.some((c: any) => c.id === id)
            const parentId = isRootChild ? null : findParent(prev.children, id)

            return {
                ...prev,
                children: updateNode(prev.children, parentId, (children) => {
                    const index = children.findIndex((c: any) => c.id === id)
                    if (index === -1) return children

                    if (direction === 'up' && index > 0) {
                        return arrayMove(children, index, index - 1)
                    }
                    if (direction === 'down' && index < children.length - 1) {
                        return arrayMove(children, index, index + 1)
                    }
                    return children
                })
            }
        })
    }

    const handleDelete = (id: string) => {
        const findParent = (nodes: any[], targetId: string): string | null => {
            for (const node of nodes) {
                if (node.children?.some((c: any) => c.id === targetId)) return node.id
                const found = findParent(node.children || [], targetId)
                if (found) return found
            }
            return null
        }

        setSchema((prev: any) => {
            const isRootChild = prev.children.some((c: any) => c.id === id)
            const parentId = isRootChild ? null : findParent(prev.children, id)

            return {
                ...prev,
                children: updateNode(prev.children, parentId, (children) =>
                    children.filter((c: any) => c.id !== id)
                )
            }
        })
        if (selectedId === id) setSelectedId(null)
    }

    // Insert a new component at specific index in a specific parent
    const handleInsert = (parentId: string | null, index: number, type: string = 'GridInput') => {
        const newComponent = {
            id: `node_${Date.now()}`,
            component: type,
            props: {
                label: `New ${type}`,
                name: `field_${Date.now()}`
            },
            children: [] // Initialize empty children for containers
        }

        setSchema((prev: any) => ({
            ...prev,
            children: updateNode(prev.children, parentId, (children) => {
                const newChildren = [...children]
                // Fix: Ensure index is within bounds
                const safeIndex = Math.min(Math.max(0, index), newChildren.length)
                newChildren.splice(safeIndex, 0, newComponent)
                return newChildren
            })
        }))
        setSelectedId(newComponent.id)
    }

    const handleSave = async () => {
        await saveAppSchema(app.slug, schema)
        router.refresh()
    }

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#09090b', color: 'white' }}>
                {/* ... Header ... */}
                <div style={{ height: '50px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{app.name}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>v{app.version || '1.0'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setActiveTab('visual')} style={{ opacity: activeTab === 'visual' ? 1 : 0.5 }}>
                            <Move size={18} />
                        </button>
                        <button onClick={() => setActiveTab('code')} style={{ opacity: activeTab === 'code' ? 1 : 0.5 }}>
                            <Code size={18} />
                        </button>
                        <button onClick={handleSave} className="v2-btn v2-btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                            Save
                        </button>
                    </div>
                </div>

                {/* Main Workspace */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Center: Canvas */}
                    <div style={{
                        flex: 1,
                        background: '#111',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* Viewport Toolbar */}
                        <div style={{ height: '40px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                            <Monitor size={14} color="#666" />
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>Canvas</span>
                        </div>

                        {/* The Canvas */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                            <VisualCanvas
                                schema={schema}
                                onSelect={setSelectedId}
                                selectedId={selectedId}
                                onMove={handleMove}
                                onDelete={handleDelete}
                                onInsert={handleInsert}
                            />

                            {/* Mobile Panel Overlays */}
                            <div className="mobile-only" style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 20,
                                display: mobilePanel === 'canvas' ? 'none' : 'flex',
                                flexDirection: 'column'
                            }}>
                                {mobilePanel === 'inspector' && (
                                    <PropertyInspector
                                        selectedId={selectedId}
                                        schema={schema}
                                        onChange={(newSchema: any) => setSchema(newSchema)}
                                        osData={osData}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Inspector (Desktop) */}
                    <div className="desktop-only" style={{ width: '300px', borderLeft: '1px solid #333', display: 'none', flexDirection: 'column' }}>
                        <PropertyInspector
                            selectedId={selectedId}
                            schema={schema}
                            onChange={(newSchema: any) => setSchema(newSchema)}
                            osData={osData}
                        />
                    </div>

                </div>

                {/* Mobile Bottom Nav (Visible only on mobile via CSS) */}
                <div className="mobile-only" style={{ height: '60px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <button onClick={() => setMobilePanel('canvas')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: mobilePanel === 'canvas' ? 1 : 0.5 }}>
                        <Eye size={20} />
                        <span style={{ fontSize: '0.7rem' }}>View</span>
                    </button>
                    <button onClick={() => setMobilePanel('inspector')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: mobilePanel === 'inspector' ? 1 : 0.5 }}>
                        <Settings size={20} />
                        <span style={{ fontSize: '0.7rem' }}>Edit</span>
                    </button>
                </div>

                {/* Mobile Overlays */}
                {/* Implementation detail: Show Palette/Inspector based on mobilePanel state */}

                <style jsx global>{`
                /* Hide GridPass Global Nav while in Studio */
                /* Target multiple potential classes and IDs */
                body .v2-bottom-nav, 
                body nav.v2-bottom-nav,
                .bottom-tab-bar,
                nav.bottom-tab-bar,
                .v2-tab-bar, 
                #bottom-nav,
                .v2-footer { 
                    display: none !important; 
                    height: 0 !important;
                    overflow: hidden !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }

                /* Responsive Breakpoints */
                @media (min-width: 1024px) {
                    .desktop-only { display: flex !important; }
                    .mobile-only { display: none !important; }
                }
                @media (max-width: 1023px) {
                    .desktop-only { display: none !important; }
                    .mobile-only { display: flex !important; }
                }
            `}</style>

                <DragOverlay>
                    {/* Optional: Render drag preview */}
                </DragOverlay>
            </div>
        </DndContext>
    )
}
