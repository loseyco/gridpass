
import { updateClassified, deleteClassified } from '../actions';
import { createClient } from '@/utils/supabase/server';
import { ArrowLeft, Save, Trash } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function EditClassifiedPage({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;
    const supabase = await createClient();

    const { data: item } = await supabase.from('classifieds').select('*').eq('id', id).single();

    if (!item) notFound();

    const contactInfo = item.contact_info as any;
    const updateAction = updateClassified.bind(null, item.id);
    const deleteAction = deleteClassified.bind(null, item.id);

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/admin/classifieds" className="flex items-center text-neutral-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                    </Link>

                    <form action={async () => {
                        'use server';
                        await deleteClassified(id);
                        redirect('/admin/classifieds');
                    }}>
                        <button type="submit" className="text-red-500 hover:text-red-400 text-sm font-bold flex items-center gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                            <Trash className="w-4 h-4" /> Delete Listing
                        </button>
                    </form>
                </div>

                <h1 className="text-3xl font-bold mb-8">Edit Listing</h1>

                <form action={updateAction} className="space-y-6 bg-neutral-900 border border-white/10 p-8 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Title</label>
                            <input name="title" defaultValue={item.title} required className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Price</label>
                            <input name="price" defaultValue={item.price || ''} type="number" step="0.01" required className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-neutral-400 uppercase">Description</label>
                        <textarea name="description" defaultValue={item.description || ''} rows={5} className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Category</label>
                            <select name="category" defaultValue={item.category} className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none">
                                <option value="Vehicles">Vehicles</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Tools">Tools</option>
                                <option value="Parts">Parts</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Status</label>
                            <select name="status" defaultValue={item.status} className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none">
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="sold">Sold</option>
                                <option value="hidden">Hidden</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-neutral-400 uppercase">Images (Comma Separated URLs)</label>
                        <input name="images" defaultValue={item.images?.join(', ') || ''} className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Contact Email</label>
                            <input name="contact_email" defaultValue={contactInfo?.email || ''} type="email" className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Contact Phone</label>
                            <input name="contact_phone" defaultValue={contactInfo?.phone || ''} className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Save className="w-5 h-5" /> Update Listing
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <Link href={`/classifieds/${item.id}`} className="text-neutral-500 hover:text-white text-sm hover:underline">
                        View Public Listing
                    </Link>
                </div>
            </div>
        </div>
    );
}
