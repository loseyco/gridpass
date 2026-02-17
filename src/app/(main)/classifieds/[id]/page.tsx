
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Tag, Calendar, User, DollarSign, Mail, Phone, Image as ImageIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import ContactSellerButton from '@/components/classifieds/ContactSellerButton';

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = (await params).id;
    const supabase = await createClient();

    const { data: item } = await supabase
        .from('classifieds')
        .select('*')
        .eq('id', id)
        .single();

    if (!item) {
        return {
            title: 'Item Not Found',
        }
    }

    return {
        title: item.title,
        description: item.description,
        openGraph: {
            images: item.images && item.images.length > 0 ? [item.images[0]] : ['/hero-launch.png'],
        },
    }
}

export default async function ClassifiedDetailPage({ params }: Props) {
    const id = (await params).id;
    const supabase = await createClient();

    // Fetch item first without complicated joins
    const { data: item, error: itemError } = await supabase
        .from('classifieds')
        .select('*')
        .eq('id', id)
        .single();

    if (itemError) {
        console.error('Error fetching classified:', itemError);
    }

    if (!item) {
        notFound();
    }

    // Fetch profile separately
    let profile = null;
    if (item.user_id) {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', item.user_id)
            .single();
        profile = profileData;
    }

    // Merge for compatibility with existing JSX
    // valid item contact_info
    const contactInfo = item.contact_info as any;
    const itemWithProfile = { ...item, profiles: profile };

    // Update variable references below to use itemWithProfile or just handle it.
    // Actually, I should just map it to the structure the JSX expects.
    // The JSX expects `item` to have `profiles`.
    Object.assign(item, { profiles: profile });


    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12">
            <div className="max-w-7xl mx-auto animate-fade-in">

                <Link href="/classifieds" className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Images */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-white/10 relative">
                            {item.images && item.images.length > 0 ? (
                                <img src={item.images[0]} alt={item.title} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                    <ImageIcon className="w-16 h-16 opacity-50" />
                                </div>
                            )}
                            {item.status === 'sold' && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-red-500 font-bold text-5xl border-4 border-red-500 px-8 py-2 -rotate-12 uppercase tracking-widest">
                                        SOLD
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails (if multiple, utilizing carousel logic later, simpler for now) */}
                        {item.images && item.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {item.images.map((img: string, idx: number) => (
                                    <div key={idx} className="aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-white/10 opacity-70 hover:opacity-100 cursor-pointer">
                                        <img src={img} alt={`${item.title} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <div>
                        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 sticky top-24">
                            <div className="flex items-start justify-between mb-4">
                                <span className="px-3 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
                                    {item.category}
                                </span>
                                <span className="text-neutral-500 text-sm flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" /> {new Date(item.created_at!).toLocaleDateString()}
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                            <p className="text-4xl font-bold text-emerald-400 mb-6 flex items-center">
                                <DollarSign className="w-6 h-6" /> {item.price?.toLocaleString()}
                            </p>

                            <script
                                type="application/ld+json"
                                dangerouslySetInnerHTML={{
                                    __html: JSON.stringify({
                                        "@context": "https://schema.org",
                                        "@type": "Product",
                                        "name": item.title,
                                        "description": item.description,
                                        "image": item.images?.[0] || "",
                                        "offers": {
                                            "@type": "Offer",
                                            "price": item.price,
                                            "priceCurrency": "USD",
                                            "availability": item.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/SoldOut"
                                        }
                                    })
                                }}
                            />

                            <div className="border-t border-white/10 py-6 mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">Description</h3>
                                <p className="text-neutral-300 leading-relaxed whitespace-pre-line">
                                    {item.description}
                                </p>
                            </div>

                            <div className="bg-neutral-950 rounded-xl p-6 border border-white/5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">Seller Info</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden">
                                        {(item as any).profiles?.avatar_url ? (
                                            <img src={(item as any).profiles.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-neutral-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold">{(item as any).profiles?.full_name || (item as any).profiles?.username || 'Unknown Seller'}</p>
                                        <p className="text-xs text-neutral-500">Verified Member</p>
                                    </div>
                                </div>

                                {item.status === 'active' ? (
                                    <div className="space-y-3">
                                        {profile ? (
                                            <ContactSellerButton
                                                recipientName={profile.full_name || profile.username || 'Seller'}
                                                recipientUsername={profile.username}
                                            />
                                        ) : contactInfo?.email && (
                                            <a href={`mailto:${contactInfo.email}`} className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors">
                                                <Mail className="w-4 h-4 mr-2" /> Email Seller
                                            </a>
                                        )}
                                        {contactInfo?.phone && (
                                            <div className="flex items-center justify-center w-full bg-neutral-800 text-neutral-300 font-medium py-3 rounded-lg border border-white/5">
                                                <Phone className="w-4 h-4 mr-2" /> {contactInfo.phone}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-3 bg-neutral-800 rounded-lg text-neutral-500 font-medium">
                                        Use 'Contact' button to message seller
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
