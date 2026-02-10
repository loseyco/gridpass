import { getService } from '@/app/actions/services';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Tag, Globe, Clock, CheckCircle } from 'lucide-react';
import ServiceInquiryForm from '@/components/services/ServiceInquiryForm';
import { ShareCard } from '@/components/ShareCard';

export async function generateMetadata({ params }: { params: Promise<{ username: string, serviceId: string }> }) {
    const { serviceId } = await params;
    const service = await getService(serviceId);

    if (!service) {
        return { title: 'Service Not Found' };
    }

    return {
        title: `${service.title} | ${service.profiles?.full_name || 'GridPass'}`,
        description: service.description || `Check out this service on GridPass.`,
        openGraph: {
            images: service.photo_url ? [service.photo_url] : [],
        }
    };
}

export default async function ServiceDetailsPage({ params }: { params: Promise<{ username: string, serviceId: string }> }) {
    const { username, serviceId } = await params;
    const service = await getService(serviceId);

    if (!service) {
        notFound();
    }

    // Verify username matches (optional but good for canonical URLs)
    // if (service.profiles?.username !== username) ...

    const profile = service.profiles;

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header / Nav */}
                <div className="flex justify-between items-center mb-8">
                    <Link
                        href={`/u/${username}`}
                        className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Profile
                    </Link>

                    <ShareCard
                        url={`https://gridpass.app/u/${username}/services/${serviceId}`}
                        title={service.title}
                        subtitle={`Service by @${username}`}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Image */}
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl">
                            {service.photo_url ? (
                                <Image
                                    src={service.photo_url}
                                    alt={service.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                                    <Tag className="w-16 h-16 text-neutral-700" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-full border border-white/10">
                                    {service.category || 'General'}
                                </span>
                            </div>
                        </div>

                        {/* Title & Stats */}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{service.title}</h1>

                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <div className="flex items-center gap-2 text-sm text-neutral-400">
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt={username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-500" />
                                        )}
                                    </div>
                                    <span className="font-medium text-white">@{username}</span>
                                </div>
                                <div className="h-1 w-1 rounded-full bg-neutral-700" />
                                <div className="text-xl font-bold text-green-400">
                                    {service.currency === 'USD' ? '$' : service.currency}
                                    {service.price}
                                    <span className="text-sm text-neutral-500 font-normal ml-1">
                                        / {service.unit}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {service.tags?.map((tag: string) => (
                                    <span key={tag} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-neutral-400">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
                            <h3 className="text-lg font-bold text-white mb-4">About this Service</h3>
                            <div className="prose prose-invert max-w-none text-neutral-300">
                                <p className="whitespace-pre-wrap">{service.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Inquiry Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <ServiceInquiryForm serviceId={serviceId} serviceTitle={service.title} />

                            {/* Trust Signals */}
                            <div className="mt-6 space-y-3 px-2">
                                <div className="flex items-center gap-3 text-sm text-neutral-500">
                                    <CheckCircle className="w-4 h-4 text-green-500/50" />
                                    <span>Direct communication with provider</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-500">
                                    <Globe className="w-4 h-4 text-indigo-500/50" />
                                    <span>Secure platform</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-500">
                                    <Clock className="w-4 h-4 text-amber-500/50" />
                                    <span>Typically responds within 24h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
