'use client';

import { useState } from 'react';
import { Vehicle } from '@/types/garage';
import { Car, Truck, Monitor, Box, Edit2, Trash2 } from 'lucide-react';

interface VehicleCardProps {
    vehicle: Vehicle;
    onEdit?: (vehicle: Vehicle) => void;
    onDelete?: (id: string) => void;
    readOnly?: boolean;
}

export default function VehicleCard({ vehicle, onEdit, onDelete, readOnly = false }: VehicleCardProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const getIcon = () => {
        switch (vehicle.type) {
            case 'Sim Rig': return <Monitor className="w-5 h-5" />;
            case 'Race Car': return <Car className="w-5 h-5" />;
            case 'Street Car': return <Car className="w-5 h-5" />;
            case 'Trailer': return <Truck className="w-5 h-5" />;
            default: return <Box className="w-5 h-5" />;
        }
    };

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors group">
            {vehicle.photo_url ? (
                <div className="h-40 w-full overflow-hidden relative">
                    <img
                        src={vehicle.photo_url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1.5 text-white">
                        {getIcon()}
                        {vehicle.type}
                    </div>
                    {vehicle.is_for_sale && (
                        <div className="absolute top-2 right-2 bg-green-600/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold uppercase text-white shadow-lg">
                            For Sale
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-24 bg-neutral-800 flex items-center justify-center relative">
                    <div className="absolute top-2 left-2 bg-black/40 px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1.5 text-neutral-300">
                        {getIcon()}
                        {vehicle.type}
                    </div>
                    {vehicle.is_for_sale && (
                        <div className="absolute top-2 right-2 bg-green-600/90 backdrop-blur-md px-2 py-1 rounded text-xs font-bold uppercase text-white shadow-lg animate-pulse">
                            For Sale
                        </div>
                    )}
                    <Car className="w-8 h-8 text-neutral-600" />
                </div>
            )}

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-white text-lg leading-tight">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        {vehicle.is_for_sale && vehicle.price && (
                            <p className="text-green-400 font-bold text-sm mt-0.5">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: vehicle.currency || 'USD' }).format(vehicle.price)}
                            </p>
                        )}
                    </div>
                    {!readOnly && (
                        <div className="flex gap-1 items-center">
                            {isConfirming ? (
                                <>
                                    <span className="text-xs text-red-400 font-bold mr-2 animate-pulse">Delete?</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsConfirming(false);
                                        }}
                                        className="px-2 py-1 text-xs bg-neutral-800 rounded text-neutral-300 hover:bg-neutral-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete?.(vehicle.id);
                                        }}
                                        className="px-2 py-1 text-xs bg-red-600 rounded text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                                    >
                                        Yes, Delete
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => onEdit?.(vehicle)}
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

                {vehicle.description && (
                    <p className="text-sm text-neutral-400 line-clamp-2 mb-3">
                        {vehicle.description}
                    </p>
                )}

                {vehicle.specs && Object.keys(vehicle.specs).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(vehicle.specs).slice(0, 4).map(([key, val]) => (
                            <div key={key}>
                                <span className="text-neutral-500 block">{key}</span>
                                <span className="text-neutral-300 font-medium truncate block">{String(val)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
