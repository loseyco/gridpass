'use client';

import { useState } from 'react';
import { Vehicle, Part, MaintenanceLog, Setup } from '@/types/garage';
import { addPart, addLog, deleteVehicle } from '../actions';
import {
    Wrench, Settings, Activity, Trash2, Plus,
    Calendar, Gauge, DollarSign, AlertTriangle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
                    <div className="w-24 h-24 bg-neutral-950 rounded-xl flex items-center justify-center text-4xl">
                        {vehicle.type === 'Sim Rig' ? '🎮' : '🚗'}
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
                        {vehicle.vin && (
                            <p className="text-xs font-mono text-neutral-600 bg-neutral-950 px-2 py-1 rounded inline-block">
                                VIN: {vehicle.vin}
                            </p>
                        )}
                    </div>
                </div>
                {!readOnly && (
                    <div className="flex items-start gap-2">
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
                                    <span className="font-mono text-white">1,204 km</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Hours Driven</span>
                                    <span className="font-mono text-white">42.5 hrs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Maintenance Cost</span>
                                    <span className="font-mono text-white">$1,450</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'parts' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Tracked Components</h2>
                            {!readOnly && (
                                <button
                                    onClick={() => setShowAddPart(true)}
                                    className="flex items-center gap-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add Part
                                </button>
                            )}
                        </div>

                        {parts.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
                                <p className="text-neutral-500">No parts tracked yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {parts.map(part => (
                                    <div key={part.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-white">{part.name}</h4>
                                            <p className="text-neutral-500 text-sm">{part.category} • {part.status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-sm text-neutral-300">{part.current_mileage || 0} km</p>
                                            <div className="w-24 h-1 bg-neutral-800 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className={`h-full ${part.status === 'good' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    style={{ width: '80%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Service History</h2>
                            {!readOnly && (
                                <button
                                    onClick={() => setShowAddLog(true)}
                                    className="flex items-center gap-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add Log
                                </button>
                            )}
                        </div>

                        {logs.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
                                <p className="text-neutral-500">No maintenance logs yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map(log => (
                                    <div key={log.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white">{log.title}</h4>
                                            <span className="text-xs text-neutral-500">
                                                {new Date(log.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-neutral-400 text-sm mb-3">{log.description}</p>
                                        <div className="flex gap-4 text-xs font-mono text-neutral-500">
                                            {log.mileage && <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {log.mileage} km</span>}
                                            {log.cost && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${log.cost}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
        </div>
    );
}
