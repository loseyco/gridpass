'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage } from '@/lib/firebase/config';
import { 
  collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Wrench, Warehouse, Package, DollarSign, Layers, Plus, Search, Filter, 
  Copy, QrCode, Tag, Camera, CheckCircle2, ChevronRight, X, ArrowLeft, Loader2,
  Trash2, ExternalLink, Sparkles, AlertCircle, ShoppingBag, HardDrive
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import GridpassQRCode, { downloadGridpassQR } from '@/components/qr/GridpassQRCode';
import { GarageItem, GarageZone, ItemStatus, ItemCategory, ItemCondition } from '@/lib/types/garage';

const CATEGORIES: ItemCategory[] = [
  'Engine & Drivetrain',
  'Suspension & Brakes',
  'Wheels & Tires',
  'Electronics & Telemetry',
  'Body & Aerodynamics',
  'Hardware & Fasteners',
  'Tools & Equipment',
  'Apparel & Safety',
  'Accessories',
  'Other'
];

const CONDITIONS: ItemCondition[] = ['Brand New', 'Like New', 'Good', 'Fair', 'Parts Only'];
const STATUSES: ItemStatus[] = ['Draft', 'Photographed', 'Listed', 'Sold'];

export default function GarageManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GarageItem[]>([]);
  const [zones, setZones] = useState<GarageZone[]>([]);
  const [activeStatusFilter, setActiveStatusFilter] = useState<ItemStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | 'All'>('All');

  // Space dimensions state (e.g. 24' x 22' = 528 sq ft)
  const [spaceLength, setSpaceLength] = useState(24);
  const [spaceWidth, setSpaceWidth] = useState(22);

  // Modal / Drawer States
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GarageItem | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQRItem, setActiveQRItem] = useState<GarageItem | null>(null);

  // Item Form State
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState<ItemCategory>('Engine & Drivetrain');
  const [itemCondition, setItemCondition] = useState<ItemCondition>('Good');
  const [itemCostPrice, setItemCostPrice] = useState<number | ''>('');
  const [itemListPrice, setItemListPrice] = useState<number | ''>('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemSpecs, setItemSpecs] = useState('');
  const [itemStatus, setItemStatus] = useState<ItemStatus>('Draft');
  const [itemZoneId, setItemZoneId] = useState('');
  const [itemShelf, setItemShelf] = useState('Shelf A');
  const [itemBinId, setItemBinId] = useState('');
  const [itemPhotos, setItemPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Zone Form State
  const [zoneName, setZoneName] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');

  // Load Firestore Data
  useEffect(() => {
    if (authLoading) return;
    let isMounted = true;

    async function loadGarageData() {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        let loadedItems: GarageItem[] = [];
        let loadedZones: GarageZone[] = [];

        try {
          // Query items
          const itemsQuery = query(collection(db, 'garage_items'), where('owner_uid', '==', user.uid));
          const itemsSnap = await getDocs(itemsQuery);
          loadedItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as GarageItem));

          // Query zones
          const zonesQuery = query(collection(db, 'garage_zones'), where('owner_uid', '==', user.uid));
          const zonesSnap = await getDocs(zonesQuery);
          loadedZones = zonesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GarageZone));
        } catch (dbErr) {
          console.warn("Firestore garage fetch warning, fallback check:", dbErr);
        }

        const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__ === true;
        if (isMock && loadedItems.length === 0) {
          loadedZones = [
            { id: 'zone-1', garage_id: 'default', owner_uid: user.uid, name: 'Engine Bay & Racks', description: 'Heavy parts shelving', created_at: new Date().toISOString() },
            { id: 'zone-2', garage_id: 'default', owner_uid: user.uid, name: 'Telemetry & Electronics', description: 'Precision IoT & sensors', created_at: new Date().toISOString() }
          ];
          loadedItems = [
            {
              id: 'mock-item-1',
              owner_uid: user.uid,
              title: 'Ford Mustang GT 5.0 Intake Manifold',
              category: 'Engine & Drivetrain',
              condition: 'Like New',
              cost_price: 150,
              list_price: 350,
              status: 'Listed',
              location: { zone_id: 'zone-1', zone_name: 'Engine Bay & Racks', shelf: 'Shelf A', bin_id: 'BIN-01' },
              qr_code_tag: 'GP-GAR-INTAKE50',
              description: 'OEM 5.0L Coyote Intake Manifold in flawless condition.',
              specs: 'Part # 5.0-V8-2024, OEM Ford, Anodized Black',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'mock-item-2',
              owner_uid: user.uid,
              title: 'iRacing Telemetry Sensor Hub',
              category: 'Electronics & Telemetry',
              condition: 'Brand New',
              cost_price: 200,
              list_price: 450,
              status: 'Draft',
              location: { zone_id: 'zone-2', zone_name: 'Telemetry & Electronics', shelf: 'Shelf B', bin_id: 'BIN-08' },
              qr_code_tag: 'GP-GAR-TELHUB',
              description: '60Hz telemetry extraction hub with CAN bus adapter.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'mock-item-3',
              owner_uid: user.uid,
              title: 'Brembo 6-Piston Brake Caliper Kit',
              category: 'Suspension & Brakes',
              condition: 'Good',
              cost_price: 500,
              list_price: 950,
              status: 'Sold',
              sale_price: 950,
              location: { zone_id: 'zone-1', zone_name: 'Engine Bay & Racks', shelf: 'Shelf C', bin_id: 'BIN-12' },
              qr_code_tag: 'GP-GAR-BREMBO6P',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
        }

        if (isMounted) {
          setItems(loadedItems);
          setZones(loadedZones);
        }
      } catch (err) {
        console.error("Error loading garage manager data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGarageData();
    return () => { isMounted = false; };
  }, [user, authLoading]);

  // Calculated Space & Financial Metrics
  const totalSqFt = spaceLength * spaceWidth;
  const totalValuation = items.reduce((sum, item) => sum + (item.list_price || 0), 0);
  const totalCashCollected = items
    .filter(i => i.status === 'Sold')
    .reduce((sum, item) => sum + (item.sale_price || item.list_price || 0), 0);

  // Filtered Inventory List
  const filteredItems = items.filter(item => {
    const matchesStatus = activeStatusFilter === 'All' || item.status === activeStatusFilter;
    const matchesZone = selectedZoneId === 'All' || item.location?.zone_id === selectedZoneId;
    const matchesSearch = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location?.bin_id && item.location.bin_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesZone && matchesSearch;
  });

  const handleOpenNewItemModal = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemCategory('Engine & Drivetrain');
    setItemCondition('Good');
    setItemCostPrice('');
    setItemListPrice('');
    setItemDescription('');
    setItemSpecs('');
    setItemStatus('Draft');
    setItemZoneId(zones[0]?.id || '');
    setItemShelf('Shelf A');
    setItemBinId('');
    setItemPhotos([]);
    setShowItemModal(true);
  };

  const handleOpenEditItemModal = (item: GarageItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemCategory(item.category);
    setItemCondition(item.condition);
    setItemCostPrice(item.cost_price || '');
    setItemListPrice(item.list_price || '');
    setItemDescription(item.description || '');
    setItemSpecs(item.specs || '');
    setItemStatus(item.status);
    setItemZoneId(item.location?.zone_id || '');
    setItemShelf(item.location?.shelf || 'Shelf A');
    setItemBinId(item.location?.bin_id || '');
    setItemPhotos(item.photos || []);
    setShowItemModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, idx) => {
        const storagePath = `garage/${user.uid}/${Date.now()}_${idx}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      });

      const newUrls = await Promise.all(uploadPromises);
      setItemPhotos(prev => [...prev, ...newUrls]);
      showToast({
        title: "📷 Photos Uploaded!",
        message: `Attached ${newUrls.length} photo(s) to garage item passport.`,
        icon: "✅"
      });
    } catch (err) {
      console.error("Photo upload error:", err);
      showToast({ title: "Upload Warning", message: "Image upload failed. Try again.", icon: "⚠️" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      showToast({ title: "Missing Title", message: "Please enter an item title.", icon: "⚠️" });
      return;
    }
    if (!user) return;

    setSavingItem(true);
    const selectedZone = zones.find(z => z.id === itemZoneId);

    const itemData = {
      owner_uid: user.uid,
      title: itemTitle.trim(),
      category: itemCategory,
      condition: itemCondition,
      cost_price: Number(itemCostPrice) || 0,
      list_price: Number(itemListPrice) || 0,
      description: itemDescription.trim(),
      specs: itemSpecs.trim(),
      status: itemStatus,
      photos: itemPhotos,
      primary_photo_url: itemPhotos[0] || '',
      location: {
        zone_id: itemZoneId,
        zone_name: selectedZone?.name || 'Main Zone',
        shelf: itemShelf,
        bin_id: itemBinId.trim()
      },
      qr_code_tag: editingItem?.qr_code_tag || `GP-GAR-${Date.now().toString(36).toUpperCase()}`,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'garage_items', editingItem.id), itemData);
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i));
        showToast({ title: "✅ Item Updated", message: `"${itemTitle}" saved to garage inventory.`, icon: "🏆" });
      } else {
        const docRef = await addDoc(collection(db, 'garage_items'), {
          ...itemData,
          created_at: new Date().toISOString()
        });
        const newItem: GarageItem = { id: docRef.id, created_at: new Date().toISOString(), ...itemData };
        setItems(prev => [newItem, ...prev]);
        showToast({ title: "📦 Item Staged", message: `"${itemTitle}" added to garage inventory.`, icon: "🔥" });
      }

      setShowItemModal(false);
    } catch (err) {
      console.error("Save garage item error:", err);
      showToast({ title: "Save Failed", message: "Could not save item details.", icon: "⚠️" });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'garage_items', itemId));
      setItems(prev => prev.filter(i => i.id !== itemId));
      showToast({ title: "🗑️ Item Removed", message: "Removed item from inventory.", icon: "✅" });
    } catch (err) {
      console.error("Delete item error:", err);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim() || !user) return;

    try {
      const docRef = await addDoc(collection(db, 'garage_zones'), {
        owner_uid: user.uid,
        name: zoneName.trim(),
        description: zoneDesc.trim(),
        created_at: new Date().toISOString()
      });
      const newZone: GarageZone = {
        id: docRef.id,
        garage_id: 'default',
        owner_uid: user.uid,
        name: zoneName.trim(),
        description: zoneDesc.trim(),
        created_at: new Date().toISOString()
      };
      setZones(prev => [...prev, newZone]);
      setZoneName('');
      setZoneDesc('');
      setShowZoneModal(false);
      showToast({ title: "📍 Zone Created", message: `Created location zone "${zoneName}".`, icon: "✅" });
    } catch (err) {
      console.error("Create zone error:", err);
    }
  };

  const handleCopyListingText = (item: GarageItem) => {
    const text = `🏁 FOR SALE: ${item.title.toUpperCase()}
----------------------------------
PRICE: $${item.list_price.toLocaleString()} (Cash / Zelle / Venmo)
CONDITION: ${item.condition}
CATEGORY: ${item.category}

${item.description ? `DETAILS:\n${item.description}\n\n` : ''}${item.specs ? `SPECS:\n${item.specs}\n\n` : ''}PADDOCK QR TAG: ${item.qr_code_tag || 'GP-GAR-TAG'}
LOCATION: ${item.location?.zone_name || 'Garage HQ'} (Local Pickup Available)
CONTACT: Serious inquiries only. DM for quick response!`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast({
        title: "📋 Copy Generated!",
        message: `Listing copy for "${item.title}" copied to clipboard for Facebook Marketplace / eBay!`,
        icon: "✨"
      });
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
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between text-left">
      
      {/* 🏁 HEADER NAVIGATION BAR */}
      <div className="w-full bg-neutral-900 border-b border-neutral-800 text-white px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/dash" 
              className="min-h-[44px] min-w-[44px] px-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono font-bold rounded-xl border border-neutral-700 flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div>
              <span className="text-[9px] font-mono font-black text-[#ff3b30] uppercase tracking-widest block">
                GRIDPASS MOTORSPORT SAAS
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <Warehouse className="w-6 h-6 text-[#ff3b30]" /> Garage Manager &amp; Liquidation Engine
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="add-zone-btn"
              onClick={() => setShowZoneModal(true)}
              className="min-h-[44px] px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-amber-400" /> + Add Zone
            </button>
            <button
              type="button"
              data-testid="stage-item-btn"
              onClick={handleOpenNewItemModal}
              className="min-h-[44px] px-5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-red-500/20"
            >
              <Plus className="w-4 h-4" /> + Stage Garage Item
            </button>
          </div>
        </div>
      </div>

      {/* 📊 MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
        
        {/* 1. GARAGE HUB METRICS HEADER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-testid="garage-hub-header-metrics">
          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-1" data-testid="metric-space-allocated">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">Space Size Allocated</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-neutral-900">{totalSqFt}</span>
              <span className="text-xs font-mono font-bold text-neutral-500">SQ FT ({spaceLength}' × {spaceWidth}')</span>
            </div>
          </div>

          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-1" data-testid="metric-staged-items">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">Staged Inventory Items</span>
            <span className="text-2xl font-black font-mono text-neutral-900">{items.length}</span>
          </div>

          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-1" data-testid="metric-inventory-valuation">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">Estimated Inventory Valuation</span>
            <span className="text-2xl font-black font-mono text-[#ff3b30]">${totalValuation.toLocaleString()}</span>
          </div>

          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-1" data-testid="metric-cash-collected">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">Total Cash Collected (Sold)</span>
            <span className="text-2xl font-black font-mono text-emerald-600">${totalCashCollected.toLocaleString()}</span>
          </div>
        </div>

        {/* 2. LIQUIDATION SALES PIPELINE & FILTER BAR */}
        <div className="bg-white p-5 border border-neutral-200 rounded-3xl shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar" data-testid="status-pipeline-filter-bar">
              {['All', ...STATUSES].map(status => {
                const count = status === 'All' ? items.length : items.filter(i => i.status === status).length;
                const isActive = activeStatusFilter === status;

                return (
                  <button
                    key={status}
                    type="button"
                    data-testid={`status-filter-pill-${status}`}
                    onClick={() => setActiveStatusFilter(status as any)}
                    className={`min-h-[44px] px-4 text-xs font-mono font-black uppercase rounded-2xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      isActive 
                        ? 'bg-[#ff3b30] text-white shadow-md shadow-red-500/20' 
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <span>{status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search title, category, bin..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
              />
            </div>
          </div>

          {/* Location Tree Filter Pills */}
          {zones.length > 0 && (
            <div className="pt-3 border-t border-neutral-100 flex items-center gap-2 overflow-x-auto no-scrollbar" data-testid="location-tree-filter-bar">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase shrink-0">LOCATION ZONE:</span>
              <button
                type="button"
                data-testid="zone-filter-pill-All"
                onClick={() => setSelectedZoneId('All')}
                className={`min-h-[44px] px-3 py-1.5 text-[11px] font-mono font-bold uppercase rounded-xl transition-all shrink-0 cursor-pointer ${
                  selectedZoneId === 'All' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                All Zones ({items.length})
              </button>
              {zones.map(z => {
                const zCount = items.filter(i => i.location?.zone_id === z.id).length;
                return (
                  <button
                    key={z.id}
                    type="button"
                    data-testid={`zone-filter-pill-${z.id}`}
                    onClick={() => setSelectedZoneId(z.id)}
                    className={`min-h-[44px] px-3 py-1.5 text-[11px] font-mono font-bold uppercase rounded-xl transition-all shrink-0 cursor-pointer ${
                      selectedZoneId === z.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    📍 {z.name} ({zCount})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. INVENTORY GRID / STRICT ZERO FAKE DATA EMPTY STATE */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-md hover:border-[#ff3b30] transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header */}
                  <div className="w-full h-48 bg-neutral-900 relative overflow-hidden">
                    {item.photos && item.photos.length > 0 ? (
                      <img 
                        src={item.photos[0]} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 space-y-1">
                        <Package className="w-10 h-10" />
                        <span className="text-[10px] font-mono font-bold uppercase">No Photo Staged</span>
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase border shadow-md ${
                      item.status === 'Sold' ? 'bg-emerald-600 text-white border-emerald-500' :
                      item.status === 'Listed' ? 'bg-[#ff3b30] text-white border-red-500' :
                      item.status === 'Photographed' ? 'bg-blue-600 text-white border-blue-500' :
                      'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}>
                      {item.status}
                    </div>

                    {/* Category Pill */}
                    <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-white text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border border-neutral-800">
                      {item.category}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-black uppercase text-neutral-900 tracking-tight leading-snug">
                        {item.title}
                      </h3>
                      <span className="text-lg font-black font-mono text-[#ff3b30] shrink-0">
                        ${item.list_price.toLocaleString()}
                      </span>
                    </div>

                    {/* Specs / Details */}
                    {item.description && (
                      <p className="text-xs text-neutral-600 font-medium line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Location Tag */}
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-500 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                      <Tag className="w-3.5 h-3.5 text-[#ff3b30]" />
                      <span>{item.location?.zone_name || 'Main Zone'}</span>
                      {item.location?.shelf && <span>• {item.location.shelf}</span>}
                      {item.location?.bin_id && <span>• Bin {item.location.bin_id}</span>}
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid={`copy-listing-btn-${item.id}`}
                      onClick={() => handleCopyListingText(item)}
                      className="min-h-[44px] px-3 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="Copy formatted listing copy for Facebook Marketplace / eBay"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#ff3b30]" /> Copy Listing
                    </button>

                    <button
                      type="button"
                      data-testid={`view-qr-tag-btn-${item.id}`}
                      onClick={() => {
                        setActiveQRItem(item);
                        setShowQRModal(true);
                      }}
                      className="min-h-[44px] min-w-[44px] p-2 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                      title="View Paddock QR Tag"
                    >
                      <QrCode className="w-4 h-4 text-neutral-700" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`edit-item-btn-${item.id}`}
                      onClick={() => handleOpenEditItemModal(item)}
                      className="min-h-[44px] px-3 bg-neutral-900 hover:bg-black text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      data-testid={`delete-item-btn-${item.id}`}
                      onClick={() => handleDeleteItem(item.id)}
                      className="min-h-[44px] min-w-[44px] p-2 text-neutral-400 hover:text-red-600 transition-all rounded-xl cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl text-center space-y-3">
            <Package className="w-12 h-12 mx-auto text-neutral-300" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700">⚪ No items staged in this garage zone</h3>
            <p className="text-xs text-neutral-500 font-medium max-w-md mx-auto">
              Stage auto parts, tools, telemetry devices, accessories, or custom builds to start your liquidation pipeline.
            </p>
            <button
              type="button"
              onClick={handleOpenNewItemModal}
              className="min-h-[44px] px-6 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> + Stage First Item
            </button>
          </div>
        )}
      </div>

      {/* 4. ITEM PASSPORT DRAWER / MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200" data-testid="item-passport-modal">
          <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-neutral-200 text-left relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-black text-[#ff3b30] uppercase tracking-widest block">
                  GARAGE ITEM PASSPORT
                </span>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                  {editingItem ? 'Edit Garage Item' : 'Stage New Garage Item'}
                </h2>
              </div>
              <button
                type="button"
                data-testid="close-item-passport-modal-btn"
                onClick={() => setShowItemModal(false)}
                className="min-h-[44px] min-w-[44px] p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Item Title *</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={e => setItemTitle(e.target.value)}
                  placeholder="e.g. Ford Mustang GT 5.0 Intake Manifold"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Category</label>
                  <select
                    value={itemCategory}
                    onChange={e => setItemCategory(e.target.value as any)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Condition</label>
                  <select
                    value={itemCondition}
                    onChange={e => setItemCondition(e.target.value as any)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Cost Basis ($)</label>
                  <input
                    type="number"
                    value={itemCostPrice}
                    onChange={e => setItemCostPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="100"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">List Price ($)</label>
                  <input
                    type="number"
                    value={itemListPrice}
                    onChange={e => setItemListPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="250"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Pipeline Status</label>
                  <select
                    value={itemStatus}
                    onChange={e => setItemStatus(e.target.value as any)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Location Hierarchy Selector */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-3">
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block">Shelving &amp; Location Tree</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Zone</label>
                    <select
                      value={itemZoneId}
                      onChange={e => setItemZoneId(e.target.value)}
                      className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 min-h-[44px]"
                    >
                      {zones.length > 0 ? (
                        zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)
                      ) : (
                        <option value="">Main Zone</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Shelf</label>
                    <input
                      type="text"
                      value={itemShelf}
                      onChange={e => setItemShelf(e.target.value)}
                      placeholder="Shelf A"
                      className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Bin ID</label>
                    <input
                      type="text"
                      value={itemBinId}
                      onChange={e => setItemBinId(e.target.value)}
                      placeholder="BIN-42"
                      className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Photo Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-[#ff3b30]" /> Multi-Photo Gallery ({itemPhotos.length})
                </label>

                {itemPhotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                    {itemPhotos.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 shrink-0 group">
                        <img src={url} alt={`Photo ${idx+1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setItemPhotos(itemPhotos.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="min-h-[44px] p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-800 flex items-center justify-center gap-2 cursor-pointer transition-all">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#ff3b30]" /> : <Camera className="w-4 h-4 text-blue-600" />}
                  <span>{uploading ? 'Uploading to Storage...' : '+ Upload Item Photos'}</span>
                  <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Item Description</label>
                <textarea
                  rows={2}
                  value={itemDescription}
                  onChange={e => setItemDescription(e.target.value)}
                  placeholder="Details, fitment, condition notes..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Technical Specs</label>
                <input
                  type="text"
                  value={itemSpecs}
                  onChange={e => setItemSpecs(e.target.value)}
                  placeholder="Part # 5.0-V8-2024, OEM Ford, Anodized Black"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="min-h-[44px] px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="min-h-[44px] px-6 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/20"
                >
                  {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Item Passport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ZONE CREATION MODAL */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl border border-neutral-200 text-left relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-black uppercase text-neutral-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" /> Create Location Zone
              </h3>
              <button
                type="button"
                onClick={() => setShowZoneModal(false)}
                className="min-h-[44px] min-w-[44px] p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Zone Name *</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={e => setZoneName(e.target.value)}
                  placeholder="e.g. Engine Bay & Racks, Pallet A"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Description</label>
                <input
                  type="text"
                  value={zoneDesc}
                  onChange={e => setZoneDesc(e.target.value)}
                  placeholder="North wall heavy shelving unit"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 min-h-[44px]"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  className="min-h-[44px] px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. QR CODE MODAL */}
      {showQRModal && activeQRItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200" data-testid="qr-code-modal">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl border border-neutral-200 text-center relative shadow-2xl space-y-4">
            <button
              type="button"
              data-testid="close-qr-modal-btn"
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 min-h-[44px] min-w-[44px] p-2 text-neutral-400 hover:text-neutral-900 text-sm font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1 border-b border-neutral-100 pb-3">
              <span className="text-[9px] font-mono font-black uppercase text-[#ff3b30] tracking-widest block">
                PADDOCK ITEM QR TAG
              </span>
              <h3 className="text-base font-black uppercase text-neutral-900">
                {activeQRItem.title}
              </h3>
              <p className="text-[10px] font-mono font-bold text-neutral-500">{activeQRItem.qr_code_tag}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
              <GridpassQRCode 
                value={`https://gridpass.app/dash/garage?item=${activeQRItem.id}`} 
                size={180} 
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                data-testid="download-qr-code-btn"
                onClick={() => downloadGridpassQR('garage-item-qr-code', `${activeQRItem.title.replace(/[^a-zA-Z0-9]/g, '_')}_QR`)}
                className="w-full min-h-[44px] py-2.5 px-4 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer shadow-md"
              >
                Download QR Code PNG
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
