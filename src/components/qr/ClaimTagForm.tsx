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

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Inline vehicle registration state
    const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
    const [vehicleYear, setVehicleYear] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');

    useEffect(() => {
        if (!user) return;

        let isMounted = true;

        async function fetchAssets() {
            try {
                // Fetch Vehicles owned by this user
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

                // Fetch Businesses owned by this user
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
                console.error("Error fetching assets for claiming:", error);
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

            await logEvent(
                'error',
                'scan',
                `Failed to claim tag ${tagId}: ${err.message}`,
                { tagId, collectionName, docId, userEmail: user.email }
            );
        }
    };

    const handleRegisterAndClaimVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !vehicleYear || !vehicleMake || !vehicleModel) return;
        setSubmitting(true);

        try {
            // 1. Create the new vehicle document
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
                `Registered new vehicle (${vehicleYear} ${vehicleMake} ${vehicleModel}) and linked GridPass tag ${tagId}`,
                { tagId, vehicleId: docRef.id, userEmail: user.email }
            );

            setSuccessMessage(`Registered & Linked ${vehicleYear} ${vehicleMake} ${vehicleModel}!`);

            setTimeout(() => {
                router.push(`/v/${docRef.id}`);
            }, 1500);

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error("Failed to register and link vehicle:", err);
            alert("Failed to claim tag: " + err.message);
            setSubmitting(false);

            await logEvent(
                'error',
                'scan',
                `Failed register-and-claim vehicle for tag ${tagId}: ${err.message}`,
                { tagId, userEmail: user.email }
            );
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-[#09090d]/60 border border-neutral-900 rounded-3xl backdrop-blur-xl">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Fetching Active Garage...</p>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                </div>
                <p className="text-white font-bold">{successMessage}</p>
                <p className="text-xs text-neutral-400">Loading your new digital dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-neutral-400 text-sm font-medium px-4 text-center">
                Select an entity to assign your physical GridPass tag, or register a vehicle inline.
            </p>

            {/* User Profile Option */}
            <div className="glass-card rounded-3xl p-4 shadow-xl">
                <div className="px-2 pb-3 border-b border-neutral-900 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-blue-500" /> Driver Identity
                    </h3>
                </div>
                <div className="pt-3">
                    <button
                        onClick={() => handleClaim('users', user!.uid, 'User Profile')}
                        disabled={submitting}
                        className="w-full flex items-center justify-between p-4 bg-neutral-900/30 hover:bg-blue-600/10 border border-neutral-900 hover:border-blue-500/30 rounded-2xl transition-all group disabled:opacity-50"
                    >
                        <div className="text-left">
                            <p className="font-bold text-white group-hover:text-blue-400 transition-colors">My Driver Profile</p>
                            <p className="text-xs text-neutral-500">Link tag directly to your digital card</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        </div>
                    </button>
                </div>
            </div>

            {/* Vehicles Options */}
            <div className="glass-card rounded-3xl p-4 shadow-xl">
                <div className="px-2 pb-3 border-b border-neutral-900 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                        <CarFront className="w-4 h-4 text-emerald-500" /> Digital Garage
                    </h3>
                </div>
                
                {vehicles.length > 0 && !showNewVehicleForm && (
                    <div className="pt-3 space-y-2">
                        {vehicles.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => handleClaim('vehicles', v.id, `${v.year} ${v.make} ${v.model}`)}
                                disabled={submitting}
                                className="w-full flex items-center justify-between p-4 bg-neutral-900/30 hover:bg-emerald-600/10 border border-neutral-900 hover:border-emerald-500/30 rounded-2xl transition-all group disabled:opacity-50"
                            >
                                <div className="text-left">
                                    <p className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{v.year} {v.make} {v.model}</p>
                                    <p className="text-xs text-neutral-500">Link tag to this vehicle</p>
                                </div>
                                <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all ml-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {showNewVehicleForm ? (
                    <form onSubmit={handleRegisterAndClaimVehicle} className="pt-4 space-y-3">
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Register New Vehicle</p>
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="number"
                                required
                                min="1900"
                                max="2030"
                                placeholder="Year"
                                value={vehicleYear}
                                onChange={(e) => setVehicleYear(e.target.value)}
                                className="glass-input px-3 py-2 rounded-xl text-sm placeholder:text-neutral-600"
                            />
                            <input
                                type="text"
                                required
                                placeholder="Make (e.g. Porsche)"
                                value={vehicleMake}
                                onChange={(e) => setVehicleMake(e.target.value)}
                                className="glass-input col-span-2 px-3 py-2 rounded-xl text-sm placeholder:text-neutral-600"
                            />
                        </div>
                        <input
                            type="text"
                            required
                            placeholder="Model (e.g. 911 GT3 RS)"
                            value={vehicleModel}
                            onChange={(e) => setVehicleModel(e.target.value)}
                            className="glass-input w-full px-3 py-2 rounded-xl text-sm placeholder:text-neutral-600"
                        />
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowNewVehicleForm(false)}
                                className="flex-1 py-2 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-emerald-600/20"
                            >
                                {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin mx-auto" /> : 'Claim & Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="pt-3">
                        <button
                            onClick={() => setShowNewVehicleForm(true)}
                            disabled={submitting}
                            className="w-full flex items-center justify-between p-4 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl transition-all group disabled:opacity-50"
                        >
                            <div className="text-left">
                                <p className="font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">Register New Vehicle</p>
                                <p className="text-xs text-neutral-500">Add a new unit to garage & assign tag</p>
                            </div>
                            <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all ml-2">
                                <PlusCircle className="w-4 h-4" />
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Businesses Options */}
            {businesses.length > 0 && (
                <div className="glass-card rounded-3xl p-4 shadow-xl">
                    <div className="px-2 pb-3 border-b border-neutral-900 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-500" /> Business Entities
                        </h3>
                    </div>
                    <div className="pt-3 space-y-2">
                        {businesses.map((b) => (
                            <button
                                key={b.id}
                                onClick={() => handleClaim('businesses', b.id, b.name)}
                                disabled={submitting}
                                className="w-full flex items-center justify-between p-4 bg-neutral-900/30 hover:bg-purple-600/10 border border-neutral-900 hover:border-purple-500/30 rounded-2xl transition-all group disabled:opacity-50"
                            >
                                <div className="text-left">
                                    <p className="font-bold text-white group-hover:text-purple-400 transition-colors truncate">{b.name}</p>
                                    <p className="text-xs text-neutral-500">Link tag to business hub</p>
                                </div>
                                <div className="w-8 h-8 shrink-0 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all ml-2">
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
