'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface SocialLinksEditorProps {
    profile: any
}

export default function SocialLinksEditor({ profile }: SocialLinksEditorProps) {
    const router = useRouter()
    const supabase = createClient()
    const [saving, setSaving] = useState(false)

    // Initial state from profile.social_links or empty object
    const [links, setLinks] = useState({
        instagram: profile.social_links?.instagram || '',
        twitter: profile.social_links?.twitter || '',
        linkedin: profile.social_links?.linkedin || '',
        youtube: profile.social_links?.youtube || '',
        tiktok: profile.social_links?.tiktok || '',
        facebook: profile.social_links?.facebook || '',
        indeed: profile.social_links?.indeed || '',
        website: profile.website || '' // Website is a root column usually, but can be managed here too
    })

    const handleChange = (field: string, value: string) => {
        setLinks(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            // Update profile
            // Note: Website is root column, others are in social_links JSONB
            // The API /api/profile/update expects 'social_links' object and 'website' separately

            const payload = {
                website: links.website,
                social_links: {
                    instagram: links.instagram,
                    twitter: links.twitter,
                    linkedin: links.linkedin,
                    youtube: links.youtube,
                    tiktok: links.tiktok,
                    facebook: links.facebook,
                    indeed: links.indeed
                }
            }

            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!response.ok) throw new Error('Failed to save')

            router.refresh()
            router.push('/profile/edit')
        } catch (error) {
            console.error(error)
            alert('Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const socialFields = [
        { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
        { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/username' },
        { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
        { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
        { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
        { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
        { key: 'indeed', label: 'Indeed', placeholder: 'https://indeed.com/...' },
        { key: 'website', label: 'Website / Portfolio', placeholder: 'https://yourwebsite.com' },
    ]

    return (
        <>
            <div className="v2-header">
                <Link href="/profile/edit" className="v2-link">
                    ← Settings
                </Link>
                <h1 className="v2-title">Social Links</h1>
                <div style={{ width: '60px' }} />
            </div>

            <div className="v2-content">
                <div className="v2-card">
                    <p className="v2-text-secondary v2-text-sm v2-mb-4">
                        Add links to your social profiles to help people connect with you.
                    </p>

                    <form onSubmit={handleSave} className="v2-form-group">
                        {socialFields.map(field => (
                            <div key={field.key} className="v2-form-group">
                                <label className="v2-label">{field.label}</label>
                                <input
                                    type="url"
                                    className="v2-input"
                                    value={links[field.key as keyof typeof links]}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            </div>
                        ))}

                        <div className="v2-mt-4">
                            <button
                                type="submit"
                                className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
