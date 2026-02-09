'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/types/garage';
import { getGarage, addVehicle, updateVehicle, deleteVehicle } from '@/app/dashboard/profile/garage-actions';
import VehicleCard from './VehicleCard';
import ImageUpload from '@/components/ui/ImageUpload';
import { Plus, Loader2, X } from 'lucide-react';

interface VehicleManagerProps {
    userId: string;
}

export default function VehicleManager({ userId }: VehicleManagerProps) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getGarage(userId);
            setVehicles(data.vehicles);
        } catch (error) {
            console.error('Failed to load vehicles', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openVehicleModal = (vehicle?: Vehicle) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setFormData({ ...vehicle });
        } else {
            setEditingVehicle(null);
            setFormData({ type: 'Sim Rig', make: '', model: '', year: new Date().getFullYear(), description: '' });
        }
        setIsVehicleModalOpen(true);
    };

    const handleSaveVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingVehicle) {
                await updateVehicle(editingVehicle.id, formData);
            } else {
                await addVehicle(formData);
            }
            await loadData();
            setIsVehicleModalOpen(false);
        } catch (error) {
            console.error('Failed to save vehicle', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteVehicle = async (id: string) => {
        console.log('handleDeleteVehicle called with ID:', id);
        // Confirmation is now handled by the UI card
        try {
            console.log('Calling server action deleteVehicle...');
            await deleteVehicle(id);
            console.log('Server action returned. Updating local state.');
            setVehicles(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            console.error('Failed to delete vehicle', error);
            alert('Failed to delete vehicle: ' + (error as Error).message);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-500" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Vehicles & Rigs</h2>
                    <p className="text-sm text-neutral-400">Manage your sim rigs, race cars, and transport.</p>
                </div>
                <button
                    onClick={() => openVehicleModal()}
                    className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Vehicle
                </button>
            </div>

            {vehicles.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl bg-neutral-900/50">
                    <p className="text-neutral-500">No vehicles added yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map(vehicle => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            onEdit={openVehicleModal}
                            onDelete={handleDeleteVehicle}
                        />
                    ))}
                </div>
            )}

            {/* --- Vehicle Modal --- */}
            {isVehicleModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
                            <button onClick={() => setIsVehicleModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSaveVehicle} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Type</label>
                                    <select
                                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white"
                                        value={formData.type || 'Sim Rig'}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    >
                                        <option value="Sim Rig">Sim Rig</option>
                                        <option value="Race Car">Race Car</option>
                                        <option value="Street Car">Street Car</option>
                                        <option value="Trailer">Trailer</option>
                                        <option value="Kart">Kart</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Year</label>
                                    <input
                                        type="number"
                                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white"
                                        value={formData.year || ''}
                                        onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        placeholder="2024"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Make</label>
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white"
                                        value={formData.make || ''}
                                        onChange={e => setFormData({ ...formData, make: e.target.value })}
                                        placeholder="e.g. Porsche"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Model</label>
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white"
                                        value={formData.model || ''}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="e.g. 911 GT3"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Photo</label>
                                <ImageUpload
                                    value={formData.photo_url || ''}
                                    onChange={(url) => setFormData({ ...formData, photo_url: url })}
                                    bucket="garage"
                                    pathPrefix={`vehicles/${userId}`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white h-24 resize-none"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Specs, modifications, setup details..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="px-4 py-2 hover:bg-neutral-800 rounded text-neutral-300">Cancel</button>
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
