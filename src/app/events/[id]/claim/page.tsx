'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ToastContext';

export default function ClaimEventPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const token = searchParams.get('token');
  
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      setLoading(true);
      setErrorMsg(null);
      
      try {
        const snap = await getDoc(doc(db, 'events', eventId));
        if (!snap.exists()) {
          setErrorMsg('This Event Hub registry does not exist or has expired.');
          setLoading(false);
          return;
        }
        
        const data = snap.data();
        
        // 1. Check if already claimed
        if (data.is_claimed || data.claim_status === 'claimed') {
          setErrorMsg('This Event Hub has already been claimed by another organizer.');
          setLoading(false);
          return;
        }
        
        // 2. Verify token
        if (!token || data.claim_token !== token) {
          setErrorMsg('Invalid or Expired Magic Claim Token. Please contact your administrator for a valid invite link.');
          setLoading(false);
          return;
        }
        
        setEventData(data);
      } catch (err) {
        console.error('Error fetching claim event:', err);
        setErrorMsg('Failed to load event details. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId, token]);

  const handleClaim = async () => {
    if (!user) {
      // Store redirect target
      router.push(`/login?redirect=/events/${eventId}/claim?token=${token}`);
      return;
    }
    
    setClaiming(true);
    try {
      const eventRef = doc(db, 'events', eventId);
      
      const updateData = {
        host_uid: user.uid,
        host_name: user.displayName || user.email || 'Event Organizer',
        is_claimed: true,
        claim_status: 'claimed',
        claim_date: new Date().toISOString(),
        allow_vehicles: true,
        allow_spectators: true,
        allow_vendors: true
      };
      
      await setDoc(eventRef, updateData, { merge: true });
      
      showToast({
        title: "Event Hub Claimed!",
        message: `You are now the official organizer of "${eventData.title}"!`,
        icon: "🎉"
      });
      
      // Redirect to edit page
      router.push(`/events/${eventId}/edit`);
    } catch (err) {
      console.error('Error claiming event:', err);
      showToast({
        title: "Claim Failed",
        message: "Failed to claim event. Please check your permissions and try again.",
        icon: "⚠️"
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-12 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-[2rem] border border-neutral-200 text-center shadow-2xl space-y-6">
        
        {errorMsg ? (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-50 text-[#ff3b30] border border-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-black uppercase text-neutral-900 tracking-tight">Claim Failed</h1>
            <p className="text-xs text-neutral-500 leading-relaxed">{errorMsg}</p>
            <div className="pt-2">
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Event Directory
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="mx-auto w-12 h-12 bg-neutral-100 text-neutral-900 border border-neutral-200 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-md uppercase tracking-wider">
                🔑 Organizer Invite
              </span>
              <h1 className="text-base sm:text-xl font-black uppercase text-neutral-900 tracking-tight pt-2">
                Claim Event Hub
              </h1>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto pt-0.5 leading-relaxed">
                Take control of this event registry, manage driver staging categories, and access check-in analytics.
              </p>
            </div>
            
            {/* Event Summary Card */}
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 text-left space-y-2">
              <h2 className="text-xs font-extrabold uppercase text-[#1c1c1e] tracking-wider truncate">
                {eventData?.title}
              </h2>
              <div className="text-[10px] text-neutral-500 font-mono font-bold space-y-0.5">
                <p>📍 Location: {eventData?.location_name || 'Location Unspecified'}</p>
                <p>📅 Date: {eventData?.date_str}</p>
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full min-h-[44px] py-2.5 px-6 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-300 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Claiming...
                  </>
                ) : user ? (
                  "🚀 Claim Event Hub"
                ) : (
                  "🔑 Login to Claim Event"
                )}
              </button>
              
              <Link
                href={`/events/${eventId}`}
                className="block text-[10px] font-mono font-bold text-neutral-400 hover:text-neutral-600 uppercase transition-all tracking-wider py-1.5"
              >
                Preview Event Page (Read-Only)
              </Link>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
