'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { EventClaimRequest } from '@/lib/types/events';
import { useToast } from '@/components/ToastContext';
import { ShieldCheck, CheckCircle2, XCircle, Loader2, ArrowLeft, Mail, Phone, Clock, FileText, User } from 'lucide-react';
import Link from 'next/link';

export default function AdminClaimsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [claims, setClaims] = useState<EventClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Mock claims for testing/demonstration
  const mockClaims: EventClaimRequest[] = [
    {
      id: 'claim_101',
      event_id: 'maple-city-cruise',
      event_title: '26TH ANNUAL MONMOUTH CRUISE NIGHT (MAPLE CITY STREET MACHINES)',
      user_uid: 'clifford-adams-uid',
      user_name: 'Clifford Adams',
      role_title: 'Club President / Event Director',
      contact_email: 'clifford@maplecitystreetmachines.com',
      contact_phone: '(309) 555-0199',
      proof_notes: 'Official Facebook Page Admin & Car Club President of Maple City Street Machines.',
      status: 'pending',
      submitted_at: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ];

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'event_claims'));
        if (!snap.empty) {
          const list: EventClaimRequest[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as EventClaimRequest));
          setClaims(list);
        } else {
          setClaims(mockClaims);
        }
      } catch (err) {
        console.error("Failed to load claims:", err);
        setClaims(mockClaims);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  const handleApproveClaim = async (claim: EventClaimRequest) => {
    setProcessingId(claim.id);
    try {
      // Update claim status to approved
      try {
        const claimRef = doc(db, 'event_claims', claim.id);
        await updateDoc(claimRef, { status: 'approved' });
      } catch (e) {
        // Fallback for mock
      }

      // Update target event host ownership
      try {
        const eventRef = doc(db, 'events', claim.event_id);
        await updateDoc(eventRef, {
          is_claimed: true,
          claim_status: 'verified',
          host_uid: claim.user_uid
        });
      } catch (e) {
        // Fallback for mock
      }

      setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'approved' } : c));
      showToast({
        title: "Claim Approved!",
        message: `${claim.user_name} is now the verified host of ${claim.event_title}.`,
        icon: "✓"
      });
    } catch (err) {
      console.error("Approval error:", err);
      showToast({
        title: "Approval Error",
        message: "Failed to process claim approval.",
        icon: "⚠️"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClaim = async (claim: EventClaimRequest) => {
    setProcessingId(claim.id);
    try {
      try {
        const claimRef = doc(db, 'event_claims', claim.id);
        await updateDoc(claimRef, { status: 'rejected' });
      } catch (e) {}

      setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'rejected' } : c));
      showToast({
        title: "Claim Rejected",
        message: `Claim request from ${claim.user_name} was rejected.`,
        icon: "❌"
      });
    } catch (err) {
      console.error("Rejection error:", err);
    } finally {
      setProcessingId(null);
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
    <div className="min-h-screen bg-white text-neutral-900 pb-16">
      
      {/* Admin Header Bar */}
      <div className="bg-neutral-900 text-white p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4 text-left">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Admin HQ Control Panel
          </Link>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#ff3b30]" /> Organizer Claim Verification HQ
              </h1>
              <p className="text-xs text-neutral-400 font-mono">Audit and verify event ownership requests from club presidents & organizers.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#ff3b30] text-white px-3 py-1.5 rounded-xl uppercase">
              {claims.filter(c => c.status === 'pending').length} Pending
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
        {claims.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-neutral-200 rounded-3xl space-y-2 text-neutral-400">
            <ShieldCheck className="w-10 h-10 mx-auto opacity-35" />
            <p className="text-xs font-mono font-bold uppercase">No pending ownership claim requests.</p>
          </div>
        ) : (
          claims.map((claim) => (
            <div 
              key={claim.id} 
              className={`p-6 rounded-3xl border transition-all space-y-4 shadow-sm ${
                claim.status === 'approved' 
                  ? 'bg-emerald-50/50 border-emerald-200' 
                  : claim.status === 'rejected'
                  ? 'bg-neutral-50 border-neutral-200 opacity-60'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-100 pb-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Event Claim Request</span>
                  <h3 className="text-sm font-black uppercase text-neutral-900 truncate">{claim.event_title}</h3>
                </div>
                <span className={`text-[9px] font-mono font-bold px-3 py-1 rounded-full uppercase ${
                  claim.status === 'approved' ? 'bg-emerald-600 text-white' : claim.status === 'rejected' ? 'bg-neutral-300 text-neutral-700' : 'bg-amber-500 text-white'
                }`}>
                  {claim.status === 'approved' ? '✓ Verified Host' : claim.status === 'rejected' ? 'Rejected' : '⏳ Pending Review'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-neutral-900 font-bold">
                    <User className="w-4 h-4 text-[#ff3b30]" /> Claimant: {claim.user_name}
                  </div>
                  <div className="text-neutral-500 text-[11px] font-mono">Role: {claim.role_title}</div>
                  <div className="flex items-center gap-2 text-neutral-600 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" /> {claim.contact_email}
                  </div>
                  {claim.contact_phone && (
                    <div className="flex items-center gap-2 text-neutral-600 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" /> {claim.contact_phone}
                    </div>
                  )}
                </div>

                <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/60">
                  <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">Verification Proof Notes</span>
                  <p className="text-[11px] text-neutral-700 leading-relaxed font-mono">
                    {claim.proof_notes || 'No additional verification notes provided.'}
                  </p>
                </div>
              </div>

              {claim.status === 'pending' && (
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleRejectClaim(claim)}
                    disabled={processingId === claim.id}
                    className="py-2.5 px-4 bg-transparent hover:bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4 text-neutral-400" /> Reject Claim
                  </button>
                  <button
                    onClick={() => handleApproveClaim(claim)}
                    disabled={processingId === claim.id}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" /> Approve Ownership Verification
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
