import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-black text-white px-4 py-4 pb-32">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Hero Skeleton */}
                    <Skeleton className="lg:col-span-8 h-[500px] rounded-3xl" />

                    {/* Sidebar Skeleton */}
                    <div className="lg:col-span-4 space-y-6">
                        <Skeleton className="h-64 rounded-2xl" />
                        <Skeleton className="h-64 rounded-2xl" />
                    </div>

                    {/* Grid Skeletons */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-48 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
