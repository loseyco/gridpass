'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus, Trash, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdsDashboard() {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [headline, setHeadline] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [tier, setTier] = useState('FREE');
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClientComponentClient();
    const router = useRouter();

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setAds(data);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('ads')
            .insert({
                user_id: user.id,
                headline,
                image_url: imageUrl,
                tier,
                active: true // Auto-approve for now
            });

        if (!error) {
            setHeadline('');
            setImageUrl('');
            fetchAds();
        } else {
            alert('Error creating ad: ' + error.message);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        const { error } = await supabase.from('ads').delete().eq('id', id);
        if (!error) fetchAds();
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Ad Campaigns</h1>
            <p className="text-slate-400 mb-8">Manage your spots on the GridPass Live Network.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl sticky top-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-red-500" /> New Campaign
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Headline</label>
                                <input
                                    type="text"
                                    value={headline}
                                    onChange={e => setHeadline(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-red-500"
                                    placeholder="e.g. Join our Sim League!"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Image URL</label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-red-500"
                                    placeholder="https://..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm font-bold mb-2">Plan Tier</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setTier('FREE')}
                                        className={`p-4 rounded border text-center transition-colors ${tier === 'FREE' ? 'bg-slate-800 border-white text-white' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                    >
                                        <div className="font-bold">FREE</div>
                                        <div className="text-xs mt-1">Standard Rotation</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTier('PRO')}
                                        className={`p-4 rounded border text-center transition-colors ${tier === 'PRO' ? 'bg-red-900/20 border-red-500 text-red-500' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                    >
                                        <div className="font-bold">PRO</div>
                                        <div className="text-xs mt-1">$9.99/mo</div>
                                    </button>
                                </div>
                            </div>

                            {/* Preview */}
                            {(headline || imageUrl) && (
                                <div className="mt-6 pt-6 border-t border-slate-800">
                                    <label className="block text-slate-500 text-xs font-bold mb-2 uppercase tracking-wider">Preview</label>
                                    <div className="bg-black aspect-video relative overflow-hidden rounded border border-slate-800 group">
                                        {imageUrl && <img src={imageUrl} className="w-full h-full object-cover opacity-60" />}
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <h3 className="text-2xl font-black text-white italic uppercase text-center shadow-black drop-shadow-lg leading-tight">
                                                {headline}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded transition-colors disabled:opacity-50 mt-6"
                            >
                                {submitting ? 'Launching...' : 'Launch Campaign'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-white mb-6">Your Active Ads</h2>
                    {loading ? (
                        <div className="text-slate-500 animate-pulse">Loading campaigns...</div>
                    ) : ads.length === 0 ? (
                        <div className="text-center py-24 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                            <ImageIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500">No active campaigns. Create one to get started!</p>
                        </div>
                    ) : (
                        ads.map(ad => (
                            <div key={ad.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-6 items-center group hover:border-slate-700 transition-colors">
                                <div className="w-32 aspect-video bg-black rounded overflow-hidden relative shrink-0">
                                    <img src={ad.image_url} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        {ad.tier === 'PRO' && (
                                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">PRO</span>
                                        )}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${ad.active ? 'bg-green-900/30 text-green-500' : 'bg-yellow-900/30 text-yellow-500'}`}>
                                            {ad.active ? 'Active' : 'Pending'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white truncate">{ad.headline}</h3>
                                    <p className="text-sm text-slate-500 truncate">{ad.id}</p>
                                </div>

                                <button
                                    onClick={() => handleDelete(ad.id)}
                                    className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-950/30 rounded-full transition-colors"
                                >
                                    <Trash className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
