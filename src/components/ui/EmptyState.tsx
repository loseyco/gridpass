import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/utils/cn'; // Assuming you have a cn utility, if not I will use template literals

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionLink?: string;
    className?: string;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionLink, className }: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center bg-neutral-900/50 border border-white/5 rounded-xl border-dashed ${className}`}>
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-neutral-400 max-w-sm mb-6">{description}</p>
            {actionLabel && actionLink && (
                <Link
                    href={actionLink}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
