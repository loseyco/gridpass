'use client';

import { useState } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';

interface BackgroundImageUploaderProps {
    leadId: string;
    currentBackgroundUrl?: string | null;
}

export function BackgroundImageUploader({ leadId, currentBackgroundUrl }: BackgroundImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [backgroundUrl, setBackgroundUrl] = useState(currentBackgroundUrl || '');
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(f => f.type.startsWith('image/'));

        if (imageFile) {
            await uploadFile(imageFile);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (JPG, PNG, WEBP)');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('leadId', leadId);
            formData.append('fileType', 'background');

            const response = await fetch('/api/admin/upload-profile-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setBackgroundUrl(data.url);
            window.location.reload(); // Refresh to show updated background
        } catch (err) {
            setError('Failed to upload background. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const removeBackground = async () => {
        if (!confirm('Remove background image?')) return;

        try {
            const response = await fetch('/api/admin/upload-profile-image', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, fileType: 'background' }),
            });

            if (response.ok) {
                setBackgroundUrl('');
                window.location.reload();
            }
        } catch (err) {
            setError('Failed to remove background');
        }
    };

    if (backgroundUrl) {
        return (
            <div className="space-y-3">
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
                    <img
                        src={backgroundUrl}
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={removeBackground}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                        title="Remove background"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors">
                    <Upload className="w-4 h-4" />
                    Replace Background
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>
                <p className="text-xs text-white/40">
                    Recommended: 1920x400 or similar wide format
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-all
          ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
            >
                <ImageIcon className={`
          w-12 h-12 mx-auto mb-3 transition-colors
          ${isDragging ? 'text-indigo-400' : 'text-white/40'}
        `} />

                <div className="space-y-2">
                    <p className="text-sm font-medium text-white/90">
                        {uploading ? 'Uploading...' : 'Drop background image here'}
                    </p>
                    <p className="text-xs text-white/50">
                        or click to browse
                    </p>
                    <p className="text-xs text-white/30">
                        JPG, PNG, WEBP • Max 10MB • Recommended: 1920x400
                    </p>
                </div>

                <label className="mt-4 cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4" />
                    Choose File
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />
                </label>
            </div>

            {error && (
                <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    {error}
                </div>
            )}
        </div>
    );
}
