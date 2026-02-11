'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';

interface VideoGuideProps {
    title: string;
    videoSrc: string; // URL to the video file
    triggerLabel?: string; // e.g. "Watch Guide"
    className?: string; // External styling for the button
}

export default function VideoGuide({ title, videoSrc, triggerLabel = "Watch Guide", className }: VideoGuideProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-full transition-colors ${className}`}
            >
                <Play className="w-3 h-3 fill-current" />
                <span>{triggerLabel}</span>
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 z-10 shrink-0">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Play className="w-4 h-4 text-indigo-500 fill-current" />
                                {title}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-black flex items-center justify-center p-1 md:p-8 overflow-y-auto w-full h-full min-h-[300px]">
                            {videoSrc.endsWith('.webp') ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={videoSrc} alt={title} className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain" />
                            ) : (
                                <video
                                    src={videoSrc}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
