'use client';

import { useState, useEffect } from 'react';
import { Tool } from '@/types/garage';
import { getGarage, addTool, updateTool, deleteTool } from '@/app/actions/garage';
import ToolCard from './ToolCard';
import ImageUpload from '@/components/ui/ImageUpload';
import { Plus, Loader2, X } from 'lucide-react';

interface ToolsManagerProps {
    userId: string;
}

export default function ToolsManager({ userId }: ToolsManagerProps) {
    const [tools, setTools] = useState<Tool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [isToolModalOpen, setIsToolModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<Tool | null>(null);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getGarage(userId);
            setTools(data.tools);
        } catch (error) {
            console.error('Failed to load tools', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openToolModal = (tool?: Tool) => {
        if (tool) {
            setEditingTool(tool);
            setFormData({ ...tool });
        } else {
            setEditingTool(null);
            setFormData({ name: '', brand: '', category: '', description: '' });
        }
        setIsToolModalOpen(true);
    };

    const handleSaveTool = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingTool) {
                await updateTool(editingTool.id, formData);
            } else {
                await addTool(formData);
            }
            await loadData();
            setIsToolModalOpen(false);
        } catch (error) {
            console.error('Failed to save tool', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTool = async (id: string) => {
        // Confirmation is now handled by the UI card
        try {
            await deleteTool(id);
            setTools(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete tool', error);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-500" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Tools & Equipment</h2>
                    <p className="text-sm text-neutral-400">List your professional tool collection and equipment.</p>
                </div>
                <button
                    onClick={() => openToolModal()}
                    className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Tool
                </button>
            </div>

            {tools.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl bg-neutral-900/50">
                    <p className="text-neutral-500">No tools listed yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tools.map(tool => (
                        <ToolCard
                            key={tool.id}
                            tool={tool}
                            onEdit={openToolModal}
                            onDelete={handleDeleteTool}
                        />
                    ))}
                </div>
            )}

            {/* --- Tool Modal --- */}
            {isToolModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editingTool ? 'Edit Tool' : 'Add Tool'}</h3>
                            <button onClick={() => setIsToolModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveTool} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Torque Wrench"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Brand</label>
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white"
                                        value={formData.brand || ''}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        placeholder="e.g. Snap-on"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Category</label>
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white"
                                        value={formData.category || ''}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. Hand Tools"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Photo</label>
                                <ImageUpload
                                    value={formData.photo_url || ''}
                                    onChange={(url) => setFormData({ ...formData, photo_url: url })}
                                    bucket="garage"
                                    pathPrefix={`tools/${userId}`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white h-24 resize-none"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Details..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsToolModalOpen(false)} className="px-4 py-2 hover:bg-neutral-800 rounded text-neutral-300">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
