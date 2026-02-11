'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/types/garage';
import ImageUpload from '@/components/ui/ImageUpload';
import { Loader2 } from 'lucide-react';

interface VehicleFormProps {
    initialData?: Partial<Vehicle>;
    userId: string; // Used for image upload path
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    submitLabel?: string;
}

export default function VehicleForm({
    initialData,
    userId,
    onSubmit,
    onCancel,
    isLoading = false,
    submitLabel = 'Save'
}: VehicleFormProps) {
    const [formData, setFormData] = useState<Partial<Vehicle>>({
        type: 'Street Car',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        description: '',
        ...initialData
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (field: keyof Vehicle, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Type</label>
                    <select
                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white focus:outline-none focus:border-white/30"
                        value={formData.type || 'Sim Rig'}
                        onChange={e => handleChange('type', e.target.value)}
                        required
                    >
                        <option value="Race Car">Race Car</option>
                        <option value="Street Car">Street Car</option>
                        <option value="Sim Rig">Sim Rig</option>
                        <option value="Kart">Kart</option>
                        <option value="Trailer">Trailer</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Boat">Boat</option>
                        <option value="Plane">Plane</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Year</label>
                    <input
                        type="number"
                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white focus:outline-none focus:border-white/30"
                        value={formData.year || ''}
                        onChange={e => handleChange('year', parseInt(e.target.value))}
                        placeholder="2024"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Make</label>
                    <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white focus:outline-none focus:border-white/30"
                        value={formData.make || ''}
                        onChange={e => handleChange('make', e.target.value)}
                        placeholder="e.g. Porsche"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Model</label>
                    <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white focus:outline-none focus:border-white/30"
                        value={formData.model || ''}
                        onChange={e => handleChange('model', e.target.value)}
                        placeholder="e.g. 911 GT3"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">VIN / Chassis</label>
                    <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white focus:outline-none focus:border-white/30 font-mono"
                        value={formData.vin || ''}
                        onChange={e => handleChange('vin', e.target.value)}
                        placeholder="VIN..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">License Plate</label>
                    <input
                        type="text"
                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white focus:outline-none focus:border-white/30 uppercase"
                        value={formData.license_plate || ''}
                        onChange={e => handleChange('license_plate', e.target.value)}
                        placeholder="PLATE..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Mileage</label>
                    <input
                        type="number"
                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white focus:outline-none focus:border-white/30 font-mono"
                        value={formData.mileage || ''}
                        onChange={e => handleChange('mileage', parseFloat(e.target.value))}
                        placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Unit</label>
                    <select
                        className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white focus:outline-none focus:border-white/30"
                        value={formData.mileage_unit || 'mi'}
                        onChange={e => handleChange('mileage_unit', e.target.value)}
                    >
                        <option value="mi">Miles (mi)</option>
                        <option value="km">Kilometers (km)</option>
                        <option value="hr">Hours (hr)</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Photo</label>
                <ImageUpload
                    value={formData.photo_url || ''}
                    onChange={(url) => handleChange('photo_url', url)}
                    bucket="garage"
                    pathPrefix={`vehicles/${userId}`}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Description</label>
                <textarea
                    className="w-full bg-neutral-950 border border-white/10 p-2 rounded text-white h-24 resize-none focus:outline-none focus:border-white/30"
                    value={formData.description || ''}
                    onChange={e => handleChange('description', e.target.value)}
                    placeholder="Specs, modifications, setup details..."
                />
            </div>
            <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 hover:bg-neutral-800 rounded text-neutral-300 transition-colors">Cancel</button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
