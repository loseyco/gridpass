
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Plus, Edit, Trash, Eye, EyeOff, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminClassifiedsPage() {
    const supabase = await createClient();

    // Fetch all classifieds
    const { data: items } = await supabase
        .from('classifieds')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                            <Tag className="w-8 h-8 text-emerald-500" />
                            Classifieds Management
                        </h1>
                        <p className="text-neutral-400">Manage your marketplace listings.</p>
                    </div>
                    <Link href="/admin/classifieds/new" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                        <Plus className="w-4 h-4" /> New Listing
                    </Link>
                </header>

                <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-800 border-b border-white/10 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Title</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {items?.map((item) => (
                                <tr key={item.id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{item.title}</div>
                                        <div className="text-xs text-neutral-500 truncate max-w-[200px]">{item.description}</div>
                                    </td>
                                    <td className="p-4 font-mono text-emerald-400">
                                        ${item.price?.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs text-neutral-300">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${item.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                item.status === 'sold' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    item.status === 'draft' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                        'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-neutral-400">
                                        {new Date(item.created_at!).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/classifieds/${item.id}`}
                                                className="p-2 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"
                                                title="View Public Page"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/admin/classifieds/${item.id}`}
                                                className="p-2 hover:bg-white/10 rounded text-amber-500 hover:text-amber-400 transition-colors"
                                                title="Edit Listing"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            {/* Delete would require a server action or client button with API call. Verified in later steps. */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!items || items.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-neutral-500">
                                        No listings found. Create your first one!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
