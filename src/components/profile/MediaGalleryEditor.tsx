'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, Trash2, Image as ImageIcon, Film } from 'lucide-react';

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    sort_order: number;
}

export default function MediaGalleryEditor() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profile_media')
            .select('*')
            .eq('user_id', user.id)
            .order('sort_order', { ascending: true });

        setMedia(data || []);
        setIsLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/gallery/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('profile_assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profile_assets')
                .getPublicUrl(filePath);

            // 2. Insert into DB
            const { error: dbError } = await supabase
                .from('profile_media')
                .insert({
                    user_id: user.id,
                    url: publicUrl,
                    type: file.type.startsWith('video') ? 'video' : 'image',
                    sort_order: media.length // Append to end
                });

            if (dbError) throw dbError;

            await loadMedia();
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            // Delete from DB first for snappiness
            const { error } = await supabase
                .from('profile_media')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Should also delete from storage but URL handling handles orphaned files for now

            setMedia(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-neutral-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item) => (
                    <div key={item.id} className="group relative aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-white/5">
                        {item.type === 'video' ? (
                            <video src={item.url} className="w-full h-full object-cover opacity-80" />
                        ) : (
                            <img src={item.url} alt="Gallery item" className="w-full h-full object-cover" />
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                                onClick={() => handleDelete(item.id, item.url)}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {item.type === 'video' && (
                            <div className="absolute top-2 right-2 p-1 bg-black/50 rounded text-white"><Film className="w-3 h-3" /></div>
                        )}
                    </div>
                ))}

                {/* Upload Button */}
                <label className="aspect-square bg-neutral-900/50 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors group">
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    ) : (
                        <>
                            <Plus className="w-8 h-8 text-neutral-500 group-hover:text-indigo-400 mb-2" />
                            <span className="text-sm font-medium text-neutral-500 group-hover:text-indigo-400">Add Media</span>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={handleUpload}
                    />
                </label>
            </div>

            {media.length === 0 && (
                <div className="text-center py-8 text-neutral-500 text-sm">
                    Upload photos of your car, team, or podium moments.
                </div>
            )}
        </div>
    );
}
