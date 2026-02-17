'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Reorder } from 'framer-motion'
import { GripVertical } from 'lucide-react'

interface MediaItem {
    id: string
    url: string
    type: 'image' | 'video'
    caption?: string
    sort_order: number
}

interface V2MediaEditorProps {
    userId: string
}

export default function V2MediaEditor({ userId }: V2MediaEditorProps) {
    const router = useRouter()
    const [media, setMedia] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        loadMedia()
    }, [userId])

    const loadMedia = async () => {
        const { data } = await supabase
            .from('profile_media')
            .select('*')
            .eq('user_id', userId)
            .order('sort_order', { ascending: true })

        setMedia(data || [])
        setLoading(false)
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        try {
            setUploading(true)
            const newMediaItems: any[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]

                // 1. Upload to Storage
                const fileExt = file.name.split('.').pop()
                const filePath = `${userId}/gallery/${Date.now()}-${i}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('profile_assets')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('profile_assets')
                    .getPublicUrl(filePath)

                // 2. Insert into DB
                const { data: insertedData, error: dbError } = await supabase
                    .from('profile_media')
                    .insert({
                        user_id: userId,
                        url: publicUrl,
                        type: file.type.startsWith('video') ? 'video' : 'image',
                        sort_order: media.length + i
                    })
                    .select()
                    .single()

                if (dbError) throw dbError
                if (insertedData) newMediaItems.push(insertedData)
            }

            setMedia(prev => [...prev, ...newMediaItems])
        } catch (error) {
            console.error('Upload failed', error)
            alert('Upload failed. Please try again.')
        } finally {
            setUploading(false)
            // Reset input
            e.target.value = ''
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return

        try {
            const { error } = await supabase
                .from('profile_media')
                .delete()
                .eq('id', id)

            if (error) throw error

            setMedia(prev => prev.filter(item => item.id !== id))
        } catch (error) {
            console.error('Delete failed', error)
            alert('Delete failed')
        }
    }

    const handleReorder = async (newOrder: MediaItem[]) => {
        setMedia(newOrder)

        // Optimistic update locally, then background sync
        try {
            const updates = newOrder.map((item, index) => ({
                id: item.id,
                sort_order: index,
                user_id: userId // Required for RLS usually
            }))

            // Batch update using upsert
            const { error } = await supabase
                .from('profile_media')
                .upsert(updates, { onConflict: 'id' })

            if (error) throw error
        } catch (error) {
            console.error('Reorder failed sync', error)
            // Ideally revert state here if critical
        }
    }

    return (
        <>
            <div className="v2-header">
                <Link href="/profile/edit" className="v2-link">
                    ← Settings
                </Link>
                <h1 className="v2-title">Media Gallery</h1>
                <div style={{ width: '60px' }} />
            </div>

            <div className="v2-content">
                <div className="v2-card">
                    <h2 className="v2-heading-3">Your Gallery</h2>
                    <p className="v2-text-secondary v2-text-sm v2-mb-4">
                        Upload photos and videos to showcase your career. Drag to reorder.
                    </p>

                    {/* Upload Button */}
                    <div className="v2-mb-4">
                        <label className={`v2-upload-btn ${uploading ? 'disabled' : ''}`}>
                            {uploading ? 'Uploading...' : '+ Upload Photos / Videos'}
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleUpload}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    {/* Draggable Grid */}
                    {loading ? (
                        <p className="v2-text-secondary">Loading...</p>
                    ) : media.length === 0 ? (
                        <p className="v2-empty-state">No media uploaded yet.</p>
                    ) : (
                        <Reorder.Group
                            axis="y"
                            values={media}
                            onReorder={handleReorder}
                            className="media-grid-reorder"
                        >
                            {media.map((item) => (
                                <Reorder.Item key={item.id} value={item} className="media-item-wrapper">
                                    <div className="media-item">
                                        {item.type === 'video' ? (
                                            <video src={item.url} className="media-thumb" />
                                        ) : (
                                            <img src={item.url} alt="Gallery" className="media-thumb" />
                                        )}
                                        <div className="drag-handle">
                                            <GripVertical size={16} />
                                        </div>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(item.id)}
                                            aria-label="Delete item"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    )}

                    <div className="v2-mt-4">
                        <button
                            onClick={() => router.push('/profile/edit')}
                            className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
                        >
                            Save & Return
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .v2-upload-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    padding: 1rem;
                    background: var(--v2-bg-secondary);
                    border: 2px dashed var(--v2-border);
                    border-radius: var(--v2-radius-md);
                    color: var(--v2-text-secondary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .v2-upload-btn:hover {
                    border-color: var(--v2-accent-primary);
                    color: var(--v2-accent-primary);
                    background: var(--v2-accent-light);
                }

                .v2-upload-btn.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Reorder Grid Styles */
                :global(.media-grid-reorder) {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                    list-style: none;
                    padding: 0;
                }

                .media-item {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: var(--v2-radius-md);
                    overflow: hidden;
                    border: 1px solid var(--v2-border);
                    background: var(--v2-bg-secondary);
                    touch-action: none; /* Crucial for drag on mobile */
                }

                .media-thumb {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    pointer-events: none; /* Prevent image drag interfering */
                }

                .drag-handle {
                    position: absolute;
                    top: 0.5rem;
                    left: 0.5rem;
                    width: 28px;
                    height: 28px;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: grab;
                }

                .delete-btn {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    width: 28px;
                    height: 28px;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    line-height: 1;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .delete-btn:hover {
                    background: #e31e24;
                    border-color: #e31e24;
                }
            `}</style>
        </>
    )
}
