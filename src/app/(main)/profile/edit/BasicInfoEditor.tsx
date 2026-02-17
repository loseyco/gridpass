'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface ProfileEditorProps {
  profile: any
}

export default function ProfileEditor({ profile }: ProfileEditorProps) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    avatar_url: profile.avatar_url || '',
    cover_url: profile.cover_url || ''
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'cover_url') => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}/${field === 'cover_url' ? 'cover' : 'avatar'}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile_assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile_assets')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, [field]: publicUrl }))
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      router.push('/profile/edit')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="v2-header">
        <Link href="/profile/edit" className="v2-link">
          ← Settings
        </Link>
        <h1 className="v2-title">Basic Info</h1>
        <div style={{ width: '60px' }} />
      </div>

      <div className="v2-content">
        <form onSubmit={handleSubmit} className="v2-form-group">
          {error && (
            <div className="v2-error-banner">
              {error}
            </div>
          )}

          {/* Profile Images */}
          <div className="v2-card v2-mb-4">
            <h2 className="v2-heading-2">Profile Images</h2>

            {/* Cover Photo */}
            <div className="v2-mb-4">
              <label className="v2-label">Cover Photo</label>
              <div style={{
                width: '100%',
                height: '140px',
                background: formData.cover_url ? `url(${formData.cover_url}) center/cover` : 'var(--v2-bg-secondary)',
                borderRadius: 'var(--v2-radius-md)',
                border: '1px dashed var(--v2-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div className="v2-btn v2-btn-secondary" style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    {uploading ? 'Uploading...' : 'Change Cover'}
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'cover_url')}
                  style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Avatar */}
            <div>
              <label className="v2-label">Profile Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Avatar"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        border: '2px solid var(--v2-accent-primary)',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '2px solid var(--v2-border)',
                      background: 'var(--v2-bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--v2-text-tertiary)',
                    }}>
                      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="15" r="6" stroke="currentColor" strokeWidth="2.5" />
                        <path d="M8 32C8 26 12 22 20 22C28 22 32 26 32 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <button type="button" className="v2-btn v2-btn-secondary" style={{ width: '100%' }}>
                      {uploading ? 'Uploading...' : 'Change Avatar'}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'avatar_url')}
                      style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
                      disabled={uploading}
                    />
                  </div>
                  <p className="v2-text-tertiary v2-text-xs" style={{ marginTop: '0.5rem' }}>
                    Recommended: Square JPG/PNG, max 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="v2-card v2-mb-4">
            <h2 className="v2-heading-2">Basic Information</h2>

            <div className="v2-form-group">
              <label className="v2-label">Full Name</label>
              <input
                type="text"
                className="v2-input"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            <div className="v2-form-group">
              <label className="v2-label">Username</label>
              <input
                type="text"
                className="v2-input"
                value={profile.username}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p className="v2-text-tertiary v2-text-sm" style={{ marginTop: '0.25rem' }}>Username cannot be changed</p>
            </div>

            <div className="v2-form-group">
              <label className="v2-label">Bio</label>
              <textarea
                className="v2-input"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>

            <div className="v2-form-group">
              <label className="v2-label">Location</label>
              <input
                type="text"
                className="v2-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="v2-btn v2-btn-primary v2-btn-full v2-justify-center"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  )
}
