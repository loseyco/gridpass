'use client';

import { useState } from 'react';
import {
    Trophy, Wrench, Briefcase, User, MapPin,
    FileText, Zap, Shield, Globe, Award
} from 'lucide-react';

type FieldCategory = {
    id: string;
    title: string;
    icon: any;
    description: string;
    fields: { key: string; label: string; type: string; placeholder?: string }[];
};

const SCHEMA_CATEGORIES: FieldCategory[] = [
    {
        id: 'driver',
        title: 'Racing Driver',
        icon: Trophy,
        description: 'Fields for active drivers tracking their career.',
        fields: [
            { key: 'iracing_id', label: 'iRacing Customer ID', type: 'number', placeholder: '123456' },
            { key: 'license_class', label: 'License Class', type: 'select', placeholder: 'A, B, C, D, Pro' },
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
        fields: [
            { key: 'ase_certs', label: 'ASE Certifications', type: 'multiselect', placeholder: 'A1, A2, L1...' },
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
        fields: [
            { key: 'helmet_size', label: 'Helmet Size', type: 'select', placeholder: 'S, M, L, XL' },
            { key: 'suit_size', label: 'Suit Size', type: 'text', placeholder: '52 Euro / 42 US' },
            { key: 'shoe_size', label: 'Shoe Size', type: 'number', placeholder: '10.5' },
            { key: 'glove_size', label: 'Glove Size', type: 'select', placeholder: 'M, L, XL' },
            { key: 'blood_type', label: 'Blood Type', type: 'text', placeholder: 'O+' },
            { key: 'allergies', label: 'Medical Allergies', type: 'text', placeholder: 'Latex, Penicillin' }
        ]
    },
    {
        id: 'logistics',
        title: 'Logistics',
        icon: Briefcase,
        description: 'Travel and employment eligibility.',
        fields: [
            { key: 'home_airport', label: 'Home Airport Code', type: 'text', placeholder: 'AUS' },
            { key: 'passport_status', label: 'Passport Valid?', type: 'checkbox' },
            { key: 'drivers_license_state', label: 'DL State', type: 'text', placeholder: 'TX' },
            { key: 'languages', label: 'Languages Spoken', type: 'text', placeholder: 'English, Spanish' }
        ]
    }
];

export default function SchemaResearchPage() {
    const [activeTab, setActiveTab] = useState<string>('driver');

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-24">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <FileText className="w-8 h-8 text-indigo-500" />
                    Profile Schema Research
                </h1>
                <p className="text-neutral-400 mt-2">
                    Review and test potential profile fields to standardize the GridPass identity.
                    Select a category to explore its proposed schema.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {SCHEMA_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === cat.id
                                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20'
                                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                }`}
                        >
                            <cat.icon className={`w-5 h-5 ${activeTab === cat.id ? 'text-white' : 'text-neutral-500'}`} />
                            {cat.title}
                        </button>
                    ))}

                    <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-2">
                            <Zap className="w-4 h-4" />
                            Research Mode
                        </div>
                        <p className="text-xs text-amber-200/60 leading-relaxed">
                            These fields are not yet active in the database. Use this view to audit what we should capture.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3">
                    {SCHEMA_CATEGORIES.map(cat => cat.id === activeTab && (
                        <div key={cat.id} className="bg-neutral-900 border border-white/5 rounded-2xl p-8 animate-fade-in">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        {cat.title}
                                        <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded border border-white/5 font-mono">
                                            sys.schema.{cat.id}
                                        </span>
                                    </h2>
                                    <p className="text-neutral-400 mt-1">{cat.description}</p>
                                </div>
                                <div className="p-3 bg-neutral-800 rounded-lg">
                                    <cat.icon className="w-6 h-6 text-neutral-300" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cat.fields.map((field) => (
                                    <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 flex justify-between">
                                            {field.label}
                                            <span className="text-[10px] text-neutral-700 font-mono">{field.key}</span>
                                        </label>

                                        {field.type === 'textarea' ? (
                                            <textarea
                                                className="w-full bg-neutral-950 border border-white/10 p-4 rounded-lg focus:border-indigo-500 outline-none min-h-[100px]"
                                                placeholder={field.placeholder || "Enter details..."}
                                            />
                                        ) : field.type === 'checkbox' ? (
                                            <div className="flex items-center gap-3 p-4 bg-neutral-950 border border-white/10 rounded-lg">
                                                <input type="checkbox" className="w-5 h-5 rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-neutral-300">Yes, verified</span>
                                            </div>
                                        ) : field.type === 'select' ? (
                                            <div className="relative">
                                                <select className="w-full bg-neutral-950 border border-white/10 p-4 rounded-lg focus:border-indigo-500 outline-none appearance-none text-neutral-400">
                                                    <option>Select Option...</option>
                                                    <option>Option A</option>
                                                    <option>Option B</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                                    ▼
                                                </div>
                                            </div>
                                        ) : (
                                            <input
                                                type={field.type}
                                                className="w-full bg-neutral-950 border border-white/10 p-4 rounded-lg focus:border-indigo-500 outline-none"
                                                placeholder={field.placeholder}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
