'use client';

import { useState } from 'react';
import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronRight, Edit2, Save, X } from 'lucide-react';

interface Field {
    key: string;
    label: string;
    value: any;
    required?: boolean;
    type?: 'text' | 'textarea' | 'select' | 'tags';
    options?: string[];
}

interface FieldCategory {
    name: string;
    fields: Field[];
}

interface ResumeFieldChecklistProps {
    leadId: string;
    leadData: any;
}

export default function ResumeFieldChecklist({ leadId, leadData }: ResumeFieldChecklistProps) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<any>('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Essential', 'Professional']));

    // Define all field categories
    const categories: FieldCategory[] = [
        {
            name: 'Essential',
            fields: [
                { key: 'name', label: 'Full Name', value: leadData.name, required: true },
                { key: 'email', label: 'Email', value: leadData.email, required: true },
                { key: 'phone', label: 'Phone', value: leadData.phone, required: true },
                { key: 'metadata.dob', label: 'Date of Birth', value: leadData.metadata?.dob },
                { key: 'metadata.nationality', label: 'Nationality', value: leadData.metadata?.nationality },
            ]
        },
        {
            name: 'Professional',
            fields: [
                { key: 'job_title', label: 'Current Role', value: leadData.job_title, required: true },
                { key: 'bio', label: 'Professional Bio', value: leadData.bio, type: 'textarea', required: true },
                { key: 'metadata.skills', label: 'Skills', value: leadData.metadata?.skills, type: 'tags' },
                { key: 'experience_years', label: 'Experience (years)', value: leadData.experience_years },
            ]
        },
        {
            name: 'Logistics',
            fields: [
                { key: 'metadata.home_airport', label: 'Home Airport', value: leadData.metadata?.home_airport },
                { key: 'metadata.passport_valid', label: 'Valid Passport', value: leadData.metadata?.passport_valid, type: 'select', options: ['Yes', 'No'] },
                { key: 'metadata.helmet_size', label: 'Helmet Size', value: leadData.metadata?.helmet_size, type: 'select', options: ['XS', 'S', 'M', 'L', 'XL'] },
                { key: 'metadata.salary_expectations', label: 'Salary/Rate', value: leadData.metadata?.salary_expectations },
                { key: 'metadata.availability', label: 'Availability', value: leadData.metadata?.availability, type: 'select', options: ['Immediate', 'Within 2 weeks', 'Within 1 month', 'Flexible'] },
            ]
        },
        {
            name: 'Files & Links',
            fields: [
                { key: 'resume_url', label: 'Resume PDF', value: leadData.resume_url, required: true },
                { key: 'linkedin_url', label: 'LinkedIn', value: leadData.linkedin_url },
                { key: 'portfolio_url', label: 'Portfolio', value: leadData.portfolio_url },
                { key: 'indeed_url', label: 'Indeed', value: leadData.indeed_url },
            ]
        }
    ];

    // Calculate completion stats
    const totalFields = categories.reduce((acc, cat) => acc + cat.fields.length, 0);
    const completedFields = categories.reduce((acc, cat) => {
        return acc + cat.fields.filter(f => {
            if (Array.isArray(f.value)) return f.value.length > 0;
            return f.value !== null && f.value !== undefined && f.value !== '';
        }).length;
    }, 0);
    const progress = Math.round((completedFields / totalFields) * 100);

    const getCategoryStatus = (category: FieldCategory) => {
        const total = category.fields.length;
        const completed = category.fields.filter(f => {
            if (Array.isArray(f.value)) return f.value.length > 0;
            return f.value !== null && f.value !== undefined && f.value !== '';
        }).length;

        if (completed === total) return 'complete';
        if (completed > 0) return 'partial';
        return 'empty';
    };

    const getFieldStatus = (field: Field) => {
        if (Array.isArray(field.value)) return field.value.length > 0;
        return field.value !== null && field.value !== undefined && field.value !== '';
    };

    const toggleCategory = (categoryName: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryName)) {
            newExpanded.delete(categoryName);
        } else {
            newExpanded.add(categoryName);
        }
        setExpandedCategories(newExpanded);
    };

    const startEditing = (field: Field) => {
        setEditingField(field.key);
        setEditValue(field.value || '');
    };

    const cancelEditing = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveField = async (fieldKey: string) => {
        try {
            const response = await fetch('/api/admin/update-resume-field', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, fieldKey, value: editValue }),
            });

            const result = await response.json();

            if (result.success) {
                setEditingField(null);
                // Refresh page to show updated data
                window.location.reload();
            } else {
                alert('Failed to save: ' + result.error);
            }
        } catch (error) {
            console.error('Failed to save field:', error);
            alert('Failed to save. Please try again.');
        }
    };

    return (
        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
            {/* Progress Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">Field Completion</h3>
                    <span className="text-sm text-neutral-400">{completedFields}/{totalFields}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-neutral-500 mt-1">{progress}% Complete</p>
            </div>

            {/* Categories */}
            <div className="space-y-3">
                {categories.map(category => {
                    const status = getCategoryStatus(category);
                    const isExpanded = expandedCategories.has(category.name);

                    return (
                        <div key={category.name} className="border border-white/5 rounded-lg overflow-hidden">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category.name)}
                                className="w-full flex items-center justify-between p-3 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    <span className="font-bold text-sm">{category.name}</span>
                                    {status === 'complete' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                    {status === 'partial' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                                    {status === 'empty' && <Circle className="w-4 h-4 text-neutral-600" />}
                                </div>
                                <span className="text-xs text-neutral-500">
                                    {category.fields.filter(f => getFieldStatus(f)).length}/{category.fields.length}
                                </span>
                            </button>

                            {/* Category Fields */}
                            {isExpanded && (
                                <div className="p-3 space-y-2 bg-black/20">
                                    {category.fields.map(field => {
                                        const isComplete = getFieldStatus(field);
                                        const isEditing = editingField === field.key;

                                        return (
                                            <div
                                                key={field.key}
                                                className="flex items-start gap-2 p-2 rounded hover:bg-white/5 transition-colors"
                                            >
                                                {/* Status Icon */}
                                                <div className="mt-0.5">
                                                    {isComplete ? (
                                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-neutral-600" />
                                                    )}
                                                </div>

                                                {/* Field Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <label className="text-xs text-neutral-400 uppercase tracking-wide">
                                                            {field.label}
                                                            {field.required && <span className="text-red-400 ml-1">*</span>}
                                                        </label>
                                                        {!isEditing && (
                                                            <button
                                                                onClick={() => startEditing(field)}
                                                                className="text-neutral-500 hover:text-white transition-colors"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {isEditing ? (
                                                        <div className="space-y-2">
                                                            {field.type === 'textarea' ? (
                                                                <textarea
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="w-full bg-neutral-800 border border-white/10 rounded p-2 text-sm text-white"
                                                                    rows={3}
                                                                />
                                                            ) : field.type === 'select' ? (
                                                                <select
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="w-full bg-neutral-800 border border-white/10 rounded p-2 text-sm text-white"
                                                                >
                                                                    <option value="">Select...</option>
                                                                    {field.options?.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            ) : field.type === 'tags' ? (
                                                                <input
                                                                    type="text"
                                                                    value={Array.isArray(editValue) ? editValue.join(', ') : editValue}
                                                                    onChange={(e) => setEditValue(e.target.value.split(',').map(s => s.trim()))}
                                                                    placeholder="Comma separated..."
                                                                    className="w-full bg-neutral-800 border border-white/10 rounded p-2 text-sm text-white"
                                                                />
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    className="w-full bg-neutral-800 border border-white/10 rounded p-2 text-sm text-white"
                                                                />
                                                            )}
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => saveField(field.key)}
                                                                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold"
                                                                >
                                                                    <Save className="w-3 h-3" />
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditing}
                                                                    className="flex items-center gap-1 bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded text-xs"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className={`text-sm ${isComplete ? 'text-white' : 'text-neutral-600 italic'}`}>
                                                            {Array.isArray(field.value)
                                                                ? field.value.join(', ') || 'Not provided'
                                                                : field.value || 'Not provided'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
