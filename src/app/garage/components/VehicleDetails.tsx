'use client';

import { useState } from 'react';
import { Vehicle, Part, MaintenanceLog, Setup } from '@/types/garage';
import { addPart, addLog, deleteVehicle } from '../actions';
import {
    Wrench, Settings, Activity, Trash2, Plus,
    Calendar, Gauge, DollarSign, AlertTriangle, CheckCircle, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import VehicleForm from '@/components/profile/VehicleForm';

type Props = {
    vehicle: Vehicle;
    parts: Part[];
    logs: MaintenanceLog[];
    setups: Setup[];
    readOnly?: boolean;
};

export default function VehicleDetails({ vehicle, parts, logs, setups, readOnly = false }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'parts' | 'logs' | 'setups'>('overview');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [showAddPart, setShowAddPart] = useState(false);
    const [showAddLog, setShowAddLog] = useState(false);

    const [isEditing, setIsEditing] = useState(false);

    async function handleAddPart(formData: FormData) {
        setLoading(true);
        try {
            formData.append('vehicle_id', vehicle.id);
            const res = await addPart(formData);
            if (res?.error) toast.error(res.error);
            else {
                toast.success('Part added');
                setShowAddPart(false);
            }
        } catch (e) {
            toast.error('Failed to add part');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddLog(formData: FormData) {
        setLoading(true);
        try {
            formData.append('vehicle_id', vehicle.id);
            const res = await addLog(formData);
            if (res?.error) toast.error(res.error);
            else {
                toast.success('Log added');
                setShowAddLog(false);
            }
        } catch (e) {
            toast.error('Failed to add log');
        } finally {
            setLoading(false);
        }
    }

    // We need updateVehicle action here, let's assume it's imported or we need to import it
    // Wait, VehicleDetails takes props, maybe we need to refresh page on edit
    // Or we update local state? For now, simplistic refresh via router.

    // We need to import updateVehicle

    async function handleEdit(data: any) {
        setLoading(true);
        // Dynamically import to avoid circular dep if any (unlikely in this structure)
        // or just add it to imports
        // But for client component, server actions need to be imported at top
        try {
            const { updateVehicle } = await import('@/app/dashboard/profile/garage-actions');
            await updateVehicle(vehicle.id, data);
            toast.success('Vehicle updated');
            setIsEditing(false);
            router.refresh();
        } catch (e) {
            console.error(e);
            toast.error('Failed to update vehicle');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        setLoading(true);
        try {
            const res = await deleteVehicle(vehicle.id);
            if (res?.error) toast.error(res.error);
        } catch (e) {
            toast.error('Failed to delete vehicle');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-6">
                    <div className="w-24 h-24 bg-neutral-950 rounded-xl flex items-center justify-center text-4xl overflow-hidden">
                        {vehicle.photo_url ? (
                            <img src={vehicle.photo_url} alt={vehicle.name} className="w-full h-full object-cover" />
                        ) : (
                            <span>{vehicle.type === 'Sim Rig' ? '🎮' : '🚗'}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-white">{vehicle.name}</h1>
                            <span className="bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded text-xs font-bold uppercase border border-indigo-500/20">
                                {vehicle.type}
                            </span>
                        </div>
                        <p className="text-lg text-neutral-400 mb-2">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <div className="flex gap-2 text-xs font-mono text-neutral-600">
                            {vehicle.vin && (
                                <span className="bg-neutral-950 px-2 py-1 rounded inline-block">VIN: {vehicle.vin}</span>
                            )}
                            {vehicle.license_plate && (
                                <span className="bg-neutral-950 px-2 py-1 rounded inline-block">PLATE: {vehicle.license_plate}</span>
                            )}
                        </div>
                    </div>
                </div>
                {!readOnly && (
                    <div className="flex items-start gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={loading}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-2 rounded-lg transition-colors"
                            title="Edit Vehicle"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-colors"
                            title="Delete Vehicle"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-800 flex gap-8">
                {[
                    { id: 'overview', label: 'Overview', icon: Activity },
                    { id: 'parts', label: 'Parts & Components', icon: Wrench },
                    { id: 'logs', label: 'Maintenance Log', icon: Calendar },
                    { id: 'setups', label: 'Setups', icon: Settings },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-4 flex items-center gap-2 font-bold transition-all border-b-2 ${activeTab === tab.id
                            ? 'text-white border-indigo-500'
                            : 'text-neutral-500 border-transparent hover:text-neutral-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                            <h3 className="text-neutral-500 uppercase text-xs font-bold mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Total Mileage</span>
                                    <span className="font-mono text-white">{vehicle.mileage || 0} {vehicle.mileage_unit || 'mi'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Hours Driven</span>
                                    <span className="font-mono text-white">---</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Maintenance Cost</span>
                                    <span className="font-mono text-white">$---</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                            <h3 className="text-neutral-500 uppercase text-xs font-bold mb-4">Description</h3>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                {vehicle.description || "No description provided."}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'parts' && (
                    <div className="text-center py-12">
                        <Wrench className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white">Parts Tracking Coming Soon</h3>
                        <p className="text-neutral-500">Track mileage and lifespan of individual components.</p>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white">Service Logs Coming Soon</h3>
                        <p className="text-neutral-500">Keep a detailed history of all maintenance and repairs.</p>
                    </div>
                )}

                {activeTab === 'setups' && (
                    <div className="text-center py-12">
                        <Settings className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white">Setups Coming Soon</h3>
                        <p className="text-neutral-500">Upload and manage your car setups here.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Edit Vehicle</h3>
                            <button onClick={() => setIsEditing(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                            {/* Dynamically imported Form to avoid import cycle issues if any, though regular import likely fine */}
                            <VehicleForm
                                userId={vehicle.user_id}
                                initialData={vehicle}
                                onSubmit={handleEdit}
                                onCancel={() => setIsEditing(false)}
                                isLoading={loading}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
