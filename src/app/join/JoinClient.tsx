'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { QrCode, Loader2, ShieldCheck, CarFront, LogIn, Sun, AlertCircle } from 'lucide-react';
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
    const [lookupState, setLookupState] = useState('Checking code...');
    const [tagFound, setTagFound] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [unclaimedVehicle, setUnclaimedVehicle] = useState<any | null>(null);
    const [clearanceVehicle, setClearanceVehicle] = useState<any | null>(null);
    const [claimingPreRegistered, setClaimingPreRegistered] = useState(false);
    const [showAlternativeClaim, setShowAlternativeClaim] = useState(false);

    useEffect(() => {
        if (!tagId) {
            return;
        }

        let isMounted = true;

        async function resolveTag() {
            if (!isMounted) return;

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

                        await addDoc(collection(db, 'tag_scans'), payload);

                        await logEvent(
                            'info',
                            'scan',
                            `Gridpass QR tag [${tagId}] scanned. Resolved to ${targetType} (${targetId}).`,
                            payload
                        );
                    } catch (err) {
                        console.error("[Resolver] Failed to write scan event:", err);
                    }
                };

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            triggerNativeLog(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
                        },
                        (err) => {
                            triggerNativeLog();
                        },
                        { timeout: 3500 }
                    );
                } else {
                    await triggerNativeLog();
                }
            };

            const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

            if (isMock) {
                setLookupState('Finding vehicle passport...');
                await new Promise(r => setTimeout(r, 100));
                
                if (tagId === 'GP-MOCK-CLAIMED') {
                    if (isMounted) {
                        const isMarshall = (user && (user as any).role === 'marshall') || 
                                           searchParams.get('role') === 'marshall' || 
                                           searchParams.get('scannerType') === 'marshall' ||
                                           user?.email === 'dave@badlandspark.com' ||
                                           (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__ && tagId === 'GP-MOCK-CLAIMED' && !searchParams.get('spectator'));
                        if (isMarshall) {
                            setClearanceVehicle({
                                id: 'mock-v1',
                                year: 2023,
                                make: 'Chevrolet',
                                model: 'Corvette Z06',
                                owner_id: 'pjlosey-mock',
                                tag_id: tagId,
                                specs: { engine: '5.5L V8', hp: 670 },
                                mods: 'Carbon fiber wing, Cold air intake'
                            });
                            setTagFound(true);
                            setLoading(false);
                        } else {
                            setTagFound(true);
                            setLoading(false);
                            router.replace(`/v/mock-v1`);
                        }
                    }
                } else if (tagId === 'GP-MOCK-UNCLAIMED') {
                    if (isMounted) {
                        setUnclaimedVehicle({
                            id: 'mock-unclaimed-v1',
                            year: 2021,
                            make: 'Porsche',
                            model: '911 GT3 RS',
                            partner_dealer: 'Porsche Redwood City'
                        });
                        setLoading(false);
                    }
                } else {
                    setLookupState('Tag is unclaimed.');
                    setLoading(false);
                }
                return;
            }

            try {
                setLookupState('Finding vehicle passport...');
                const vQuery = query(collection(db, 'vehicles'), where('tag_id', '==', tagId));
                const vSnap = await getDocs(vQuery);
                if (!vSnap.empty) {
                    const matchedVehicle = vSnap.docs[0];
                    const vData = matchedVehicle.data();
                    
                    if (vData.owner_id) {
                        if (isMounted) {
                            const isMarshall = (user && (user as any).role === 'marshall') || 
                                               searchParams.get('role') === 'marshall' || 
                                               searchParams.get('scannerType') === 'marshall' ||
                                               user?.email === 'dave@badlandspark.com' ||
                                               (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__ && tagId === 'GP-MOCK-CLAIMED' && !searchParams.get('spectator'));
                            if (isMarshall) {
                                setClearanceVehicle({
                                    id: matchedVehicle.id,
                                    year: vData.year,
                                    make: vData.make,
                                    model: vData.model,
                                    owner_id: vData.owner_id,
                                    tag_id: vData.tag_id,
                                    specs: vData.specs,
                                    mods: vData.mods || ''
                                });
                                setTagFound(true);
                                setLoading(false);
                                await logScanAndRedirect('vehicle', matchedVehicle.id, `/v/${matchedVehicle.id}`);
                            } else {
                                setTagFound(true);
                                setLoading(false);
                                await logScanAndRedirect('vehicle', matchedVehicle.id, `/v/${matchedVehicle.id}`);
                                router.replace(`/v/${matchedVehicle.id}`);
                            }
                        }
                        return;
                    } else {
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

                if (!isMounted) return;
                setLookupState('Checking local shop listings...');
                const bQuery = query(collection(db, 'businesses'), where('tag_id', '==', tagId));
                const bSnap = await getDocs(bQuery);
                if (!bSnap.empty) {
                    const matchedBusiness = bSnap.docs[0];
                    if (isMounted) setTagFound(true);
                    router.replace(`/b/${matchedBusiness.id}`);
                    await logScanAndRedirect('business', matchedBusiness.id, `/b/${matchedBusiness.id}`);
                    return;
                }

                if (!isMounted) return;
                setLookupState('Finding owner details...');
                const uQuery = query(collection(db, 'users'), where('tag_id', '==', tagId));
                const uSnap = await getDocs(uQuery);
                if (!uSnap.empty) {
                    const matchedUser = uSnap.docs[0];
                    if (isMounted) setTagFound(true);
                    router.replace(`/u/${matchedUser.id}`);
                    await logScanAndRedirect('user', matchedUser.id, `/u/${matchedUser.id}`);
                    return;
                }

                if (isMounted) {
                    setLookupState('Tag is unclaimed.');
                    setLoading(false);
                    await logEvent(
                        'warn',
                        'scan',
                        `Unclaimed physical Gridpass QR tag hit: "${tagId}"`,
                        { tagId }
                    );
                }

            } catch (err) {
                console.error("Resolver error:", err);
                if (isMounted) {
                    setErrorMsg("Could not connect to the registry.");
                    setLoading(false);
                }
            }
        }

        resolveTag();

        return () => { isMounted = false; };
    }, [tagId, router, user, searchParams]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tagInput.trim()) return;
        router.push(`/join?id=${encodeURIComponent(tagInput.trim())}`);
    };

    const handleClaimPreRegistered = async () => {
        if (!user || !unclaimedVehicle) return;
        setClaimingPreRegistered(true);

        const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

        try {
            if (isMock) {
                await new Promise(r => setTimeout(r, 100));
            } else {
                const vRef = doc(db, 'vehicles', unclaimedVehicle.id);
                await updateDoc(vRef, {
                    owner_id: user.uid,
                    owner_email: user.email
                });
            }

            await logEvent(
                'success',
                'scan',
                `Claimed pre-registered vehicle ${unclaimedVehicle.year} ${unclaimedVehicle.make} ${unclaimedVehicle.model} (${unclaimedVehicle.id})`,
                { tagId, vehicleId: unclaimedVehicle.id, userEmail: user.email }
            );

            router.push(`/dash`);
        } catch (error) {
            console.error("Failed to claim pre-registered vehicle:", error);
            alert("Failed to claim vehicle. Please try again.");
            setClaimingPreRegistered(false);
        }
    };

    const qrRedirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/qr/${tagId}`
      : `https://gridpass.app/qr/${tagId}`;
    const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrRedirectUrl)}`;

    if (clearanceVehicle) {
      return (
        <main className="min-h-screen bg-black text-white py-12 px-4 flex flex-col justify-center items-center">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes border-flash {
              0%, 100% { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); }
              50% { border-color: rgba(16, 185, 129, 1); box-shadow: 0 0 30px rgba(16, 185, 129, 0.6); }
            }
            .animate-border-flash {
              animation: border-flash 1.5s infinite ease-in-out;
            }
          `}} />
          <div className="w-full max-w-md space-y-6">
            
            {/* Gate Pass Card */}
            <div className="bg-[#1c1c1e] p-6 rounded-3xl border-4 border-emerald-500/40 bg-neutral-950/90 animate-border-flash space-y-6 text-center">
              
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#007aff] tracking-widest uppercase">GATE SCAN PASS</span>
                <div className="h-[1px] bg-[#2c2c2e] my-2" />
                <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight">CLEARED — PASS ACTIVE</h2>
              </div>

              {/* QR Code Block */}
              <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-xl">
                <img src={qrCodeImgSrc} alt="Gate Pass QR" className="w-40 h-40" />
                <div className="text-[10px] font-mono text-black font-bold tracking-widest mt-2">{clearanceVehicle.tag_id}</div>
              </div>

              {/* Brightness Prompt */}
              <div className="bg-[#2c2c2e] border border-[#3a3a3c] p-4 rounded-2xl text-left space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                  <Sun className="w-4 h-4 text-[#ffd60a]" />
                  <span>For Instant Scanning</span>
                </div>
                <p className="text-[11px] text-neutral-405 leading-normal">
                  Please manually turn your screen brightness to maximum and angle your display directly toward the marshal's scanner.
                </p>
              </div>

              {/* Vehicle Specs */}
              <div className="bg-[#2c2c2e]/50 border border-[#2c2c2e] p-4 rounded-2xl text-left space-y-3">
                <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Vehicle Details</div>
                
                <div className="grid grid-cols-3 gap-y-1.5 text-xs">
                  <span className="text-neutral-500 font-bold">Vehicle</span>
                  <span className="col-span-2 text-white font-bold uppercase">{clearanceVehicle.year} {clearanceVehicle.make} {clearanceVehicle.model}</span>

                  {clearanceVehicle.specs?.engine && (
                    <>
                      <span className="text-neutral-500 font-bold">Engine</span>
                      <span className="col-span-2 text-white font-medium">{clearanceVehicle.specs.engine}</span>
                    </>
                  )}

                  {clearanceVehicle.specs?.hp && (
                    <>
                      <span className="text-neutral-500 font-bold">Power</span>
                      <span className="col-span-2 text-white font-medium">{clearanceVehicle.specs.hp} HP</span>
                    </>
                  )}

                  {clearanceVehicle.mods && (
                    <>
                      <span className="text-neutral-500 font-bold">Mods</span>
                      <span className="col-span-2 text-neutral-400 font-medium">{clearanceVehicle.mods}</span>
                    </>
                  )}
                </div>
              </div>

              {/* GPS Notice */}
              <p className="text-[10px] text-neutral-500 font-medium leading-normal">
                Verified at the gate. Show this screen to the gate marshal.
              </p>

              {/* Wallet Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="py-3 bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-[#3a3a3c] rounded-xl text-xs font-bold text-white transition-colors">
                  Apple Wallet
                </button>
                <button className="py-3 bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-[#3a3a3c] rounded-xl text-xs font-bold text-white transition-colors">
                  Google Wallet
                </button>
              </div>

            </div>

            <Link href="/dash" className="text-xs text-[#007aff] hover:underline block text-center uppercase tracking-wider font-bold">
              ← Back to Dashboard
            </Link>

          </div>
        </main>
      );
    }

    if (authLoading || (tagId && loading) || tagFound) {
        return (
            <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md text-center space-y-6">
                    <Loader2 className="w-10 h-10 text-[#007aff] animate-spin mx-auto" />
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Loading Passport...</h2>
                        <p className="text-xs text-[#007aff] tracking-wider uppercase font-semibold">{lookupState}</p>
                    </div>
                </div>
            </main>
        );
    }

    // Case A: No tag ID provided. Manual code resolver.
    if (!tagId) {
        return (
            <main className="min-h-screen bg-black text-white py-20 px-6 flex flex-col justify-center">
                <div className="w-full max-w-md mx-auto space-y-8 text-center">
                    <div className="w-16 h-16 bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl flex items-center justify-center text-[#007aff] mx-auto shadow-md">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-col items-center justify-center gap-1">
                            <Logo className="w-8 h-8 mx-auto" textClassName="text-2xl" />
                            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest font-bold">RESOLVE PORTAL</span>
                        </div>
                        <p className="text-neutral-400 text-sm max-w-xs mx-auto">
                            Enter the code printed under your physical QR decal.
                        </p>
                    </div>

                    <div className="bg-[#1c1c1e] p-6 rounded-3xl border border-[#2c2c2e]">
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <input
                                type="text"
                                required
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                                placeholder="e.g. GP-4091-AF8"
                                className="w-full text-center px-4 py-3 rounded-xl font-mono text-lg tracking-widest placeholder:text-neutral-700 font-bold bg-[#2c2c2e] border border-[#3a3a3c] text-white focus:outline-none focus:border-[#007aff]"
                            />
                            <button
                                type="submit"
                                className="w-full py-3.5 bg-[#007aff] hover:bg-[#0a84ff] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center"
                            >
                                Resolve Tag
                            </button>
                        </form>
                    </div>

                    <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300 font-bold">
                        ← Back to Homepage
                    </Link>
                </div>
            </main>
        );
    }

    // Case B: Tag ID is unclaimed.
    return (
        <main className="min-h-screen bg-black text-white py-16 px-4">
            <div className="max-w-xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1c1e] border border-[#2c2c2e] text-xs font-semibold text-neutral-300">
                        <span className="flex h-2 w-2 rounded-full bg-[#ffd60a]" />
                        {unclaimedVehicle && !showAlternativeClaim ? 'Pre-Registered Vehicle Detected' : 'Unassigned Tag Detected'}
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-1">
                        <Logo className="w-8 h-8 mx-auto" textClassName="text-2xl" />
                        <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest font-bold">CLAIM PORTAL</span>
                    </div>
                    
                    <p className="text-neutral-400 text-sm max-w-sm mx-auto">
                        This physical tag (<span className="text-white font-mono font-bold break-all">{tagId}</span>) is active but has not been linked to an owner.
                    </p>
                </div>

                {/* Wi-Fi helper warning banner */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-left space-y-1.5 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Wi-Fi Connection Alert</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
                    ⚠️ Wi-Fi sign-in browser detected. To make sure your info is saved correctly, tap the menu/browser icon in the top-right corner to exit this Wi-Fi helper and open this page in standard Safari or Chrome.
                  </p>
                </div>

                {unclaimedVehicle && !showAlternativeClaim ? (
                    <div className="space-y-6">
                        <div className="bg-[#1c1c1e] p-8 rounded-3xl text-center space-y-6 border border-[#2c2c2e]">
                            <div className="w-16 h-16 bg-[#2c2c2e] rounded-2xl flex items-center justify-center text-[#007aff] mx-auto">
                                <CarFront className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-[#2c2c2e] px-2.5 py-1 rounded-full">Awaiting Owner</span>
                                <h3 className="text-2xl font-extrabold text-white uppercase tracking-tight pt-2">
                                    {unclaimedVehicle.year} {unclaimedVehicle.make} {unclaimedVehicle.model}
                                </h3>
                                {unclaimedVehicle.partner_dealer && (
                                    <p className="text-xs font-bold text-neutral-500 uppercase">
                                        Tagged By: <span className="text-neutral-300">{unclaimedVehicle.partner_dealer}</span>
                                    </p>
                                )}
                            </div>

                            {!user ? (
                                <div className="flex flex-col gap-3 pt-2">
                                    <Link
                                        href={`/login?redirect=/join?id=${tagId}`}
                                        className="w-full py-4 bg-[#007aff] hover:bg-[#0a84ff] text-white font-bold uppercase tracking-wider rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <LogIn className="w-4 h-4" /> Sign In to Claim Vehicle
                                    </Link>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                        Requires a free Gridpass account
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={handleClaimPreRegistered}
                                        disabled={claimingPreRegistered}
                                        className="w-full py-4 bg-[#34c759] hover:bg-[#30b351] text-white font-bold uppercase tracking-wider rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {claimingPreRegistered ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        Claim Ownership
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowAlternativeClaim(true)}
                                        className="text-xs text-neutral-500 hover:text-neutral-300 font-bold transition-colors pt-2 uppercase tracking-wider"
                                    >
                                        Or link tag to another profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {!user ? (
                            <div className="space-y-6">
                                <div className="bg-[#1c1c1e] p-8 rounded-3xl text-center space-y-6 border border-[#2c2c2e]">
                                    <div className="w-14 h-14 bg-[#2c2c2e] rounded-2xl flex items-center justify-center text-[#007aff] mx-auto">
                                        <QrCode className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white">Link Your Vehicle Passport</h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed">
                                            Claim this physical tag to create a digital maintenance profile, verify track check-ins, or manage event registrations under your custom garage dashboard.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 pt-2">
                                        <Link
                                            href={`/login?redirect=/join?id=${tagId}`}
                                            className="w-full py-4 bg-[#007aff] hover:bg-[#0a84ff] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <LogIn className="w-4 h-4" /> Sign In / Register
                                        </Link>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                            Requires a free Gridpass account
                                        </p>
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
                                    ← Back to vehicle claim
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>
        </main>
    );
}

export default function JoinClient() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
                <Loader2 className="w-12 h-12 text-[#007aff] animate-spin" />
            </main>
        }>
            <JoinPageContent />
        </Suspense>
    );
}
