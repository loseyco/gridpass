'use client';

import { useState } from 'react';
import { Service } from '@/types/services';
import { ServiceForm } from '@/components/services/ServiceForm';
import { deleteService } from '@/app/actions/services';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/utils/format';

interface ServiceManagerProps {
    initialServices: Service[];
}

export function ServiceManager({ initialServices }: ServiceManagerProps) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        setDeletingId(id);
        try {
            await deleteService(id);
            router.refresh();
        } catch (error) {
            console.error('Failed to delete service:', error);
            alert('Failed to delete service');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSuccess = () => {
        setIsCreating(false);
        setEditingService(null);
        router.refresh();
    };

    if (isCreating || editingService) {
        return (
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold mb-6 text-white">
                    {editingService ? 'Edit Service' : 'Create New Service'}
                </h2>
                <ServiceForm
                    initialData={editingService}
                    onSuccess={handleSuccess}
                    onCancel={() => {
                        setIsCreating(false);
                        setEditingService(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">My Services</h1>
                    <p className="text-neutral-400">Manage the services you offer to the community.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Service
                </button>
            </div>

            <div className="grid gap-4">
                {initialServices.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-900 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-medium text-white mb-2">No services listed yet</h3>
                        <p className="text-neutral-400 mb-6">Start offering your skills to get hired.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Your First Service
                        </button>
                    </div>
                ) : (
                    initialServices.map(service => (
                        <div
                            key={service.id}
                            className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-neutral-900 border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                {service.image_url ? (
                                    <img src={service.image_url} alt={service.title} className="w-16 h-16 rounded-lg object-cover bg-neutral-800" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-600 font-bold text-xs">
                                        NO IMG
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white text-lg">{service.title}</h3>
                                        {!service.is_active && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-400 border border-white/5">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-neutral-400 mb-1">
                                        {service.category || 'Uncategorized'} • {formatCurrency(service.price, service.currency)}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {service.tags?.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] bg-white/5 text-neutral-400 px-1.5 py-0.5 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                <button
                                    onClick={() => setEditingService(service)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(service.id)}
                                    disabled={deletingId === service.id}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    {deletingId === service.id ? (
                                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
