'use client';

import { useState } from 'react';
import { createClientTeam } from '@/app/collections/concierge-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, CheckCircle, UserPlus, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientSetupPage() {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        collection_name: ''
    });
    const [result, setResult] = useState<{ teamId: string, collectionId: string } | null>(null);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('collection_name', formData.collection_name);

        try {
            const res = await createClientTeam(data);
            if (res.error) {
                toast.error(res.error);
            } else if (res.success && res.teamId && res.collectionId) {
                setResult({ teamId: res.teamId, collectionId: res.collectionId });
                setStep(3);
                toast.success('Client and Collection setup complete!');
            }
        } catch (err) {
            toast.error('An unexpected error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-3xl font-black text-white mb-2">New Client Setup</h1>
                    <p className="text-neutral-400">Onboard a new client, create their team entity, and initialize their primary collection.</p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-4 mb-8 text-sm font-bold text-neutral-500">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-700'}`}>1</div>
                        Client
                    </div>
                    <div className="h-px bg-neutral-800 flex-1"></div>
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-700'}`}>2</div>
                        Collection
                    </div>
                    <div className="h-px bg-neutral-800 flex-1"></div>
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-400' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-700'}`}>3</div>
                        Done
                    </div>
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl md:p-8">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold mb-4">Client Details</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clientName">Client / Organization Name</Label>
                                    <Input
                                        id="clientName"
                                        placeholder="e.g. John Doe Racing"
                                        className="bg-black border-neutral-800"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        autoFocus
                                    />
                                    <p className="text-xs text-neutral-500">This will create a new Team entity.</p>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!formData.name}
                                    className="bg-white text-black hover:bg-neutral-200 font-bold"
                                >
                                    Next <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl md:p-8">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
                                <FolderPlus className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold mb-4">Collection Details</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="collectionName">Collection Name</Label>
                                    <Input
                                        id="collectionName"
                                        placeholder={`e.g. ${formData.name}'s Collection`}
                                        className="bg-black border-neutral-800"
                                        value={formData.collection_name}
                                        onChange={(e) => setFormData({ ...formData, collection_name: e.target.value })}
                                    />
                                    <p className="text-xs text-neutral-500">Leave blank to use default. Created as Private by default.</p>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="text-neutral-400 hover:text-white"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                                >
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Create Client & Collection
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && result && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="bg-neutral-900 border border-emerald-500/20 p-8 rounded-2xl text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">Setup Complete!</h2>
                            <p className="text-neutral-400 mb-8">
                                <strong>{formData.name}</strong> has been created with collection <strong>{formData.collection_name || `${formData.name}'s Collection`}</strong>.
                            </p>

                            <div className="grid gap-4 max-w-sm mx-auto">
                                <Link
                                    href={`/garage/add?collection_id=${result.collectionId}`}
                                    className="block w-full bg-white text-black hover:bg-neutral-200 py-3 rounded-lg font-bold"
                                >
                                    Add Vehicles Now
                                </Link>
                                <Link
                                    href={`/collections/${result.collectionId}`}
                                    className="block w-full bg-neutral-800 text-white hover:bg-neutral-700 py-3 rounded-lg font-bold"
                                >
                                    View Collection
                                </Link>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setStep(1);
                                        setFormData({ name: '', collection_name: '' });
                                        setResult(null);
                                    }}
                                    className="text-neutral-500 hover:text-white"
                                >
                                    Setup Another Client
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
