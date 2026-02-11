'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/types/garage';
import { getGarage, addVehicle, updateVehicle, deleteVehicle } from '@/app/dashboard/profile/garage-actions';
import VehicleCard from './VehicleCard';
import VehicleForm from './VehicleForm';
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
        } else {
            setEditingVehicle(null);
        }
        setIsVehicleModalOpen(true);
    };

    const handleSaveVehicle = async (data: any) => {
        setIsSaving(true);
        try {
            if (editingVehicle) {
                await updateVehicle(editingVehicle.id, data);
            } else {
                await addVehicle(data);
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
                        <div className="p-6">
                            <VehicleForm
                                userId={userId}
                                initialData={editingVehicle || undefined}
                                onSubmit={handleSaveVehicle}
                                onCancel={() => setIsVehicleModalOpen(false)}
                                isLoading={isSaving}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
