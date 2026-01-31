'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Save, User as UserIcon, ChevronDown, ChevronUp, Check } from 'lucide-react';
import {
    Trophy, Wrench, Briefcase, User, MapPin,
    FileText, Zap, Shield, Globe, Award, Phone, AlertTriangle, History, Sparkles
} from 'lucide-react';
import CareerEditor from './career-editor';
import { CareerEntry } from '@/types/career';

import { SCHEMA_CATEGORIES } from '@/lib/profile-schema';
import MediaGalleryEditor from '@/components/profile/MediaGalleryEditor';
import ImageCropper from '@/components/ui/ImageCropper';


// Quick hack to add Media to sidebar without touching schema file since it's hardcoded there
const MEDIA_SECTION = { id: 'media', title: 'Media Gallery', icon: ImageIcon, description: 'Showcase your racing highlights.' };
import { Image as ImageIcon } from 'lucide-react';

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activeSection, setActiveSection] = useState<string>('basic');
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [savedSection, setSavedSection] = useState<string | null>(null);

    // Cropper State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [cropConfig, setCropConfig] = useState<{ aspect: number, circular: boolean, field: string } | null>(null);

    // Store all data in a flat state for now, but we'll map it back to JSONBs on save
    const [formData, setFormData] = useState<any>({});
    const [careerHistory, setCareerHistory] = useState<CareerEntry[]>([]);

    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                // Flatten the DB structure into form state
                setFormData({
                    // Basic fields found on root
                    username: data.username || '',
                    full_name: data.full_name || '',
                    bio: data.bio || '',
                    website: data.website || '',
                    location: data.location || '',
                    avatar_url: data.avatar_url || '',
                    cover_image_url: data.cover_image_url || '',

                    // JSONB fields flattened (simple approach for now)
                    ...data.driver_info,
                    ...data.real_world_info,
                    ...data.mechanic_info,
                    ...data.physical_info,
                    ...data.logistics_info,
                    ...data.logistics_info,
                    ...data.emergency_contact,
                });
                setCareerHistory(data.career_history || []);
            }
            setIsLoading(false);
        };
        fetchProfile();
    }, []);

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    // Auto-save wrapper for career history
    const handleCareerUpdate = async (newHistory: CareerEntry[]) => {
        setCareerHistory(newHistory);

        // Optimistic update locally, then background save
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({
                    career_history: newHistory,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                setMessage({ type: 'error', text: 'Failed to save career changes' });
            }
        } catch (e) {
            console.error('Auto-save failed', e);
        }
    };

    const handleSave = async (sectionId?: string) => {
        if (sectionId) {
            setSavingSection(sectionId);
        } else {
            setIsSaving(true);
        }
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            // Re-construct the JSONB objects
            const updates: any = {
                id: user.id,
                updated_at: new Date().toISOString(),

                // Root fields
                username: formData.username,
                full_name: formData.full_name,
                bio: formData.bio,
                website: formData.website,
                location: formData.location,
                avatar_url: formData.avatar_url,
                cover_image_url: formData.cover_image_url,

                // Nested JSONB
                driver_info: extractFields('driver', formData),
                real_world_info: extractFields('real_world', formData),
                mechanic_info: extractFields('mechanic', formData),
                physical_info: extractFields('physical', formData),
                logistics_info: extractFields('logistics', formData),
                emergency_contact: extractFields('emergency', formData),
                career_history: careerHistory,
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            if (sectionId) {
                setSavedSection(sectionId);
                setTimeout(() => setSavedSection(null), 3000);
            } else {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
            setSavingSection(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSave();
    };

    // --- Cropper Logic ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || null);
            setCropConfig({
                aspect: field === 'avatar_url' ? 1 : 16 / 9,
                circular: field === 'avatar_url',
                field
            });
        });
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!cropConfig || !cropImageSrc) return;

        const field = cropConfig.field;
        setCropImageSrc(null); // Close cropper UI immediately
        setCropConfig(null);

        try {
            setIsLoading(true);
            setMessage(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Define path based on field
            const isAvatar = field === 'avatar_url';
            const bucket = isAvatar ? 'avatars' : 'profile_assets';
            const fileName = `${Date.now()}.webp`;
            const filePath = isAvatar ? `${user.id}/${fileName}` : `${user.id}/cover/${fileName}`;

            // Upload
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, croppedBlob, { contentType: 'image/webp', upsert: true });

            if (uploadError) throw uploadError;

            // Get URL
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

            // Update State & DB
            handleChange(field, publicUrl);
            await supabase.from('profiles').update({ [field]: publicUrl }).eq('id', user.id);

            setMessage({ type: 'success', text: 'Image updated successfully!' });

        } catch (error: any) {
            console.error('Upload error', error);
            setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to extract specific fields for a category from the flat form data
    const extractFields = (catId: string, data: any) => {
        const category = SCHEMA_CATEGORIES.find(c => c.id === catId);
        if (!category) return {};

        const extracted: any = {};
        category.fields.forEach(field => {
            if (data[field.key] !== undefined) {
                extracted[field.key] = data[field.key];
            }
        });
        return extracted;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Edit Profile</h1>
                    <p className="text-neutral-400">Manage your identity across the GridPass ecosystem.</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/u/${formData.username}`}
                        target="_blank"
                        className="bg-neutral-800 text-neutral-300 font-bold px-4 py-2 rounded hover:bg-neutral-700 transition-colors flex items-center gap-2 border border-white/5"
                    >
                        <UserIcon className="w-4 h-4" />
                        View Public Profile
                    </a>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-white text-black font-bold px-6 py-2 rounded hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded mb-8 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-1 lg:col-span-1">
                    {SCHEMA_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveSection(cat.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors text-sm font-medium ${activeSection === cat.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.title}
                        </button>
                    ))}

                    <button
                        onClick={() => setActiveSection('career')}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors text-sm font-medium ${activeSection === 'career'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Career Timeline
                    </button>

                    <button
                        onClick={() => setActiveSection('media')}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors text-sm font-medium ${activeSection === 'media'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        <ImageIcon className="w-4 h-4" />
                        Media Gallery
                    </button>

                    <div className="pt-4 mt-4 border-t border-white/5">
                        <div className="px-4 text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Integrations</div>
                        <button className="w-full text-left px-4 py-2 rounded flex items-center gap-3 text-neutral-500 cursor-not-allowed opacity-50">
                            <img src="/iracing-icon.png" className="w-4 h-4 grayscale" alt="" />
                            Link iRacing
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="lg:col-span-3 space-y-6">
                    {activeSection === 'career' ? (
                        <CareerEditor entries={careerHistory} onChange={handleCareerUpdate} />
                    ) : activeSection === 'media' ? (
                        <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 md:p-8 animate-fade-in">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Media Gallery
                                </h2>
                                <p className="text-sm text-neutral-400 mt-1">
                                    Upload photos and videos to showcase your career.
                                </p>
                            </div>
                            <MediaGalleryEditor />
                        </div>
                    ) : (
                        SCHEMA_CATEGORIES.map(cat => (
                            activeSection === cat.id && (
                                <div key={cat.id} className="bg-neutral-900 border border-white/5 rounded-xl p-6 md:p-8 animate-fade-in">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-bold flex items-center gap-2">
                                                {cat.title}
                                            </h2>
                                            <p className="text-sm text-neutral-400 mt-1">{cat.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {savedSection === cat.id && (
                                                <span className="text-sm text-emerald-500 font-bold flex items-center gap-1 animate-fade-in">
                                                    <Check className="w-4 h-4" /> Saved!
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleSave(cat.id)}
                                                disabled={isSaving || savingSection === cat.id}
                                                className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                {savingSection === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cover Image Upload */}
                                    {cat.id === 'basic' && (
                                        <div className="mb-8 relative group rounded-xl overflow-hidden border border-white/10 bg-neutral-900 h-48 md:h-64">
                                            {/* Preview */}
                                            {formData.cover_image_url ? (
                                                <img src={formData.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-2" />
                                                        <p className="text-neutral-500 font-medium">No Cover Image</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions Overlay */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                {/* Manual Upload */}
                                                <label className="bg-white text-black px-5 py-2.5 rounded-full font-bold cursor-pointer hover:bg-neutral-200 transition-colors flex items-center gap-2">
                                                    <Wrench className="w-4 h-4" />
                                                    Upload
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleFileSelect(e, 'cover_image_url')}
                                                    />
                                                </label>

                                            </div>
                                        </div>
                                    )}

                                    {/* Avatar Upload */}
                                    {cat.id === 'basic' && (
                                        <div className="mb-8 p-6 bg-black/20 rounded-xl border border-dashed border-white/10 flex items-center gap-6">
                                            <div className="relative group">
                                                <div className="w-24 h-24 rounded-full bg-neutral-800 overflow-hidden border-2 border-white/10 flex items-center justify-center">
                                                    {formData.avatar_url ? (
                                                        <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon className="w-10 h-10 text-neutral-500" />
                                                    )}
                                                </div>
                                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity rounded-full">
                                                    <span className="text-xs font-bold text-white">Change</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleFileSelect(e, 'avatar_url')}
                                                    />
                                                </label>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-neutral-200">Profile Photo</h3>
                                                <p className="text-sm text-neutral-500 max-w-sm">
                                                    This image will be shown on your public profile and used as the preview image when you share your link.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {cat.fields.map(field => (
                                            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                                                    {field.label}
                                                </label>

                                                {field.type === 'textarea' ? (
                                                    <textarea
                                                        value={formData[field.key] || ''}
                                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                                        className="w-full bg-neutral-950 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none resize-none min-h-[100px]"
                                                        placeholder={field.placeholder}
                                                    />
                                                ) : field.type === 'select' ? (
                                                    <div className="relative">
                                                        <select
                                                            value={formData[field.key] || ''}
                                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                                            className="w-full bg-neutral-950 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none appearance-none"
                                                        >
                                                            <option value="">Select...</option>
                                                            {field.options?.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                                                    </div>
                                                ) : field.type === 'checkbox' ? (
                                                    <label className="flex items-center gap-3 p-3 bg-neutral-950 border border-white/10 rounded cursor-pointer hover:border-white/20">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData[field.key] === true}
                                                            onChange={(e) => handleChange(field.key, e.target.checked)}
                                                            className="w-5 h-5 rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-neutral-300">{field.placeholder || "Yes"}</span>
                                                    </label>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={formData[field.key] || ''}
                                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                                        className="w-full bg-neutral-950 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none"
                                                        placeholder={field.placeholder}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))
                    )
                    }
                </div >
            </div >
            {/* Cropper Modal */}
            {cropImageSrc && cropConfig && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    aspectRatio={cropConfig.aspect}
                    circularCrop={cropConfig.circular}
                    onCropComplete={handleCropComplete}
                    onCancel={() => {
                        setCropImageSrc(null);
                        setCropConfig(null);
                    }}
                />
            )}
        </div>
    );
}
