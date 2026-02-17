
import { createClassified } from '../actions';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewClassifiedPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
            <div className="max-w-3xl mx-auto">
                <Link href="/admin/classifieds" className="flex items-center text-neutral-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                </Link>

                <h1 className="text-3xl font-bold mb-8">Create New Listing</h1>

                <form action={createClassified} className="space-y-6 bg-neutral-900 border border-white/10 p-8 rounded-xl">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Title</label>
                            <input name="title" required className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" placeholder="e.g. 2022 CRG Kart" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Price</label>
                            <input name="price" type="number" step="0.01" required className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" placeholder="0.00" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-neutral-400 uppercase">Description</label>
                        <textarea name="description" rows={5} className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" placeholder="Item details..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Category</label>
                            <select name="category" className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none">
                                <option value="Vehicles">Vehicles</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Tools">Tools</option>
                                <option value="Parts">Parts</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Status</label>
                            <select name="status" className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none">
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="sold">Sold</option>
                                <option value="hidden">Hidden</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-neutral-400 uppercase">Images (Comma Separated URLs)</label>
                        <input name="images" className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
                        <p className="text-xs text-neutral-500">Provide direct image links for now.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Contact Email</label>
                            <input name="contact_email" type="email" className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" placeholder="pj@gridpass.app" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-neutral-400 uppercase">Contact Phone</label>
                            <input name="contact_phone" className="w-full bg-neutral-950 border border-white/10 rounded p-3 focus:border-emerald-500 outline-none" placeholder="+1 555-0123" />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Save className="w-5 h-5" /> Create Listing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
