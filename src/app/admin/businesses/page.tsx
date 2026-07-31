'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { BusinessProfile } from '@/lib/types/business';
import { MemberUser } from '@/lib/types/admin';

type BusinessFilter = 'all' | 'auto_shop' | 'race_team' | 'food_truck' | 'track_venue';
type SortField = 'name' | 'vertical' | 'mrr' | 'id';
type SortOrder = 'asc' | 'desc';

export interface ProductCatalogItem {
  id: string;
  name: string;
  category: string;
  pricing_model: string;
  price: number;
  description: string;
  status: string;
  route_path?: string;
  is_active: boolean;
}

const DEFAULT_PRODUCTS: ProductCatalogItem[] = [
  {
    id: 'prod_shop_basic',
    name: 'Free Business Directory Listing',
    category: 'auto_shop',
    pricing_model: 'free',
    price: 0,
    description: 'Basic business directory page on Gridpass map with name, location, contact info, and business QR code.',
    status: 'live_working',
    is_active: true,
  },
  {
    id: 'prod_vendor_food',
    name: 'Food Truck Live Menu & Express Mobile Ordering',
    category: 'food_truck',
    pricing_model: 'monthly',
    price: 15.0,
    description: 'Digital paddock menu, real-time item availability toggles, express customer mobile pickup queue, and SMS order alerts.',
    status: 'in_development',
    is_active: true,
  },
  {
    id: 'prod_food_catering',
    name: 'Event Catering Vouchers & Queue Management',
    category: 'food_truck',
    pricing_model: 'monthly',
    price: 15.0,
    description: 'Redeem prepaid race team catering vouchers via QR scan at your truck window; skip-the-line paddock pass.',
    status: 'in_development',
    is_active: true,
  },
  {
    id: 'prod_custom_setup',
    name: 'Custom Portal Setup & White-Label Integration',
    category: 'custom',
    pricing_model: 'one_time',
    price: 199.0,
    description: 'Complete menu buildout, custom branding, truck window QR poster asset creation, and domain integration.',
    status: 'in_development',
    is_active: true,
  },
];

export default function AdminBusinessesPage() {
  const [clients, setClients] = useState<BusinessProfile[]>([]);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [products, setProducts] = useState<ProductCatalogItem[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);

  // Filter & Search & Sort State
  const [activeFilter, setActiveFilter] = useState<BusinessFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modal State for Add Business
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newVertical, setNewVertical] = useState<'auto_shop' | 'race_team' | 'food_truck' | 'track_venue'>('food_truck');
  const [newOwnerUid, setNewOwnerUid] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMrr, setNewMrr] = useState<number>(30);

  // Proposal Builder Modal State
  const [proposalTargetBiz, setProposalTargetBiz] = useState<BusinessProfile | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    'prod_shop_basic',
    'prod_vendor_food',
    'prod_food_catering',
    'prod_custom_setup',
  ]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Subscribe to live businesses, members, and products collections
  useEffect(() => {
    const unsubBiz = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        const bizList: BusinessProfile[] = [];
        snapshot.forEach((docSnap) => {
          bizList.push({ id: docSnap.id, ...docSnap.data() } as BusinessProfile);
        });
        setClients(bizList);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubMembers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const mList: MemberUser[] = [];
      snapshot.forEach((docSnap) => {
        mList.push({ uid: docSnap.id, ...docSnap.data() } as MemberUser);
      });
      setMembers(mList);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const pList: ProductCatalogItem[] = [];
        snapshot.forEach((docSnap) => {
          pList.push({ id: docSnap.id, ...docSnap.data() } as ProductCatalogItem);
        });
        setProducts(pList);
      }
    });

    return () => {
      unsubBiz();
      unsubMembers();
      unsubProducts();
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleVerticalChange = async (clientId: string, vertical: 'auto_shop' | 'race_team' | 'food_truck' | 'track_venue') => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, vertical } : c))
    );

    try {
      await setDoc(doc(db, 'businesses', clientId), { vertical }, { merge: true });
    } catch (err) {}
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    const slug = newClientName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const selectedOwner = members.find((m) => m.uid === newOwnerUid);

    const newBiz: BusinessProfile = {
      id: slug,
      name: newClientName,
      owner_uid: newOwnerUid || 'admin',
      description: `Gridpass business profile for ${newClientName}`,
      category: newVertical === 'food_truck' ? 'food_truck' : 'shop_garage',
      vertical: newVertical,
      location_name: 'Local Region',
      contact_email: newEmail || selectedOwner?.email || 'client@shawdaddys.com',
      subscription: {
        tier: 'pro',
        mrr: Number(newMrr) || 30,
        billing_cycle: 'monthly',
        status: 'active',
      },
    };

    setClients((prev) => [newBiz, ...prev.filter((c) => c.id !== slug)]);

    try {
      await setDoc(doc(db, 'businesses', slug), newBiz);
    } catch (err) {}

    setNewClientName('');
    setNewEmail('');
    setShowAddModal(false);
  };

  // Open Proposal Builder for a specific business & client
  const openProposalModal = (biz: BusinessProfile) => {
    setProposalTargetBiz(biz);
    setGeneratedLink('');
    setLinkCopied(false);
  };

  const toggleProductSelection = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleGenerateProposalLink = async () => {
    if (!proposalTargetBiz) return;

    const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
    const ownerMember = members.find((m) => m.uid === proposalTargetBiz.owner_uid);

    const monthlyTotal = selectedProducts
      .filter((i) => i.pricing_model === 'monthly')
      .reduce((sum, i) => sum + i.price, 0);

    const oneTimeTotal = selectedProducts
      .filter((i) => i.pricing_model === 'one_time')
      .reduce((sum, i) => sum + i.price, 0);

    const proposalObj = {
      id: proposalTargetBiz.id,
      client_name: ownerMember?.display_name || 'Zach Shaw',
      business_name: proposalTargetBiz.name,
      client_email: proposalTargetBiz.contact_email || ownerMember?.email || 'zach@shawdaddys.com',
      sales_rep: 'PJ / Gridpass Lead',
      prototype_url: `/b/${proposalTargetBiz.id}`,
      status: 'proposal_sent',
      monthly_total: monthlyTotal,
      setup_total: oneTimeTotal,
      items: selectedProducts.map((item) => ({
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

    try {
      await setDoc(doc(db, 'proposals', proposalTargetBiz.id), proposalObj);
    } catch (err) {}

    const link = `${window.location.origin}/partner/proposal/${proposalTargetBiz.id}`;
    setGeneratedLink(link);
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
  };

  const filteredClients = clients.filter((c) => {
    if (activeFilter !== 'all' && c.vertical !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.contact_email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    let aVal: any = a[sortField as keyof BusinessProfile] || '';
    let bVal: any = b[sortField as keyof BusinessProfile] || '';

    if (sortField === 'mrr') {
      aVal = a.subscription?.mrr || 0;
      bVal = b.subscription?.mrr || 0;
    }

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-neutral-900 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
            Data &amp; Records
          </span>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight mt-1">
            Businesses &amp; Client Accounts
          </h1>
          <p className="text-sm font-medium text-neutral-600 mt-0.5">
            Manage partner businesses, link them to Client Members (e.g. Zach Shaw), and issue live proposals.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <span>+ Add Business</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-neutral-500 uppercase mr-1">Vertical:</span>
          {['all', 'food_truck', 'auto_shop', 'race_team', 'track_venue'].map((v) => (
            <button
              key={v}
              onClick={() => setActiveFilter(v as any)}
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition ${
                activeFilter === v
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {v.replace('_', ' ')}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs w-full md:w-60 focus:outline-none focus:border-[#ff3b30]"
        />
      </div>

      {/* Businesses Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-black">
              <th className="p-3">Business Name &amp; ID</th>
              <th className="p-3">Vertical</th>
              <th className="p-3">Client Member Owner</th>
              <th className="p-3">Contact Email</th>
              <th className="p-3">Target MRR</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sortedClients.map((biz) => {
              const owner = members.find((m) => m.uid === biz.owner_uid);

              return (
                <tr key={biz.id} className="hover:bg-neutral-50 transition">
                  <td className="p-3 font-black text-neutral-900 uppercase">
                    <Link href={`/b/${biz.id}`} target="_blank" className="hover:text-[#ff3b30] flex items-center gap-1.5">
                      <span>{biz.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400 font-normal">({biz.id})</span>
                    </Link>
                  </td>
                  <td className="p-3">
                    <select
                      value={biz.vertical || 'food_truck'}
                      onChange={(e) => handleVerticalChange(biz.id, e.target.value as any)}
                      className="px-2 py-0.5 border border-neutral-300 rounded text-xs font-bold uppercase bg-white focus:border-[#ff3b30]"
                    >
                      <option value="food_truck">🍔 Food Truck</option>
                      <option value="auto_shop">🛠️ Auto Shop</option>
                      <option value="race_team">🏎️ Race Team</option>
                      <option value="track_venue">🏁 Track Venue</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {owner ? (
                      <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                        👤 {owner.display_name}
                      </span>
                    ) : (
                      <span className="text-neutral-500 font-mono text-[11px]">{biz.owner_uid || 'Unassigned'}</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-neutral-700">{biz.contact_email || '—'}</td>
                  <td className="p-3 font-black text-neutral-900">${biz.subscription?.mrr || 0}/mo</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => openProposalModal(biz)}
                      className="px-2.5 py-1 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-[11px] uppercase rounded shadow-2xs transition"
                    >
                      📄 Create Proposal
                    </button>
                    <Link
                      href={`/b/${biz.id}`}
                      target="_blank"
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[11px] uppercase rounded transition inline-block"
                    >
                      View Live 🔗
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: ADD BUSINESS & LINK CLIENT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900 uppercase">+ Add Business Entity</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddBusiness} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shaw's Food Truck & Gourmet Paddock Eats"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Link Client Member Owner</label>
                <select
                  value={newOwnerUid}
                  onChange={(e) => setNewOwnerUid(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                >
                  <option value="">Select Member (e.g. Zach Shaw)</option>
                  {members.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      👤 {m.display_name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Vertical</label>
                  <select
                    value={newVertical}
                    onChange={(e) => setNewVertical(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="food_truck">🍔 Food Truck</option>
                    <option value="auto_shop">🛠️ Auto Shop</option>
                    <option value="race_team">🏎️ Race Team</option>
                    <option value="track_venue">🏁 Track Venue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Target MRR ($/mo)</label>
                  <input
                    type="number"
                    value={newMrr}
                    onChange={(e) => setNewMrr(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Business Contact Email</label>
                <input
                  type="email"
                  placeholder="e.g. zach@shawdaddys.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold text-xs uppercase rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded-lg shadow-sm"
                >
                  Save Business Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE PROPOSAL FOR SPECIFIC BUSINESS & CLIENT */}
      {proposalTargetBiz && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="bg-neutral-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Client Proposal Dispatch
                </span>
                <h3 className="font-black text-lg text-neutral-900 uppercase mt-0.5">
                  Generate Proposal for {proposalTargetBiz.name}
                </h3>
              </div>
              <button onClick={() => setProposalTargetBiz(null)} className="text-neutral-400 hover:text-neutral-900 font-bold text-lg">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-black text-neutral-900 uppercase">{proposalTargetBiz.name}</p>
                  <p className="text-neutral-500 font-mono">{proposalTargetBiz.contact_email || 'zach@shawdaddys.com'}</p>
                </div>
                <span className="px-2.5 py-1 bg-green-100 text-green-800 font-black text-[10px] uppercase rounded">
                  {proposalTargetBiz.vertical?.replace('_', ' ')}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1.5">
                  Select Modules from Product Catalog:
                </label>
                <div className="space-y-2">
                  {products.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProductSelection(p.id)}
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
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateProposalLink}
                  className="w-full py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase rounded-xl shadow-sm transition"
                >
                  💾 Save &amp; Generate Proposal Link
                </button>
              </div>

              {generatedLink && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-1">
                  <p className="font-black text-green-900 text-[10px] uppercase">
                    {linkCopied ? '✓ Proposal Created & Link Copied!' : '✓ Proposal Link Ready'}
                  </p>
                  <Link
                    href={generatedLink}
                    target="_blank"
                    className="block font-mono font-bold text-green-800 hover:underline truncate"
                  >
                    {generatedLink}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
