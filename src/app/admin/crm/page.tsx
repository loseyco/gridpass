'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { MemberUser } from '@/lib/types/admin';
import { BusinessProfile } from '@/lib/types/business';

export type CrmDealStage = 'lead_intake' | 'proposal_sent' | 'in_negotiation' | 'closed_won' | 'closed_lost';

export interface CrmDealItem {
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  business_name: string;
  vertical: 'food_truck' | 'auto_shop' | 'race_team' | 'track_venue';
  stage: CrmDealStage;
  assigned_rep: string;
  commission_rate: number; // e.g. 50% for Zach Shaw
  mrr: number;
  setup_fee: number;
  proposal_link?: string;
  notes?: string;
  created_at: string;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  category: string;
  pricing_model: string;
  price: number;
  description: string;
}

const DEFAULT_PRODUCTS: ProductCatalogItem[] = [
  {
    id: 'prod_shop_basic',
    name: 'Free Business Directory Listing',
    category: 'auto_shop',
    pricing_model: 'free',
    price: 0,
    description: 'Basic business directory page on Gridpass map with name, location, contact info, and business QR code.',
  },
  {
    id: 'prod_vendor_food',
    name: 'Food Truck Live Menu & Express Mobile Ordering',
    category: 'food_truck',
    pricing_model: 'monthly',
    price: 15.0,
    description: 'Digital paddock menu, real-time item availability toggles, express customer mobile pickup queue, and SMS order alerts.',
  },
  {
    id: 'prod_food_catering',
    name: 'Event Catering Vouchers & Queue Management',
    category: 'food_truck',
    pricing_model: 'monthly',
    price: 15.0,
    description: 'Redeem prepaid race team catering vouchers via QR scan at your truck window; skip-the-line paddock pass.',
  },
  {
    id: 'prod_custom_setup',
    name: 'Custom Portal Setup & White-Label Integration',
    category: 'custom',
    pricing_model: 'one_time',
    price: 199.0,
    description: 'Complete menu buildout, custom branding, truck window QR poster asset creation, and domain integration.',
  },
];

const DEFAULT_DEALS: CrmDealItem[] = [];

export default function AdminCrmPage() {
  const [deals, setDeals] = useState<CrmDealItem[]>([]);
  const [products, setProducts] = useState<ProductCatalogItem[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 4-Step Guided Client Intake Wizard Modal
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard Form Fields
  const [clientName, setClientName] = useState('');
  const [contactChannel, setContactChannel] = useState<'email' | 'fb_messenger' | 'instagram' | 'phone' | 'in_person'>('fb_messenger');
  const [contactHandle, setContactHandle] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [vertical, setVertical] = useState<string>('food_truck');
  const [customVertical, setCustomVertical] = useState<string>('');
  const [salesRep, setSalesRep] = useState('PJ (Admin)');
  const [commissionRate, setCommissionRate] = useState<number>(50);

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    'prod_shop_basic',
    'prod_vendor_food',
    'prod_food_catering',
    'prod_custom_setup',
  ]);

  const [notes, setNotes] = useState('');

  // Generated Link Output
  const [createdProposalLink, setCreatedProposalLink] = useState('');

  const [staffList, setStaffList] = useState<{ id: string; name: string; commission_split: number }[]>([
    { id: 'pj-losey', name: 'PJ Losey', commission_split: 100 },
    { id: 'zach-shaw', name: 'Zach Shaw', commission_split: 50 },
  ]);

  const [industryList, setIndustryList] = useState<{ id: string; name: string; icon: string }[]>([
    { id: 'food_truck', name: 'Food Truck & Mobile Vendor', icon: '🍔' },
    { id: 'auto_shop', name: 'Auto Repair & Detail Shop', icon: '🛠️' },
    { id: 'race_team', name: 'Race Team & Logistics', icon: '🏎️' },
    { id: 'track_venue', name: 'Track & Event Venue', icon: '🏁' },
    { id: 'marine_shop', name: 'Marine & PWC Shop', icon: '🛥️' },
    { id: 'offroad_park', name: 'Offroad & Powersports Park', icon: '🏔️' },
    { id: 'car_club', name: 'Car Club & Organizer', icon: '🚗' },
    { id: 'general_merchant', name: 'General Merchant / Business', icon: '🏢' },
  ]);

  // Realtime Firestore sync with LocalStorage backup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDeals = localStorage.getItem('__gridpass_crm_deals__');
      if (savedDeals !== null) {
        try {
          const parsed = JSON.parse(savedDeals);
          if (Array.isArray(parsed)) setDeals(parsed);
        } catch (e) {}
      }

      const savedStaff = localStorage.getItem('__gridpass_sales_staff__');
      if (savedStaff) {
        try {
          const parsed = JSON.parse(savedStaff);
          if (Array.isArray(parsed) && parsed.length > 0) setStaffList(parsed);
        } catch (e) {}
      }

      const savedInd = localStorage.getItem('__gridpass_industries__');
      if (savedInd) {
        try {
          const parsed = JSON.parse(savedInd);
          if (Array.isArray(parsed) && parsed.length > 0) setIndustryList(parsed);
        } catch (e) {}
      }
    }

    const unsubDeals = onSnapshot(
      collection(db, 'crm_deals'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CrmDealItem[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as CrmDealItem);
          });
          setDeals(list);
          if (typeof window !== 'undefined') {
            localStorage.setItem('__gridpass_crm_deals__', JSON.stringify(list));
          }
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const pList: ProductCatalogItem[] = [];
        snapshot.forEach((d) => {
          pList.push({ id: d.id, ...d.data() } as ProductCatalogItem);
        });
        setProducts(pList);
      }
    });

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      if (!snapshot.empty) {
        const sList: any[] = [];
        snapshot.forEach((d) => {
          sList.push({ id: d.id, ...d.data() });
        });
        setStaffList(sList);
      }
    });

    const unsubInd = onSnapshot(collection(db, 'industries'), (snapshot) => {
      if (!snapshot.empty) {
        const iList: any[] = [];
        snapshot.forEach((d) => {
          iList.push({ id: d.id, ...d.data() });
        });
        setIndustryList(iList);
      }
    });

    return () => {
      unsubDeals();
      unsubProducts();
      unsubStaff();
      unsubInd();
    };
  }, []);

  const openWizardModal = () => {
    setWizardStep(1);
    setClientName('');
    setContactChannel('fb_messenger');
    setContactHandle('');
    setClientEmail('');
    setClientPhone('');
    setBusinessName('');
    setVertical('food_truck');
    setCustomVertical('');
    setSalesRep('PJ (Admin)');
    setCommissionRate(50);
    setSelectedProductIds(['prod_shop_basic', 'prod_vendor_food', 'prod_food_catering', 'prod_custom_setup']);
    setNotes('');
    setCreatedProposalLink('');
    setShowWizardModal(true);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Complete Intake Wizard: Creates Member + Business + Proposal + CRM Deal in 1 action!
  const handleCompleteIntake = async () => {
    const slug = (businessName || clientName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `client-${Date.now()}`;

    const effectiveEmail = clientEmail.trim()
      ? clientEmail.trim()
      : `${slug}@prospect.gridpass.app`;

    const effectiveVertical = (vertical === 'custom' ? (customVertical.trim() || 'custom') : vertical) as any;

    const selectedProds = products.filter((p) => selectedProductIds.includes(p.id));
    const monthlyTotal = selectedProds
      .filter((i) => i.pricing_model === 'monthly')
      .reduce((sum, i) => sum + i.price, 0);

    const oneTimeTotal = selectedProds
      .filter((i) => i.pricing_model === 'one_time')
      .reduce((sum, i) => sum + i.price, 0);

    // 1. Member Profile (users collection)
    const memberObj: MemberUser = {
      uid: `usr_${slug}`,
      display_name: clientName,
      email: effectiveEmail,
      phone: clientPhone || (contactHandle ? `[${contactChannel.toUpperCase()}] ${contactHandle}` : undefined),
      bio: notes || `Prospect contact channel: ${contactChannel.toUpperCase()} (${contactHandle || 'In-person'})`,
      avatar_color: '#ff3b30',
      role: 'business_owner',
      is_gold: false,
      vehicles_count: 0,
      joined_date: new Date().toISOString().split('T')[0],
      invite_status: 'pending',
    };

    // 2. Business Profile (businesses collection)
    const bizObj: BusinessProfile = {
      id: slug,
      owner_uid: `usr_${slug}`,
      name: businessName,
      description: `Gridpass business profile for ${businessName}`,
      category: effectiveVertical === 'food_truck' ? 'food_truck' : 'shop_garage',
      vertical: effectiveVertical,
      location_name: 'Local Region',
      contact_email: effectiveEmail,
      subscription: {
        tier: 'pro',
        mrr: monthlyTotal,
        billing_cycle: 'monthly',
        status: 'active',
      },
    };

    // 3. Client Proposal (proposals collection)
    const proposalObj = {
      id: slug,
      client_name: clientName,
      business_name: businessName,
      client_email: effectiveEmail,
      sales_rep: salesRep,
      prototype_url: `/b/${slug}`,
      status: 'proposal_sent',
      monthly_total: monthlyTotal,
      setup_total: oneTimeTotal,
      items: selectedProds.map((item) => ({
        name: item.name,
        category: item.category,
        price_label:
          item.pricing_model === 'free'
            ? 'FREE ($0.00)'
            : item.pricing_model === 'monthly'
            ? `$${item.price.toFixed(2)} / mo`
            : item.pricing_model === 'one_time'
            ? `$${item.price.toFixed(0)} Setup`
            : 'Custom Quote',
        description: item.description,
      })),
      updated_at: new Date().toISOString(),
    };

    // 4. CRM Deal Record (crm_deals collection)
    const dealObj: CrmDealItem = {
      id: slug,
      client_name: clientName,
      client_email: effectiveEmail,
      client_phone: clientPhone || (contactHandle ? `[${contactChannel.toUpperCase()}] ${contactHandle}` : undefined),
      business_name: businessName,
      vertical: effectiveVertical,
      stage: 'proposal_sent',
      assigned_rep: salesRep,
      commission_rate: Number(commissionRate) || 50,
      mrr: monthlyTotal,
      setup_fee: oneTimeTotal,
      proposal_link: `/partner/proposal/${slug}`,
      notes: notes || (contactHandle ? `Contact via ${contactChannel.toUpperCase()}: ${contactHandle}` : ''),
      created_at: new Date().toISOString().split('T')[0],
    };

    // Update Local State
    setDeals((prev) => {
      const updated = [dealObj, ...prev.filter((d) => d.id !== slug)];
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_crm_deals__', JSON.stringify(updated));
      }
      return updated;
    });

    // Write to Firestore
    try {
      await setDoc(doc(db, 'users', memberObj.uid), memberObj, { merge: true });
      await setDoc(doc(db, 'businesses', slug), bizObj, { merge: true });
      await setDoc(doc(db, 'proposals', slug), proposalObj, { merge: true });
      await setDoc(doc(db, 'crm_deals', slug), dealObj, { merge: true });
    } catch (err) {}

    const link = `${window.location.origin}/partner/proposal/${slug}`;
    setCreatedProposalLink(link);
    setWizardStep(4);
  };

  const handleStageChange = async (dealId: string, newStage: CrmDealStage) => {
    setDeals((prev) => {
      const updated = prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d));
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_crm_deals__', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'crm_deals', dealId), { stage: newStage }, { merge: true });
    } catch (err) {}
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CRM deal record?')) return;
    setDeals((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_crm_deals__', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'crm_deals', id));
    } catch (err) {}
  };

  const filteredDeals = deals.filter((d) => {
    if (activeStageFilter !== 'all' && d.stage !== activeStageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.client_name.toLowerCase().includes(q) ||
        d.business_name.toLowerCase().includes(q) ||
        d.client_email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStageBadge = (stage: CrmDealStage) => {
    switch (stage) {
      case 'lead_intake':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-900 font-black text-[10px] uppercase rounded">📋 Lead Intake</span>;
      case 'proposal_sent':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-black text-[10px] uppercase rounded">📄 Proposal Sent</span>;
      case 'in_negotiation':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-black text-[10px] uppercase rounded">💬 In Negotiation</span>;
      case 'closed_won':
        return <span className="px-2 py-0.5 bg-green-100 text-green-800 font-black text-[10px] uppercase rounded">🎉 Closed Won</span>;
      case 'closed_lost':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 font-black text-[10px] uppercase rounded">❌ Closed Lost</span>;
    }
  };

  const totalPipelineMrr = deals.reduce((sum, d) => sum + (d.mrr || 0), 0);
  const totalClosedWonMrr = deals.filter((d) => d.stage === 'closed_won').reduce((sum, d) => sum + (d.mrr || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-neutral-900 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
            Sales &amp; CRM Department
          </span>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight mt-1">
            Client Sales Pipeline &amp; Intake
          </h1>
          <p className="text-sm font-medium text-neutral-600 mt-0.5">
            Meet prospects, enter intake info to generate Member + Business + Proposal in 1 continuous workflow.
          </p>
        </div>

        <button
          onClick={openWizardModal}
          className="px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <span>🚀 + New Client &amp; Prospect Intake</span>
        </button>
      </div>

      {/* KPI Pipeline Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Active Pipeline Deals</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">{deals.length} Clients</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Pipeline MRR</p>
          <p className="text-2xl font-black text-blue-900 mt-1">${totalPipelineMrr.toFixed(2)}/mo</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Closed Won MRR</p>
          <p className="text-2xl font-black text-green-600 mt-1">${totalClosedWonMrr.toFixed(2)}/mo</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-neutral-500 uppercase mr-1">Stage Filter:</span>
          {['all', 'lead_intake', 'proposal_sent', 'in_negotiation', 'closed_won', 'closed_lost'].map((stg) => (
            <button
              key={stg}
              onClick={() => setActiveStageFilter(stg)}
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition ${
                activeStageFilter === stg
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {stg.replace('_', ' ')}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search client or business..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs w-full md:w-60 focus:outline-none focus:border-[#ff3b30]"
        />
      </div>

      {/* CRM Deals Pipeline Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-black">
              <th className="p-3">Client &amp; Business Entity</th>
              <th className="p-3">Vertical</th>
              <th className="p-3">Pipeline Stage</th>
              <th className="p-3">Assigned Sales Rep</th>
              <th className="p-3">Rep Split</th>
              <th className="p-3">Target MRR</th>
              <th className="p-3">Proposal Link</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredDeals.map((deal) => (
              <tr key={deal.id} className="hover:bg-neutral-50 transition">
                <td className="p-3 font-black text-neutral-900 uppercase">
                  <div>
                    <span className="text-sm font-black text-neutral-900">{deal.client_name}</span>
                    <p className="text-xs font-bold text-neutral-700 normal-case">{deal.business_name}</p>
                    <p className="text-[10px] font-mono text-neutral-500 normal-case">{deal.client_email}</p>
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                    {deal.vertical.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3">
                  <select
                    value={deal.stage}
                    onChange={(e) => handleStageChange(deal.id, e.target.value as CrmDealStage)}
                    className="px-2 py-1 border border-neutral-300 rounded text-xs font-bold uppercase bg-white focus:border-[#ff3b30]"
                  >
                    <option value="lead_intake">📋 Lead Intake</option>
                    <option value="proposal_sent">📄 Proposal Sent</option>
                    <option value="in_negotiation">💬 In Negotiation</option>
                    <option value="closed_won">🎉 Closed Won</option>
                    <option value="closed_lost">❌ Closed Lost</option>
                  </select>
                </td>
                <td className="p-3 font-bold text-neutral-900">{deal.assigned_rep}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-black text-[10px] rounded">
                    {deal.commission_rate}% Split
                  </span>
                </td>
                <td className="p-3 font-black text-neutral-900">
                  ${deal.mrr.toFixed(2)}/mo
                  {deal.setup_fee > 0 && <span className="block text-[10px] font-bold text-neutral-500">+${deal.setup_fee} Setup</span>}
                </td>
                <td className="p-3 font-mono">
                  {deal.proposal_link ? (
                    <Link
                      href={deal.proposal_link}
                      target="_blank"
                      className="px-2.5 py-1 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-[10px] uppercase rounded inline-block shadow-2xs"
                    >
                      📄 View Proposal
                    </Link>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDeleteDeal(deal.id)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4-STEP CLIENT INTAKE WIZARD MODAL */}
      {showWizardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            {/* Modal Header & Stepper Indicator */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="bg-neutral-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Step {wizardStep} of 4 • Client Sales Intake
                </span>
                <h3 className="font-black text-lg text-neutral-900 uppercase mt-0.5">
                  {wizardStep === 1 && '1. Client Contact Intake (Creates Member)'}
                  {wizardStep === 2 && '2. Business Entity Setup (Creates Business)'}
                  {wizardStep === 3 && '3. Select Modular Products & Target Price'}
                  {wizardStep === 4 && '4. Proposal Published & Deal Created!'}
                </h3>
              </div>
              <button onClick={() => setShowWizardModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold text-lg">✕</button>
            </div>

            {/* STEP 1: CLIENT CONTACT INTAKE */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600">
                  Enter prospect contact info. This automatically creates their <strong>Member Profile</strong> in Gridpass.
                </p>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zach Shaw"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Primary Contact Channel</label>
                    <select
                      value={contactChannel}
                      onChange={(e) => setContactChannel(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                    >
                      <option value="fb_messenger">💬 Facebook Messenger</option>
                      <option value="instagram">📷 Instagram DM / Handle</option>
                      <option value="email">📧 Email Address</option>
                      <option value="phone">📱 SMS / Phone Call</option>
                      <option value="in_person">🤝 In Person</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Social Handle / Link</label>
                    <input
                      type="text"
                      placeholder={
                        contactChannel === 'instagram' ? 'e.g. @shawdaddys' :
                        contactChannel === 'fb_messenger' ? 'e.g. m.me/shawdaddys' :
                        contactChannel === 'phone' ? 'e.g. (555) 867-5309' :
                        'e.g. Met at Fox Lake Show'
                      }
                      value={contactHandle}
                      onChange={(e) => setContactHandle(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Client Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. zach@shawdaddys.com (Leave blank if unknown)"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 flex justify-end">
                  <button
                    onClick={() => setWizardStep(2)}
                    disabled={!clientName.trim()}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-black text-xs uppercase rounded-lg shadow-sm transition"
                  >
                    Next: Business Entity →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: BUSINESS ENTITY SETUP */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600">
                  Set up the client's business entity. This creates the <strong>Business Profile</strong> linked to {clientName}.
                </p>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shaw's Food Truck & Gourmet Paddock Eats"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Industry Vertical</label>
                    <select
                      value={vertical}
                      onChange={(e) => setVertical(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                    >
                      {industryList.map((ind) => (
                        <option key={ind.id} value={ind.id}>
                          {ind.icon} {ind.name}
                        </option>
                      ))}
                      <option value="custom">⚙️ Custom / Other Industry...</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Assigned Sales Rep</label>
                    <select
                      value={salesRep}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        setSalesRep(selectedName);
                        const foundStaff = staffList.find((s) => s.name === selectedName);
                        if (foundStaff) {
                          setCommissionRate(foundStaff.commission_split || 50);
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                    >
                      {staffList.map((stf) => (
                        <option key={stf.id} value={stf.name}>
                          👤 {stf.name} ({stf.commission_split}% Split)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {vertical === 'custom' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Specify Custom Industry Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Towing Service, Wrap Shop, Bakery, Brewery..."
                      value={customVertical}
                      onChange={(e) => setCustomVertical(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Rep Revenue Commission Split (%)</label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold text-xs uppercase rounded-lg"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    disabled={!businessName}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-black text-xs uppercase rounded-lg shadow-sm transition"
                  >
                    Next: Select Products →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SELECT PRODUCTS & PRICING */}
            {wizardStep === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600">
                  Select modular software products from the catalog to include in the proposal for {businessName}.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {products.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`p-3 rounded-lg border transition cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'bg-red-50/50 border-[#ff3b30]'
                            : 'bg-white border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                              {p.category.replace('_', ' ')}
                            </span>
                            <span className="font-black text-xs text-neutral-900 uppercase">{p.name}</span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">{p.description}</p>
                        </div>
                        <span className="font-black text-xs text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded flex-shrink-0">
                          {p.pricing_model === 'free' && 'FREE'}
                          {p.pricing_model === 'monthly' && `$${p.price.toFixed(2)}/mo`}
                          {p.pricing_model === 'one_time' && `$${p.price.toFixed(0)} Setup`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Deal Notes / Special Instructions</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold text-xs uppercase rounded-lg"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleCompleteIntake}
                    className="px-5 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded-lg shadow-sm transition"
                  >
                    💾 Save &amp; Generate Client Proposal →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PROPOSAL PUBLISHED & SUCCESS */}
            {wizardStep === 4 && (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                  ✓
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-neutral-900 uppercase">
                    Intake Complete for {clientName}!
                  </h4>
                  <p className="text-xs text-neutral-600">
                    Created <strong>Member Profile</strong>, <strong>Business Profile ({businessName})</strong>, <strong>Proposal</strong>, and <strong>CRM Deal Stage</strong>!
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-xs break-all">
                  <span className="font-black text-neutral-900 block text-[10px] uppercase mb-1">Client Proposal Link:</span>
                  <Link href={createdProposalLink} target="_blank" className="text-[#ff3b30] font-bold hover:underline">
                    {createdProposalLink}
                  </Link>
                </div>

                <button
                  onClick={() => setShowWizardModal(false)}
                  className="w-full py-3 bg-neutral-900 text-white font-black text-xs uppercase rounded-xl"
                >
                  Close &amp; View Pipeline Board
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
