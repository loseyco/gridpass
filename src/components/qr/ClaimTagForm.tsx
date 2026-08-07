'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { CarFront, Building2, UserCircle, Loader2, ArrowRight, PlusCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logEvent } from '@/lib/logger';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  owner_id: string;
  owner_email?: string;
  tag_id?: string;
  isPremium?: boolean;
}

interface Business {
  id: string;
  name: string;
  owner_id: string;
  tag_id?: string;
}

export function ClaimTagForm({ tagId }: { tagId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
    const [vehicleYear, setVehicleYear] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');

    useEffect(() => {
        if (!user) return;

        let isMounted = true;

        async function fetchAssets() {
            try {
                const vQuery = query(collection(db, 'vehicles'), where('owner_id', '==', user!.uid));
                const vSnap = await getDocs(vQuery);
                const vList = vSnap.docs.map(docSnap => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        year: data.year,
                        make: data.make,
                        model: data.model,
                        owner_id: data.owner_id,
                        owner_email: data.owner_email,
                        tag_id: data.tag_id,
                        isPremium: data.isPremium
                    } as Vehicle;
                });

                const bQuery = query(collection(db, 'businesses'), where('owner_id', '==', user!.uid));
                const bSnap = await getDocs(bQuery);
                const bList = bSnap.docs.map(docSnap => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        name: data.name,
                        owner_id: data.owner_id,
                        tag_id: data.tag_id
                    } as Business;
                });

                if (isMounted) {
                    setVehicles(vList);
                    setBusinesses(bList);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching assets:", error);
                if (isMounted) setLoading(false);
            }
        }

        fetchAssets();

        return () => { isMounted = false; };
    }, [user]);

    const handleClaim = async (collectionName: string, docId: string, nameForLog: string) => {
        if (!user) return;
        setSubmitting(true);

        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, { tag_id: tagId });

            await logEvent(
                'success',
                'scan',
                `GridPass tag ${tagId} claimed for ${collectionName} ID: ${docId}`,
                { tagId, collectionName, docId, userEmail: user.email }
            );

            setSuccessMessage(`Success! Assigned to ${nameForLog}.`);

            setTimeout(() => {
                if (collectionName === 'users') {
                    router.push(`/u/${docId}`);
                } else if (collectionName === 'vehicles') {
                    router.push(`/v/${docId}`);
                } else if (collectionName === 'businesses') {
                    router.push(`/b/${docId}`);
                } else {
                    router.refresh();
                }
            }, 1500);

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error("Failed to claim tag:", err);
            alert("Failed to claim tag: " + err.message);
            setSubmitting(false);
        }
    };

    const handleRegisterAndClaimVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !vehicleYear || !vehicleMake || !vehicleModel) return;
        setSubmitting(true);

        try {
            const vehicleData = {
                year: parseInt(vehicleYear),
                make: vehicleMake,
                model: vehicleModel,
                owner_id: user.uid,
                owner_email: user.email,
                tag_id: tagId,
                created_at: serverTimestamp()
            };

            const vehiclesRef = collection(db, 'vehicles');
            const docRef = await addDoc(vehiclesRef, vehicleData);

            await logEvent(
                'success',
                'scan',
                `Registered and linked vehicle for tag ${tagId}`,
                { tagId, vehicleId: docRef.id, userEmail: user.email }
            );

            setSuccessMessage(`Registered & Linked ${vehicleYear} ${vehicleMake} ${vehicleModel}!`);

            setTimeout(() => {
                router.push(`/v/${docRef.id}`);
            }, 1500);

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error("Failed to register vehicle:", err);
            alert("Failed to claim tag: " + err.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-[#1c1c1e] border border-[#2c2c2e] rounded-3xl">
                <Loader2 className="w-8 h-8 text-[#007aff] animate-spin mb-4" />
                <p className="text-neutral-500 font-bold uppercase tracking-wider text-xs">Loading Garage...</p>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="p-8 bg-[#1c1c1e] border border-[#2c2c2e] rounded-3xl text-center space-y-4">
                <div className="w-12 h-12 bg-[#34c759]/10 text-[#34c759] rounded-full flex items-center justify-center mx-auto border border-[#34c759]/20">
                    <Check className="w-6 h-6" />
                </div>
                <p className="text-white font-semibold">{successMessage}</p>
                <p className="text-xs text-neutral-400">Loading your profile page...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-neutral-400 text-sm font-medium px-4 text-center">
                Link this tag to your profile, an existing vehicle, or register a new one.
            </p>

            {/* User Profile */}
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-4 space-y-3">
                <div className="pb-2 border-b border-[#2c2c2e]">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <UserCircle className="w-4 h-4 text-[#007aff]" /> Member Identity
                    </h3>
                </div>
                <button
                    onClick={() => handleClaim('users', user!.uid, 'User Profile')}
                    disabled={submitting}
                    className="w-full flex items-center justify-between p-3.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-all group disabled:opacity-50 text-left"
                >
                    <div>
                        <p className="font-semibold text-white">Link to My Member Profile</p>
                        <p className="text-xs text-neutral-400">Set this tag as your personal profile pass</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#007aff]/10 text-[#007aff] flex items-center justify-center group-hover:bg-[#007aff] group-hover:text-white transition-all shrink-0">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                </button>
            </div>

            {/* Vehicles Options */}
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-4 space-y-3">
                <div className="pb-2 border-b border-[#2c2c2e]">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <CarFront className="w-4 h-4 text-[#34c759]" /> Digital Garage
                    </h3>
                </div>
                
                {vehicles.length > 0 && !showNewVehicleForm && (
                    <div className="space-y-2">
                        {vehicles.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => handleClaim('vehicles', v.id, `${v.year} ${v.make} ${v.model}`)}
                                disabled={submitting}
                                className="w-full flex items-center justify-between p-3.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-all group disabled:opacity-50 text-left"
                            >
                                <div>
                                    <p className="font-semibold text-white truncate">{v.year} {v.make} {v.model}</p>
                                    <p className="text-xs text-neutral-400">Link tag to this vehicle profile</p>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-[#34c759]/10 text-[#34c759] flex items-center justify-center group-hover:bg-[#34c759] group-hover:text-white transition-all shrink-0 ml-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {showNewVehicleForm ? (
                    <form onSubmit={handleRegisterAndClaimVehicle} className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase">New Vehicle Specifications</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="number"
                                required
                                min="1900"
                                max="2030"
                                placeholder="Year"
                                value={vehicleYear}
                                onChange={(e) => setVehicleYear(e.target.value)}
                                className="bg-[#2c2c2e] border border-[#3a3a3c] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#007aff]"
                            />
                            <input
                                type="text"
                                required
                                placeholder="Make (e.g. Porsche)"
                                value={vehicleMake}
                                onChange={(e) => setVehicleMake(e.target.value)}
                                className="bg-[#2c2c2e] border border-[#3a3a3c] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#007aff] col-span-2"
                            />
                        </div>
                        <input
                            type="text"
                            required
                            placeholder="Model (e.g. 911 GT3 RS)"
                            value={vehicleModel}
                            onChange={(e) => setVehicleModel(e.target.value)}
                            className="w-full bg-[#2c2c2e] border border-[#3a3a3c] text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-[#007aff]"
                        />
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowNewVehicleForm(false)}
                                className="flex-1 py-2 bg-transparent border border-[#3a3a3c] text-neutral-400 hover:text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2 bg-[#34c759] hover:bg-[#30b351] text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Claim & Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowNewVehicleForm(true)}
                        disabled={submitting}
                        className="w-full flex items-center justify-between p-3.5 bg-[#2c2c2e]/40 hover:bg-[#2c2c2e] border border-[#2c2c2e] rounded-xl transition-all group disabled:opacity-50 text-left"
                    >
                        <div>
                            <p className="font-semibold text-[#34c759]">{isMock ? "Register New Vehicle" : "Add New Vehicle"}</p>
                            <p className="text-xs text-neutral-450">Create profile inline and link this tag</p>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#34c759]/10 text-[#34c759] flex items-center justify-center group-hover:bg-[#34c759] group-hover:text-white transition-all shrink-0 ml-2">
                            <PlusCircle className="w-4 h-4" />
                        </div>
                    </button>
                )}
            </div>

            {/* Businesses Options */}
            {businesses.length > 0 && (
                <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-4 space-y-3">
                    <div className="pb-2 border-b border-[#2c2c2e]">
                        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-purple-500" /> Business Hubs
                        </h3>
                    </div>
                    <div className="space-y-2">
                        {businesses.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => handleClaim('businesses', b.id, b.name)}
                                disabled={submitting}
                                className="w-full flex items-center justify-between p-3.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-all group disabled:opacity-50 text-left"
                            >
                                <div>
                                    <p className="font-semibold text-white truncate">{b.name}</p>
                                    <p className="text-xs text-neutral-400">Link tag to business storefront</p>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0 ml-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
