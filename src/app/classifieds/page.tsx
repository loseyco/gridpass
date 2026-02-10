
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Tag, MapPin, DollarSign, Image as ImageIcon } from 'lucide-react';
import { Metadata } from 'next';
import { hasRole, ROLES } from '@/utils/rbac';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Classifieds | GridPass",
    description: "Buy and sell racing gear, cars, and electronics directly on GridPass.",
};

export default async function ClassifiedsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const activeCategory = typeof params.category === 'string' ? params.category : null;

    const supabase = await createClient();

    // Role Check
    // Allow access in development for testing, otherwise require SUPERADMIN
    const isSuperAdmin = await hasRole(ROLES.SUPERADMIN);
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isAllowed = isSuperAdmin || isDevelopment;

    // IF USER IS NOT ALLOWED, RETURN COMING SOON VIEW
    if (!isAllowed) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-center p-6">
                <h1 className="text-4xl font-bold text-white mb-4">Classifieds</h1>
                <Tag className="w-16 h-16 text-indigo-500 mb-6 opacity-50" />
                <p className="text-xl text-neutral-400 max-w-md">
                    The GridPass Marketplace is currently in <span className="text-indigo-500 font-bold">Private Beta</span>.
                </p>
                <p className="text-neutral-500 mt-2">Check back soon for public launch.</p>
                <Link href="/" className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors">
                    Back to Home
                </Link>
            </div>
        );
    }

    // Build query with category filter
    let query = supabase
        .from('classifieds')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (activeCategory && activeCategory !== 'All') {
        // Assuming database stores categories with matching case (Title Case)
        // If case-insensitive match needed, use .ilike('category', activeCategory)
        query = query.eq('category', activeCategory);
    }

    const { data: items } = await query;

    const categories = ['All', 'Vehicles', 'Electronics', 'Tools', 'Parts', 'Other'];

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12">
            <div className="max-w-7xl mx-auto animate-fade-in">

                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Classifieds</h1>
                        <p className="text-neutral-400">The marketplace for the grid.</p>
                    </div>
                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map((cat) => {
                            const isActive = (cat === 'All' && !activeCategory) || (cat === activeCategory);
                            return (
                                <Link
                                    key={cat}
                                    href={cat === 'All' ? '/classifieds' : `/classifieds?category=${cat}`}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${isActive
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                            : 'bg-neutral-900 border-white/10 text-neutral-400 hover:bg-neutral-800 hover:text-white hover:border-white/20'
                                        }`}
                                >
                                    {cat}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items?.map((item) => (
                        <Link
                            key={item.id}
                            href={`/classifieds/${item.id}`}
                            className="group bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:bg-neutral-900/80 transition-all flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10"
                        >
                            <div className="aspect-[4/3] bg-neutral-800 relative overflow-hidden">
                                {item.images && item.images.length > 0 ? (
                                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-600 bg-neutral-950">
                                        <ImageIcon className="w-12 h-12 opacity-30 group-hover:opacity-50 transition-opacity" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded border border-white/10">
                                    {item.category}
                                </div>
                            </div>

                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-300 transition-colors line-clamp-1">{item.title}</h3>
                                <p className="text-emerald-400 font-bold mb-3 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-0.5" /> {item.price?.toLocaleString()}
                                </p>

                                <p className="text-sm text-neutral-400 line-clamp-2 mb-4 flex-grow">
                                    {item.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-neutral-500 mt-auto pt-4 border-t border-white/5">
                                    <span>{new Date(item.created_at!).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-indigo-400 font-medium">
                                        Details →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {(!items || items.length === 0) && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-neutral-500 border border-dashed border-white/10 rounded-xl bg-neutral-900/30">
                            <Tag className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium text-neutral-300">No items found</p>
                            <p className="text-sm">
                                {activeCategory ? `No classifieds listed in ${activeCategory} yet.` : "Check back soon for new listings."}
                            </p>
                            {activeCategory && (
                                <Link
                                    href="/classifieds"
                                    className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                >
                                    Clear filters
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
