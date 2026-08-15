'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage } from '@/lib/firebase/config';
import { 
  collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Wrench, Warehouse, Package, DollarSign, Layers, Plus, Search, Filter, 
  Copy, QrCode, Tag, Camera, CheckCircle2, ChevronRight, X, ArrowLeft, Loader2,
  Trash2, ExternalLink, Sparkles, AlertCircle, ShoppingBag, HardDrive,
  ShieldCheck, Printer, BookOpen, Calendar, Clock, Eye, Users, Zap, Image as ImageIcon, Recycle, Trophy, MapPin
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import GridpassQRCode, { downloadGridpassQR } from '@/components/qr/GridpassQRCode';
import { ExcelWorksheetTable, ColumnDef } from '@gridpass/ui';
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
  'Detailing & Wraps',
  'Food & Beverage Stock',
  'Kitchen & Catering Gear',
  'Apparel & Merch',
  'Accessories',
  'Other'
];

const STATUSES: ItemStatus[] = ['Draft', 'Photographed', 'Listed', 'Sold'];

export function GarageInventoryManagerContent() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'qr-tags' | 'insurance'>('inventory');

  const [urlSpaceId, setUrlSpaceId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setUrlSpaceId(params.get('space'));
    }
  }, []);

  // Inventory & Space State
  const [items, setItems] = useState<GarageItem[]>([]);
  const [zones, setZones] = useState<GarageZone[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | 'All'>(urlSpaceId || 'All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeStatusFilter, setActiveStatusFilter] = useState<ItemStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | 'All'>('All');

  // Storyboard & Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQRItem, setActiveQRItem] = useState<any | null>(null);

  // Item Form State
  const [itemTitle, setItemTitle] = useState('');
  const [itemSpaceId, setItemSpaceId] = useState('');
  const [itemMake, setItemMake] = useState('');
  const [itemModel, setItemModel] = useState('');
  const [itemWebsiteUrl, setItemWebsiteUrl] = useState('');
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
  const [itemCoOwners, setItemCoOwners] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [matchedMembers, setMatchedMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [newCoOwnerShare, setNewCoOwnerShare] = useState<number | ''>(50);
  const [uploading, setUploading] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Rapid Bulk Intake Studio State
  const [showRapidBulkModal, setShowRapidBulkModal] = useState(false);
  const [bulkSessionCount, setBulkSessionCount] = useState(0);
  const [bulkTitle, setBulkTitle] = useState('');
  const [bulkMake, setBulkMake] = useState('');
  const [bulkModel, setBulkModel] = useState('');
  const [bulkSpaceId, setBulkSpaceId] = useState('');
  const [bulkZoneId, setBulkZoneId] = useState('');
  const [bulkPhotos, setBulkPhotos] = useState<string[]>([]);
  const [savingBulkItem, setSavingBulkItem] = useState(false);
  const bulkTitleInputRef = React.useRef<HTMLInputElement>(null);

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
        let loadedItems: any[] = [];
        let loadedZones: any[] = [];
        let loadedSpaces: any[] = [];

        if (user && !isMock) {
          try {
            const itemsQuery = query(collection(db, 'garage_items'), where('owner_uid', '==', user.uid));
            const coOwnedQuery = query(collection(db, 'garage_items'), where('co_owner_uids', 'array-contains', user.uid));
            
            const [itemsSnap, coOwnedSnap] = await Promise.all([
              getDocs(itemsQuery),
              getDocs(coOwnedQuery).catch(() => ({ docs: [] }))
            ]);
            
            const ownedItems = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const coOwnedItems = coOwnedSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            const itemMap = new Map<string, any>();
            [...ownedItems, ...coOwnedItems].forEach(item => itemMap.set(item.id, item));
            loadedItems = Array.from(itemMap.values());

            const zonesQuery = query(collection(db, 'garage_zones'), where('owner_uid', '==', user.uid));
            const zonesSnap = await getDocs(zonesQuery);
            loadedZones = zonesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            const spacesQuery = query(collection(db, 'garage_spaces'), where('owner_uid', '==', user.uid));
            const spacesSnap = await getDocs(spacesQuery);
            loadedSpaces = spacesSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((s: any) => !s.is_hidden);

          } catch (e) {
            console.error("Firestore garage load error:", e);
          }
        }

        if (loadedItems.length === 0 && (isMock || !user)) {
          loadedItems = [
            {
              id: 'mock-1',
              owner_uid: user?.uid || 'GPTestUser_Marcus',
              space_id: 'space-main-bay',
              title: 'Holley EFI Dominator ECU & Wiring Harness',
              make: 'Holley',
              model: 'Dominator EFI',
              website_url: 'https://www.holley.com/products/fuel_systems/fuel_injection/dominator_efi/',
              category: 'Electronics & Telemetry',
              condition: 'Like New',
              cost_price: 2450,
              list_price: 2200,
              replacement_value: 2600,
              status: 'Listed',
              serial_number: 'HOL-99218-X',
              photos: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80'],
              specs: 'Dual 4.3 TBI control, 8-stage nitrous support, built-in datalogging',
              shelf_location: 'Shelf B2',
              bin_id: 'BIN-ELECT-01',
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-2',
              owner_uid: user?.uid || 'GPTestUser_Marcus',
              space_id: 'space-trailer-1',
              title: 'VP Racing C12 Race Fuel (55 Gal Drum)',
              make: 'VP Racing',
              model: 'C12 Leaded 112 Octane',
              website_url: 'https://vpracingfuels.com/product/c12/',
              category: 'Tools & Equipment',
              condition: 'Brand New',
              cost_price: 850,
              list_price: 850,
              replacement_value: 920,
              status: 'Photographed',
              serial_number: 'VP-C12-DRUM-442',
              photos: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&auto=format&fit=crop&q=80'],
              specs: 'Leaded 112 Motor Octane for high-compression drag engines',
              shelf_location: 'Floor Rack 01',
              created_at: new Date().toISOString()
            },
            {
              id: 'mock-3',
              owner_uid: user?.uid || 'GPTestUser_Marcus',
              space_id: 'space-main-bay',
              title: 'Brembo GT 6-Piston Monobloc Brake Caliper Kit',
              make: 'Brembo',
              model: 'GT 6-Piston 380mm',
              website_url: 'https://www.brembo.com/en/car/sporting-use/gt-systems',
              category: 'Suspension & Brakes',
              condition: 'Good',
              cost_price: 3800,
              list_price: 3200,
              replacement_value: 4100,
              status: 'Draft',
              serial_number: 'BRM-GT6-380-R',
              photos: ['https://images.unsplash.com/photo-1600706432522-7774e1d3e8e1?w=600&auto=format&fit=crop&q=80'],
              specs: 'Red Anodized Monobloc calipers with drilled 2-piece floating rotors',
              shelf_location: 'Shelf C1',
              created_at: new Date().toISOString()
            }
          ];
        }

        if (loadedSpaces.length === 0) {
          loadedSpaces = [
            { id: 'space-main-bay', name: 'Main Race Shop Bay', length_ft: 40, width_ft: 30, type: 'Shop' },
            { id: 'space-trailer-1', name: '53ft Gooseneck Race Trailer', length_ft: 53, width_ft: 8.5, type: 'Trailer' }
          ];
        }

        if (isMounted) {
          setItems(loadedItems);
          setZones(loadedZones);
          setSpaces(loadedSpaces);
        }
      } catch (err) {
        console.error("Error loading garage manager payload:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGarageData();
    return () => { isMounted = false; };
  }, [user, authLoading]);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'item' | 'bulk') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (target === 'item') setUploading(true);

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (user) {
          const fileRef = ref(storage, `garage_photos/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          urls.push(downloadUrl);
        } else {
          urls.push(URL.createObjectURL(file));
        }
      }

      if (target === 'item') setItemPhotos(prev => [...prev, ...urls]);
      if (target === 'bulk') setBulkPhotos(prev => [...prev, ...urls]);

      showToast({ title: 'Photos Uploaded', message: `Added ${urls.length} photo(s)` });
    } catch (err) {
      console.error("Photo upload error:", err);
      showToast({ title: 'Upload Failed', message: 'Failed to upload photo.' });
    } finally {
      if (target === 'item') setUploading(false);
    }
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      showToast({ title: 'Title Required', message: 'Please enter an item title.' });
      return;
    }

    setSavingItem(true);
    try {
      const coOwnerUids = itemCoOwners.map(c => c.uid);
      const payload: any = {
        owner_uid: user?.uid || 'GPTestUser_Marcus',
        space_id: itemSpaceId || (spaces[0]?.id || 'space-main-bay'),
        zone_id: itemZoneId || '',
        title: itemTitle.trim(),
        make: itemMake.trim(),
        model: itemModel.trim(),
        website_url: itemWebsiteUrl.trim(),
        category: itemCategory,
        condition: itemCondition,
        cost_price: typeof itemCostPrice === 'number' ? itemCostPrice : 0,
        list_price: typeof itemListPrice === 'number' ? itemListPrice : 0,
        serial_number: itemSerialNumber.trim(),
        replacement_value: typeof itemReplacementValue === 'number' ? itemReplacementValue : 0,
        description: itemDescription.trim(),
        specs: itemSpecs.trim(),
        status: itemStatus,
        shelf_location: itemShelf.trim(),
        bin_id: itemBinId.trim(),
        photos: itemPhotos,
        co_owners: itemCoOwners,
        co_owner_uids: coOwnerUids,
        updated_at: new Date().toISOString()
      };

      if (editingItem && editingItem.id) {
        if (user) {
          await updateDoc(doc(db, 'garage_items', editingItem.id), payload);
        }
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...payload } : i));
        showToast({ title: 'Item Saved!', message: 'Updated inventory item details.' });
      } else {
        payload.created_at = new Date().toISOString();
        if (user) {
          const docRef = await addDoc(collection(db, 'garage_items'), payload);
          payload.id = docRef.id;
        } else {
          payload.id = `item-${Date.now()}`;
        }
        setItems([payload, ...items]);
        showToast({ title: 'Item Saved!', message: 'New inventory item added.' });
      }

      resetItemForm();
      setShowItemModal(false);
    } catch (err) {
      console.error("Save item error:", err);
      showToast({ title: 'Save Failed', message: 'Could not save inventory item.' });
    } finally {
      setSavingItem(false);
    }
  };

  // Rapid Bulk Intake Save
  const handleSaveRapidBulkItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTitle.trim()) {
      showToast({ title: 'Title Required', message: 'Please enter item title or snap photo.' });
      return;
    }

    setSavingBulkItem(true);
    try {
      const targetSpaceId = bulkSpaceId || (selectedSpaceId !== 'All' ? selectedSpaceId : (spaces[0]?.id || 'space-main-bay'));
      const payload: any = {
        owner_uid: user?.uid || 'GPTestUser_Marcus',
        space_id: targetSpaceId,
        zone_id: bulkZoneId || '',
        title: bulkTitle.trim(),
        make: bulkMake.trim(),
        model: bulkModel.trim(),
        category: 'Tools & Equipment',
        condition: 'Good',
        status: 'Photographed',
        cost_price: 0,
        list_price: 0,
        replacement_value: 0,
        photos: bulkPhotos,
        created_at: new Date().toISOString()
      };

      if (user) {
        const docRef = await addDoc(collection(db, 'garage_items'), payload);
        payload.id = docRef.id;
      } else {
        payload.id = `bulk-${Date.now()}`;
      }

      setItems(prev => [payload, ...prev]);
      setBulkSessionCount(prev => prev + 1);
      showToast({ title: 'Item Staged!', message: `Saved "${bulkTitle}". Add next item!` });

      // Preserve locked storage space & location presets for rapid consecutive entry
      setBulkSpaceId(targetSpaceId);
      setBulkTitle('');
      setBulkMake('');
      setBulkModel('');
      setBulkPhotos([]);

      setTimeout(() => {
        bulkTitleInputRef.current?.focus();
      }, 100);

    } catch (err) {
      console.error("Rapid bulk save error:", err);
      showToast({ title: 'Save Failed', message: 'Could not stage bulk item.' });
    } finally {
      setSavingBulkItem(false);
    }
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemSpaceId(spaces[0]?.id || '');
    setItemMake('');
    setItemModel('');
    setItemWebsiteUrl('');
    setItemCategory('Engine & Drivetrain');
    setItemCondition('Good');
    setItemCostPrice('');
    setItemListPrice('');
    setItemSerialNumber('');
    setItemReplacementValue('');
    setItemDescription('');
    setItemSpecs('');
    setItemStatus('Draft');
    setItemZoneId('');
    setItemShelf('Shelf A');
    setItemBinId('');
    setItemPhotos([]);
    setItemCoOwners([]);
    setSelectedMember(null);
    setMemberSearchQuery('');
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setItemTitle(item.title || '');
    setItemSpaceId(item.space_id || '');
    setItemMake(item.make || '');
    setItemModel(item.model || '');
    setItemWebsiteUrl(item.website_url || '');
    setItemCategory(item.category || 'Engine & Drivetrain');
    setItemCondition(item.condition || 'Good');
    setItemCostPrice(item.cost_price || '');
    setItemListPrice(item.list_price || '');
    setItemSerialNumber(item.serial_number || '');
    setItemReplacementValue(item.replacement_value || '');
    setItemDescription(item.description || '');
    setItemSpecs(item.specs || '');
    setItemStatus(item.status || 'Draft');
    setItemZoneId(item.zone_id || '');
    setItemShelf(item.shelf_location || '');
    setItemBinId(item.bin_id || '');
    setItemPhotos(item.photos || []);
    setItemCoOwners(item.co_owners || []);
    setShowItemModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      if (user) {
        await updateDoc(doc(db, 'garage_items', itemId), { is_hidden: true });
      }
      setItems(items.filter(i => i.id !== itemId));
      showToast({ title: 'Item Removed', message: 'Item archived from inventory.' });
    } catch (err) {
      console.error("Delete item error:", err);
      showToast({ title: 'Error', message: 'Failed to archive item.' });
    }
  };

  // Filtered items
  const filteredItems = items.filter((item: any) => {
    if (selectedSpaceId !== 'All' && item.space_id !== selectedSpaceId) return false;
    if (selectedCategoryFilter !== 'All' && item.category !== selectedCategoryFilter) return false;
    if (activeStatusFilter !== 'All' && item.status !== activeStatusFilter) return false;
    if (selectedZoneId !== 'All' && item.zone_id !== selectedZoneId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchMake = (item.make || '').toLowerCase().includes(q);
      const matchModel = (item.model || '').toLowerCase().includes(q);
      const matchSerial = (item.serial_number || '').toLowerCase().includes(q);
      const matchBin = (item.bin_id || '').toLowerCase().includes(q);
      return matchTitle || matchMake || matchModel || matchSerial || matchBin;
    }
    return true;
  });

  const totalValuation = filteredItems.reduce((acc, curr) => acc + (curr.replacement_value || curr.list_price || curr.cost_price || 0), 0);

  const excelColumns: ColumnDef<any>[] = [
    {
      key: 'photos',
      label: 'PHOTO',
      render: (row: any) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
          {row.photos && row.photos.length > 0 ? (
            <img src={row.photos[0]} alt={row.title} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-4 h-4 text-neutral-400" />
          )}
        </div>
      )
    },
    {
      key: 'title',
      label: 'ITEM & SPECS',
      render: (row: any) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 text-xs">{row.title}</span>
            {row.website_url && (
              <a href={row.website_url} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-[#ff3b30] transition-colors" title="Official Part Link">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-2 mt-0.5">
            {row.make && <span>Make: <strong className="text-neutral-700">{row.make}</strong></span>}
            {row.model && <span>Model: <strong className="text-neutral-700">{row.model}</strong></span>}
            {row.serial_number && <span>S/N: <strong className="text-neutral-700">{row.serial_number}</strong></span>}
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'CATEGORY',
      render: (row: any) => (
        <span className="inline-block px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 font-mono text-[10px] rounded-md font-bold uppercase">
          {row.category}
        </span>
      )
    },
    {
      key: 'co_owners',
      label: 'CO-OWNERS & SHARES',
      render: (row: any) => (
        <div>
          {row.co_owners && row.co_owners.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.co_owners.map((co: any, idx: number) => (
                <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[9px] font-mono font-bold rounded-md">
                  <Users className="w-2.5 h-2.5" />
                  {co.display_name} ({co.ownership_share_pct}%)
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-neutral-400 font-mono">100% Sole Owner</span>
          )}
        </div>
      )
    },
    {
      key: 'space_id',
      label: 'LOCATION & BIN',
      render: (row: any) => (
        <div className="font-mono text-[10px] text-neutral-700">
          <div className="font-bold flex items-center gap-1 text-neutral-900">
            <MapPin className="w-3 h-3 text-[#ff3b30]" />
            {spaces.find(s => s.id === row.space_id)?.name || 'Main Shop'}
          </div>
          <div className="text-neutral-500">
            {row.shelf_location || 'Unassigned Shelf'} {row.bin_id ? `• Bin: ${row.bin_id}` : ''}
          </div>
        </div>
      )
    },
    {
      key: 'replacement_value',
      label: 'EST. VALUATION',
      render: (row: any) => (
        <div className="font-mono text-xs text-emerald-600 font-bold">
          ${(row.replacement_value || row.list_price || row.cost_price || 0).toLocaleString()}
        </div>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row: any) => {
        const badgeColors: Record<string, string> = {
          Draft: 'bg-neutral-100 text-neutral-600 border-neutral-200',
          Photographed: 'bg-amber-50 text-amber-700 border-amber-200',
          Listed: 'bg-blue-50 text-blue-700 border-blue-200',
          Sold: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        return (
          <span className={`inline-block px-2 py-0.5 border font-mono text-[10px] font-bold rounded-md uppercase ${badgeColors[row.status] || badgeColors.Draft}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Edit Item"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveQRItem(row);
              setShowQRModal(true);
            }}
            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Print Asset QR Tag"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteItem(row.id)}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Archive Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center font-mono text-xs font-bold uppercase gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff3b30]" />
        <span>Loading Inventory &amp; Equipment Catalog...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20">
      
      {/* Top Banner Header */}
      <div className="bg-neutral-900 text-white border-b border-neutral-800 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dash" className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-neutral-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff3b30] font-black">GRIDPASS GARAGE</span>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <Warehouse className="w-6 h-6 text-[#ff3b30]" />
                INVENTORY
              </h1>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              data-testid="rapid-bulk-intake-open-btn"
              onClick={() => {
                setShowRapidBulkModal(true);
                setBulkSessionCount(0);
                setBulkSpaceId(selectedSpaceId !== 'All' ? selectedSpaceId : (spaces[0]?.id || ''));
                setTimeout(() => bulkTitleInputRef.current?.focus(), 150);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-mono text-xs font-black uppercase rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              ⚡ Bulk Add Items
            </button>

            <button
              type="button"
              onClick={() => {
                resetItemForm();
                setShowItemModal(true);
              }}
              className="px-4 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-mono text-xs font-black uppercase rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'inventory' ? 'bg-[#ff3b30] text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Inventory ({filteredItems.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('qr-tags')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'qr-tags' ? 'bg-[#ff3b30] text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Tags ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('insurance')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'insurance' ? 'bg-[#ff3b30] text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Insurance (${totalValuation.toLocaleString()})
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <span className="text-neutral-500">TOTAL ITEMS: <strong className="text-neutral-900">{items.length}</strong></span>
            <span className="text-neutral-300">|</span>
            <span className="text-emerald-600 font-bold">VALUATION: ${totalValuation.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Tab 1: Inventory Spreadsheet Table & Controls */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-4">
            
            {/* Filter & Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search part name, S/N, make, bin..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Dropdowns */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-800 focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={activeStatusFilter}
                    onChange={(e) => setActiveStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-800 focus:outline-none focus:border-[#ff3b30]"
                  >
                    <option value="All">All Statuses</option>
                    {STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                        viewMode === 'table' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Spreadsheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                        viewMode === 'cards' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      Cards
                    </button>
                  </div>
                </div>
              </div>

              {/* Space Storage Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-neutral-100">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase mr-1">Storage Space:</span>
                <button
                  type="button"
                  onClick={() => setSelectedSpaceId('All')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer shrink-0 ${
                    selectedSpaceId === 'All' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  All Items ({items.length})
                </button>
                {spaces.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSpaceId(s.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer shrink-0 ${
                      selectedSpaceId === s.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {s.name} ({items.filter(i => i.space_id === s.id).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Spreadsheet Table View */}
            {viewMode === 'table' ? (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                <ExcelWorksheetTable
                  idKey="id"
                  title="Inventory Spreadsheet"
                  data={filteredItems}
                  columns={excelColumns}
                />
              </div>
            ) : (
              /* Card Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="h-40 bg-neutral-100 rounded-xl overflow-hidden relative border border-neutral-200">
                        {item.photos && item.photos.length > 0 ? (
                          <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 font-mono text-xs font-bold uppercase">
                            No Photo
                          </div>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-neutral-900/90 backdrop-blur-md text-white text-[9px] font-mono font-bold rounded-md uppercase">
                          {item.category}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-black text-neutral-900 text-sm">{item.title}</h3>
                        <p className="text-xs text-neutral-500 font-mono">
                          {item.make} {item.model ? `• ${item.model}` : ''}
                        </p>
                      </div>

                      {item.specs && (
                        <p className="text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded-lg font-mono">
                          {item.specs}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-neutral-400 font-mono uppercase block">EST. VALUE</span>
                        <span className="text-xs font-mono font-bold text-emerald-600">
                          ${(item.replacement_value || item.cost_price || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-mono font-bold rounded-lg cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Tab 2: QR Tags Studio */}
        {activeSubTab === 'qr-tags' && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-neutral-900 uppercase flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#ff3b30]" />
                PRINT ASSET QR TAGS
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                Generate high-resolution printable QR codes for parts, toolboxes, and equipment bins.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-xs">
                    <GridpassQRCode value={`https://gridpass.app/inventory?item=${item.id}`} size={120} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs line-clamp-1">{item.title}</h4>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase block">{item.serial_number || item.category}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadGridpassQR(`qr-${item.id}`, `Gridpass-QR-${item.title}`)}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Download Tag PNG
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Insurance Schedule */}
        {activeSubTab === 'insurance' && (
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-neutral-900 uppercase flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  VERIFIED INSURANCE &amp; VALUATION SCHEDULE
                </h2>
                <p className="text-xs text-neutral-500 font-mono mt-1">
                  Export complete itemized serial numbers, valuations, and photos for insurance claims.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-mono uppercase block font-bold">TOTAL COVERED VALUATION</span>
                <span className="text-xl font-mono font-black text-emerald-700">${totalValuation.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs">{item.title}</h4>
                    <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-3 mt-1">
                      <span>S/N: <strong className="text-neutral-800">{item.serial_number || 'N/A'}</strong></span>
                      <span>Category: <strong className="text-neutral-800">{item.category}</strong></span>
                      <span>Condition: <strong className="text-neutral-800">{item.condition}</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 font-mono block">REPLACEMENT VALUE</span>
                    <span className="text-sm font-mono font-bold text-emerald-600">
                      ${(item.replacement_value || item.cost_price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* RAPID BULK INTAKE STUDIO MODAL */}
      {showRapidBulkModal && (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Zap className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 text-sm uppercase">⚡ BULK ADD ITEMS</h3>
                  <p className="text-[10px] text-neutral-500 font-mono">Snap photo → Title → Enter ↵ to save &amp; add next</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRapidBulkModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkSessionCount > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-mono font-bold text-emerald-800">
                <span>🎉 Added {bulkSessionCount} item(s) in this session!</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            )}

            <form onSubmit={handleSaveRapidBulkItem} className="space-y-4">
              
              {/* Photo Snap Staging Area */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  1. ITEM PHOTO
                </label>
                <div className="flex items-center gap-3">
                  {bulkPhotos.length > 0 ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 relative shrink-0">
                      <img src={bulkPhotos[0]} alt="Staged item" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBulkPhotos([])}
                        className="absolute top-1 right-1 p-1 bg-neutral-900/80 text-white rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50 flex flex-col items-center justify-center cursor-pointer text-neutral-400 hover:text-amber-600 transition-colors shrink-0">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[9px] font-mono font-bold uppercase">Snap</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, 'bulk')}
                        className="hidden"
                      />
                    </label>
                  )}

                  <div className="text-[11px] text-neutral-500 font-mono leading-tight">
                    Snap a quick photo with your phone camera or select file. Photo attaches automatically.
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                  2. ITEM TITLE *
                </label>
                <input
                  ref={bulkTitleInputRef}
                  type="text"
                  required
                  value={bulkTitle}
                  onChange={(e) => setBulkTitle(e.target.value)}
                  placeholder="e.g. Holley EFI Dominator ECU or VP Fuel Drum"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Location Preset */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    STORAGE SPACE
                  </label>
                  <select
                    value={bulkSpaceId}
                    onChange={(e) => setBulkSpaceId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900"
                  >
                    {spaces.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-neutral-700 mb-1">
                    MAKE / BRAND (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={bulkMake}
                    onChange={(e) => setBulkMake(e.target.value)}
                    placeholder="e.g. Holley"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-200 space-y-2">
                <button
                  type="submit"
                  data-testid="rapid-bulk-save-next-btn"
                  disabled={savingBulkItem || !bulkTitle.trim()}
                  className={`w-full min-h-[52px] px-6 text-sm font-mono font-black uppercase rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                    bulkTitle.trim() && !savingBulkItem
                      ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950 shadow-amber-500/20 active:scale-98'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-5 h-5 fill-neutral-950" />
                  {savingBulkItem ? "Saving Item..." : `⚡ SAVE & ADD NEXT ITEM (Enter ↵)`}
                </button>

                {bulkSessionCount > 0 && (
                  <button
                    type="button"
                    data-testid="rapid-bulk-finish-btn"
                    onClick={() => setShowRapidBulkModal(false)}
                    className="w-full min-h-[44px] px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    🏁 Done Adding Items ({bulkSessionCount} Items Added) → Open Spreadsheet
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function GarageInventoryManager() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center font-mono text-xs font-bold uppercase">Loading Inventory...</div>}>
      <GarageInventoryManagerContent />
    </Suspense>
  );
}
