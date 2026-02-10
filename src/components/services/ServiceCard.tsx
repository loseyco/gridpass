import Link from "next/link";
import { Service } from "@/types/services";
import { formatCurrency } from "@/utils/format";
import { BadgeCheck, Clock, MapPin } from "lucide-react";

interface ServiceCardProps {
    service: Service & {
        profiles?: {
            username: string;
            full_name: string;
            avatar_url: string | null;
        } | null;
    };
    showOwner?: boolean;
}

export function ServiceCard({ service, showOwner = true }: ServiceCardProps) {
    return (
        <Link
            href={`/u/${service.profiles?.username || 'user'}/services/${service.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/5 p-4 transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/10 border border-white/10 hover:border-purple-500/50"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />

            {/* Image / Cover */}
            <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-neutral-900">
                {service.photo_url ? (
                    <img
                        src={service.photo_url}
                        alt={service.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-700">
                        <span className="text-sm font-medium">No Image</span>
                    </div>
                )}
                <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10">
                    {service.category || "General"}
                </div>
            </div>

            {/* Content */}
            <div className="relative flex flex-1 flex-col z-10">
                <h3 className="mb-1 text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {service.title}
                </h3>

                {showOwner && service.profiles && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-neutral-400">
                        {service.profiles.avatar_url ? (
                            <img
                                src={service.profiles.avatar_url}
                                alt={service.profiles.username}
                                className="h-5 w-5 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-neutral-800" />
                        )}
                        <span className="hover:text-white transition-colors">
                            @{service.profiles.username}
                        </span>
                        {/* Logic for verified badge could go here */}
                    </div>
                )}

                <p className="mb-4 line-clamp-2 text-sm text-neutral-400">
                    {service.description || "No description provided."}
                </p>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex flex-wrap gap-1">
                        {service.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-400">
                                {tag}
                            </span>
                        ))}
                        {(service.tags?.length || 0) > 2 && (
                            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-neutral-500">
                                +{service.tags!.length - 2}
                            </span>
                        )}
                    </div>

                    <div className="text-lg font-bold text-white">
                        {service.price !== null ? (
                            <>
                                {service.currency === 'USD' ? '$' : service.currency}
                                {service.price}
                            </>
                        ) : (
                            <span className="text-xs uppercase text-green-400">Contact for Price</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
