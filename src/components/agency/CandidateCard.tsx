
import { AgencyCandidate } from "@/types/agency";
import { User, MapPin, Link as LinkIcon, FileText } from "lucide-react";

interface CandidateCardProps {
    candidate: AgencyCandidate;
    onManage?: (candidate: AgencyCandidate) => void;
    onView?: () => void;
    onAddPlacement?: (candidate: AgencyCandidate) => void;
}

export function CandidateCard({ candidate, onManage, onView, onAddPlacement }: CandidateCardProps) {
    return (
        <div
            onClick={onView}
            className="group relative flex flex-col rounded-xl bg-white/5 p-4 border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer"
        >
            <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800">
                    {candidate.contact_info?.avatar_url ? (
                        <img src={candidate.contact_info.avatar_url} alt={candidate.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-600">
                            <User className="h-5 w-5" />
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 flex items-center gap-2">
                        {candidate.name}
                        {candidate.source_type === 'profile' && (
                            <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.5 rounded-full border border-purple-500/30">
                                PRO
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-neutral-400">{candidate.role || "Candidate"}</p>
                </div>
                <div className={`ml-auto px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${candidate.status === 'approved' ? 'bg-blue-500/10 text-blue-400' :
                    candidate.status === 'new' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-neutral-500/10 text-neutral-400'
                    }`}>
                    {candidate.status}
                </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-1">
                {candidate.skills?.slice(0, 3).map(skill => (
                    <span key={skill} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-neutral-400 border border-white/5">
                        {skill}
                    </span>
                ))}
            </div>

            <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-3">
                {candidate.resume_url && (
                    <a href={candidate.resume_url} target="_blank" className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white">
                        <FileText className="h-3 w-3" /> Resume
                    </a>
                )}
                {candidate.linkedin_url && (
                    <a href={candidate.linkedin_url} target="_blank" className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white">
                        <LinkIcon className="h-3 w-3" /> LinkedIn
                    </a>
                )}
                {candidate.source_type === 'profile' && candidate.source_link && (
                    <a href={candidate.source_link} target="_blank" className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300">
                        <User className="h-3 w-3" /> View Profile
                    </a>
                )}

                {onAddPlacement && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddPlacement(candidate); }}
                        className="ml-auto mr-2 text-xs text-green-400 hover:text-green-300"
                    >
                        + Add to Job
                    </button>
                )}
                {onManage && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onManage(candidate); }}
                        className="text-xs text-white hover:text-blue-400"
                    >
                        Manage
                    </button>
                )}
            </div>
        </div>
    );
}
