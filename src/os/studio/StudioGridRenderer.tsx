'use client'
import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { COMPONENT_MAP, ComponentSchema } from '@/os/core/GridRenderer'
import { StudioBlock } from './StudioBlock'

// --- Interfaces ---
interface StudioGridRendererProps {
    schema: any // ComponentSchema | ComponentSchema[] (flexible for root vs children)
    selectedId: string | null
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onMove: (id: string, direction: 'up' | 'down') => void
    onInsert: (parentId: string | null, index: number, type: string) => void
    data?: any
}

// --- Insert Divider Component ---
const InsertDivider = ({ parentId, index, onInsert }: { parentId: string | null, index: number, onInsert: any }) => {
    const [isOpen, setIsOpen] = useState(false)

    // Quick list of common components
    const COMMON_COMPONENTS = ['GridInput', 'GridToggle', 'GridButton', 'Container', 'Row', 'Col', 'GridChart']

    return (
        <div className="group relative py-3 -my-3 z-20 cursor-pointer">
            {/* Visual Line (Hidden by default, visible on hover) */}
            <div className="absolute inset-x-0 top-1/2 h-[2px] bg-blue-500/0 group-hover:bg-blue-500/50 transition-colors duration-200" />

            {/* Button (Always visible but subtle, full on hover) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 transform group-hover:scale-110">
                {!isOpen ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation() // Prevent triggering parent clicks
                            setIsOpen(true)
                        }}
                        className="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-blue-600 rounded-full p-1.5 border border-zinc-700 shadow-sm opacity-50 group-hover:opacity-100 hover:border-blue-500 transition-all"
                        title="Insert Block"
                    >
                        <Plus size={16} />
                    </button>
                ) : (
                    <div className="flex flex-col items-center bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 min-w-[200px] animate-in zoom-in-95 duration-100">
                        <div className="flex justify-between items-center w-full mb-2 pb-2 border-b border-zinc-800">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Add Block</span>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white"><X size={12} /></button>
                        </div>

                        <div className="grid grid-cols-1 gap-1 w-full">
                            {COMMON_COMPONENTS.map(type => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        onInsert(parentId, index, type)
                                        setIsOpen(false)
                                    }}
                                    className="text-left text-sm px-2 py-1.5 rounded hover:bg-blue-600 hover:text-white text-zinc-300 transition-colors flex items-center gap-2"
                                >
                                    {/* Icons could go here */}
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


export function StudioGridRenderer({ schema, selectedId, onSelect, onDelete, onMove, onInsert, data }: StudioGridRendererProps) {

    // Ensure we're working with a list of children
    const nodes: ComponentSchema[] = Array.isArray(schema) ? schema : (schema.children || [])

    // Identify Sortable IDs for this level
    const sortableIds = nodes.map(node => node.id || '')

    return (
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0 w-full min-h-[50px] transition-all">
                {/* Initial Divider (Top of list) */}
                <InsertDivider parentId={null} index={0} onInsert={onInsert} />

                {nodes.map((node, index) => {
                    const Component = COMPONENT_MAP[node.component] || (() => <div className="text-red-500">Unknown: {node.component}</div>)

                    // Recursive render for children
                    // We need to pass the *node's ID* as the parentId for insertions inside it
                    const hasChildren = node.children && Array.isArray(node.children)

                    return (
                        <React.Fragment key={node.id || index}>
                            <StudioBlock
                                id={node.id || `node_${index}`}
                                selected={selectedId === node.id}
                                onSelect={onSelect}
                                onDelete={onDelete}
                                onMove={onMove}
                                label={node.component}
                            >
                                <Component {...node.props}>
                                    {hasChildren && (
                                        <div className="pl-4 border-l border-zinc-800/50 my-2">
                                            {/* Recursion! */}
                                            {/* We create a bespoke renderer for the children to handle THEIR logic */}
                                            <NestedRenderer
                                                parentId={node.id!}
                                                childrenSchema={node.children}
                                                selectedId={selectedId}
                                                onSelect={onSelect}
                                                onDelete={onDelete}
                                                onMove={onMove}
                                                onInsert={onInsert}
                                                data={data}
                                            />
                                        </div>
                                    )}
                                </Component>
                            </StudioBlock>

                            {/* Divider after this block */}
                            <InsertDivider parentId={null} index={index + 1} onInsert={onInsert} />
                        </React.Fragment>
                    )
                })}

                {nodes.length === 0 && (
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-600">
                        <span className="text-sm">Empty Container</span>
                    </div>
                )}
            </div>
        </SortableContext>
    )
}

// Helper for recursion to preserve parentId context
function NestedRenderer({ parentId, childrenSchema, ...props }: any) {
    // Override onInsert to bind the correct parentId
    const handleInsert = (pid: string | null, index: number, type: string) => {
        // If pid is null here, it implies 'root of this nested list', which is actually the parentId prop
        props.onInsert(pid || parentId, index, type)
    }

    return (
        <StudioGridRenderer
            {...props}
            schema={childrenSchema}
            onInsert={handleInsert}
        />
    )
}
