
import { AgencyGig } from "@/types/agency";
import { Calendar, MapPin, DollarSign, AlertCircle } from "lucide-react";

interface GigCardProps {
    gig: AgencyGig;
}

export function GigCard({ gig }: GigCardProps) {
    const isUrgent = gig.is_urgent;

    return (
        <div className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all hover:shadow-lg ${isUrgent
                ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}>
            {isUrgent && (
                <div className="absolute -top-3 -right-3 flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-red-500/20 animate-pulse">
                    <AlertCircle className="h-3 w-3" />
                    URGENT
                </div>
            )}

            <div>
                <div className="mb-2 flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {gig.title}
                        </h3>
                        <p className="text-sm text-neutral-400">{gig.role}</p>
                    </div>
                </div>

                <div className="mb-4 space-y-2 text-sm text-neutral-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neutral-500" />
                        <span>{new Date(gig.start_date).toLocaleDateString()} - {new Date(gig.end_date).toLocaleDateString()}</span>
                    </div>
                    {gig.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-neutral-500" />
                            <span>{gig.location}</span>
                        </div>
                    )}
                    {gig.daily_rate && (
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-neutral-500" />
                            <span>{gig.currency} {gig.daily_rate}/day</span>
                        </div>
                    )}
                </div>

                {gig.requirements && gig.requirements.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1">
                        {gig.requirements.map((req, i) => (
                            <span key={i} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-neutral-400 border border-white/5">
                                {req}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-2 flex gap-2">
                <button className="flex-1 rounded-lg bg-white/10 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">
                    Find Crew
                </button>
            </div>
        </div>
    );
}
