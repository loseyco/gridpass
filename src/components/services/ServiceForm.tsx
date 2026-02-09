'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Service, ServiceFormData } from '@/types/services';
import { createService, updateService } from '@/app/actions/services';
import { Image as ImageIcon, Loader2, Save, X } from 'lucide-react';

interface ServiceFormProps {
    initialData?: Service | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function ServiceForm({ initialData, onSuccess, onCancel }: ServiceFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<ServiceFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        price: initialData?.price || 0,
        currency: initialData?.currency || 'USD',
        image_url: initialData?.image_url || '',
        category: initialData?.category || '',
        tags: initialData?.tags || [],
        is_active: initialData?.is_active ?? true,
    });

    const [tagInput, setTagInput] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !formData.tags?.includes(newTag)) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...(prev.tags || []), newTag]
                }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (initialData) {
                await updateService(initialData.id, formData);
            } else {
                await createService(formData);
            }

            router.refresh();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Service Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="e.g. Driver Coaching, Kart Setup"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Category
                    </label>
                    <select
                        name="category"
                        value={formData.category || ''}
                        onChange={handleChange}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors appearance-none"
                    >
                        <option value="" className="bg-neutral-900">Select a category...</option>
                        <option value="Coaching" className="bg-neutral-900">Coaching</option>
                        <option value="Engineering" className="bg-neutral-900">Engineering</option>
                        <option value="Mechanic" className="bg-neutral-900">Mechanic</option>
                        <option value="Media" className="bg-neutral-900">Media</option>
                        <option value="Logistics" className="bg-neutral-900">Logistics</option>
                        <option value="Other" className="bg-neutral-900">Other</option>
                    </select>
                </div>

                {/* Price & Currency */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Price
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price || ''}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Currency
                        </label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors appearance-none"
                        >
                            <option value="USD" className="bg-neutral-900">USD ($)</option>
                            <option value="EUR" className="bg-neutral-900">EUR (€)</option>
                            <option value="GBP" className="bg-neutral-900">GBP (£)</option>
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        rows={4}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                        placeholder="Describe what you offer..."
                    />
                </div>

                {/* Image URL */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Cover Image URL
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                            <ImageIcon className="h-4 w-4" />
                        </div>
                        <input
                            type="url"
                            name="image_url"
                            value={formData.image_url || ''}
                            onChange={handleChange}
                            className="w-full pl-10 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                            placeholder="https://..."
                        />
                    </div>
                    {formData.image_url && (
                        <div className="mt-2 aspect-video w-full max-w-[200px] overflow-hidden rounded-lg bg-neutral-900 border border-white/10">
                            <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags?.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-2 py-1 text-sm text-purple-300 border border-purple-500/30">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="Type tag and press Enter..."
                    />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleCheckboxChange}
                        id="is_active"
                        className="rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <label htmlFor="is_active" className="text-sm text-neutral-300 select-none cursor-pointer">
                        Publicly visible
                    </label>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {initialData ? 'Update Service' : 'Create Service'}
                </button>
            </div>
        </form>
    );
}
