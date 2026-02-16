'use client'

import React, { useState, useEffect } from 'react'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, MouseSensor, TouchSensor, DragStartEvent, DragEndEvent, closestCorners } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Palette, Settings, Monitor, Layers, Move, Code, Eye, ArrowRight, AlertTriangle } from 'lucide-react'
import { VisualCanvas } from './VisualCanvas'
import { PropertyInspector } from './PropertyInspector'
import { saveAppSchema } from '@/os/actions/studio-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

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

    // Code Editor State
    const [schemaJson, setSchemaJson] = useState(JSON.stringify(schema, null, 2))
    const [codeError, setCodeError] = useState<string | null>(null)

    // Sync Schema -> JSON when in Visual Mode
    useEffect(() => {
        if (activeTab === 'visual') {
            setSchemaJson(JSON.stringify(schema, null, 2))
        }
    }, [schema, activeTab])

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setSchemaJson(value)
        try {
            const parsed = JSON.parse(value)
            // Basic validation: must be object
            if (typeof parsed !== 'object' || parsed === null) {
                throw new Error("Root must be an object")
            }
            setSchema(parsed)
            setCodeError(null)
        } catch (err: any) {
            setCodeError(err.message)
        }
    }

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

    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await saveAppSchema(app.slug, schema)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success('App saved successfully')
                router.refresh()
            }
        } catch (e) {
            toast.error('Failed to save')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveAndExit = async () => {
        setIsSaving(true)
        try {
            const res = await saveAppSchema(app.slug, schema)
            if (res?.error) {
                toast.error(res.error)
                setIsSaving(false)
            } else {
                toast.success('Saved! Exiting...')
                router.push('/studio')
                router.refresh()
            }
        } catch (e) {
            toast.error('Failed to save')
            setIsSaving(false)
        }
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
                        <Link href="/studio" className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors" title="Back to Studio">
                            <ArrowRight size={16} className="rotate-180" />
                        </Link>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }} className="hidden sm:inline">{app.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div className="flex bg-zinc-800 rounded p-0.5 mr-2">
                            <button
                                onClick={() => setActiveTab('visual')}
                                className={`p-1.5 rounded ${activeTab === 'visual' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                title="Visual Editor"
                            >
                                <Move size={14} />
                            </button>
                            <button
                                onClick={() => setActiveTab('code')}
                                className={`p-1.5 rounded ${activeTab === 'code' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                title="Code Editor"
                            >
                                <Code size={14} />
                            </button>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving || !!codeError}
                            className="text-zinc-300 hover:text-white px-3 py-1.5 rounded hover:bg-zinc-800 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handleSaveAndExit}
                            disabled={isSaving || !!codeError}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save & Exit'}
                        </button>
                    </div>
                </div>

                {/* Main Workspace */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Center: Canvas or Code */}
                    <div style={{
                        flex: 1,
                        background: '#111',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* Viewport Toolbar */}
                        <div style={{ height: '40px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#09090b' }}>
                            {activeTab === 'visual' ? (
                                <>
                                    <Monitor size={14} color="#666" />
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Canvas</span>
                                </>
                            ) : (
                                <>
                                    <Code size={14} color="#666" />
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>JSON Schema</span>
                                    {codeError && (
                                        <div className="flex items-center gap-1 text-red-500 ml-4 animate-pulse">
                                            <AlertTriangle size={12} />
                                            <span style={{ fontSize: '0.75rem' }}>Invalid JSON</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* The Canvas or Editor */}
                        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                            {activeTab === 'visual' ? (
                                <div style={{ height: '100%', overflow: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                                    <VisualCanvas
                                        schema={schema}
                                        onSelect={setSelectedId}
                                        selectedId={selectedId}
                                        onMove={handleMove}
                                        onDelete={handleDelete}
                                        onInsert={handleInsert}
                                    />

                                    {/* Mobile Panel Overlays for Visual Mode */}
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
                            ) : (
                                <textarea
                                    value={schemaJson}
                                    onChange={handleCodeChange}
                                    spellCheck={false}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        background: '#1a1a1a',
                                        color: codeError ? '#fca5a5' : '#e4e4e7',
                                        border: 'none',
                                        padding: '1.5rem',
                                        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        resize: 'none',
                                        outline: 'none'
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right: Inspector (Desktop) - Only match Visual Mode */}
                    {activeTab === 'visual' && (
                        <div className="desktop-only" style={{ width: '300px', borderLeft: '1px solid #333', display: 'none', flexDirection: 'column' }}>
                            <PropertyInspector
                                selectedId={selectedId}
                                schema={schema}
                                onChange={(newSchema: any) => setSchema(newSchema)}
                                osData={osData}
                            />
                        </div>
                    )}

                </div>

                {/* Mobile Bottom Nav (Visible only on mobile via CSS) - Only for Visual Mode */}
                {activeTab === 'visual' && (
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
                )}

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
