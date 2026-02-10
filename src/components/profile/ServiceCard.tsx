'use client';

import { Service } from '@/types/services';
import { Pencil, Trash2, Tag, Clock, Calendar } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ServiceCardProps {
    service: Service;
    onEdit: (service: Service) => void;
    onDelete: (id: string) => void;
    isOwner: boolean;
}

export default function ServiceCard({ service, onEdit, onDelete, isOwner }: ServiceCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors group">
            {/* Image Section */}
            <div className="h-40 bg-neutral-800 relative">
                {service.photo_url ? (
                    <Image
                        src={service.photo_url}
                        alt={service.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
                        <Tag className="w-12 h-12 opacity-20" />
                    </div>
                )}

                {/* Price Tag Overlay */}
                {(service.price !== undefined && service.price !== null) && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-md border border-white/10 text-white font-bold text-sm">
                        {service.currency === 'EUR' ? '€' : service.currency === 'GBP' ? '£' : '$'}
                        {service.price}
                        <span className="text-neutral-400 text-xs font-normal ml-1">
                            / {service.unit === 'fixed' ? 'total' : service.unit}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-white truncate pr-2">{service.title}</h3>
                        {service.category && (
                            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                                {service.category}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                    {service.tags && service.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-white/5 text-neutral-400 text-[10px] rounded border border-white/5">
                            {tag}
                        </span>
                    ))}
                </div>

                {service.description && (
                    <p className="text-sm text-neutral-400 line-clamp-2 mb-4 h-10">
                        {service.description}
                    </p>
                )}

                {/* Actions (Owner Only) */}
                {isOwner && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                        {isDeleting ? (
                            <div className="flex items-center gap-2 w-full justify-between animate-fade-in">
                                <span className="text-xs text-red-400 font-bold">Confirm Delete?</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsDeleting(false)}
                                        className="px-3 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onDelete(service.id)}
                                        className="px-3 py-1 bg-red-600/20 text-red-500 border border-red-500/30 text-xs rounded hover:bg-red-600 hover:text-white"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => onEdit(service)}
                                    className="flex-1 px-3 py-2 bg-neutral-800 text-neutral-300 text-xs font-bold rounded hover:bg-neutral-700 flex items-center justify-center gap-2"
                                >
                                    <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button
                                    onClick={() => setIsDeleting(true)}
                                    className="px-3 py-2 bg-neutral-800 text-red-400 text-xs font-bold rounded hover:bg-red-900/20 border border-transparent hover:border-red-900/50 flex items-center justify-center"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
