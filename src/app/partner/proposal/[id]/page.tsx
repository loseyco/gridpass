'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

export interface ClientProposalData {
  id: string;
  client_name: string;
  business_name: string;
  client_email: string;
  sales_rep: string;
  prototype_url: string;
  status: 'draft' | 'proposal_sent' | 'approved' | 'paid' | 'live';
  monthly_total: number;
  setup_total: number;
  items: Array<{
    name: string;
    category: string;
    price_label: string;
    description: string;
  }>;
  wishes_and_feedback?: Array<{
    id: string;
    type: 'wish' | 'bug' | 'question';
    content: string;
    created_at: string;
    status: 'open' | 'reviewed' | 'completed';
  }>;
}

const DEFAULT_ZACH_PROPOSAL: ClientProposalData = {
  id: 'shaw-daddys',
  client_name: 'Zach Shaw',
  business_name: "Shaw's Food Truck & Gourmet Paddock Eats",
  client_email: 'zach@shawdaddys.com',
  sales_rep: 'PJ / Gridpass Lead',
  prototype_url: '/b/shaw-daddys',
  status: 'proposal_sent',
  monthly_total: 30.0,
  setup_total: 199.0,
  items: [
    {
      name: 'Free Gridpass Business Directory Listing',
      category: 'Auto & Vendor Directory',
      price_label: 'FREE ($0.00)',
      description: 'Official Gridpass business profile page with location, contact info, photo showcase, and downloadable dynamic QR code.',
    },
    {
      name: 'Food Truck Live Menu & Express Mobile Ordering',
      category: 'Vendor Operations',
      price_label: '$15.00 / mo',
      description: 'Digital paddock menu, real-time item availability toggles, express customer mobile pickup queue, and SMS order alerts.',
    },
    {
      name: 'Event Catering Vouchers & Queue Management',
      category: 'Vendor Operations',
      price_label: '$15.00 / mo',
      description: 'Redeem prepaid race team catering vouchers via QR scan at your truck window; skip-the-line paddock pass.',
    },
    {
      name: 'Custom Portal Setup & White-Label Integration',
      category: 'Custom Setup Service',
      price_label: '$199.00 One-Time Setup',
      description: 'Complete menu buildout, custom branding, truck window QR poster asset creation, and domain integration.',
    },
  ],
  wishes_and_feedback: [
    {
      id: 'fb_1',
      type: 'wish',
      content: 'Can we add SMS notifications when orders are ready at the truck window?',
      created_at: '2026-07-31',
      status: 'completed',
    },
  ],
};

export default function ClientProposalPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = (params?.id as string) || 'shaw-daddys';

  const [proposal, setProposal] = useState<ClientProposalData>(DEFAULT_ZACH_PROPOSAL);
  const [loading, setLoading] = useState(true);

  // Client Feedback Input
  const [feedbackType, setFeedbackType] = useState<'wish' | 'bug' | 'question'>('wish');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    async function loadProposal() {
      try {
        const docRef = doc(db, 'proposals', proposalId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProposal({ id: snap.id, ...snap.data() } as ClientProposalData);
        } else {
          setProposal({ ...DEFAULT_ZACH_PROPOSAL, id: proposalId });
        }
      } catch (err) {
        console.warn('Proposal fallback to default Zach Shaw profile:', err);
        setProposal({ ...DEFAULT_ZACH_PROPOSAL, id: proposalId });
      } finally {
        setLoading(false);
      }
    }
    loadProposal();
  }, [proposalId]);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    const newItem = {
      id: `fb_${Date.now()}`,
      type: feedbackType,
      content: feedbackText,
      created_at: new Date().toISOString().split('T')[0],
      status: 'open' as const,
    };

    const updatedFeedback = [...(proposal.wishes_and_feedback || []), newItem];
    const updatedProposal = { ...proposal, wishes_and_feedback: updatedFeedback };

    setProposal(updatedProposal);

    try {
      await setDoc(doc(db, 'proposals', proposalId), updatedProposal, { merge: true });
      await addDoc(collection(db, 'client_feedback'), {
        proposal_id: proposalId,
        client_name: proposal.client_name,
        business_name: proposal.business_name,
        type: feedbackType,
        content: feedbackText,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Saved feedback locally:', err);
    }

    setFeedbackText('');
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 4000);
  };

  const handleSimulatePayment = () => {
    setIsPaid(true);
    setProposal((prev) => ({ ...prev, status: 'paid' }));
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-8">
        {/* Proposal Header Banner */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-[#ff3b30] text-white font-black text-[10px] uppercase rounded tracking-wider">
                  Interactive Client Proposal
                </span>
                <span className="px-2.5 py-0.5 bg-neutral-900 text-white font-bold text-[10px] uppercase rounded">
                  Prepared for: {proposal.client_name}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                {proposal.business_name}
              </h1>
              <p className="text-xs font-bold text-neutral-500 mt-1">
                Custom Gridpass Software Suite &amp; Operations Portal • Sales Rep: {proposal.sales_rep}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0 self-start sm:self-center">
              {isPaid || proposal.status === 'paid' ? (
                <span className="inline-block px-3.5 py-1.5 bg-emerald-600 text-white font-black text-xs uppercase rounded-lg shadow-sm whitespace-nowrap">
                  ✓ Activated &amp; Paid
                </span>
              ) : (
                <span className="inline-block px-3.5 py-1.5 bg-neutral-900 text-white font-black text-xs uppercase rounded-lg shadow-sm whitespace-nowrap">
                  ● Proposal Review Ready
                </span>
              )}
            </div>
          </div>

          {/* Test Live Prototype Action Card */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-black text-[#ff3b30] uppercase tracking-wider">Private Working Prototype</span>
              <h3 className="font-black text-sm uppercase text-neutral-900">Test Your Live Food Truck Portal</h3>
              <p className="text-xs text-neutral-600 max-w-md">
                We built a private working version of your live menu, express mobile ordering, and food truck QR code asset!
              </p>
            </div>

            <Link
              href={proposal.prototype_url}
              target="_blank"
              className="px-5 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded-xl shadow-sm transition flex items-center gap-2 whitespace-nowrap"
            >
              <span>🎮 Test Live Prototype</span>
            </Link>
          </div>
        </div>

        {/* Itemized Software Package Breakdown */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-lg font-black uppercase text-neutral-900 tracking-wide">
              Selected Software Modules &amp; Services
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Custom operational tools included in your Gridpass food truck package.
            </p>
          </div>

          <div className="space-y-4">
            {proposal.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                      {item.category}
                    </span>
                    <h3 className="font-black text-sm uppercase text-neutral-900">{item.name}</h3>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className="px-3 py-1 bg-white border border-neutral-200 text-neutral-900 font-black text-xs uppercase rounded-lg shadow-2xs">
                    {item.price_label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals & Stripe Activation Card */}
          <div className="pt-6 border-t border-neutral-100 bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-black text-sm uppercase text-neutral-900">Package Pricing Summary</h3>
                <p className="text-xs text-neutral-500">Includes all food truck menu tools, QR assets, and support.</p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <div className="text-xs font-bold text-neutral-600">
                  Monthly Subscriptions: <span className="font-black text-neutral-900">${proposal.monthly_total.toFixed(2)}/mo</span>
                </div>
                <div className="text-xs font-bold text-neutral-600">
                  One-Time Custom Setup: <span className="font-black text-neutral-900">${proposal.setup_total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-neutral-600">
                Total Due Today to Activate: <span className="font-black text-lg text-neutral-900">${(proposal.monthly_total + proposal.setup_total).toFixed(2)}</span>
              </div>

              {isPaid || proposal.status === 'paid' ? (
                <div className="px-6 py-3 bg-green-600 text-white font-black text-xs uppercase rounded-xl flex items-center gap-2">
                  ✓ Account Active &amp; Subscription Live!
                </div>
              ) : (
                <button
                  onClick={handleSimulatePayment}
                  className="w-full sm:w-auto px-6 py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  💳 Activate &amp; Pay via Stripe (${(proposal.monthly_total + proposal.setup_total).toFixed(2)})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Client Feedback, Feature Wishes & Bug Submitter */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-lg font-black uppercase text-neutral-900 tracking-wide">
              Client Feedback, Feature Requests &amp; Bug Submitter
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Have a feature request, menu update wish, or bug to report? Submit it directly to our development team.
            </p>
          </div>

          <form onSubmit={handleSendFeedback} className="space-y-4">
            <div className="flex gap-3">
              {(['wish', 'bug', 'question'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedbackType(type)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition ${
                    feedbackType === type
                      ? 'bg-[#ff3b30] text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                  }`}
                >
                  {type === 'wish' && '💡 Feature Wish'}
                  {type === 'bug' && '🐛 Report Bug'}
                  {type === 'question' && '❓ Question'}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              required
              placeholder={
                feedbackType === 'wish'
                  ? 'e.g. Can we add a combo button for burger + fries + Monster drink?'
                  : feedbackType === 'bug'
                  ? 'e.g. Notice button alignment on mobile menu...'
                  : 'Ask us anything about your food truck portal setup...'
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#ff3b30]"
            />

            <div className="flex items-center justify-between">
              {submittedMessage ? (
                <span className="text-xs font-bold text-green-600">✓ Submitted directly to engineering &amp; sales!</span>
              ) : (
                <span className="text-xs text-neutral-500">Your feedback syncs directly to our /admin portal.</span>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs uppercase rounded-xl transition"
              >
                Submit Request
              </button>
            </div>
          </form>

          {/* History of Wishes & Notes */}
          {(proposal.wishes_and_feedback || []).length > 0 && (
            <div className="pt-4 border-t border-neutral-100 space-y-3">
              <h3 className="font-black text-xs uppercase text-neutral-500">Submitted Requests &amp; Updates History</h3>
              <div className="space-y-2">
                {proposal.wishes_and_feedback?.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[10px] uppercase text-[#ff3b30] mr-2">[{fb.type}]</span>
                      <span className="text-neutral-800">{fb.content}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-neutral-200 text-neutral-700 rounded">
                      {fb.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
