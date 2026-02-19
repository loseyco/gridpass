
import { AgencyPlacement } from "@/types/agency";
import { CheckCircle, Clock, DollarSign, Briefcase, User } from "lucide-react";

interface PlacementCardProps {
    placement: AgencyPlacement;
}

export function PlacementCard({ placement }: PlacementCardProps) {
    const statusColor = {
        pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
        applied: "text-blue-300 bg-blue-300/10 border-blue-300/20",
        interviewing: "text-purple-400 bg-purple-400/10 border-purple-400/20",
        offered: "text-orange-400 bg-orange-400/10 border-orange-400/20",
        hired: "text-green-400 bg-green-400/10 border-green-400/20",
        invoiced: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        rejected: "text-red-400 bg-red-400/10 border-red-400/20",
    }[placement.status] || "text-neutral-400 bg-neutral-400/10 border-neutral-400/20";

    return (
        <div className="flex flex-col rounded-xl bg-white/5 p-4 border border-white/10 hover:border-green-500/50 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-white/5">
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{placement.job?.title || "Unknown Job"}</h3>
                        <p className="text-xs text-neutral-400">{placement.job?.company_name || "Unknown Company"}</p>
                    </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${statusColor}`}>
                    {placement.status}
                </div>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-neutral-500" />
                    <span className="text-sm text-neutral-300 font-medium">
                        {placement.candidate?.name || "Unknown Candidate"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-green-500" />
                    <span className="text-sm text-green-400 font-bold">
                        {placement.fee_amount.toLocaleString()} {placement.currency}
                    </span>
                    <span className="text-xs text-neutral-500 ml-auto">Fee</span>
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-white/10">
                <span className="flex items-center gap-1">
                    <Clock size={12} /> {new Date(placement.created_at).toLocaleDateString()}
                </span>
                {placement.notes && (
                    <span className="italic truncate max-w-[150px]">{placement.notes}</span>
                )}
            </div>
        </div>
    );
}
