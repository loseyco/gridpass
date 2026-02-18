
import { AgencyJob } from "@/types/agency";
import { formatCurrency } from "@/utils/format";
import { Briefcase, Building, DollarSign, MapPin } from "lucide-react";

interface JobCardProps {
    job: AgencyJob;
    onEdit?: (job: AgencyJob) => void;
}

export function JobCard({ job, onEdit }: JobCardProps) {
    const commission = job.commission_config || { type: 'percentage', value: 0 };

    return (
        <div className="group relative flex flex-col rounded-xl bg-white/5 p-4 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="mb-2 flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-white group-hover:text-purple-400">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Building className="h-3 w-3" />
                        <span>{job.company_name || "Confidential"}</span>
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${job.status === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-neutral-500/10 text-neutral-400'
                    }`}>
                    {job.status}
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-3 text-xs text-neutral-300">
                {job.location && (
                    <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-neutral-500" />
                        {job.location}
                    </div>
                )}
                {job.salary_range && (
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-neutral-500" />
                        {job.salary_range}
                    </div>
                )}
            </div>

            <div className="mt-auto border-t border-white/10 pt-3 flex items-center justify-between">
                <div className="text-xs text-neutral-500">
                    Est. Comm: <span className="text-purple-400 font-mono">
                        {commission.type === 'percentage' ? `${commission.value}%` : `$${commission.value}`}
                    </span>
                </div>
                {onEdit && (
                    <button
                        onClick={() => onEdit(job)}
                        className="text-xs text-white hover:text-purple-400"
                    >
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
}
