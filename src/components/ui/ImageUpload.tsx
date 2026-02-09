'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    bucket?: string;
    pathPrefix?: string;
    placeholder?: string;
    className?: string;
}

export default function ImageUpload({
    value,
    onChange,
    bucket = 'garage',
    pathPrefix = 'uploads',
    placeholder = 'Upload Image',
    className = ''
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${pathPrefix}/${fileName}`;

        setIsUploading(true);
        setError(null);

        try {
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative group w-32 h-24 bg-neutral-900 border border-white/10 rounded-lg overflow-hidden">
                        <img
                            src={value}
                            alt="Upload preview"
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="w-32 h-24 bg-neutral-900 border border-dashed border-white/20 rounded-lg flex items-center justify-center text-neutral-500">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                )}

                <div className="flex-1">
                    <label className={`
                        flex items-center justify-center gap-2 px-4 py-2 
                        bg-white/5 hover:bg-white/10 border border-white/10 
                        rounded cursor-pointer transition-colors text-sm font-medium
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}>
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {isUploading ? 'Uploading...' : placeholder}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />
                    </label>
                    {error && (
                        <p className="text-red-400 text-xs mt-1">{error}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">
                        Supported: JPG, PNG, WEBP
                    </p>
                </div>
            </div>
        </div>
    );
}
