'use client';

import { Tool } from '@/types/garage';
import { Wrench, Edit2, Trash2 } from 'lucide-react';

interface ToolCardProps {
    tool: Tool;
    onEdit?: (tool: Tool) => void;
    onDelete?: (id: string) => void;
    readOnly?: boolean;
}

import { useState } from 'react';

// ... imports

export default function ToolCard({ tool, onEdit, onDelete, readOnly = false }: ToolCardProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    return (
        <div className="bg-neutral-900 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors group flex justify-between items-center gap-4">
            <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 bg-neutral-800 rounded flex items-center justify-center shrink-0 overflow-hidden">
                    {tool.photo_url ? (
                        <img src={tool.photo_url} alt={tool.name} className="w-full h-full object-cover" />
                    ) : (
                        <Wrench className="w-6 h-6 text-neutral-500" />
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">
                        {tool.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                        {tool.brand && <span className="text-indigo-400 font-medium">{tool.brand}</span>}
                        {tool.brand && tool.category && <span>•</span>}
                        {tool.category && <span>{tool.category}</span>}
                    </div>
                    {tool.description && (
                        <p className="text-xs text-neutral-500 mt-1 truncate max-w-xs">{tool.description}</p>
                    )}
                </div>
            </div>

            {!readOnly && (
                <div className="flex gap-1 shrink-0">
                    {isConfirming ? (
                        <>
                            <button
                                onClick={() => setIsConfirming(false)}
                                className="px-2 py-1 text-xs bg-neutral-800 rounded text-neutral-300 hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onDelete?.(tool.id)}
                                className="px-2 py-1 text-xs bg-red-600/20 text-red-500 border border-red-600/50 rounded hover:bg-red-600 hover:text-white transition-colors"
                            >
                                Confirm
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => onEdit?.(tool)}
                                className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsConfirming(true);
                                }}
                                className="p-1.5 hover:bg-red-900/20 rounded text-neutral-400 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
