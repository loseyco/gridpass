
import { useState, useEffect } from "react";
import { AgencyCandidate, AgencyJob } from "@/types/agency";
import { X, Check, DollarSign } from "lucide-react";

interface PlacementModalProps {
    candidate: AgencyCandidate;
    jobs: AgencyJob[];
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
}

export function PlacementModal({ candidate, jobs, onClose, onSave }: PlacementModalProps) {
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [feeAmount, setFeeAmount] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    // Auto-calculate fee when job is selected
    useEffect(() => {
        if (selectedJobId) {
            const job = jobs.find(j => j.id === selectedJobId);
            if (job && job.commission_config) {
                // Simple logic: if fixed, use value. If percentage, we need salary.
                // For now, let's just default to a placeholder calculation or manual entry
                if (job.commission_config.type === 'fixed') {
                    setFeeAmount(job.commission_config.value.toString());
                } else {
                    // Try to parse salary range? Too complex for MVP.
                    // Just leave it blank or hint percentage.
                    setFeeAmount("");
                }
            }
        }
    }, [selectedJobId, jobs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                job_id: selectedJobId,
                lead_id: candidate.id,
                fee_amount: parseFloat(feeAmount) || 0,
                currency: 'USD',
                notes,
                status: 'pending'
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const selectedJob = jobs.find(j => j.id === selectedJobId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-neutral-900 rounded-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Create Placement</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Candidate</label>
                        <div className="p-3 bg-white/5 rounded border border-white/10 text-white font-medium">
                            {candidate.name}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Select Job *</label>
                        <select
                            required
                            value={selectedJobId}
                            onChange={e => setSelectedJobId(e.target.value)}
                            className="w-full bg-neutral-800 border border-white/10 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                        >
                            <option value="">-- Choose a Job --</option>
                            {jobs.filter(j => j.status === 'open').map(job => (
                                <option key={job.id} value={job.id}>
                                    {job.title} {job.company_name ? `at ${job.company_name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Placement Fee ($)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 text-neutral-500" size={16} />
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={feeAmount}
                                onChange={e => setFeeAmount(e.target.value)}
                                className="w-full bg-neutral-800 border border-white/10 rounded pl-9 pr-3 py-2 text-white focus:border-green-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        {selectedJob?.commission_config && (
                            <p className="text-xs text-neutral-500 mt-1">
                                Commission: {selectedJob.commission_config.value}
                                {selectedJob.commission_config.type === 'percentage' ? '%' : ' Fixed'}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">Notes</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-neutral-800 border border-white/10 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                            placeholder="Placement details..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded text-neutral-400 hover:text-white hover:bg-white/5 transition">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedJobId}
                            className="px-6 py-2 rounded bg-green-600 hover:bg-green-500 text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Confirm Placement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
