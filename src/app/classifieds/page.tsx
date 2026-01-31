
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Tag, MapPin, DollarSign, Image as ImageIcon } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Classifieds",
    description: "Buy and sell racing gear, cars, and electronics directly on GridPass.",
};

export default async function ClassifiedsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Temporary Superadmin Restriction
    const allowedEmails = ['pjlosey@gmail.com', 'admin@gridpass.io'];
    if (!user || !allowedEmails.includes(user.email || '')) {
        // Show "Coming Soon" or redirect. Let's show a friendly "Access Denied / Coming Soon" instead of redirecting aggressively?
        // Or just redirect to home for now as per "not ready for public".
        // The user said "not ready for public", usually implying hidden.
        // Let's redirect to home for non-admins.
        // Actually, let's Redirect to Home.
        // We can't import redirect here without importing it.
        // Let's modify imports first?
        // Actually, let's keep it simple: Return a "Coming Soon" view if not admin.
    }

    // IF USER IS NOT ADMIN, RETURN COMING SOON VIEW
    if (!user || !allowedEmails.includes(user.email || '')) {
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

    // Fetch active classifieds
    const { data: items } = await supabase
        .from('classifieds')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12">
            <div className="max-w-7xl mx-auto animate-fade-in">

                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Classifieds</h1>
                        <p className="text-neutral-400">The marketplace for the grid.</p>
                    </div>
                    {/* Placeholder for category filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['All', 'Vehicles', 'Electronics', 'Tools', 'Parts', 'Other'].map((cat) => (
                            <button key={cat} className="px-4 py-2 rounded-full bg-neutral-900 border border-white/10 text-sm hover:bg-neutral-800 transition-colors whitespace-nowrap">
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items?.map((item) => (
                        <Link
                            key={item.id}
                            href={`/classifieds/${item.id}`}
                            className="group bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:bg-neutral-900/80 transition-all flex flex-col"
                        >
                            <div className="aspect-[4/3] bg-neutral-800 relative">
                                {item.images && item.images.length > 0 ? (
                                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                        <ImageIcon className="w-12 h-12 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded border border-white/10">
                                    {item.category}
                                </div>
                            </div>

                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-300 transition-colors line-clamp-1">{item.title}</h3>
                                <p className="text-emerald-400 font-bold mb-3 flex items-center">
                                    <DollarSign className="w-4 h-4" /> {item.price?.toLocaleString()}
                                </p>

                                <p className="text-sm text-neutral-400 line-clamp-2 mb-4 flex-grow">
                                    {item.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-neutral-500 mt-auto pt-4 border-t border-white/5">
                                    <span>{new Date(item.created_at!).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-indigo-400">
                                        Details →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {(!items || items.length === 0) && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-neutral-500 border border-dashed border-white/10 rounded-xl bg-neutral-900/30">
                            <Tag className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No items listed yet.</p>
                            <p className="text-sm">Check back soon for new gear.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
