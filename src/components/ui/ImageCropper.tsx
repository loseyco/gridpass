'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

/* 
 * Helper to create the cropped image
 */
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg', 1); // 100% quality JPEG
    });
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });
}


interface ImageCropperProps {
    imageSrc: string;
    aspectRatio?: number; // e.g., 1 for square, 16/9 for covers
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
    circularCrop?: boolean;
}

export default function ImageCropper({ imageSrc, aspectRatio = 1, onCropComplete, onCancel, circularCrop = false }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropAreaChange = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImageBlob);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 animate-fade-in flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10 transition-all">
                <button
                    onClick={onCancel}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="font-bold text-white tracking-widest uppercase text-sm">
                    Adjust Image
                </div>
                <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                >
                    {isProcessing ? <span className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full block"></span> : <Check className="w-6 h-6" />}
                </button>
            </div>

            {/* Cropper Container */}
            <div className="relative flex-1 w-full bg-neutral-900">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    onCropChange={onCropChange}
                    onCropComplete={onCropAreaChange}
                    onZoomChange={onZoomChange}
                    cropShape={circularCrop ? 'round' : 'rect'}
                    showGrid={true}
                />
            </div>

            {/* Controls */}
            <div className="p-6 bg-neutral-900 text-white pb-safe">
                <div className="flex items-center gap-4 max-w-md mx-auto">
                    <ZoomOut className="w-5 h-5 text-neutral-400" />
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <ZoomIn className="w-5 h-5 text-neutral-400" />
                </div>
            </div>
        </div>
    );
}
