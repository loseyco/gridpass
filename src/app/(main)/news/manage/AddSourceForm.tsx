'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddSourceForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('General');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/news/sources', {
                method: 'POST',
                body: JSON.stringify({ name, url, category, type: 'rss' }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) throw new Error('Failed to add source');

            setIsOpen(false);
            setUrl('');
            setName('');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to add source. Check URL uniqueness.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Source
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end bg-zinc-800/50 p-4 rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-zinc-400 mb-1">Source Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Racer.com"
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                />
            </div>
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-zinc-400 mb-1">Category</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none appearance-none"
                >
                    <option value="General">General</option>
                    <option value="F1">F1</option>
                    <option value="NASCAR">NASCAR</option>
                    <option value="IndyCar">IndyCar</option>
                    <option value="Sportscar">Sportscar / IMSA / WEC</option>
                    <option value="Dirt">Dirt / Rally / Offroad</option>
                    <option value="Sim Racing">Sim Racing</option>
                    <option value="MotoGP">MotoGP</option>
                    <option value="Automotive">Automotive</option>
                </select>
            </div>
            <div className="flex-[2] w-full">
                <label className="block text-xs font-bold text-zinc-400 mb-1">RSS URL</label>
                <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/feed"
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                />
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-transparent hover:bg-white/5 text-zinc-400 rounded text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
            </div>
        </form>
    );
}
