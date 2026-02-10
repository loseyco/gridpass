'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Service, ServiceFormData } from '@/types/services';
import { Plus, X, Loader2, DollarSign } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import ServiceCard from './ServiceCard';

interface ServicesManagerProps {
    userId: string;
    isOwnProfile: boolean;
}

export default function ServicesManager({ userId, isOwnProfile }: ServicesManagerProps) {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

    const [formData, setFormData] = useState<ServiceFormData>({
        title: '',
        description: '',
        price: undefined,
        currency: 'USD',
        unit: 'fixed',
        photo_url: '',
        category: '',
        tags: [],
        is_active: true
    });

    const supabase = createClient();

    useEffect(() => {
        fetchServices();
    }, [userId]);

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('user_services')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (currentServiceId) {
                // Update
                const { error } = await supabase
                    .from('user_services')
                    .update(formData)
                    .eq('id', currentServiceId);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('user_services')
                    .insert({
                        ...formData,
                        user_id: userId
                    });

                if (error) throw error;
            }

            await fetchServices();
            closeModal();
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Failed to save service');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('user_services')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setServices(services.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Failed to delete service');
        }
    };

    const openEdit = (service: Service) => {
        setFormData({
            title: service.title,
            description: service.description || '',
            price: service.price,
            currency: service.currency || 'USD',
            unit: service.unit,
            photo_url: service.photo_url || '',
            category: service.category || '',
            tags: service.tags || [],
            is_active: service.is_active ?? true
        });
        setCurrentServiceId(service.id);
        setIsEditing(true);
    };

    const openAdd = () => {
        setFormData({
            title: '',
            description: '',
            price: undefined,
            currency: 'USD',
            unit: 'fixed',
            photo_url: '',
            category: '',
            tags: [],
            is_active: true
        });
        setCurrentServiceId(null);
        setIsEditing(true);
    };

    const closeModal = () => {
        setIsEditing(false);
        setCurrentServiceId(null);
    };

    if (loading) return <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

    if (!isOwnProfile && services.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Services Offered
                    <span className="text-xs font-normal text-neutral-500 bg-neutral-900 px-2 py-1 rounded">
                        {services.length}
                    </span>
                </h3>
                {isOwnProfile && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Service
                    </button>
                )}
            </div>

            {services.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-neutral-800 rounded-xl text-center">
                    <p className="text-neutral-500 mb-4">No services listed yet.</p>
                    {isOwnProfile && (
                        <button onClick={openAdd} className="text-indigo-400 hover:text-indigo-300 text-sm font-bold">
                            + List your first service
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(service => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            isOwner={isOwnProfile}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-neutral-800/50">
                            <h3 className="font-bold text-lg">{currentServiceId ? 'Edit Service' : 'Add Service'}</h3>
                            <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Service Image</label>
                                <ImageUpload
                                    value={formData.photo_url || ''}
                                    onChange={(url) => setFormData({ ...formData, photo_url: url })}
                                    bucket="garage"
                                    pathPrefix={`services/${userId}`}
                                    className="h-40"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-neutral-950 border border-white/10 rounded p-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Engine Tuning, Driver Coaching"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Price ($)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.price || ''}
                                            onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            className="w-full bg-neutral-950 border border-white/10 rounded p-3 pl-9 text-white focus:border-indigo-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                                        className="w-full bg-neutral-950 border border-white/10 rounded p-3 text-white focus:border-indigo-500 outline-none appearance-none"
                                    >
                                        <option value="fixed">Fixed Price</option>
                                        <option value="hourly">Per Hour</option>
                                        <option value="daily">Per Day</option>
                                        <option value="project">Per Project</option>
                                        <option value="consultation">Per Consultation</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-neutral-950 border border-white/10 rounded p-3 text-white focus:border-indigo-500 outline-none h-24 resize-none"
                                    placeholder="Describe what you offer..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {currentServiceId ? 'Save Changes' : 'Create Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
