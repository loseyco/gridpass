import { Metadata } from 'next';
import { getServices } from '@/app/actions/services';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceFilter } from '@/components/services/ServiceFilter';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Services | GridPass',
    description: 'Find racing drivers, mechanics, engineers, and more for your team.',
};

export default async function ServicesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const search = typeof params.search === 'string' ? params.search : undefined;
    const category = typeof params.category === 'string' ? params.category : undefined;

    const services = await getServices({ search, category });

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-4">Marketplace</h1>
                        <p className="text-neutral-400 max-w-2xl">
                            Discover top-tier talent and services for your racing program. From driver coaching to race engineering, find the support you need.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/services"
                        className="hidden md:flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        List Your Service
                    </Link>
                </div>

                <ServiceFilter />

                {services.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-900 rounded-2xl border border-white/5">
                        <h3 className="text-xl font-bold mb-2">No services found</h3>
                        <p className="text-neutral-400 mb-6">Try adjusting your filters or search terms.</p>
                        <Link
                            href="/dashboard/services"
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            List a Service
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {services.map(service => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
