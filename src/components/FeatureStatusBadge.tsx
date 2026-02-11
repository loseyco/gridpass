import { cn } from "@/lib/utils";

type StatusType = 'alpha' | 'beta' | 'v1' | 'v2' | 'new' | 'stable';

interface FeatureStatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusConfig = {
    alpha: { label: 'Alpha', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', description: 'Early access. Expect bugs and changes.' },
    beta: { label: 'Beta', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', description: 'Public testing. Mostly stable but improving.' },
    v1: { label: 'v1.0', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', description: 'First stable release.' },
    v2: { label: 'v2.0', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', description: 'Major update with new features.' },
    new: { label: 'New', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', description: 'Recently released feature.' },
    stable: { label: 'Stable', color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20', description: 'Fully tested and reliable.' },
};

export default function FeatureStatusBadge({ status, className }: FeatureStatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <div className={cn("inline-flex items-center gap-1.5 group relative cursor-help", className)}>
            <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors",
                config.color
            )}>
                {config.label}
            </span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-50">
                <div className="font-semibold text-white mb-0.5">{config.label} Release</div>
                {config.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900" />
            </div>
        </div>
    );
}
