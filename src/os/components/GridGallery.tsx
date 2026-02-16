'use client'
import React, { useState } from 'react'

interface GalleryImage {
    id?: string
    image_url: string
    caption?: string
    category?: string
}

interface GridGalleryProps {
    images?: GalleryImage[]
    columns?: number
}

export function GridGallery({ images = [], columns = 3 }: GridGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

    if (!images || images.length === 0) {
        return <div className="v2-text-secondary">No images in gallery</div>
    }

    return (
        <>
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${300 / columns}px, 1fr))`,
                gap: '1rem',
                margin: '2rem 0'
            }}>
                {images.map((img, index) => (
                    <div
                        key={img.id || index}
                        style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            background: '#111'
                        }}
                        onClick={() => setSelectedImage(img)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <img
                            src={img.image_url}
                            alt={img.caption || `Gallery image ${index + 1}`}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                        {img.caption && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                padding: '2rem 1rem 1rem',
                                color: '#fff',
                                fontSize: '0.9rem'
                            }}>
                                {img.caption}
                            </div>
                        )}
                        {img.category && (
                            <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                background: '#667eea',
                                color: '#fff',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                {img.category}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.95)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '2rem',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => setSelectedImage(null)}
                    >
                        ×
                    </button>
                    <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%' }}>
                        <img
                            src={selectedImage.image_url}
                            alt={selectedImage.caption || 'Gallery image'}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                        />
                        {selectedImage.caption && (
                            <div style={{
                                marginTop: '1rem',
                                color: '#fff',
                                textAlign: 'center',
                                fontSize: '1.1rem'
                            }}>
                                {selectedImage.caption}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
