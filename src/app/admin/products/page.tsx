'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

export type FeatureDevStatus = 'idea' | 'planned' | 'in_development' | 'beta' | 'live_working' | 'deprecated';
export type FeaturePricingModel = 'free' | 'monthly' | 'one_time' | 'commission_split' | 'custom_quote';

export interface ProductCatalogItem {
  id: string;
  name: string;
  category: 'vehicle' | 'driver' | 'auto_shop' | 'food_truck' | 'track_venue' | 'race_team' | 'custom';
  pricing_model: FeaturePricingModel;
  price: number;
  description: string;
  status: FeatureDevStatus;
  route_path?: string;
  is_active: boolean;
}

const DEFAULT_PRODUCTS: ProductCatalogItem[] = [
  {
    id: 'prod_member_free',
    name: 'Unlimited Member Passport & Profile',
    category: 'driver',
    pricing_model: 'free',
    price: 0,
    description: 'Public member profile resume with career bio, garage links, licensing badges, and dynamic QR card.',
    status: 'live_working',
    route_path: '/members',
    is_active: true,
  },
  {
    id: 'prod_veh_free',
    name: 'Unlimited Vehicle Passport & Garage',
    category: 'vehicle',
    pricing_model: 'free',
    price: 0,
    description: 'Unlimited vehicle profiles with basic specs, photo gallery, public URL, and high-res downloadable QR code.',
    status: 'live_working',
    route_path: '/vehicles',
    is_active: true,
  },
  {
    id: 'prod_shop_basic',
    name: 'Free Business Directory Listing',
    category: 'auto_shop',
    pricing_model: 'free',
    price: 0,
    description: 'Basic business directory page on Gridpass map with name, location, contact info, and business QR code.',
    status: 'live_working',
    route_path: '/businesses',
    is_active: true,
  },
  {
    id: 'prod_event_basic',
    name: 'Free Event Listing & Public Signups',
    category: 'track_venue',
    pricing_model: 'free',
    price: 0,
    description: 'Publish car shows, track days, or food truck staging events with public attendee signups.',
    status: 'live_working',
    route_path: '/events',
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
    route_path: '/b/shaw-daddys',
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
    route_path: '/b/shaw-daddys',
    is_active: true,
  },
  {
    id: 'prod_shop_manager',
    name: 'Custom Shop Manager (Shop Monkey Style)',
    category: 'auto_shop',
    pricing_model: 'monthly',
    price: 29.0,
    description: 'Repair work orders, parts inventory, labor estimates, and verified digital customer service stamps.',
    status: 'planned',
    route_path: '/b/demo-shop',
    is_active: true,
  },
  {
    id: 'prod_fleet_manager',
    name: 'B2B Trade & Commercial Fleet Passport Manager',
    category: 'auto_shop',
    pricing_model: 'monthly',
    price: 49.0,
    description: 'Universal QR fleet tracking for trade services (plumbing, HVAC, electrical, contracting), work vans, heavy construction equipment, and utility trailers. Auto-categorize equipment, track service logs, and manage driver/operator assignments.',
    status: 'planned',
    route_path: '/admin/fleet',
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
    route_path: '/b/shaw-daddys',
    is_active: true,
  },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductCatalogItem[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add / Edit Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductCatalogItem | null>(null);

  // Form Input States
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<ProductCatalogItem['category']>('food_truck');
  const [pricingModelInput, setPricingModelInput] = useState<FeaturePricingModel>('monthly');
  const [priceInput, setPriceInput] = useState<number>(15);
  const [statusInput, setStatusInput] = useState<FeatureDevStatus>('in_development');
  const [descriptionInput, setDescriptionInput] = useState('');

  // Dual Persistence: LocalStorage Instant Sync + Firestore Realtime Subscription
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocal = localStorage.getItem('__gridpass_admin_products__');
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
          }
        } catch (e) {}
      }
    }

    const unsub = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ProductCatalogItem[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as ProductCatalogItem);
          });
          setProducts(list);
          if (typeof window !== 'undefined') {
            localStorage.setItem('__gridpass_admin_products__', JSON.stringify(list));
          }
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setNameInput('');
    setCategoryInput('food_truck');
    setPricingModelInput('monthly');
    setPriceInput(15);
    setStatusInput('in_development');
    setDescriptionInput('');
    setShowAddModal(true);
  };

  const openEditModal = (item: ProductCatalogItem) => {
    setEditingItem(item);
    setNameInput(item.name);
    setCategoryInput(item.category);
    setPricingModelInput(item.pricing_model);
    setPriceInput(item.price);
    setStatusInput(item.status);
    setDescriptionInput(item.description);
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const prodId = editingItem ? editingItem.id : `prod_${Date.now()}`;
    const calculatedPrice = pricingModelInput === 'free' ? 0 : Number(priceInput) || 0;

    const prodObj: ProductCatalogItem = {
      id: prodId,
      name: nameInput,
      category: categoryInput,
      pricing_model: pricingModelInput,
      price: calculatedPrice,
      description: descriptionInput,
      status: statusInput,
      route_path: editingItem?.route_path || (categoryInput === 'food_truck' ? '/b/shaw-daddys' : undefined),
      is_active: true,
    };

    setProducts((prev) => {
      const exists = prev.some((p) => p.id === prodId);
      const updated = exists ? prev.map((p) => (p.id === prodId ? prodObj : p)) : [...prev, prodObj];
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_admin_products__', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'products', prodId), prodObj);
    } catch (err) {
      // Local storage already saved
    }

    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product catalog item?')) return;

    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('__gridpass_admin_products__', JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      // Local storage already saved
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status: FeatureDevStatus) => {
    switch (status) {
      case 'live_working':
        return <span className="px-2 py-0.5 bg-green-100 text-green-800 font-black text-[10px] uppercase rounded">✓ Live &amp; Working</span>;
      case 'beta':
        return <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 font-black text-[10px] uppercase rounded">🧪 Beta Testing</span>;
      case 'in_development':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-black text-[10px] uppercase rounded">🛠️ In Development</span>;
      case 'planned':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-900 font-black text-[10px] uppercase rounded">📋 Planned</span>;
      case 'idea':
        return <span className="px-2 py-0.5 bg-neutral-200 text-neutral-700 font-black text-[10px] uppercase rounded">💡 Concept</span>;
      case 'deprecated':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 font-black text-[10px] uppercase rounded">⛔ Deprecated</span>;
    }
  };

  const getPricingTag = (model: FeaturePricingModel, price: number) => {
    switch (model) {
      case 'free':
        return <span className="font-black text-xs text-green-700">FREE ($0)</span>;
      case 'monthly':
        return <span className="font-black text-xs text-neutral-900">${price.toFixed(2)}/mo</span>;
      case 'one_time':
        return <span className="font-black text-xs text-neutral-900">${price.toFixed(0)} Setup</span>;
      case 'commission_split':
        return <span className="font-black text-xs text-purple-900">5% + ${price.toFixed(2)} Split</span>;
      case 'custom_quote':
        return <span className="font-black text-xs text-blue-900">Custom Quote</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-neutral-900 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
            Data &amp; Records
          </span>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight mt-1">
            Products &amp; Features Catalog
          </h1>
          <p className="text-sm font-medium text-neutral-600 mt-0.5">
            Central catalog of all software features, pricing models, development statuses, and system routes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-500 uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded text-xs font-bold uppercase focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="vehicle">Vehicle</option>
              <option value="driver">Driver</option>
              <option value="auto_shop">Auto Shop</option>
              <option value="food_truck">Food Truck</option>
              <option value="track_venue">Track Venue</option>
              <option value="race_team">Race Team</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-500 uppercase">Dev Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded text-xs font-bold uppercase focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="live_working">✓ Live &amp; Working</option>
              <option value="beta">🧪 Beta Testing</option>
              <option value="in_development">🛠️ In Development</option>
              <option value="planned">📋 Planned</option>
              <option value="idea">💡 Concept</option>
            </select>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs w-full md:w-60 focus:outline-none focus:border-[#ff3b30]"
        />
      </div>

      {/* Products Catalog Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-black">
              <th className="p-3">Category</th>
              <th className="p-3">Product / Feature Name</th>
              <th className="p-3">Dev Status</th>
              <th className="p-3">Pricing Model</th>
              <th className="p-3">Price</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50 transition">
                <td className="p-3">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                    {p.category.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 font-black text-neutral-900 uppercase">
                  {p.name}
                  <p className="text-[11px] font-normal text-neutral-500 normal-case mt-0.5">{p.description}</p>
                </td>
                <td className="p-3">
                  {getStatusBadge(p.status)}
                </td>
                <td className="p-3 font-bold uppercase text-neutral-700">
                  {p.pricing_model.replace('_', ' ')}
                </td>
                <td className="p-3">
                  {getPricingTag(p.pricing_model, p.price)}
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="text-xs font-bold text-neutral-900 hover:text-[#ff3b30] hover:underline"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
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

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="font-black text-base text-neutral-900 uppercase">
                {editingItem ? '✏️ Edit Product' : '+ Add Product'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Product / Feature Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Food Truck Live Menu & Ordering"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Category</label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="vehicle">Vehicle</option>
                    <option value="driver">Driver</option>
                    <option value="auto_shop">Auto Shop</option>
                    <option value="food_truck">Food Truck</option>
                    <option value="track_venue">Track Venue</option>
                    <option value="race_team">Race Team</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Development Status</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="live_working">✓ Live &amp; Working</option>
                    <option value="beta">🧪 Beta Testing</option>
                    <option value="in_development">🛠️ In Development</option>
                    <option value="planned">📋 Planned</option>
                    <option value="idea">💡 Concept</option>
                    <option value="deprecated">⛔ Deprecated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Pricing Model</label>
                  <select
                    value={pricingModelInput}
                    onChange={(e) => {
                      const val = e.target.value as FeaturePricingModel;
                      setPricingModelInput(val);
                      if (val === 'free') setPriceInput(0);
                    }}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="free">Free ($0)</option>
                    <option value="monthly">Monthly ($/mo)</option>
                    <option value="one_time">One-Time Setup ($)</option>
                    <option value="commission_split">Ticket Split (%)</option>
                    <option value="custom_quote">Custom Quote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={pricingModelInput === 'free'}
                    value={pricingModelInput === 'free' ? 0 : priceInput}
                    onChange={(e) => setPriceInput(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold focus:outline-none focus:border-[#ff3b30] disabled:bg-neutral-100 disabled:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Overview of what this feature provides..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-[#ff3b30]"
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
                  {editingItem ? 'Save Changes' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
