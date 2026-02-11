'use client';

import { useState } from 'react';
import { Play, X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    sort_order: number;
}

interface MediaGalleryProps {
    items: MediaItem[];
}

export default function MediaGallery({ items }: MediaGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    if (!items || items.length === 0) return null;

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex + 1) % items.length);
        }
    };
    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex - 1 + items.length) % items.length);
        }
    };

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 md:p-8 mb-6 animate-fade-in break-inside-avoid print:bg-white print:border-none print:p-0 print:mb-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5 print:border-gray-300 print:mb-3 print:pb-2">
                <div className="p-2 bg-neutral-800 rounded-lg print:hidden">
                    <ImageIcon className="w-5 h-5 text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold print:text-black print:uppercase print:tracking-widest print:text-sm">Media Gallery</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className="group relative aspect-square bg-neutral-950 rounded-lg overflow-hidden border border-white/5 cursor-pointer hover:border-indigo-500/50 transition-colors"
                        onClick={() => openLightbox(index)}
                    >
                        {item.type === 'video' ? (
                            <>
                                <video src={item.url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                    <div className="w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <img src={item.url} alt={item.caption || "Gallery Image"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors hidden md:block"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>

                    <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors hidden md:block"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>

                    <div
                        className="max-w-5xl max-h-[85vh] w-full relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {items[lightboxIndex].type === 'video' ? (
                            <video
                                src={items[lightboxIndex].url}
                                controls
                                autoPlay
                                className="w-full h-full max-h-[85vh] object-contain bg-black rounded-lg shadow-2xl border border-white/5"
                            />
                        ) : (
                            <img
                                src={items[lightboxIndex].url}
                                alt="Full size"
                                className="w-full h-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            />
                        )}
                        {items[lightboxIndex].caption && (
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <p className="inline-block bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white text-sm">
                                    {items[lightboxIndex].caption}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/30 text-sm pointer-events-none">
                        {lightboxIndex + 1} / {items.length}
                    </div>
                </div>
            )}
        </div>
    );
}
