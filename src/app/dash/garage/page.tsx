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
  Trash2, ExternalLink, Sparkles, AlertCircle, ShoppingBag, HardDrive,
  ShieldCheck, Printer, BookOpen, Calendar, Image as ImageIcon, Recycle, Trophy, MapPin
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import GridpassQRCode, { downloadGridpassQR } from '@/components/qr/GridpassQRCode';
import { 
  GarageItem, GarageZone, ItemStatus, ItemCategory, ItemCondition,
  TransformationCategory, GarageTransformationMilestone
} from '@/lib/types/garage';

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

const TRANSFORMATION_CATEGORIES: TransformationCategory[] = [
  'Initial Survey',
  'Work in Progress',
  'Major Sale Milestone',
  'Scrap & Recycling',
  'Final Clean Bay'
];

const CONDITIONS: ItemCondition[] = ['Brand New', 'Like New', 'Good', 'Fair', 'Parts Only'];
const STATUSES: ItemStatus[] = ['Draft', 'Photographed', 'Listed', 'Sold'];

export default function GarageManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'storyboard'>('inventory');

  // Inventory State
  const [items, setItems] = useState<GarageItem[]>([]);
  const [zones, setZones] = useState<GarageZone[]>([]);
  const [activeStatusFilter, setActiveStatusFilter] = useState<ItemStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | 'All'>('All');

  // Space dimensions state
  const [spaceLength, setSpaceLength] = useState(24);
  const [spaceWidth, setSpaceWidth] = useState(22);

  // Transformation Storyboard State
  const [milestones, setMilestones] = useState<GarageTransformationMilestone[]>([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneCategory, setMilestoneCategory] = useState<TransformationCategory>('Initial Survey');
  const [milestoneDateStr, setMilestoneDateStr] = useState('');
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [milestoneSoldCount, setMilestoneSoldCount] = useState<number | ''>('');
  const [milestoneScrappedCount, setMilestoneScrappedCount] = useState<number | ''>('');
  const [milestoneDiscardedCount, setMilestoneDiscardedCount] = useState<number | ''>('');
  const [milestoneKeptCount, setMilestoneKeptCount] = useState<number | ''>('');
  const [milestoneCashRecovered, setMilestoneCashRecovered] = useState<number | ''>('');
  const [milestonePhotos, setMilestonePhotos] = useState<string[]>([]);
  const [uploadingMilestonePhotos, setUploadingMilestonePhotos] = useState(false);
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GarageItem | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQRItem, setActiveQRItem] = useState<GarageItem | null>(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);

  // Item Form State
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState<ItemCategory>('Engine & Drivetrain');
  const [itemCondition, setItemCondition] = useState<ItemCondition>('Good');
  const [itemCostPrice, setItemCostPrice] = useState<number | ''>('');
  const [itemListPrice, setItemListPrice] = useState<number | ''>('');
  const [itemSerialNumber, setItemSerialNumber] = useState('');
  const [itemReplacementValue, setItemReplacementValue] = useState<number | ''>('');
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
    const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');
    if (authLoading && !isMock) return;
    let isMounted = true;

    async function loadGarageData() {
      if (!user && !isMock) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        let loadedItems: GarageItem[] = [];
        let loadedZones: GarageZone[] = [];
        let loadedMilestones: GarageTransformationMilestone[] = [];

        if (user && !isMock) {
          try {
            // Query items
            const itemsQuery = query(collection(db, 'garage_items'), where('owner_uid', '==', user.uid));
            const itemsSnap = await getDocs(itemsQuery);
            loadedItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as GarageItem));

            // Query zones
            const zonesQuery = query(collection(db, 'garage_zones'), where('owner_uid', '==', user.uid));
            const zonesSnap = await getDocs(zonesQuery);
            loadedZones = zonesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GarageZone));

            // Query transformation milestones
            const milestonesQuery = query(collection(db, 'garage_transformations'), where('owner_uid', '==', user.uid));
            const milestonesSnap = await getDocs(milestonesQuery);
            loadedMilestones = milestonesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GarageTransformationMilestone));
            loadedMilestones.sort((a, b) => new Date(b.date_str || b.created_at).getTime() - new Date(a.date_str || a.created_at).getTime());
          } catch (dbErr) {
            console.warn("Firestore garage fetch warning, fallback check:", dbErr);
          }
        }

        const userUid = user?.uid || 'user-pjlosey-123';
        if (isMock && loadedItems.length === 0) {
          loadedZones = [
            { id: 'zone-1', garage_id: 'default', owner_uid: userUid, name: 'Engine Bay & Racks', description: 'Heavy parts shelving', created_at: '2026-08-01T00:00:00.000Z' },
            { id: 'zone-2', garage_id: 'default', owner_uid: userUid, name: 'Telemetry & Electronics', description: 'Precision IoT & sensors', created_at: '2026-08-01T00:00:00.000Z' }
          ];
          loadedItems = [
            {
              id: 'mock-item-1',
              owner_uid: userUid,
              title: 'Ford Mustang GT 5.0 Intake Manifold',
              category: 'Engine & Drivetrain',
              condition: 'Like New',
              cost_price: 150,
              list_price: 350,
              serial_number: 'SN-FORD-50921',
              replacement_value: 450,
              status: 'Listed',
              location: { zone_id: 'zone-1', zone_name: 'Engine Bay & Racks', shelf: 'Shelf A', bin_id: 'BIN-01' },
              qr_code_tag: 'GP-GAR-INTAKE50',
              description: 'OEM 5.0L Coyote Intake Manifold in flawless condition.',
              specs: 'Part # 5.0-V8-2024, OEM Ford, Anodized Black',
              created_at: '2026-08-01T00:00:00.000Z',
              updated_at: '2026-08-01T00:00:00.000Z'
            },
            {
              id: 'mock-item-2',
              owner_uid: userUid,
              title: 'iRacing Telemetry Sensor Hub',
              category: 'Electronics & Telemetry',
              condition: 'Brand New',
              cost_price: 200,
              list_price: 450,
              serial_number: 'SN-HUB-8832',
              replacement_value: 500,
              status: 'Draft',
              location: { zone_id: 'zone-2', zone_name: 'Telemetry & Electronics', shelf: 'Shelf B', bin_id: 'BIN-08' },
              qr_code_tag: 'GP-GAR-TELHUB',
              description: '60Hz telemetry extraction hub with CAN bus adapter.',
              created_at: '2026-08-01T00:00:00.000Z',
              updated_at: '2026-08-01T00:00:00.000Z'
            },
            {
              id: 'mock-item-3',
              owner_uid: userUid,
              title: 'Brembo 6-Piston Brake Caliper Kit',
              category: 'Suspension & Brakes',
              condition: 'Good',
              cost_price: 500,
              list_price: 950,
              serial_number: 'SN-BREMBO-6P99',
              replacement_value: 1200,
              status: 'Sold',
              sale_price: 950,
              location: { zone_id: 'zone-1', zone_name: 'Engine Bay & Racks', shelf: 'Shelf C', bin_id: 'BIN-12' },
              qr_code_tag: 'GP-GAR-BREMBO6P',
              created_at: '2026-08-01T00:00:00.000Z',
              updated_at: '2026-08-01T00:00:00.000Z'
            }
          ];
        }

        if (isMock && loadedMilestones.length === 0) {
          loadedMilestones = [
            {
              id: 'mock-milestone-1',
              owner_uid: userUid,
              title: 'Phase 1: Garage Inventory & Cleanout Survey',
              category: 'Initial Survey',
              date_str: '2026-08-01',
              notes: 'Cataloged 15+ engine components, organized Zone 1 shelving, identified high-value OEM intakes.',
              items_sold_count: 1,
              items_scrapped_count: 0,
              items_discarded_count: 2,
              items_kept_count: 12,
              cash_recovered: 950,
              created_at: '2026-08-01T00:00:00.000Z'
            }
          ];
        }

        if (isMounted) {
          setItems(loadedItems);
          setZones(loadedZones);
          setMilestones(loadedMilestones);
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

  // Metrics
  const totalSqFt = spaceLength * spaceWidth;
  const totalValuation = items.reduce((sum, item) => sum + (item.list_price || 0), 0);
  const totalCashCollected = items
    .filter(i => i.status === 'Sold')
    .reduce((sum, item) => sum + (item.sale_price || item.list_price || 0), 0);

  // Storyboard Disposition Summary Metrics
  const summaryTotalCataloged = milestones.reduce((acc, m) => 
    acc + (m.items_sold_count || 0) + (m.items_scrapped_count || 0) + (m.items_discarded_count || 0) + (m.items_kept_count || 0), 0) || items.length;
  const summaryCashRecovered = milestones.reduce((acc, m) => acc + (m.cash_recovered || 0), 0) || totalCashCollected;
  const summaryScrapped = milestones.reduce((acc, m) => acc + (m.items_scrapped_count || 0), 0);
  const summaryDiscarded = milestones.reduce((acc, m) => acc + (m.items_discarded_count || 0), 0);
  const summaryRetained = milestones.reduce((acc, m) => acc + (m.items_kept_count || 0), 0);

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
    setItemSerialNumber('');
    setItemReplacementValue('');
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
    setItemSerialNumber(item.serial_number || '');
    setItemReplacementValue(item.replacement_value || '');
    setItemDescription(item.description || '');
    setItemSpecs(item.specs || '');
    setItemStatus(item.status);
    setItemZoneId(item.location?.zone_id || '');
    setItemShelf(item.location?.shelf || 'Shelf A');
    setItemBinId(item.location?.bin_id || '');
    setItemPhotos(item.photos || []);
    setShowItemModal(true);
  };

  const handleMilestonePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploadingMilestonePhotos(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, idx) => {
        const storagePath = `garage_transformations/${user.uid}/${Date.now()}_${idx}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      });

      const newUrls = await Promise.all(uploadPromises);
      setMilestonePhotos(prev => [...prev, ...newUrls]);
      showToast({ title: "📷 Photos Uploaded!", message: `Attached ${newUrls.length} photo(s) to transformation log.`, icon: "✅" });
    } catch (err) {
      console.error("Milestone photo upload error:", err);
    } finally {
      setUploadingMilestonePhotos(false);
    }
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !user) return;

    setSavingMilestone(true);
    const milestoneData = {
      owner_uid: user.uid,
      title: milestoneTitle.trim(),
      category: milestoneCategory,
      date_str: milestoneDateStr || new Date().toISOString().split('T')[0],
      notes: milestoneNotes.trim(),
      items_sold_count: Number(milestoneSoldCount) || 0,
      items_scrapped_count: Number(milestoneScrappedCount) || 0,
      items_discarded_count: Number(milestoneDiscardedCount) || 0,
      items_kept_count: Number(milestoneKeptCount) || 0,
      cash_recovered: Number(milestoneCashRecovered) || 0,
      photos: milestonePhotos,
      created_at: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'garage_transformations'), milestoneData);
      const newMilestone: GarageTransformationMilestone = { id: docRef.id, ...milestoneData };
      setMilestones(prev => [newMilestone, ...prev].sort((a, b) => new Date(b.date_str || b.created_at).getTime() - new Date(a.date_str || a.created_at).getTime()));
      showToast({ title: "📖 Milestone Logged!", message: `Saved "${milestoneTitle}" to Transformation Storyboard.`, icon: "🏆" });
      setShowMilestoneModal(false);
      resetMilestoneForm();
    } catch (err) {
      console.error("Save milestone error:", err);
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await deleteDoc(doc(db, 'garage_transformations', milestoneId));
      setMilestones(prev => prev.filter(m => m.id !== milestoneId));
      showToast({ title: "🗑️ Milestone Deleted", message: "Removed milestone log.", icon: "✅" });
    } catch (err) {
      console.error("Delete milestone error:", err);
    }
  };

  const resetMilestoneForm = () => {
    setMilestoneTitle('');
    setMilestoneCategory('Initial Survey');
    setMilestoneDateStr(new Date().toISOString().split('T')[0]);
    setMilestoneNotes('');
    setMilestoneSoldCount('');
    setMilestoneScrappedCount('');
    setMilestoneDiscardedCount('');
    setMilestoneKeptCount('');
    setMilestoneCashRecovered('');
    setMilestonePhotos([]);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !user) return;

    setSavingItem(true);
    const selectedZone = zones.find(z => z.id === itemZoneId);

    const itemData = {
      owner_uid: user.uid,
      title: itemTitle.trim(),
      category: itemCategory,
      condition: itemCondition,
      cost_price: Number(itemCostPrice) || 0,
      list_price: Number(itemListPrice) || 0,
      serial_number: itemSerialNumber.trim(),
      replacement_value: Number(itemReplacementValue) || Number(itemListPrice) || 0,
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
    } finally {
      setSavingItem(false);
    }
  };

  const handleCopyListingText = (item: GarageItem) => {
    const text = `🏁 FOR SALE: ${item.title.toUpperCase()}
----------------------------------
PRICE: $${item.list_price.toLocaleString()} (Cash / Zelle / Venmo)
CONDITION: ${item.condition}
CATEGORY: ${item.category}
${item.serial_number ? `SERIAL #: ${item.serial_number}\n` : ''}
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
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setUploading(false);
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

  const isMock = typeof window !== 'undefined' && (!!(window as any).__PLAYWRIGHT_MOCK__ || localStorage.getItem('__playwright_mock__') === 'true');
  if (loading) {
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

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              data-testid="export-insurance-schedule-btn"
              onClick={() => setShowInsuranceModal(true)}
              className="min-h-[44px] px-4 bg-emerald-700 hover:bg-emerald-800 border border-emerald-600 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> 🛡️ Export Insurance Schedule (PDF/Print)
            </button>
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
        
        {/* SUB-TAB SELECTOR & TOP ACTIVE SPACE SELECTOR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3" data-testid="garage-sub-tab-selector">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="subtab-inventory"
              onClick={() => setActiveSubTab('inventory')}
              className={`min-h-[44px] px-5 py-2.5 rounded-2xl text-xs font-mono font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'inventory'
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Package className="w-4 h-4 text-[#ff3b30]" />
              <span>📦 Inventory &amp; Pipeline</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-white">
                {items.length}
              </span>
            </button>

            <button
              type="button"
              data-testid="subtab-storyboard"
              onClick={() => setActiveSubTab('storyboard')}
              className={`min-h-[44px] px-5 py-2.5 rounded-2xl text-xs font-mono font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'storyboard'
                  ? 'bg-[#ff3b30] text-white shadow-md shadow-red-500/20'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📖 Transformation Story</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                activeSubTab === 'storyboard' ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {milestones.length}
              </span>
            </button>
          </div>

          {/* Top Active Space Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="space-selector" className="text-xs font-mono font-bold text-neutral-600 uppercase flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#ff3b30]" /> Space:
            </label>
            <select
              id="space-selector"
              data-testid="space-selector-dropdown"
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="min-h-[44px] px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] cursor-pointer min-w-[220px]"
            >
              <option value="All">All Physical Spaces</option>
              <option value="kristina-garage">Kristina's Garage</option>
              <option value="monmouth-storage">Monmouth Beach Self-Storage Unit #402</option>
              <option value="rented-workshop">Rented Workshop Room</option>
              <option value="utility-trailer">7'x14' Enclosed Utility Trailer</option>
              <option value="kristina-house">Kristina's House</option>
            </select>
          </div>
        </div>

        {/* SUB-TAB 1: INVENTORY & PIPELINE */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Header Metrics */}
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

            {/* Filter Bar */}
            <div className="bg-white p-5 border border-neutral-200 rounded-3xl shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
            </div>

            {/* Inventory Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-md hover:border-[#ff3b30] transition-all flex flex-col justify-between group"
                  >
                    <div>
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
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase border shadow-md ${
                          item.status === 'Sold' ? 'bg-emerald-600 text-white border-emerald-500' :
                          item.status === 'Listed' ? 'bg-[#ff3b30] text-white border-red-500' :
                          item.status === 'Photographed' ? 'bg-blue-600 text-white border-blue-500' :
                          'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}>
                          {item.status}
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-black uppercase text-neutral-900 tracking-tight leading-snug">
                            {item.title}
                          </h3>
                          <span className="text-lg font-black font-mono text-[#ff3b30] shrink-0">
                            ${item.list_price.toLocaleString()}
                          </span>
                        </div>
                        {item.serial_number && (
                          <div className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200 inline-block">
                            SN: {item.serial_number}
                          </div>
                        )}
                        {item.description && (
                          <p className="text-xs text-neutral-600 font-medium line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-testid={`copy-listing-btn-${item.id}`}
                          onClick={() => handleCopyListingText(item)}
                          className="min-h-[44px] px-3 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-[10px] font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-1 cursor-pointer"
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
        )}

        {/* SUB-TAB 2: TRANSFORMATION STORYBOARD */}
        {activeSubTab === 'storyboard' && (
          <div className="space-y-8 animate-in fade-in duration-200" data-testid="transformation-storyboard-section">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 text-white p-6 rounded-3xl shadow-xl">
              <div>
                <span className="text-[9px] font-mono font-black text-[#ff3b30] uppercase tracking-widest block">
                  GARAGE TRANSFORMATION STORYBOARD
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#ff3b30]" /> Timeline Logbook &amp; Storytelling Hub
                </h2>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                  Document cleanouts, scrap recovery, major sale milestones, and before/after garage transformations step-by-step.
                </p>
              </div>

              <button
                type="button"
                data-testid="log-milestone-btn"
                onClick={() => {
                  resetMilestoneForm();
                  setShowMilestoneModal(true);
                }}
                className="min-h-[44px] px-6 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-2xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-lg shadow-red-500/20"
              >
                <Plus className="w-4 h-4" /> + Log Transformation Milestone
              </button>
            </div>

            {/* Disposition Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" data-testid="disposition-summary-cards">
              <div className="p-4 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-1">
                <span className="font-mono font-bold text-[10px] text-neutral-500 uppercase block">Cataloged</span>
                <span className="text-2xl font-black font-mono text-neutral-900 block">{summaryTotalCataloged}</span>
              </div>
              <div className="p-4 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-1">
                <span className="font-mono font-bold text-[10px] text-neutral-500 uppercase block">Cash Recovered</span>
                <span className="text-2xl font-black font-mono text-emerald-600 block">${summaryCashRecovered.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-1">
                <span className="font-mono font-bold text-[10px] text-neutral-500 uppercase block">Scrapped</span>
                <span className="text-2xl font-black font-mono text-purple-600 block">{summaryScrapped}</span>
              </div>
              <div className="p-4 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-1">
                <span className="font-mono font-bold text-[10px] text-neutral-500 uppercase block">Discarded</span>
                <span className="text-2xl font-black font-mono text-neutral-700 block">{summaryDiscarded}</span>
              </div>
              <div className="p-4 bg-white border border-neutral-200 rounded-3xl shadow-xs space-y-1 col-span-2 sm:col-span-1">
                <span className="font-mono font-bold text-[10px] text-neutral-500 uppercase block">Retained</span>
                <span className="text-2xl font-black font-mono text-blue-600 block">{summaryRetained}</span>
              </div>
            </div>

            {/* Milestone List */}
            {milestones.length > 0 ? (
              <div className="space-y-6" data-testid="timeline-logbook-container">
                {milestones.map((m, idx) => (
                  <div key={m.id} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-neutral-900 text-white text-[10px] font-mono font-bold rounded-full uppercase">
                          {m.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-500">{m.date_str}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="min-h-[44px] min-w-[44px] text-neutral-400 hover:text-red-600 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-black uppercase text-neutral-900">{m.title}</h3>
                    {m.notes && <p className="text-xs text-neutral-600 font-medium bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">{m.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl text-center space-y-3" data-testid="timeline-logbook-container">
                <Sparkles className="w-12 h-12 mx-auto text-neutral-300" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
                  ⚪ No transformation milestones logged yet. Start telling your garage story!
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    resetMilestoneForm();
                    setShowMilestoneModal(true);
                  }}
                  className="min-h-[44px] px-6 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" /> + Log First Transformation Milestone
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ITEM PASSPORT DRAWER */}
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

              {/* Serial & Replacement Valuation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Serial Number / Asset Tag</label>
                  <input
                    type="text"
                    data-testid="item-serial-number-input"
                    value={itemSerialNumber}
                    onChange={e => setItemSerialNumber(e.target.value)}
                    placeholder="e.g. SN-FORD-50921"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Est. Replacement Value ($)</label>
                  <input
                    type="number"
                    data-testid="item-replacement-value-input"
                    value={itemReplacementValue}
                    onChange={e => setItemReplacementValue(e.target.value ? Number(e.target.value) : '')}
                    placeholder="450"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  />
                </div>
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

      {/* MODAL 2: TRANSFORMATION MILESTONE DRAWER */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200" data-testid="milestone-drawer-modal">
          <div className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-neutral-200 text-left relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[9px] font-mono font-black text-[#ff3b30] uppercase tracking-widest block">
                  GARAGE LOGBOOK ENTRY
                </span>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                  Log Transformation Milestone
                </h2>
              </div>
              <button
                type="button"
                data-testid="close-milestone-modal-btn"
                onClick={() => setShowMilestoneModal(false)}
                className="min-h-[44px] min-w-[44px] p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Milestone Step Title *</label>
                <input
                  type="text"
                  required
                  data-testid="milestone-title-input"
                  value={milestoneTitle}
                  onChange={e => setMilestoneTitle(e.target.value)}
                  placeholder="e.g. Day 1: Storage Unit Disarray Audit"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Category</label>
                  <select
                    data-testid="milestone-category-selector"
                    value={milestoneCategory}
                    onChange={e => setMilestoneCategory(e.target.value as any)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  >
                    {TRANSFORMATION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Date</label>
                  <input
                    type="date"
                    data-testid="milestone-date-picker"
                    value={milestoneDateStr}
                    onChange={e => setMilestoneDateStr(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Story Notes &amp; Progress</label>
                <textarea
                  rows={3}
                  data-testid="milestone-notes-input"
                  value={milestoneNotes}
                  onChange={e => setMilestoneNotes(e.target.value)}
                  placeholder="Describe cleanout progress, scrap haul, sales, or workshop upgrades..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Attach Transformation Photos</label>
                <div className="flex items-center gap-3">
                  <label
                    data-testid="milestone-photo-uploader"
                    className="min-h-[44px] px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4 text-neutral-600" />
                    {uploadingMilestonePhotos ? 'Uploading...' : 'Upload Photos'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleMilestonePhotoUpload}
                    />
                  </label>
                  {milestonePhotos.length > 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {milestonePhotos.length} photo(s) attached
                    </span>
                  )}
                </div>
              </div>


              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="min-h-[44px] px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMilestone}
                  className="min-h-[44px] px-6 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/20"
                >
                  {savingMilestone ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Milestone Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE INSURANCE SCHEDULE */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200" data-testid="insurance-schedule-modal">
          <div className="bg-white max-w-4xl w-full p-6 sm:p-8 rounded-3xl border border-neutral-200 text-left relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <span className="text-[9px] font-mono font-black text-emerald-600 uppercase tracking-widest block">
                  GRIDPASS CERTIFIED ASSET AUDIT REPORT
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2" data-testid="insurance-schedule-title">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" /> Printable Insurance Valuation Schedule
                </h2>
              </div>
              <button
                type="button"
                data-testid="close-insurance-modal-btn"
                onClick={() => setShowInsuranceModal(false)}
                className="min-h-[44px] min-w-[44px] p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl" data-testid="insurance-valuation-summary">
              <div>
                <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">POLICY HOLDER / OWNER</span>
                <span className="text-xs font-black font-mono text-neutral-900">{user?.displayName || user?.email || 'PJ Losey'}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">TOTAL AUDITED ITEMS</span>
                <span className="text-xs font-black font-mono text-neutral-900">{items.length} ITEMS</span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">ESTIMATED REPLACEMENT VALUE</span>
                <span className="text-xs font-black font-mono text-emerald-600">
                  ${items.reduce((sum, item) => sum + (item.replacement_value || item.list_price || 0), 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase block">AUDIT CERTIFICATION DATE</span>
                <span className="text-xs font-black font-mono text-neutral-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-200 rounded-2xl" data-testid="insurance-schedule-table">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-900 text-white uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Item Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Serial # / Tag</th>
                    <th className="p-3 text-right">Cost Price</th>
                    <th className="p-3 text-right">Replacement Val</th>
                    <th className="p-3">Zone Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-neutral-900">{item.title}</td>
                      <td className="p-3 text-neutral-600">{item.category}</td>
                      <td className="p-3 font-mono text-neutral-800">{item.serial_number || item.qr_code_tag || 'N/A'}</td>
                      <td className="p-3 text-right font-bold text-neutral-700">${(item.cost_price || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">${(item.replacement_value || item.list_price || 0).toLocaleString()}</td>
                      <td className="p-3 text-neutral-600">{item.location?.zone_name || 'Main Zone'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4" data-testid="insurance-certification-block">
              <h4 className="text-xs font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Assessor Verification Sign-Off Block
              </h4>
              <p className="text-[9px] font-mono text-neutral-400 italic">
                Certified Asset Record generated by Gridpass Garage Manager.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowInsuranceModal(false)}
                className="min-h-[44px] px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="min-h-[44px] px-6 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Insurance Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QR CODE MODAL */}
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
            <h3 className="text-base font-black uppercase text-neutral-900">{activeQRItem.title}</h3>
            <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
              <GridpassQRCode value={`https://gridpass.app/dash/garage?item=${activeQRItem.id}`} size={180} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
