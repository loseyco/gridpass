'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Save, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import {
    Trophy, Wrench, Briefcase, User, MapPin,
    FileText, Zap, Shield, Globe, Award, Phone, AlertTriangle
} from 'lucide-react';

// --- Field Definitions (Reused from Research) ---
type FieldCategory = {
    id: string;
    title: string;
    icon: any;
    description: string;
    db_column: string; // The JSONB column in DB
    fields: { key: string; label: string; type: string; placeholder?: string, options?: string[] }[];
};

const SCHEMA_CATEGORIES: FieldCategory[] = [
    {
        id: 'basic',
        title: 'Basic Info',
        icon: User,
        description: 'Public facing identity.',
        db_column: 'basic', // Virtual column for top-level fields
        fields: [
            { key: 'username', label: 'Username', type: 'text', placeholder: 'racer123' },
            { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { key: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell us about yourself...' },
            { key: 'website', label: 'Website', type: 'url', placeholder: 'https://...' },
            { key: 'location', label: 'Location', type: 'text', placeholder: 'Austin, TX' },
        ]
    },
    {
        id: 'real_world',
        title: 'Real World Driver',
        icon: Award,
        description: 'FIA/SCCA/NASA licenses and track experience.',
        db_column: 'real_world_info',
        fields: [
            { key: 'organization', label: 'Sanctioning Body', type: 'text', placeholder: 'SCCA, NASA, FIA' },
            { key: 'license_grade', label: 'License Grade', type: 'text', placeholder: 'Full Competition, Time Trial' },
            { key: 'primary_series', label: 'Primary Series', type: 'text', placeholder: 'Spec Miata, IMSA' },
            { key: 'car_number', label: 'Car Number', type: 'text', placeholder: '#42' },
            { key: 'years_racing', label: 'Years Competed', type: 'number', placeholder: '3' },
            { key: 'home_track', label: 'Home Circuit', type: 'text', placeholder: 'Road Atlanta' },
            { key: 'achievements', label: 'Race Wins / Titles', type: 'textarea', placeholder: '2023 Regional Champion...' }
        ]
    },
    {
        id: 'driver',
        title: 'Sim Driver (iRacing)',
        icon: Trophy,
        description: 'Your iRacing stats and license info.',
        db_column: 'driver_info',
        fields: [
            { key: 'iracing_id', label: 'iRacing Customer ID', type: 'number', placeholder: '123456' },
            { key: 'license_class', label: 'License Class', type: 'select', options: ['Rookie', 'D', 'C', 'B', 'A', 'Pro', 'WC'] },
            { key: 'irating', label: 'iRating', type: 'number', placeholder: '2500' },
            { key: 'safety_rating', label: 'Safety Rating', type: 'text', placeholder: 'A 4.99' },
            { key: 'home_track', label: 'Home Track', type: 'text', placeholder: 'Circuit of the Americas' },
            { key: 'years_racing', label: 'Years Racing', type: 'number', placeholder: '5' },
            { key: 'achievements', label: 'Key Achievements', type: 'textarea', placeholder: '2024 Season Champion...' }
        ]
    },
    {
        id: 'mechanic',
        title: 'Mechanic / Crew',
        icon: Wrench,
        description: 'For shop staff, pit crew, and engineers.',
        db_column: 'mechanic_info',
        fields: [
            { key: 'specialties', label: 'Specialties', type: 'text', placeholder: 'Engine Building, Suspension, Fab' },
            { key: 'years_wrenching', label: 'Years Experience', type: 'number', placeholder: '10' },
            { key: 'own_tools', label: 'Has Own Tools?', type: 'checkbox' },
            { key: 'tool_box_size', label: 'Tool Storage Size', type: 'text', placeholder: 'Triple Bay Snap-on' },
            { key: 'willing_to_travel', label: 'Willing to Travel?', type: 'checkbox' }
        ]
    },
    {
        id: 'physical',
        title: 'Physical & Gear',
        icon: User,
        description: 'Vital stats for team gear and cockpit fitting.',
        db_column: 'physical_info',
        fields: [
            { key: 'helmet_size', label: 'Helmet Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
            { key: 'suit_size', label: 'Suit Size', type: 'text', placeholder: '52 Euro / 42 US' },
            { key: 'shoe_size', label: 'Shoe Size', type: 'number', placeholder: '10.5' },
            { key: 'glove_size', label: 'Glove Size', type: 'select', options: ['S', 'M', 'L', 'XL'] },
            { key: 'blood_type', label: 'Blood Type', type: 'text', placeholder: 'O+' },
            { key: 'allergies', label: 'Medical Allergies', type: 'text', placeholder: 'Latex, Penicillin' }
        ]
    },
    {
        id: 'logistics',
        title: 'Logistics',
        icon: Briefcase,
        description: 'Travel and employment eligibility.',
        db_column: 'logistics_info',
        fields: [
            { key: 'home_airport', label: 'Home Airport Code', type: 'text', placeholder: 'AUS' },
            { key: 'passport_status', label: 'Passport Valid?', type: 'checkbox' },
            { key: 'drivers_license_state', label: 'DL State', type: 'text', placeholder: 'TX' },
            { key: 'languages', label: 'Languages Spoken', type: 'text', placeholder: 'English, Spanish' }
        ]
    },
    {
        id: 'emergency',
        title: 'Emergency Contact',
        icon: AlertTriangle,
        description: 'Who to call in case of an incident.',
        db_column: 'emergency_contact',
        fields: [
            { key: 'name', label: 'Contact Name', type: 'text', placeholder: 'Jane Doe' },
            { key: 'relation', label: 'Relationship', type: 'text', placeholder: 'Spouse' },
            { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555-0123' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com' }
        ]
    }
];

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activeSection, setActiveSection] = useState<string>('basic');

    // Store all data in a flat state for now, but we'll map it back to JSONBs on save
    const [formData, setFormData] = useState<any>({});

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

                    // JSONB fields flattened (simple approach for now)
                    ...data.driver_info,
                    ...data.real_world_info,
                    ...data.mechanic_info,
                    ...data.physical_info,
                    ...data.logistics_info,
                    ...data.emergency_contact,
                });
            }
            setIsLoading(false);
        };
        fetchProfile();
    }, []);

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
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

                // Nested JSONB
                driver_info: extractFields('driver', formData),
                real_world_info: extractFields('real_world', formData),
                mechanic_info: extractFields('mechanic', formData),
                physical_info: extractFields('physical', formData),
                logistics_info: extractFields('logistics', formData),
                emergency_contact: extractFields('emergency', formData),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
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
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="bg-white text-black font-bold px-6 py-2 rounded hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
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
                    {SCHEMA_CATEGORIES.map(cat => (
                        // Show only active section for cleaner UI (could also do one long scroll)
                        activeSection === cat.id && (
                            <div key={cat.id} className="bg-neutral-900 border border-white/5 rounded-xl p-6 md:p-8 animate-fade-in">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            {cat.title}
                                        </h2>
                                        <p className="text-sm text-neutral-400 mt-1">{cat.description}</p>
                                    </div>
                                    <cat.icon className="w-5 h-5 text-neutral-500" />
                                </div>

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
                    ))}
                </div>
            </div>
        </div>
    );
}
