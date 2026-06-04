'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { QrCode, Loader2, ShieldCheck, CarFront, Sparkles, LogIn, Compass, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ClaimTagForm } from '@/components/qr/ClaimTagForm';
import { logEvent } from '@/lib/logger';
import Link from 'next/link';
import Logo from '@/components/Logo';

function JoinPageContent() {
    const searchParams = useSearchParams();
    const tagId = searchParams.get('id') || '';
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(!!tagId);
    const [lookupState, setLookupState] = useState('Initializing scan resolver...');
    const [tagFound, setTagFound] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [unclaimedVehicle, setUnclaimedVehicle] = useState<any | null>(null);
    const [claimingPreRegistered, setClaimingPreRegistered] = useState(false);
    const [showAlternativeClaim, setShowAlternativeClaim] = useState(false);

    useEffect(() => {
        if (!tagId) {
            return;
        }

        let isMounted = true;

        async function resolveTag() {
            if (!isMounted) return;

            // Log scans to both central telemetry and the tag_scans collection for geo-analytics
            const logScanAndRedirect = async (targetType: string, targetId: string, redirectPath: string) => {
                const triggerNativeLog = async (lat?: number, lng?: number, accuracy?: number) => {
                    try {
                        const payload = {
                            tagId,
                            scannedAt: new Date().toISOString(),
                            targetType,
                            targetId,
                            userAgent: navigator.userAgent,
                            ...(lat && lng ? { location: { lat, lng, accuracy } } : {})
                        };

                        // 1. Add to tag_scans analytics
                        await addDoc(collection(db, 'tag_scans'), payload);

                        // 2. Central telemetry logger
                        await logEvent(
                            'info',
                            'scan',
                            `GridPass QR tag [${tagId}] scanned. Resolved to ${targetType} (${targetId}). Location: ${lat ? 'Attributed' : 'Declined'}`,
                            payload
                        );
                    } catch (err) {
                        console.error("[Resolver] Failed to write scan event:", err);
                    }
                };

                // Request location for analytical tracking (ideal for events, track check-ins)
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            triggerNativeLog(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
                            if (isMounted) {
                                router.replace(redirectPath);
                            }
                        },
                        (err) => {
                            triggerNativeLog(); // Log without geo
                            if (isMounted) {
                                router.replace(redirectPath);
                            }
                        },
                        { timeout: 3500 }
                    );
                } else {
                    await triggerNativeLog();
                    if (isMounted) {
                        router.replace(redirectPath);
                    }
                }
            };

            try {
                // 1. Query vehicles
                setLookupState('Resolving digital garage assets...');
                const vQuery = query(collection(db, 'vehicles'), where('tag_id', '==', tagId));
                const vSnap = await getDocs(vQuery);
                if (!vSnap.empty) {
                    const matchedVehicle = vSnap.docs[0];
                    const vData = matchedVehicle.data();
                    
                    if (vData.owner_id) {
                        if (isMounted) setTagFound(true);
                        await logScanAndRedirect('vehicle', matchedVehicle.id, `/v/${matchedVehicle.id}`);
                        return;
                    } else {
                        // Unclaimed pre-registered or wild-spotted vehicle
                        if (isMounted) {
                            setUnclaimedVehicle({
                                id: matchedVehicle.id,
                                year: vData.year,
                                make: vData.make,
                                model: vData.model,
                                partner_dealer: vData.partner_dealer || vData.dealer || ''
                            });
                            setLoading(false);
                        }
                        return;
                    }
                }

                // 2. Query businesses
                if (!isMounted) return;
                setLookupState('Searching merchant business registries...');
                const bQuery = query(collection(db, 'businesses'), where('tag_id', '==', tagId));
                const bSnap = await getDocs(bQuery);
                if (!bSnap.empty) {
                    const matchedBusiness = bSnap.docs[0];
                    if (isMounted) setTagFound(true);
                    await logScanAndRedirect('business', matchedBusiness.id, `/b/${matchedBusiness.id}`);
                    return;
                }

                // 3. Query user profiles
                if (!isMounted) return;
                setLookupState('Checking public member profiles...');
                const uQuery = query(collection(db, 'users'), where('tag_id', '==', tagId));
                const uSnap = await getDocs(uQuery);
                if (!uSnap.empty) {
                    const matchedUser = uSnap.docs[0];
                    if (isMounted) setTagFound(true);
                    await logScanAndRedirect('user', matchedUser.id, `/u/${matchedUser.id}`);
                    return;
                }

                // 4. Tag is unclaimed
                if (isMounted) {
                    setLookupState('Tag is unclaimed.');
                    setLoading(false);
                    await logEvent(
                        'warn',
                        'scan',
                        `Unclaimed physical GridPass QR tag hit: "${tagId}"`,
                        { tagId }
                    );
                }

            } catch (err) {
                console.error("Resolver error:", err);
                if (isMounted) {
                    setErrorMsg("Failed to sync with the digital register.");
                    setLoading(false);
                }
            }
        }

        resolveTag();

        return () => { isMounted = false; };
    }, [tagId, router]);

    // Handle manual tag submission if they land on /join without parameter
    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tagInput.trim()) return;
        router.push(`/join?id=${encodeURIComponent(tagInput.trim())}`);
    };

    if (authLoading || (tagId && loading) || tagFound) {
        return (
            <main className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="mesh-glow" />
                <div className="w-full max-w-md text-center space-y-6 relative z-10">
                    <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-center justify-center text-blue-400 mx-auto shadow-lg animate-pulse">
                        <Compass className="w-10 h-10 animate-spin" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black tracking-tight text-white uppercase">Syncing GridPass Network</h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">{lookupState}</p>
                    </div>
                    {tagId && (
                        <div className="p-3 bg-neutral-900/60 border border-neutral-950 rounded-xl font-mono text-[10px] text-neutral-500 truncate">
                            Routing tag: {tagId}
                        </div>
                    )}
                </div>
            </main>
        );
    }

    // Case A: No tag ID provided. Render manual code resolver.
    if (!tagId) {
        return (
            <main className="min-h-screen bg-[#060608] text-[#f4f4f7] py-20 px-6 relative overflow-hidden flex flex-col justify-center">
                <div className="mesh-glow" />
                <div className="w-full max-w-md mx-auto space-y-8 relative z-10 text-center">
                    <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 mx-auto shadow-md">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-col items-center justify-center gap-1.5 mb-2">
                            <Logo className="w-9 h-9 mx-auto" textClassName="text-3xl" />
                            <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">RESOLVE PORTAL</span>
                        </div>
                        <p className="text-neutral-400 text-sm max-w-xs mx-auto">
                            Enter the alpha-numeric code printed directly underneath your physical GridPass QR tag.
                        </p>
                    </div>

                    <div className="glass-card p-6 rounded-3xl">
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <input
                                type="text"
                                required
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                                placeholder="e.g. GP-4091-AF8"
                                className="glass-input w-full text-center px-4 py-3 rounded-xl font-mono text-lg tracking-widest placeholder:text-neutral-700 font-bold"
                            />
                            <button
                                type="submit"
                                className="btn-glow w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/10"
                            >
                                Resolve Tag
                            </button>
                        </form>
                    </div>

                    <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300 font-bold transition-colors">
                        ← Back to Homepage
                    </Link>
                </div>
            </main>
        );
    }

    const handleClaimPreRegistered = async () => {
        if (!user || !unclaimedVehicle) return;
        setClaimingPreRegistered(true);

        try {
            const vRef = doc(db, 'vehicles', unclaimedVehicle.id);
            await updateDoc(vRef, {
                owner_id: user.uid,
                owner_email: user.email
            });

            await logEvent(
                'success',
                'scan',
                `Claimed pre-registered vehicle ${unclaimedVehicle.year} ${unclaimedVehicle.make} ${unclaimedVehicle.model} (${unclaimedVehicle.id})`,
                { tagId, vehicleId: unclaimedVehicle.id, userEmail: user.email }
            );

            router.push(`/v/${unclaimedVehicle.id}`);
        } catch (error) {
            console.error("Failed to claim pre-registered vehicle:", error);
            alert("Failed to claim vehicle. Please try again.");
            setClaimingPreRegistered(false);
        }
    };

    // Case B: Tag ID is unclaimed.
    return (
        <main className="min-h-screen bg-[#060608] text-[#f4f4f7] py-16 px-4 relative overflow-hidden">
            <div className="mesh-glow" />
            <div className="max-w-xl mx-auto space-y-8 relative z-10">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-semibold text-neutral-300">
                        <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        {unclaimedVehicle && !showAlternativeClaim ? 'Pre-Registered Asset Detected' : 'Unassigned Tag Detected'}
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-1.5 mb-2">
                        <Logo className="w-9 h-9 mx-auto" textClassName="text-3xl md:text-4xl" />
                        <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">CLAIM PORTAL</span>
                    </div>
                    
                    <p className="text-neutral-400 text-sm max-w-sm mx-auto">
                        This physical tag (<span className="text-white font-mono font-bold break-all">{tagId}</span>) is active in the wild but has not been claimed by its owner.
                    </p>
                </div>

                {unclaimedVehicle && !showAlternativeClaim ? (
                    // Rendering Pre-Registered Claim View
                    <div className="space-y-6">
                        <div className="glass-card p-8 rounded-3xl text-center space-y-6 border-red-500/20">
                            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
                                <CarFront className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/5 px-2.5 py-1 rounded-full border border-red-500/10">Active Wild Asset</span>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight pt-1">
                                    {unclaimedVehicle.year} {unclaimedVehicle.make} {unclaimedVehicle.model}
                                </h3>
                                {unclaimedVehicle.partner_dealer && (
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                                        Tagged By: <span className="text-neutral-300">{unclaimedVehicle.partner_dealer}</span>
                                    </p>
                                )}
                            </div>

                            {!user ? (
                                <div className="flex flex-col gap-3 pt-2">
                                    <Link
                                        href={`/login?redirect=/join?id=${tagId}`}
                                        className="btn-glow w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider rounded-xl text-sm transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2"
                                    >
                                        <LogIn className="w-4 h-4" /> Sign In to Claim Vehicle
                                    </Link>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                        Requires a GridPass pilot membership
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={handleClaimPreRegistered}
                                        disabled={claimingPreRegistered}
                                        className="btn-glow w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
                                    >
                                        {claimingPreRegistered ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Claim Ownership of this vehicle
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowAlternativeClaim(true)}
                                        className="text-xs text-neutral-500 hover:text-neutral-300 font-bold transition-colors pt-2 uppercase tracking-wider"
                                    >
                                        Or, re-route this tag to another profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Regular Claim Form (Standard Unassigned code or alternative choice)
                    <>
                        {!user ? (
                            <div className="space-y-6">
                                <div className="glass-card p-8 rounded-3xl text-center space-y-6 border-yellow-500/15">
                                    <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 mx-auto">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Link Your Vehicle Instantly</h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Claim this physical tag to create an immutable digital maintenance profile, verify track check-ins, or manage event registrations under your own custom garage dashboard.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 pt-2">
                                        <Link
                                            href={`/login?redirect=/join?id=${tagId}`}
                                            className="btn-glow w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
                                        >
                                            <LogIn className="w-4 h-4" /> Sign In / Register to Claim
                                        </Link>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                            Requires a free GridPass pilot membership
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="glass-card p-5 rounded-2xl space-y-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <CarFront className="w-4.5 h-4.5" />
                                        </div>
                                        <h4 className="text-sm font-bold text-white">Digital Garage</h4>
                                        <p className="text-neutral-400 text-xs leading-relaxed">Track service history, dealership mods, and dyno slips on a single permanent page.</p>
                                    </div>
                                    <div className="glass-card p-5 rounded-2xl space-y-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <ShieldCheck className="w-4.5 h-4.5" />
                                        </div>
                                        <h4 className="text-sm font-bold text-white">Ownership Transfers</h4>
                                        <p className="text-neutral-400 text-xs leading-relaxed">Selling your ride? Transfer the entire verified history and tag link in one click.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <ClaimTagForm tagId={tagId} />
                        )}

                        {showAlternativeClaim && unclaimedVehicle && (
                            <div className="text-center pt-4">
                                <button
                                    onClick={() => setShowAlternativeClaim(false)}
                                    className="text-xs text-neutral-500 hover:text-neutral-300 font-bold transition-colors uppercase tracking-wider"
                                >
                                    ← Back to pre-registered vehicle claim
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>
        </main>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </main>
        }>
            <JoinPageContent />
        </Suspense>
    );
}
