'use client';

import { useState } from 'react';
import { addVehicle } from '../actions';
import { Car, Gamepad2, ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AddVehiclePage() {
    const [type, setType] = useState<'real' | 'sim'>('real');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        formData.append('type', type);

        try {
            const result = await addVehicle(formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success('Vehicle added successfully!');
                // Redirect happens in action
            }
        } catch (e) {
            toast.error('Something went wrong.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-white pb-20">
            <div className="max-w-2xl mx-auto px-6 py-12">
                <Link href="/garage" className="flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Garage
                </Link>

                <h1 className="text-3xl font-black text-white mb-8">Add New Vehicle</h1>

                {/* Type Selector */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setType('real')}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${type === 'real'
                                ? 'bg-neutral-900 border-indigo-500 text-white shadow-xl shadow-indigo-500/10'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                            }`}
                    >
                        <Car className={`w-8 h-8 ${type === 'real' ? 'text-indigo-400' : 'text-neutral-600'}`} />
                        <span className="font-bold">Real World Car</span>
                    </button>

                    <button
                        onClick={() => setType('sim')}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${type === 'sim'
                                ? 'bg-neutral-900 border-purple-500 text-white shadow-xl shadow-purple-500/10'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                            }`}
                    >
                        <Gamepad2 className={`w-8 h-8 ${type === 'sim' ? 'text-purple-400' : 'text-neutral-600'}`} />
                        <span className="font-bold">Sim Racing Car</span>
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-6 bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Nickname / Name</label>
                        <input
                            name="name"
                            required
                            placeholder={type === 'real' ? "e.g. My Track Tool" : "e.g. iRacing Ferrari GT3"}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {type === 'real' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Make</label>
                                    <input name="make" placeholder="e.g. Porsche" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Model</label>
                                    <input name="model" placeholder="e.g. 911 GT3" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Platform</label>
                                    <select name="sim_platform" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                                        <option value="iRacing">iRacing</option>
                                        <option value="ACC">Assetto Corsa Competizione</option>
                                        <option value="F1 24">F1 24</option>
                                        <option value="Gran Turismo">Gran Turismo</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Car Model</label>
                                    <input name="model" placeholder="e.g. Ferrari 296 GT3" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all" />
                                </div>
                            </>
                        )}
                    </div>

                    {type === 'real' && (
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">VIN (Optional)</label>
                            <input name="vin" placeholder="For automated history tracking" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all" />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Description / Notes</label>
                        <textarea name="description" rows={3} placeholder="Current setup, modifications, etc." className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none" />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Vehicle</>}
                    </button>

                </form>
            </div>
        </main>
    );
}
