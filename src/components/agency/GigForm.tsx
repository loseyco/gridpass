
import { useState } from "react";
import { AgencyGig } from "@/types/agency";
import { X, Calendar, DollarSign, MapPin, AlertCircle } from "lucide-react";

interface GigFormProps {
    onSave: (data: Partial<AgencyGig>) => void;
    onCancel: () => void;
}

export function GigForm({ onSave, onCancel }: GigFormProps) {
    const [formData, setFormData] = useState<Partial<AgencyGig>>({
        title: "",
        role: "Suspension Mechanic",
        start_date: "",
        end_date: "",
        daily_rate: 0,
        currency: "USD",
        location: "",
        is_urgent: false,
        requirements: []
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="bg-neutral-900 w-full max-w-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden relative mx-auto mt-20">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
                <h2 className="text-lg font-bold text-white">Post Urgent Need</h2>
                <button onClick={onCancel} className="text-neutral-400 hover:text-white">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Gig Title</label>
                    <input
                        type="text"
                        required
                        className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                        placeholder="e.g. Daytona 500 Tire Specialist"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Role</label>
                        <select
                            className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option>Suspension Mechanic</option>
                            <option>Tire Specialist</option>
                            <option>Interior Mechanic</option>
                            <option>Fabricator</option>
                            <option>Truck Driver</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                            <input
                                type="text"
                                className="w-full rounded-lg bg-black/50 border border-white/10 pl-9 pr-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                placeholder="Track/Shop"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Start Date</label>
                        <input
                            type="date"
                            required
                            className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">End Date</label>
                        <input
                            type="date"
                            required
                            className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1">Daily Rate</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                            <input
                                type="number"
                                className="w-full rounded-lg bg-black/50 border border-white/10 pl-9 pr-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                placeholder="0"
                                value={formData.daily_rate}
                                onChange={e => setFormData({ ...formData, daily_rate: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-white/10 bg-black/50 text-red-500 focus:ring-red-500"
                                checked={formData.is_urgent}
                                onChange={e => setFormData({ ...formData, is_urgent: e.target.checked })}
                            />
                            <span className="text-sm font-medium text-red-400">Mark as Urgent</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-lg bg-red-500 px-6 py-2 text-sm font-medium text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                    >
                        Post Gig
                    </button>
                </div>
            </form>
        </div>
    );
}
