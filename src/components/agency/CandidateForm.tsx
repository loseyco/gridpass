
import { useState } from "react";
import { AgencyCandidate } from "@/types/agency";
import { X, Save, Plus, Trash } from "lucide-react";

interface CandidateFormProps {
    candidate?: AgencyCandidate | null;
    onSave: (data: Partial<AgencyCandidate>) => Promise<void>;
    onCancel: () => void;
}

export function CandidateForm({ candidate, onSave, onCancel }: CandidateFormProps) {
    const [formData, setFormData] = useState<Partial<AgencyCandidate>>(candidate || {
        status: 'new',
        skills: [],
        social_links: {},
        logistics_info: {},
        physical_info: {},
        relocation_prefs: { willing: false, locations: [] }
    });

    const [loading, setLoading] = useState(false);
    const [newSkill, setNewSkill] = useState("");

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (parent: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...(prev as any)[parent],
                [field]: value
            }
        }));
    };

    const addSkill = () => {
        if (newSkill.trim()) {
            setFormData(prev => ({
                ...prev,
                skills: [...(prev.skills || []), newSkill.trim()]
            }));
            setNewSkill("");
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills?.filter(s => s !== skillToRemove)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
            <div className="w-full max-w-4xl bg-neutral-900 rounded-xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-neutral-900 z-10 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white">
                        {candidate ? 'Edit Candidate' : 'Add New Candidate'}
                    </h2>
                    <button onClick={onCancel} className="text-neutral-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h3 className="text-lg font-semibold text-blue-400 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Full Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Role / Job Title</label>
                                <input
                                    type="text"
                                    value={formData.role || ''}
                                    onChange={e => handleChange('role', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.contact_info?.email || ''}
                                    onChange={e => handleNestedChange('contact_info', 'email', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.contact_info?.phone || ''}
                                    onChange={e => handleNestedChange('contact_info', 'phone', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Recruitment Data */}
                    <section>
                        <h3 className="text-lg font-semibold text-purple-400 mb-4">Recruitment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={formData.date_of_birth || ''}
                                    onChange={e => handleChange('date_of_birth', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Availability</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Immediate, 2 weeks notice"
                                    value={formData.availability || ''}
                                    onChange={e => handleChange('availability', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Desired Salary</label>
                                <input
                                    type="text"
                                    value={formData.desired_salary || ''}
                                    onChange={e => handleChange('desired_salary', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Resume URL</label>
                                <input
                                    type="url"
                                    value={formData.resume_url || ''}
                                    onChange={e => handleChange('resume_url', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="flex items-center gap-2 text-white cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.relocation_prefs?.willing || false}
                                    onChange={e => handleNestedChange('relocation_prefs', 'willing', e.target.checked)}
                                    className="rounded border-white/10 bg-white/5 text-purple-500"
                                />
                                Willing to Relocate?
                            </label>
                        </div>
                    </section>

                    {/* Logistics & Gear */}
                    <section>
                        <h3 className="text-lg font-semibold text-green-400 mb-4">Logistics & Gear</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Hometown</label>
                                <input
                                    type="text"
                                    value={formData.logistics_info?.hometown || ''}
                                    onChange={e => handleNestedChange('logistics_info', 'hometown', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Home Airport</label>
                                <input
                                    type="text"
                                    value={formData.logistics_info?.home_airport || ''}
                                    onChange={e => handleNestedChange('logistics_info', 'home_airport', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Helmet Size</label>
                                <input
                                    type="text"
                                    value={formData.physical_info?.helmet_size || ''}
                                    onChange={e => handleNestedChange('physical_info', 'helmet_size', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-neutral-500">
                            Other gear sizes (Suit, Shoe, Glove) can be added here in future updates.
                        </div>
                    </section>

                    {/* Socials */}
                    <section>
                        <h3 className="text-lg font-semibold text-pink-400 mb-4">Social Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">LinkedIn URL</label>
                                <input
                                    type="url"
                                    value={formData.linkedin_url || ''}
                                    onChange={e => handleChange('linkedin_url', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-pink-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Instagram URL</label>
                                <input
                                    type="url"
                                    value={formData.social_links?.instagram || ''}
                                    onChange={e => handleNestedChange('social_links', 'instagram', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-pink-500 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Skills */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newSkill}
                                onChange={e => setNewSkill(e.target.value)}
                                placeholder="Add skill..."
                                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-white outline-none"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                            />
                            <button type="button" onClick={addSkill} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded">
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.skills?.map(skill => (
                                <span key={skill} className="bg-white/10 px-2 py-1 rounded text-sm flex items-center gap-1">
                                    {skill}
                                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </section>

                </form>

                <div className="p-6 border-t border-white/10 bg-neutral-900 sticky bottom-0 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded text-neutral-400 hover:text-white hover:bg-white/5 transition">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Candidate'}
                    </button>
                </div>
            </div>
        </div>
    );
}

