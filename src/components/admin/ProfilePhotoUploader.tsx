'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';

interface ProfilePhotoUploaderProps {
    leadId: string;
    currentPhotoUrl?: string | null;
}

export function ProfilePhotoUploader({ leadId, currentPhotoUrl }: ProfilePhotoUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || '');
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

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('leadId', leadId);
            formData.append('fileType', 'photo');

            const response = await fetch('/api/admin/upload-profile-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setPhotoUrl(data.url);
            window.location.reload(); // Refresh to show updated photo
        } catch (err) {
            setError('Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = async () => {
        if (!confirm('Remove profile photo?')) return;

        try {
            const response = await fetch('/api/admin/upload-profile-image', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, fileType: 'photo' }),
            });

            if (response.ok) {
                setPhotoUrl('');
                window.location.reload();
            }
        } catch (err) {
            setError('Failed to remove photo');
        }
    };

    if (photoUrl) {
        return (
            <div className="space-y-3">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white/10">
                    <img
                        src={photoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={removePhoto}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        title="Remove photo"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors">
                    <Upload className="w-4 h-4" />
                    Replace Photo
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>
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
                        {uploading ? 'Uploading...' : 'Drop profile photo here'}
                    </p>
                    <p className="text-xs text-white/50">
                        or click to browse
                    </p>
                    <p className="text-xs text-white/30">
                        JPG, PNG, WEBP • Max 5MB
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
