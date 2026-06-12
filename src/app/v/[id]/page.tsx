'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { 
  collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { 
  CarFront, MapPin, Wrench, ShieldCheck, Heart, User, Calendar, 
  Map, History, ClipboardList, Info, Sparkles, Loader2, ArrowLeft, Sun,
  Settings, Award, Printer, DollarSign, Trash2, Plus, Coins, Fuel, CreditCard
} from 'lucide-react';
import { logEvent } from '@/lib/logger';

interface SpecItem {
  engine?: string;
  transmission?: string;
  hp?: number | string;
  torque?: number | string;
}

interface ModItem {
  category: string;
  brand: string;
  name: string;
  date?: string;
  cost?: number | string;
}

interface CoOwner {
  name: string;
  member_id?: string;
  split?: string;
}

interface DocItem {
  name: string;
  status: string;
  file_url?: string;
}

interface DueMaintenanceItem {
  title: string;
  due_date: string;
  status: string;
  parts_needed?: string;
  affiliate_link?: string;
}

interface VehicleData {
  id: string;
  tag_id: string;
  owner_id: string | null;
  owner_email?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  specs?: SpecItem;
  mods?: ModItem[] | string;
  partner_dealer?: string;
  is_ad_free?: boolean;
  has_telemetry?: boolean;
  is_verified_provenance?: boolean;
  photo_url?: string;
  awards?: string[];
  history?: string[];
  co_owners?: CoOwner[] | string[] | string;
  purchase_date?: string;
  purchase_price?: number | string;
  ownership_split?: string;
  title_status?: string;
  sticker_status?: string;
  engine_hours?: number | string;
  story?: string;
  documents?: DocItem[] | { name: string; status: string }[] | string;
  additional_photos?: string[] | string;
  due_maintenance?: DueMaintenanceItem[] | { title: string; due_date: string }[] | string;
}

interface ServiceLog {
  id: string;
  title: string;
  notes: string;
  date: string;
  cost?: number | string;
  recorded_by: string;
  is_verified: boolean;
  shop_id?: string;
}

interface VehicleExpense {
  id?: string;
  vehicle_id: string;
  owner_id: string;
  title: string;
  category: 'purchase' | 'license' | 'fuel' | 'addon' | 'service' | 'insurance' | 'other';
  cost: number;
  date: string;
  notes?: string;
  created_at?: any;
}

interface Sighting {
  id: string;
  spotted_by: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  location_name: string;
  description: string;
  timestamp: string | any;
}

export default function VehicleProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const vehicleId = (params?.id as string) || '';

  // Data States
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'telemetry' | 'service' | 'expenses' | 'settings'>('specs');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Expense Tracker States
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'purchase' | 'license' | 'fuel' | 'addon' | 'service' | 'insurance' | 'other'>('fuel');
  const [expenseCost, setExpenseCost] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Edit Build states
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editTrim, setEditTrim] = useState('');
  const [editEngine, setEditEngine] = useState('');
  const [editTransmission, setEditTransmission] = useState('');
  const [editHp, setEditHp] = useState('');
  const [editTorque, setEditTorque] = useState('');
  const [editAwards, setEditAwards] = useState('');
  const [editHistory, setEditHistory] = useState('');
  const [editCoOwnersList, setEditCoOwnersList] = useState<CoOwner[]>([]);
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editOwnershipSplit, setEditOwnershipSplit] = useState('');
  const [editTitleStatus, setEditTitleStatus] = useState('');
  const [editStickerStatus, setEditStickerStatus] = useState('');
  const [editEngineHours, setEditEngineHours] = useState('');
  const [editStory, setEditStory] = useState('');
  const [editDocsList, setEditDocsList] = useState<DocItem[]>([]);
  const [editPhotosList, setEditPhotosList] = useState<string[]>([]);
  const [editDueList, setEditDueList] = useState<DueMaintenanceItem[]>([]);
  const [savingSpecs, setSavingSpecs] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const getInviteLink = (ownerName: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/join?inviteVehicleId=${vehicleId}&coOwnerName=${encodeURIComponent(ownerName)}`;
    navigator.clipboard.writeText(url);
    alert(`Invite link copied to clipboard!\nShare this with the co-owner: ${url}`);
  };

  const getAffiliateLink = (m: any) => {
    if (!vehicle) return '';
    if (m.affiliate_link && m.affiliate_link.trim() !== '') {
      return m.affiliate_link.trim();
    }
    if (m.parts_needed && m.parts_needed.trim() !== '') {
      const query = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${m.parts_needed}`;
      return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=gridpass-20`;
    }
    return '';
  };

  useEffect(() => {
    if (vehicle) {
      setEditPhotoUrl(vehicle.photo_url || '');
      setEditYear(String(vehicle.year));
      setEditMake(vehicle.make || '');
      setEditModel(vehicle.model || '');
      setEditTrim(vehicle.trim || '');
      setEditEngine(vehicle.specs?.engine || '');
      setEditTransmission(vehicle.specs?.transmission || '');
      setEditHp(String(vehicle.specs?.hp || ''));
      setEditTorque(String(vehicle.specs?.torque || ''));
      setEditAwards(Array.isArray(vehicle.awards) ? vehicle.awards.join('\n') : '');
      setEditHistory(Array.isArray(vehicle.history) ? vehicle.history.join('\n') : '');

      setEditPurchaseDate(vehicle.purchase_date || '');
      setEditPurchasePrice(String(vehicle.purchase_price || ''));
      setEditOwnershipSplit(vehicle.ownership_split || '');
      setEditTitleStatus(vehicle.title_status || '');
      setEditStickerStatus(vehicle.sticker_status || '');
      setEditEngineHours(String(vehicle.engine_hours || ''));
      setEditStory(vehicle.story || '');

      // Co-Owners List
      if (Array.isArray(vehicle.co_owners)) {
        setEditCoOwnersList((vehicle.co_owners as any[]).map(co => {
          if (typeof co === 'string') return { name: co, split: '50%' };
          return { name: co.name || '', member_id: co.member_id || '', split: co.split || '50%' };
        }));
      } else if (typeof vehicle.co_owners === 'string' && vehicle.co_owners) {
        const names = vehicle.co_owners.split('&').map(n => n.trim());
        setEditCoOwnersList(names.map(name => ({ name, split: '50%' })));
      } else {
        setEditCoOwnersList([]);
      }

      // Documents List
      if (Array.isArray(vehicle.documents)) {
        setEditDocsList((vehicle.documents as any[]).map(doc => {
          if (typeof doc === 'string') return { name: doc, status: 'Valid' };
          return { name: doc.name || '', status: doc.status || 'Valid', file_url: doc.file_url || '' };
        }));
      } else {
        setEditDocsList([]);
      }

      // Photos List
      if (Array.isArray(vehicle.additional_photos)) {
        setEditPhotosList(vehicle.additional_photos);
      } else {
        setEditPhotosList([]);
      }

      // Due Maintenance List
      if (Array.isArray(vehicle.due_maintenance)) {
        setEditDueList((vehicle.due_maintenance as any[]).map(item => {
          if (typeof item === 'string') return { title: item, due_date: '', status: 'Pending' };
          return {
            title: item.title || item.name || '',
            due_date: item.due_date || '',
            status: item.status || 'Pending',
            parts_needed: item.parts_needed || '',
            affiliate_link: item.affiliate_link || ''
          };
        }));
      } else {
        setEditDueList([]);
      }
    }
  }, [vehicle]);

  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSpecs(true);

    const parsedAwards = editAwards.split('\n').map(x => x.trim()).filter(Boolean);
    const parsedHistory = editHistory.split('\n').map(x => x.trim()).filter(Boolean);

    const updatedData = {
      photo_url: editPhotoUrl.trim(),
      year: parseInt(editYear) || vehicle?.year || 2024,
      make: editMake.trim(),
      model: editModel.trim(),
      trim: editTrim.trim(),
      specs: {
        engine: editEngine.trim(),
        transmission: editTransmission.trim(),
        hp: editHp.trim() ? parseInt(editHp) || editHp : '',
        torque: editTorque.trim() ? parseInt(editTorque) || editTorque : ''
      },
      awards: parsedAwards,
      history: parsedHistory,
      co_owners: editCoOwnersList,
      purchase_date: editPurchaseDate.trim(),
      purchase_price: editPurchasePrice.trim() ? parseFloat(editPurchasePrice) || editPurchasePrice : '',
      ownership_split: editOwnershipSplit.trim(),
      title_status: editTitleStatus.trim(),
      sticker_status: editStickerStatus.trim(),
      engine_hours: editEngineHours.trim() ? parseFloat(editEngineHours) || editEngineHours : '',
      story: editStory.trim(),
      documents: editDocsList,
      additional_photos: editPhotosList,
      due_maintenance: editDueList
    };

    if (isMock) {
      await new Promise(r => setTimeout(r, 200));
      setVehicle(prev => prev ? {
        ...prev,
        ...updatedData
      } : null);
      setSavingSpecs(false);
      setActiveTab('specs');
      await logEvent('success', 'system', `Updated vehicle specs in mock for tag [${vehicle?.tag_id}]`);
      return;
    }

    try {
      await updateDoc(doc(db, 'vehicles', vehicleId), updatedData);
      setVehicle(prev => prev ? {
        ...prev,
        ...updatedData
      } : null);
      setActiveTab('specs');
      await logEvent('success', 'system', `Updated vehicle specs for document [${vehicleId}]`);
    } catch (err) {
      console.error("Failed to update vehicle specs:", err);
      alert("Error saving vehicle specification changes.");
    } finally {
      setSavingSpecs(false);
    }
  };

  const handlePrint = () => {
    if (!vehicle) return;
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Badge - Gridpass</title>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: white;
              }
              svg {
                width: 80%;
                max-width: 400px;
                height: auto;
              }
            </style>
          </head>
          <body>
            ${getBadgeSVGMarkup()}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getBadgeSVGMarkup = () => {
    if (!vehicle) return '';
    const tagId = vehicle.tag_id || `GP-VEH-${vehicle.id.slice(0, 6).toUpperCase()}`;
    const qrRedirectUrl = `${window.location.origin}/qr/${tagId}`;
    const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrRedirectUrl)}`;
    const escapedQrCodeImgSrc = qrCodeImgSrc.replace(/&/g, '&amp;');
    const badgeTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <defs>
          <linearGradient id="mGrad" x1="60" y1="22" x2="60" y2="70" gradientUnits="userSpaceOnUse">
            <stop stop-color="#bd2925" />
            <stop offset="1" stop-color="#1c1c1f" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="290" height="290" rx="20" fill="none" stroke="#bd2925" stroke-width="8"/>
        <rect x="20" y="20" width="260" height="260" rx="12" fill="none" stroke="#262626" stroke-width="2" stroke-dasharray="8,4"/>
        <image href="${escapedQrCodeImgSrc}" x="85" y="75" width="130" height="130"/>
        
        <!-- Center logo peaks overlay -->
        <rect x="134" y="124" width="32" height="32" rx="4" fill="#ffffff" />
        <g transform="translate(136, 126) scale(${28/120}, ${28/100})">
          <path d="M10 70 L42 22 L65 52 L88 28 L110 70 Z" fill="url(#mGrad)" stroke="#1c1c1f" stroke-width="6" stroke-linejoin="round" />
          <path d="M42 22 L52 42 M88 28 L98 48" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
          <path d="M18 86 C 48 86, 56 59, 96 59" stroke="#bd2925" stroke-width="12" stroke-linecap="round" />
        </g>

        <text x="150" y="52" fill="#1c1c1f" font-family="sans-serif" font-size="16" font-weight="900" letter-spacing="4" text-anchor="middle">GRIDPASS</text>
        <text x="150" y="230" fill="#1c1c1f" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${badgeTitle}</text>
        <text x="150" y="255" fill="#bd2925" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">${tagId}</text>
      </svg>
    `;
  };

  const handleDownloadSVG = () => {
    if (!vehicle) return;
    const tagId = vehicle.tag_id || `GP-VEH-${vehicle.id.slice(0, 6).toUpperCase()}`;
    const svgContent = getBadgeSVGMarkup();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gridpass-${tagId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Interactive States
  const [vibeChecks, setVibeChecks] = useState(12);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  // New Service Log form
  const [logTitle, setLogTitle] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingLog, setSubmittingLog] = useState(false);

  // Checks
  const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;
  const isOwner = user && vehicle && user.uid === vehicle.owner_id;
  
  // A certified shop is a user with a B2B shop email (mock or actual) or explicitly authenticated
  const isShop = user && (
    user.email?.endsWith('@performancetuning.com') || 
    user.email?.endsWith('@monmouthmarine.com') ||
    user.email?.endsWith('@gridpass.app') ||
    (user as any).role === 'shop' ||
    (isMock && user.email === 'mike@performancetuning.com')
  );

  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    async function loadVehicleData() {
      if (isMock) {
        // Return simulated vehicle data for Playwright tests
        await new Promise(r => setTimeout(r, 100));
        
        let ownerId = 'user-marcus-123';
        if (vehicleId === 'mock-unclaimed-v1') ownerId = '';

        const mockVehicle: VehicleData = {
          id: vehicleId || 'mock-v1',
          tag_id: 'GP-MARCUS-GT',
          owner_id: ownerId,
          owner_email: 'marcus@enthusiast.com',
          year: 2024,
          make: 'Ford',
          model: 'Mustang GT',
          trim: 'Premium',
          specs: {
            engine: '5.0L Coyote V8',
            transmission: '6-Speed Manual',
            hp: 480,
            torque: 415
          },
          mods: [
            { category: 'Exhaust', brand: 'Roush', name: 'Cat-Back Exhaust System', cost: 1200 },
            { category: 'Suspension', brand: 'Steeda', name: 'Progressive lowering springs', cost: 350 }
          ],
          partner_dealer: 'Monmouth Marine Ford',
          has_telemetry: true,
          is_verified_provenance: true,
          photo_url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80',
          awards: [
            'Best Mustang Build - Wall Stadium 2025',
            'People Choice Award - Cars & Coffee 2026'
          ],
          history: [
            'Purchased new from Monmouth Marine Ford in 2024.',
            'Roush Exhaust installed at 1,500 miles.',
            'Lowering springs installed at 3,000 miles.'
          ],
          co_owners: '',
          purchase_date: '2026-06-01',
          purchase_price: 4500,
          ownership_split: '50/50',
          title_status: 'Clean (Held by Kristina)',
          sticker_status: 'Active (Expires 2028)',
          engine_hours: 120,
          story: 'Me and Kristina bought this 2007 Sea-Doo GTI SE to share our weekend adventures. It has been incredibly reliable on the bay!',
          documents: [
            { name: 'Registration (WI-9384-AB)', status: 'Valid' },
            { name: 'USCG Safety Equipment', status: 'Compliant' },
            { name: 'Hull Insurance Policy', status: 'Active' }
          ],
          additional_photos: [
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=800&q=80'
          ],
          due_maintenance: [
            { title: 'Jet Pump Wear Ring Inspection', due_date: '2026-08-01', status: 'Pending', parts_needed: 'Wear Ring', affiliate_link: '' },
            { title: 'Winterization & Stable Fluid', due_date: '2026-10-15', status: 'Pending', parts_needed: 'Stable fluid', affiliate_link: '' }
          ]
        };

        const mockLogs: ServiceLog[] = [
          {
            id: 'log-1',
            title: 'Roush Cat-Back Exhaust Installation',
            notes: 'Installed Roush exhaust system. Sounds throaty. Fits perfectly.',
            date: '2025-10-12',
            cost: 1200,
            recorded_by: 'mike@performancetuning.com',
            is_verified: true,
            shop_id: 'performance-tuning-demo'
          },
          {
            id: 'log-2',
            title: 'First Oil Change',
            notes: 'Standard 5W-30 synthetic oil change and filter replacement.',
            date: '2025-08-01',
            cost: 85,
            recorded_by: 'owner@gridpass.app',
            is_verified: false
          }
        ];

        const mockSightings: Sighting[] = [
          {
            id: 'sight-1',
            spotted_by: 'Sarah Spotter',
            photo_url: '',
            latitude: 40.2204,
            longitude: -74.0006,
            location_name: 'Wall Stadium Speedway',
            description: 'Looking clean in the paddock!',
            timestamp: new Date().toISOString()
          },
          {
            id: 'sight-2',
            spotted_by: 'Racetrack Dave',
            photo_url: '',
            latitude: 39.9526,
            longitude: -75.1652,
            location_name: 'Badlands Offroad Gate',
            description: 'Checked-in for track day.',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ];

        const mockExpenses: VehicleExpense[] = [
          {
            id: 'exp-1',
            vehicle_id: vehicleId,
            owner_id: ownerId,
            title: 'Premium Gas Fill-up',
            category: 'fuel',
            cost: 45,
            date: '2026-06-05',
            notes: 'Standard marina gas fill'
          },
          {
            id: 'exp-2',
            vehicle_id: vehicleId,
            owner_id: ownerId,
            title: 'Roush Cat-Back Exhaust Installation',
            category: 'addon',
            cost: 1200,
            date: '2025-10-12',
            notes: 'Installed Roush exhaust'
          },
          {
            id: 'exp-3',
            vehicle_id: vehicleId,
            owner_id: ownerId,
            title: 'Yearly Sticker & Decal',
            category: 'license',
            cost: 120,
            date: '2026-06-02',
            notes: 'Registration renewal'
          }
        ];

        if (isMounted) {
          setVehicle(mockVehicle);
          setServiceLogs(mockLogs);
          setSightings(mockSightings);
          setExpenses(mockExpenses);
          setVibeChecks(24);
          setLoading(false);
        }
        return;
      }

      try {
        // Real Firestore query
        const docRef = doc(db, 'vehicles', vehicleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const vData = docSnap.data();
          const loadedVehicle: VehicleData = {
            id: docSnap.id,
            tag_id: vData.tag_id || '',
            owner_id: vData.owner_id || null,
            owner_email: vData.owner_email,
            year: vData.year || 2024,
            make: vData.make || '',
            model: vData.model || '',
            trim: vData.trim,
            specs: vData.specs,
            mods: vData.mods,
            partner_dealer: vData.partner_dealer,
            is_ad_free: vData.is_ad_free,
            has_telemetry: vData.has_telemetry,
            is_verified_provenance: vData.is_verified_provenance,
            photo_url: vData.photo_url,
            awards: vData.awards,
            history: vData.history,
            co_owners: vData.co_owners || '',
            purchase_date: vData.purchase_date || '',
            purchase_price: vData.purchase_price || '',
            ownership_split: vData.ownership_split || '',
            title_status: vData.title_status || '',
            sticker_status: vData.sticker_status || '',
            engine_hours: vData.engine_hours || '',
            story: vData.story || '',
            documents: vData.documents || [],
            additional_photos: vData.additional_photos || [],
            due_maintenance: vData.due_maintenance || []
          };

          if (isMounted) setVehicle(loadedVehicle);

          // Fetch Service Logs
          const logsQuery = query(collection(db, 'service_logs'), where('vehicle_id', '==', docSnap.id));
          const logsSnap = await getDocs(logsQuery);
          const logsList = logsSnap.docs.map(logDoc => {
            const lData = logDoc.data();
            return {
              id: logDoc.id,
              title: lData.title,
              notes: lData.notes,
              date: lData.date || '',
              cost: lData.cost,
              recorded_by: lData.recorded_by || '',
              is_verified: lData.is_verified === true,
              shop_id: lData.shop_id
            } as ServiceLog;
          }).sort((a, b) => b.date.localeCompare(a.date));

          if (isMounted) setServiceLogs(logsList);

          // Fetch Sightings (Scans/Spots)
          const sightingsQuery = query(collection(db, 'sightings'), where('vehicle_id', '==', docSnap.id));
          const sightingsSnap = await getDocs(sightingsQuery);
          const sightingsList = sightingsSnap.docs.map(sDoc => {
            const sData = sDoc.data();
            return {
              id: sDoc.id,
              spotted_by: sData.spotted_by || 'Anonymous',
              photo_url: sData.photo_url,
              latitude: sData.latitude,
              longitude: sData.longitude,
              location_name: sData.location_name || 'Unknown Location',
              description: sData.description || '',
              timestamp: sData.timestamp?.toDate() ? sData.timestamp.toDate().toISOString() : new Date().toISOString()
            } as Sighting;
          });

          if (isMounted) setSightings(sightingsList);

          // Fetch Expenses (only if logged-in user is the vehicle owner or admin)
          if (user && (user.uid === vData.owner_id || user.email === 'loseyp@gmail.com')) {
            try {
              let expensesQuery;
              if (user.email === 'loseyp@gmail.com') {
                expensesQuery = query(
                  collection(db, 'expenses'),
                  where('vehicle_id', '==', docSnap.id)
                );
              } else {
                expensesQuery = query(
                  collection(db, 'expenses'),
                  where('vehicle_id', '==', docSnap.id),
                  where('owner_id', '==', user.uid)
                );
              }
              const expensesSnap = await getDocs(expensesQuery);
              const expensesList = expensesSnap.docs.map(eDoc => {
                const eData = eDoc.data();
                return {
                  id: eDoc.id,
                  vehicle_id: eData.vehicle_id,
                  owner_id: eData.owner_id,
                  title: eData.title,
                  category: eData.category,
                  cost: eData.cost,
                  date: eData.date || '',
                  notes: eData.notes || ''
                } as VehicleExpense;
              }).sort((a, b) => b.date.localeCompare(a.date));

              if (isMounted) setExpenses(expensesList);
            } catch (expErr) {
              console.warn("Failed to fetch vehicle expenses:", expErr);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load vehicle profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVehicleData();

    return () => { isMounted = false; };
  }, [vehicleId, user, authLoading, isMock]);

  // Spot / Vibe Check Counter
  const handleVibeCheck = async () => {
    if (hasVoted || voting) return;
    setVoting(true);

    if (isMock) {
      setVibeChecks(prev => prev + 1);
      setHasVoted(true);
      setVoting(false);
      return;
    }

    try {
      // Record a simple anonymous sighting spot to increment
      await addDoc(collection(db, 'sightings'), {
        vehicle_id: vehicleId,
        spotted_by: user?.displayName || 'Passerby Spectator',
        location_name: 'Vibe Check Rating',
        description: 'Vibe-Checked this build!',
        timestamp: serverTimestamp()
      });

      setVibeChecks(prev => prev + 1);
      setHasVoted(true);

      await logEvent('info', 'scan', `Vehicle [${vehicleId}] Vibe-Checked by ${user?.email || 'Anonymous'}`);
    } catch (err) {
      console.error("Failed to submit vibe check:", err);
    } finally {
      setVoting(false);
    }
  };

  // Submit New Service Log (Owner or Shop)
  const handleAddServiceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim()) return;
    setSubmittingLog(true);

    const isVerifiedStamp = isShop;
    const authorEmail = user?.email || 'authenticated-user@gridpass.app';

    if (isMock) {
      const newLog: ServiceLog = {
        id: `log-mock-${Date.now()}`,
        title: logTitle,
        notes: logNotes,
        date: logDate,
        cost: logCost ? parseFloat(logCost) : undefined,
        recorded_by: authorEmail,
        is_verified: isVerifiedStamp,
        shop_id: isVerifiedStamp ? 'performance-tuning-demo' : undefined
      };
      setServiceLogs(prev => [newLog, ...prev]);
      setLogTitle('');
      setLogNotes('');
      setLogCost('');
      setSubmittingLog(false);
      return;
    }

    try {
      const payload = {
        vehicle_id: vehicleId,
        title: logTitle.trim(),
        notes: logNotes.trim(),
        date: logDate,
        cost: logCost ? parseFloat(logCost) : null,
        recorded_by: authorEmail,
        is_verified: isVerifiedStamp,
        shop_id: isVerifiedStamp ? 'performance-tuning-demo' : null,
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'service_logs'), payload);

      const updatedLog: ServiceLog = {
        id: `log-${Date.now()}`,
        title: payload.title,
        notes: payload.notes,
        date: payload.date,
        cost: payload.cost || undefined,
        recorded_by: payload.recorded_by,
        is_verified: payload.is_verified,
        shop_id: payload.shop_id || undefined
      };

      setServiceLogs(prev => [updatedLog, ...prev]);
      setLogTitle('');
      setLogNotes('');
      setLogCost('');

      await logEvent('success', 'system', `Service log added for vehicle [${vehicleId}]: ${payload.title} (Verified: ${payload.is_verified})`);
    } catch (error) {
      console.error("Failed to save service log:", error);
      alert("Failed to save service record.");
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseCost) return;
    setSubmittingExpense(true);

    const costNum = parseFloat(expenseCost);
    if (isNaN(costNum)) {
      alert("Invalid cost number.");
      setSubmittingExpense(false);
      return;
    }

    const ownerUid = isMock ? 'user-marcus-123' : (user?.uid || 'unknown-uid');

    if (isMock) {
      const newExpense: VehicleExpense = {
        id: `exp-mock-${Date.now()}`,
        vehicle_id: vehicleId,
        owner_id: ownerUid,
        title: expenseTitle.trim(),
        category: expenseCategory,
        cost: costNum,
        date: expenseDate,
        notes: expenseNotes.trim()
      };
      setExpenses(prev => [newExpense, ...prev]);
      setExpenseTitle('');
      setExpenseCost('');
      setExpenseNotes('');
      setSubmittingExpense(false);
      return;
    }

    try {
      const payload = {
        vehicle_id: vehicleId,
        owner_id: ownerUid,
        title: expenseTitle.trim(),
        category: expenseCategory,
        cost: costNum,
        date: expenseDate,
        notes: expenseNotes.trim(),
        created_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'expenses'), payload);

      const newExpense: VehicleExpense = {
        id: docRef.id,
        vehicle_id: payload.vehicle_id,
        owner_id: payload.owner_id,
        title: payload.title,
        category: payload.category as any,
        cost: payload.cost,
        date: payload.date,
        notes: payload.notes
      };

      setExpenses(prev => [newExpense, ...prev]);
      setExpenseTitle('');
      setExpenseCost('');
      setExpenseNotes('');

      await logEvent('success', 'system', `Expense logged for vehicle [${vehicleId}]: ${payload.title} ($${payload.cost})`);
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert("Failed to save expense record.");
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;

    if (isMock) {
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      return;
    }

    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      await logEvent('success', 'system', `Expense deleted for vehicle [${vehicleId}]: ${expenseId}`);
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert("Failed to delete expense record.");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Math for Expenses Tab
  const purchasePriceVal = vehicle?.purchase_price ? parseFloat(String(vehicle.purchase_price)) || 0 : 0;
  const fuelTotal = expenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.cost, 0);
  const licenseTotal = expenses.filter(e => e.category === 'license').reduce((sum, e) => sum + e.cost, 0);
  const addonTotal = expenses.filter(e => e.category === 'addon').reduce((sum, e) => sum + e.cost, 0);
  const serviceTotal = expenses.filter(e => e.category === 'service').reduce((sum, e) => sum + e.cost, 0);
  const insuranceTotal = expenses.filter(e => e.category === 'insurance').reduce((sum, e) => sum + e.cost, 0);
  const otherTotal = expenses.filter(e => e.category === 'other').reduce((sum, e) => sum + e.cost, 0);
  const loggedPurchaseTotal = expenses.filter(e => e.category === 'purchase').reduce((sum, e) => sum + e.cost, 0);
  const finalPurchasePrice = loggedPurchaseTotal || purchasePriceVal;
  const totalTCO = finalPurchasePrice + fuelTotal + licenseTotal + addonTotal + serviceTotal + insuranceTotal + otherTotal;

  const CATEGORY_MAP = {
    purchase: { label: 'Purchase Price', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' },
    license: { label: 'Stickers & License', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
    fuel: { label: 'Fuel', color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
    addon: { label: 'Add-ons & Mods', color: 'bg-pink-500/10 border-pink-500/30 text-pink-400' },
    service: { label: 'Service & Maintenance', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
    insurance: { label: 'Insurance', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
    other: { label: 'Other', color: 'bg-neutral-500/10 border-neutral-500/30 text-neutral-400' }
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center space-y-4">
        <CarFront className="w-16 h-16 text-neutral-700" />
        <h2 className="text-xl font-bold uppercase tracking-wider">Vehicle Passport Not Found</h2>
        <Link href="/" className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Safety
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative flex flex-col">
      <div className="mesh-glow" />
      
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 w-full flex-1 relative z-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Garage Dashboard
          </Link>
          {vehicle.partner_dealer && (
            <span className="text-[10px] font-mono font-bold bg-[#10b981]/5 border border-[#10b981]/25 text-[#10b981] px-3 py-1 rounded-full uppercase tracking-wider">
              Verified Lot: {vehicle.partner_dealer}
            </span>
          )}
        </div>

        {/* Dynamic Photo Banner */}
        {vehicle.photo_url && (
          <div className="relative w-full h-64 md:h-96 rounded-[2.5rem] overflow-hidden border border-neutral-900 shadow-2xl animate-in fade-in duration-300">
            <img 
              src={vehicle.photo_url} 
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-transparent to-transparent" />
          </div>
        )}

        {/* Hero Specs Title Card */}
        <div className="glass-card p-6 md:p-8 rounded-[2rem] border-neutral-900 bg-neutral-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded">
                {vehicle.tag_id}
              </span>
              {vehicle.is_verified_provenance && (
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Provenance Verified
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none pt-1">
              {vehicle.year} {vehicle.make} <span className="text-red-500">{vehicle.model}</span>
            </h1>
            {vehicle.trim && <p className="text-xs text-neutral-400 uppercase font-mono font-bold tracking-widest">{vehicle.trim} Package</p>}
          </div>

          {/* Vibe Check Button */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black text-white font-mono leading-none">{vibeChecks}</div>
              <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Vibe Checks</div>
            </div>
            <button
              onClick={handleVibeCheck}
              disabled={hasVoted || voting}
              className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 min-h-[48px] cursor-pointer ${
                hasVoted 
                  ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasVoted ? 'fill-emerald-400 text-emerald-400' : ''}`} />
              {hasVoted ? 'Vibe Checked' : 'Vibe Check'}
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-neutral-900 flex gap-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'specs' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <CarFront className="w-4 h-4" /> Specs & Mod List
          </button>
          
          {(isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
            <button 
              onClick={() => setActiveTab('telemetry')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'telemetry' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Map className="w-4 h-4" /> Scan Telemetry
            </button>
          )}

          <button 
            onClick={() => setActiveTab('service')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'service' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <History className="w-4 h-4" /> Service Logbook
          </button>

          {(isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
            <button 
              onClick={() => setActiveTab('expenses')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'expenses' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
              id="tab-expenses"
            >
              <Coins className="w-4 h-4" /> Expenses & TCO
            </button>
          )}

          {(isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
            <button 
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings' ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="space-y-6">

          {/* TAB 1: Specs & Modifications */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200">
              
              {/* Left Column: Specifications & Ownership */}
              <div className="md:col-span-5 space-y-6">
                
                {/* Factory Specifications */}
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" /> Factory Specifications
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs font-bold pt-2">
                    <span className="text-neutral-555 uppercase">Engine</span>
                    <span className="text-white text-right truncate">{vehicle.specs?.engine || 'N/A'}</span>

                    <span className="text-neutral-555 uppercase">Transmission</span>
                    <span className="text-white text-right truncate">{vehicle.specs?.transmission || 'N/A'}</span>

                    <span className="text-neutral-555 uppercase">Output Power</span>
                    <span className="text-white text-right">{vehicle.specs?.hp ? `${vehicle.specs.hp} HP` : 'N/A'}</span>

                    <span className="text-neutral-555 uppercase">Peak Torque</span>
                    <span className="text-white text-right">{vehicle.specs?.torque ? `${vehicle.specs.torque} lb-ft` : 'N/A'}</span>
                  </div>
                </div>

                {/* Joint-Ownership & Registry */}
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-4 h-4 text-red-500" /> Ownership & Registry
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs font-bold pt-2 border-b border-neutral-900 pb-4">
                    <span className="text-neutral-555 uppercase">Owners</span>
                    <span className="text-white text-right font-bold">
                      {Array.isArray(vehicle.co_owners) 
                        ? (vehicle.co_owners as any[]).map(c => typeof c === 'string' ? c : c.name).join(' & ') 
                        : (typeof vehicle.co_owners === 'string' ? vehicle.co_owners : 'N/A')}
                    </span>

                    <span className="text-neutral-555 uppercase">Ownership Split</span>
                    <span className="text-white text-right">{vehicle.ownership_split || 'N/A'}</span>

                    <span className="text-neutral-555 uppercase">Engine Hours</span>
                    <span className="text-white text-right">{vehicle.engine_hours ? `${vehicle.engine_hours} Hrs` : 'N/A'}</span>

                    <span className="text-neutral-555 uppercase">Purchase Date</span>
                    <span className="text-white text-right">{vehicle.purchase_date || 'N/A'}</span>

                    <span className="text-neutral-555 uppercase">Purchase Price</span>
                    <span className="text-white text-right">{vehicle.purchase_price ? `$${vehicle.purchase_price}` : 'N/A'}</span>

                    <span className="text-neutral-555 uppercase">Title Status</span>
                    <span className="text-white text-right">{vehicle.title_status || 'N/A'}</span>

                    <span className="text-neutral-555 uppercase">Sticker Status</span>
                    <span className="text-white text-right">{vehicle.sticker_status || 'N/A'}</span>
                  </div>

                  {/* Co-Owners registry split list */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Joint Owners Registry</h4>
                    {Array.isArray(vehicle.co_owners) && vehicle.co_owners.length > 0 ? (
                      <div className="space-y-2">
                        {(vehicle.co_owners as any[]).map((co, idx) => {
                          const name = typeof co === 'string' ? co : co.name;
                          const split = typeof co === 'string' ? '50%' : co.split;
                          const memberId = typeof co === 'string' ? '' : co.member_id;

                          return (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-900/30 border border-neutral-900 rounded-xl text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                {memberId ? (
                                  <Link href={`/u/${memberId}`} className="font-bold text-blue-400 hover:underline">
                                    {name}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-white">{name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-neutral-400 bg-neutral-850 px-2 py-0.5 rounded border border-neutral-800">{split}</span>
                                {(isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
                                  <button
                                    onClick={() => getInviteLink(name)}
                                    className="text-[10px] font-mono font-bold text-red-500 hover:text-red-400 hover:underline cursor-pointer"
                                  >
                                    Invite
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-500 italic">No joint owners registered.</p>
                    )}
                  </div>
                </div>

                {/* Shipped Stickers Callout */}
                <div className="glass-card p-6 rounded-3xl border border-red-500/10 bg-[#07070a] space-y-4 text-center shadow-lg">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4 text-yellow-500" /> WANT PHYSICAL STICKERS?
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Generate and download a free high-res QR Badge to print your own weatherproof stickers, keyring tags, or display sheets.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/15 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-white" /> PRINT FREE QR BADGE
                    </button>
                    <Link 
                      href={`/build-tag?vehicleId=${vehicle.id}`}
                      className="w-full py-3 bg-transparent hover:bg-white/5 border border-white text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 min-h-[44px]"
                    >
                      CUSTOMIZE QR BADGE DESIGN
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: Modifications, Story, Docs, Gallery */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Modification List */}
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-6">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-red-500" /> Modification List
                  </h3>

                  {Array.isArray(vehicle.mods) && vehicle.mods.length > 0 ? (
                    <div className="space-y-3">
                      {vehicle.mods.map((mod, idx) => (
                        <div key={idx} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded">
                              {mod.category}
                            </span>
                            <h4 className="font-bold text-white pt-1">{mod.brand} {mod.name}</h4>
                          </div>
                          {mod.cost && (
                            <span className="font-mono font-bold text-neutral-400">${mod.cost}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : typeof vehicle.mods === 'string' && vehicle.mods ? (
                    <p className="text-sm text-neutral-300 font-medium whitespace-pre-line leading-relaxed">{vehicle.mods}</p>
                  ) : (
                    <div className="text-center py-8 text-neutral-550 space-y-2">
                      <CarFront className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs uppercase font-mono font-bold">No modifications logged yet.</p>
                    </div>
                  )}
                </div>

                {/* Owner's Story */}
                {vehicle.story && (
                  <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-3">
                    <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-yellow-500" /> Owner's Story
                    </h3>
                    <p className="text-sm text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap italic">
                      "{vehicle.story}"
                    </p>
                  </div>
                )}

                {/* Compliance & Safety Documents */}
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-500" /> Safety & Compliance Documents
                  </h3>
                  
                  {Array.isArray(vehicle.documents) && vehicle.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {(vehicle.documents as any[]).map((doc, idx) => {
                        const docName = typeof doc === 'string' ? doc : doc.name;
                        const docStatus = typeof doc === 'string' ? 'Valid' : doc.status;
                        const docUrl = typeof doc === 'string' ? '' : doc.file_url;

                        return (
                          <div key={idx} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl flex flex-col justify-between gap-3 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-white break-words">{docName}</span>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                docStatus === 'Valid' || docStatus === 'Compliant' || docStatus === 'Active'
                                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                                  : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                              }`}>
                                {docStatus}
                              </span>
                            </div>
                            {docUrl && (
                              <button
                                onClick={() => {
                                  const w = window.open();
                                  if (w) {
                                    w.document.write(`
                                      <html>
                                        <head><title>View Document - ${docName}</title></head>
                                        <body style="margin:0; background:#060608;">
                                          <iframe src="${docUrl}" style="border:none; width:100%; height:100vh;"></iframe>
                                        </body>
                                      </html>
                                    `);
                                    w.document.close();
                                  }
                                }}
                                className="self-start text-[10px] font-mono font-bold text-blue-450 hover:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                📎 View Attachment
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-555 italic">No compliance documents uploaded.</p>
                  )}
                </div>

                {/* Adventure Photo Gallery */}
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CarFront className="w-4 h-4 text-emerald-500" /> Adventure Photo Gallery
                  </h3>
                  
                  {Array.isArray(vehicle.additional_photos) && vehicle.additional_photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(vehicle.additional_photos as string[]).map((photo, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-neutral-900 group">
                          <img src={photo} alt={`Adventure ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-555 italic">No gallery photos added yet.</p>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Geolocation Scan Telemetry (Owner Gated Map) */}
          {activeTab === 'telemetry' && (isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200">
              
              {/* Left Column: Visual Mock Map coordinates */}
              <div className="md:col-span-6 space-y-4">
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-blue-500" /> Geographic Scan Telemetry
                  </h3>
                  
                  {/* SVG Map mockup representing geolocation pings */}
                  <div className="w-full h-64 bg-[#07070a] border border-neutral-900 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    <svg viewBox="0 0 400 200" className="w-full h-full opacity-60">
                      {/* Outline map tracks */}
                      <path d="M50 100 Q 150 20 200 100 T 350 100" fill="none" stroke="#222" strokeWidth="4" />
                      <path d="M100 150 Q 200 80 300 150" fill="none" stroke="#222" strokeWidth="3" strokeDasharray="5,5" />
                      
                      {/* Scan coordinate nodes */}
                      <circle cx="120" cy="80" r="10" fill="#bd2925" className="animate-ping" style={{ animationDuration: '3s' }} />
                      <circle cx="120" cy="80" r="6" fill="#bd2925" />
                      
                      <circle cx="280" cy="110" r="10" fill="#3b82f6" className="animate-ping" style={{ animationDuration: '4s' }} />
                      <circle cx="280" cy="110" r="6" fill="#3b82f6" />
                    </svg>
                    
                    <div className="absolute bottom-3 right-3 bg-neutral-950/80 border border-neutral-900 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold text-neutral-400 uppercase">
                      📍 2 Active Coordinates
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-neutral-450 leading-relaxed font-bold uppercase tracking-wide">
                    ⚠️ GEOLOCATION DATA IS PRIVATE. Spectators scanning your vehicle QR code can only see your public specs sheet.
                  </p>
                </div>
              </div>

              {/* Right Column: Scan History timeline logs */}
              <div className="md:col-span-6 space-y-4">
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-4 h-4 text-red-500" /> Recent Scan Events
                  </h3>

                  <div className="space-y-3">
                    {sightings.map((sight) => (
                      <div key={sight.id} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-white uppercase">{sight.location_name}</span>
                          <span className="text-[10px] font-mono text-neutral-550">
                            {new Date(sight.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-neutral-450">{sight.description}</p>
                        {sight.latitude && sight.longitude && (
                          <div className="text-[9px] font-mono text-neutral-555">
                            Coords: {sight.latitude.toFixed(4)}° N, {sight.longitude.toFixed(4)}° W
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Maintenance Service Logbook */}
          {activeTab === 'service' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200">
              
              {/* Left Column: Form to log new maintenance (Available to Owner and Shop) */}
              <div className="md:col-span-5 space-y-4">
                {(isOwner || isShop || (isMock && (user?.email === 'marcus@enthusiast.com' || user?.email === 'mike@performancetuning.com'))) ? (
                  <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-emerald-500" /> Log Maintenance Event
                      </h3>
                      {isShop && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 inline-block mt-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Stamping as Certified Shop
                        </span>
                      )}
                    </div>

                    <form onSubmit={handleAddServiceLog} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Event Title</label>
                        <input 
                          type="text" 
                          required
                          value={logTitle}
                          onChange={(e) => setLogTitle(e.target.value)}
                          placeholder="e.g. Synthetic Oil Change" 
                          className="glass-input w-full p-2.5 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Service Details / Notes</label>
                        <textarea 
                          rows={3}
                          value={logNotes}
                          onChange={(e) => setLogNotes(e.target.value)}
                          placeholder="Provide details of parts, dyno results, alignments..." 
                          className="glass-input w-full p-2.5 rounded-xl text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Cost ($ USD)</label>
                          <input 
                            type="number" 
                            value={logCost}
                            onChange={(e) => setLogCost(e.target.value)}
                            placeholder="e.g. 150" 
                            className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Service Date</label>
                          <input 
                            type="date" 
                            required
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingLog}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/15 flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                      >
                        {submittingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        {isShop ? 'Stamp Certified Record' : 'Log Maintenance Event'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 text-center space-y-3">
                    <Info className="w-8 h-8 text-neutral-600 mx-auto" />
                    <h4 className="text-xs font-bold text-white uppercase">Certified Stamping</h4>
                    <p className="text-[11px] text-neutral-400 leading-normal">
                      Only the verified vehicle owner or certified Gridpass business profiles (detailers, service centers) can log maintenance timeline events.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Historical logs & checklist */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Maintenance & Parts Checklist */}
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-red-500" /> Maintenance & Parts Checklist
                  </h3>
                  
                  {Array.isArray(vehicle.due_maintenance) && vehicle.due_maintenance.length > 0 ? (
                    <div className="space-y-3">
                      {(vehicle.due_maintenance as any[]).map((item, idx) => {
                        const title = item.title || item.name || '';
                        const dueDate = item.due_date || '';
                        const status = item.status || 'Pending';
                        const partsNeeded = item.parts_needed || '';
                        const affLink = getAffiliateLink(item);
                        const isDone = status.toLowerCase() === 'done' || status.toLowerCase() === 'completed';

                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                              isDone 
                                ? 'bg-emerald-950/10 border-emerald-500/10 opacity-70' 
                                : 'bg-neutral-900/30 border-neutral-900'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {(isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) ? (
                                <input 
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={async () => {
                                    const newStatus = isDone ? 'Pending' : 'Done';
                                    let updatedDue = [];
                                    if (Array.isArray(vehicle.due_maintenance)) {
                                      updatedDue = (vehicle.due_maintenance as any[]).map((itm, i) => 
                                        i === idx ? { ...itm, status: newStatus } : itm
                                      );
                                    }
                                    
                                    if (isMock) {
                                      setVehicle(prev => prev ? { ...prev, due_maintenance: updatedDue } : null);
                                    } else {
                                      try {
                                        await updateDoc(doc(db, 'vehicles', vehicleId), {
                                          due_maintenance: updatedDue
                                        });
                                        setVehicle(prev => prev ? { ...prev, due_maintenance: updatedDue } : null);
                                      } catch (err) {
                                        console.error("Failed to update checklist item status:", err);
                                      }
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-red-500 focus:ring-red-500 focus:ring-offset-neutral-900 mt-0.5 cursor-pointer"
                                />
                              ) : (
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              )}
                              <div className="space-y-1">
                                <h4 className={`font-bold uppercase ${isDone ? 'text-neutral-450 line-through' : 'text-white'}`}>
                                  {title}
                                </h4>
                                {dueDate && (
                                  <p className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                                    Due: {dueDate}
                                  </p>
                                )}
                                {partsNeeded && (
                                  <p className="text-[10px] text-neutral-450">
                                    🔧 Parts Needed: <span className="font-bold text-neutral-350">{partsNeeded}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {partsNeeded && affLink && (
                                <a 
                                  href={affLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                >
                                  🛒 Buy Parts
                                </a>
                              )}
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isDone 
                                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
                                  : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                              }`}>
                                {status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-550 space-y-1">
                      <ClipboardList className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-[11px] uppercase font-mono font-bold">No due maintenance listed.</p>
                    </div>
                  )}
                </div>

                {/* Service Timeline History */}
                <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-500" /> Service Timeline History
                  </h3>

                  {serviceLogs.length > 0 ? (
                    <div className="space-y-4 relative border-l border-neutral-900 ml-3 pl-4">
                      {serviceLogs.map((log) => (
                        <div key={log.id} className="relative space-y-1 text-xs">
                          {/* Dot pointer indicator */}
                          <div className={`absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                            log.is_verified ? 'bg-emerald-500 border-[#060608]' : 'bg-neutral-850 border-neutral-900'
                          }`} />
                          
                          <div className="flex items-center justify-between font-bold">
                            <h4 className="text-white uppercase flex items-center gap-1">
                              {log.title}
                              {log.is_verified && (
                                <span className="inline-flex text-[9px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold">
                                  Shop Certified
                                </span>
                              )}
                            </h4>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-neutral-400 font-medium pt-1">{log.notes}</p>
                          
                          <div className="flex items-center gap-4 text-[9px] font-mono text-neutral-500 pt-1">
                            {log.cost && <span>Cost: ${log.cost}</span>}
                            <span>Recorded by: {log.recorded_by}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-555 space-y-2">
                      <Wrench className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs uppercase font-mono font-bold">No timeline history recorded.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: Expense Tracker & TCO */}
          {activeTab === 'expenses' && (isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
            <div className="space-y-8 animate-in fade-in duration-200" id="expenses-tab-content">
              {/* TCO Analytics Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Investment Card */}
                <div className="glass-card p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/5 blur-3xl rounded-full" />
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-[10px] font-mono font-bold text-yellow-500 uppercase tracking-widest">Total Investment (TCO)</span>
                    <Coins className="w-5 h-5 text-yellow-500 animate-pulse" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-2xl font-black text-white font-mono">
                      ${totalTCO.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                    <p className="text-[9px] text-neutral-450 font-mono mt-1">Purchase Price + All Logged Expenses</p>
                  </div>
                </div>

                {/* Purchase Price Card */}
                <div className="glass-card p-5 rounded-2xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">Purchase Price</span>
                    <DollarSign className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white font-mono">${finalPurchasePrice.toLocaleString()}</h4>
                    <p className="text-[9px] text-neutral-500 font-mono mt-1">Base asset cost</p>
                  </div>
                </div>

                {/* Stickers & Decals Card */}
                <div className="glass-card p-5 rounded-2xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">Stickers & Decals</span>
                    <CreditCard className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white font-mono">${licenseTotal.toLocaleString()}</h4>
                    <p className="text-[9px] text-neutral-500 font-mono mt-1">Registration & tags</p>
                  </div>
                </div>

                {/* Fuel Card */}
                <div className="glass-card p-5 rounded-2xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Fuel & Gas</span>
                    <Fuel className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white font-mono">${fuelTotal.toLocaleString()}</h4>
                    <p className="text-[9px] text-neutral-500 font-mono mt-1">Gas & electric fill-ups</p>
                  </div>
                </div>

                {/* Add-ons & Mods Card */}
                <div className="glass-card p-5 rounded-2xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-pink-400 uppercase">Add-ons & Mods</span>
                    <Wrench className="w-4 h-4 text-pink-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white font-mono">${addonTotal.toLocaleString()}</h4>
                    <p className="text-[9px] text-neutral-500 font-mono mt-1">Aftermarket upgrades</p>
                  </div>
                </div>

                {/* Maintenance Card */}
                <div className="glass-card p-5 rounded-2xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Maintenance</span>
                    <History className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white font-mono">${serviceTotal.toLocaleString()}</h4>
                    <p className="text-[9px] text-neutral-500 font-mono mt-1">Service & repairs</p>
                  </div>
                </div>

                {/* Insurance Card */}
                <div className="glass-card p-5 rounded-2xl border border-neutral-900 bg-neutral-950/20 flex flex-col justify-between min-h-[110px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-blue-450 uppercase">Insurance & Other</span>
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white font-mono">${(insuranceTotal + otherTotal).toLocaleString()}</h4>
                    <p className="text-[9px] text-neutral-500 font-mono mt-1">Policies & custom fees</p>
                  </div>
                </div>
              </div>

              {/* Lower Section: Form and Ledger */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Log Expense Form */}
                <div className="md:col-span-5 space-y-4">
                  <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                    <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900/60 pb-3">
                      <Plus className="w-4 h-4 text-yellow-500" /> Log Vehicle Expense
                    </h3>

                    <form onSubmit={handleAddExpense} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Expense Title</label>
                        <input 
                          type="text" 
                          required
                          value={expenseTitle}
                          onChange={(e) => setExpenseTitle(e.target.value)}
                          placeholder="e.g. Premium Gas Fill-up, Dyno Tune" 
                          className="glass-input w-full p-2.5 rounded-xl text-xs"
                          id="expense-title-input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Category</label>
                          <select
                            value={expenseCategory}
                            onChange={(e: any) => setExpenseCategory(e.target.value)}
                            className="glass-input w-full p-2.5 rounded-xl text-xs bg-[#060608] border border-neutral-800 text-neutral-300 font-mono"
                            id="expense-category-input"
                          >
                            <option value="fuel">Fuel & Gas</option>
                            <option value="license">Stickers & License</option>
                            <option value="addon">Add-ons & Mods</option>
                            <option value="service">Service & Maintenance</option>
                            <option value="insurance">Insurance</option>
                            <option value="purchase">Purchase Price</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Cost ($ USD)</label>
                          <input 
                            type="number" 
                            required
                            step="0.01"
                            value={expenseCost}
                            onChange={(e) => setExpenseCost(e.target.value)}
                            placeholder="e.g. 45.50" 
                            className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                            id="expense-cost-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Expense Date</label>
                        <input 
                          type="date" 
                          required
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                          id="expense-date-input"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Notes / Details</label>
                        <textarea 
                          rows={2}
                          value={expenseNotes}
                          onChange={(e) => setExpenseNotes(e.target.value)}
                          placeholder="Fitted hardware, 93 Octane, annual policy renewal..." 
                          className="glass-input w-full p-2.5 rounded-xl text-xs"
                          id="expense-notes-input"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingExpense}
                        className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-yellow-600/15 flex items-center justify-center gap-1 min-h-[44px] cursor-pointer"
                        id="submit-expense-btn"
                      >
                        {submittingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                        Log Expense
                      </button>
                    </form>
                  </div>
                </div>

                {/* Ledger Timeline */}
                <div className="md:col-span-7 space-y-4">
                  <div className="glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/20 space-y-4">
                    <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                      <History className="w-4 h-4 text-yellow-500" /> Expense Ledger Timeline
                    </h3>

                    {expenses.length > 0 ? (
                      <div className="space-y-4 relative border-l border-neutral-900 ml-3 pl-4 max-h-[500px] overflow-y-auto pr-2">
                        {expenses.map((exp) => {
                          const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other;
                          return (
                            <div key={exp.id} className="relative space-y-1.5 text-xs group" data-testid="expense-item">
                              {/* Dot pointer indicator */}
                              <div className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-neutral-850 border-neutral-900 group-hover:border-yellow-500 transition-all" />
                              
                              <div className="flex items-start justify-between font-bold gap-4">
                                <div className="space-y-1">
                                  <h4 className="text-white uppercase flex items-center gap-2 flex-wrap">
                                    {exp.title}
                                    <span className={`inline-flex text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold border ${catInfo.color}`}>
                                      {catInfo.label}
                                    </span>
                                  </h4>
                                  <p className="text-neutral-500 font-mono text-[10px] font-medium">
                                    {new Date(exp.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-white font-mono text-sm">${exp.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  <button
                                    onClick={() => exp.id && handleDeleteExpense(exp.id)}
                                    className="text-neutral-600 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Delete expense"
                                    data-testid={`delete-btn-${exp.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {exp.notes && (
                                <p className="text-neutral-400 font-medium pl-1 italic border-l border-neutral-800">{exp.notes}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-neutral-555 space-y-2">
                        <Coins className="w-8 h-8 mx-auto opacity-40 text-yellow-500 animate-pulse" />
                        <p className="text-xs uppercase font-mono font-bold">No custom expenses logged yet.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: Settings (Owner Gated Edit Form) */}
          {activeTab === 'settings' && (isOwner || (isMock && user?.email === 'marcus@enthusiast.com')) && (
            <form onSubmit={handleSaveSpecs} className="space-y-8 animate-in fade-in duration-200">
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-neutral-900 bg-neutral-950/20 space-y-6">
                <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-3">
                  <Settings className="w-5 h-5 text-red-500" /> Vehicle Settings & Passport Registry
                </h3>
                
                {/* Photo banner edit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Main Vehicle Photo (Base64 / URL)</label>
                    <input 
                      type="text" 
                      value={editPhotoUrl}
                      onChange={(e) => setEditPhotoUrl(e.target.value)}
                      placeholder="Paste photo URL or upload below..." 
                      className="glass-input w-full p-3 rounded-xl text-xs"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-neutral-500">Or upload:</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setEditPhotoUrl)}
                        className="text-xs text-neutral-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-neutral-900 file:text-white hover:file:bg-neutral-850 cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  {/* Basic specifications grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Year</label>
                      <input 
                        type="number" 
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        placeholder="2007" 
                        className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Make</label>
                      <input 
                        type="text" 
                        value={editMake}
                        onChange={(e) => setEditMake(e.target.value)}
                        placeholder="Sea-Doo" 
                        className="glass-input w-full p-2.5 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Model</label>
                      <input 
                        type="text" 
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                        placeholder="GTI SE" 
                        className="glass-input w-full p-2.5 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Trim</label>
                      <input 
                        type="text" 
                        value={editTrim}
                        onChange={(e) => setEditTrim(e.target.value)}
                        placeholder="130" 
                        className="glass-input w-full p-2.5 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Engine</label>
                    <input 
                      type="text" 
                      value={editEngine}
                      onChange={(e) => setEditEngine(e.target.value)}
                      placeholder="Rotax 1503" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Transmission</label>
                    <input 
                      type="text" 
                      value={editTransmission}
                      onChange={(e) => setEditTransmission(e.target.value)}
                      placeholder="Direct Drive" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">HP</label>
                    <input 
                      type="text" 
                      value={editHp}
                      onChange={(e) => setEditHp(e.target.value)}
                      placeholder="130" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Torque</label>
                    <input 
                      type="text" 
                      value={editTorque}
                      onChange={(e) => setEditTorque(e.target.value)}
                      placeholder="N/A" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Financial & Registry parameters */}
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-neutral-900 bg-neutral-950/20 space-y-6">
                <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-3">
                  <ClipboardList className="w-5 h-5 text-blue-500" /> Registry & Purchase Parameters
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Purchase Date</label>
                    <input 
                      type="date" 
                      value={editPurchaseDate}
                      onChange={(e) => setEditPurchaseDate(e.target.value)}
                      className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Purchase Price ($ USD)</label>
                    <input 
                      type="number" 
                      value={editPurchasePrice}
                      onChange={(e) => setEditPurchasePrice(e.target.value)}
                      placeholder="4500" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Ownership Split</label>
                    <input 
                      type="text" 
                      value={editOwnershipSplit}
                      onChange={(e) => setEditOwnershipSplit(e.target.value)}
                      placeholder="50/50" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Title Status</label>
                    <input 
                      type="text" 
                      value={editTitleStatus}
                      onChange={(e) => setEditTitleStatus(e.target.value)}
                      placeholder="Clean" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Sticker Status</label>
                    <input 
                      type="text" 
                      value={editStickerStatus}
                      onChange={(e) => setEditStickerStatus(e.target.value)}
                      placeholder="Wisconsin Registration" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Engine Hours</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={editEngineHours}
                      onChange={(e) => setEditEngineHours(e.target.value)}
                      placeholder="120" 
                      className="glass-input w-full p-2.5 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Owner's Story</label>
                  <textarea 
                    rows={3}
                    value={editStory}
                    onChange={(e) => setEditStory(e.target.value)}
                    placeholder="Tell the story" 
                    className="glass-input w-full p-3 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Joint-Ownership list */}
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-neutral-900 bg-neutral-950/20 space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-5 h-5 text-red-500" /> Joint Owners
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditCoOwnersList(prev => [...prev, { name: '', split: '50%', member_id: '' }])}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    + Add Co-Owner
                  </button>
                </div>

                <div className="space-y-4">
                  {editCoOwnersList.map((co, idx) => (
                    <div key={idx} className="p-4 bg-neutral-900/20 border border-neutral-900 rounded-2xl flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Co-Owner Name</label>
                          <input 
                            type="text" 
                            required
                            value={co.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditCoOwnersList(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                            }}
                            placeholder="Kristina" 
                            className="glass-input w-full p-2 rounded-xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Split %</label>
                          <input 
                            type="text" 
                            value={co.split || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditCoOwnersList(prev => prev.map((item, i) => i === idx ? { ...item, split: val } : item));
                            }}
                            placeholder="50%" 
                            className="glass-input w-full p-2 rounded-xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Driver ID (Optional)</label>
                          <input 
                            type="text" 
                            value={co.member_id || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditCoOwnersList(prev => prev.map((item, i) => i === idx ? { ...item, member_id: val } : item));
                            }}
                            placeholder="pjlosey-mock" 
                            className="glass-input w-full p-2 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setEditCoOwnersList(prev => prev.filter((_, i) => i !== idx))}
                        className="px-2.5 py-2 text-[10px] font-mono font-bold text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg border border-red-500/10 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {editCoOwnersList.length === 0 && (
                    <p className="text-xs text-neutral-500 italic text-center py-4">No joint owners defined. Add one using the button above.</p>
                  )}
                </div>
              </div>

              {/* Compliance Documents list */}
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-neutral-900 bg-neutral-950/20 space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-blue-500" /> Compliance Documents
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditDocsList(prev => [...prev, { name: '', status: 'Valid', file_url: '' }])}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    + Add Document
                  </button>
                </div>

                <div className="space-y-4">
                  {editDocsList.map((docItem, idx) => (
                    <div key={idx} className="p-4 bg-neutral-900/20 border border-neutral-900 rounded-2xl flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-550 uppercase font-bold">Document Name</label>
                          <input 
                            type="text" 
                            required
                            value={docItem.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDocsList(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                            }}
                            placeholder="Wisconsin Registration" 
                            className="glass-input w-full p-2 rounded-xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Status Badge</label>
                          <select
                            value={docItem.status}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDocsList(prev => prev.map((item, i) => i === idx ? { ...item, status: val } : item));
                            }}
                            className="glass-input w-full p-2 rounded-xl text-xs bg-[#0b0b0f] text-white"
                          >
                            <option value="Valid">Valid</option>
                            <option value="Compliant">Compliant</option>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Expired">Expired</option>
                          </select>
                        </div>
                        <div className="space-y-1 flex flex-col justify-end">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">File Upload (PDF / Image)</label>
                          <input 
                            type="file" 
                            accept="application/pdf,image/*"
                            onChange={(e) => handleFileUpload(e, (base64) => {
                              setEditDocsList(prev => prev.map((item, i) => i === idx ? { ...item, file_url: base64 } : item));
                            })}
                            className="text-xs text-neutral-400 file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:uppercase file:bg-neutral-900 file:text-white hover:file:bg-neutral-850 cursor-pointer w-full mt-1.5"
                          />
                          {docItem.file_url && (
                            <span className="text-[9px] font-mono text-emerald-400 font-bold mt-1">✓ File Attached</span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setEditDocsList(prev => prev.filter((_, i) => i !== idx))}
                        className="px-2.5 py-2 text-[10px] font-mono font-bold text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg border border-red-500/10 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {editDocsList.length === 0 && (
                    <p className="text-xs text-neutral-550 italic text-center py-4">No documents uploaded. Add one using the button above.</p>
                  )}
                </div>
              </div>

              {/* Due Maintenance Checklist list */}
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-neutral-900 bg-neutral-950/20 space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Wrench className="w-5 h-5 text-emerald-500" /> Maintenance & Parts Checklist Settings
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditDueList(prev => [...prev, { title: '', due_date: '', status: 'Pending', parts_needed: '', affiliate_link: '' }])}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    + Add Task
                  </button>
                </div>

                <div className="space-y-4">
                  {editDueList.map((m, idx) => (
                    <div key={idx} className="p-4 bg-neutral-900/20 border border-neutral-900 rounded-2xl flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Task Title</label>
                          <input 
                            type="text" 
                            required
                            value={m.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDueList(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                            }}
                            placeholder="Jet Pump Inspection" 
                            className="glass-input w-full p-2 rounded-xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Due Date</label>
                          <input 
                            type="date" 
                            value={m.due_date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDueList(prev => prev.map((item, i) => i === idx ? { ...item, due_date: val } : item));
                            }}
                            className="glass-input w-full p-2 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Status</label>
                          <select
                            value={m.status}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDueList(prev => prev.map((item, i) => i === idx ? { ...item, status: val } : item));
                            }}
                            className="glass-input w-full p-2 rounded-xl text-xs bg-[#0b0b0f] text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Done">Done</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Parts Needed (Optional)</label>
                          <input 
                            type="text" 
                            value={m.parts_needed || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDueList(prev => prev.map((item, i) => i === idx ? { ...item, parts_needed: val } : item));
                            }}
                            placeholder="Spark Plugs" 
                            className="glass-input w-full p-2 rounded-xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-555 uppercase font-bold">Custom Shopping Affiliate Link (Optional)</label>
                          <input 
                            type="text" 
                            value={m.affiliate_link || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDueList(prev => prev.map((item, i) => i === idx ? { ...item, affiliate_link: val } : item));
                            }}
                            placeholder="amazon.com" 
                            className="glass-input w-full p-2 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setEditDueList(prev => prev.filter((_, i) => i !== idx))}
                        className="self-end px-2.5 py-1.5 text-[10px] font-mono font-bold text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg border border-red-500/10 cursor-pointer"
                      >
                        Remove Task
                      </button>
                    </div>
                  ))}

                  {editDueList.length === 0 && (
                    <p className="text-xs text-neutral-550 italic text-center py-4">No due tasks set. Add one using the button above.</p>
                  )}
                </div>
              </div>

              {/* Adventure Photos list */}
              <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-neutral-900 bg-neutral-950/20 space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CarFront className="w-5 h-5 text-emerald-500" /> Adventure Photo Gallery
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 font-bold">Upload Photo:</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, (base64) => {
                        setEditPhotosList(prev => [...prev, base64]);
                      })}
                      className="text-xs text-neutral-400 file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:uppercase file:bg-neutral-900 file:text-white hover:file:bg-neutral-850 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {editPhotosList.map((photo, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-neutral-900 group bg-neutral-950">
                      <img src={photo} alt={`Edit Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditPhotosList(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 bg-red-600/90 text-white rounded-full p-1.5 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {editPhotosList.length === 0 && (
                  <p className="text-xs text-neutral-550 italic text-center py-4">No gallery photos added yet. Upload one above.</p>
                )}
              </div>

              {/* Form Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('specs');
                  }}
                  className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-850 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5 min-h-[48px] cursor-pointer"
                >
                  {savingSpecs ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Passport Settings
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 md:p-8 rounded-[2rem] border border-neutral-850 bg-neutral-950/95 space-y-6 text-center relative shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Your QR Badge</h3>
            <p className="text-xs text-neutral-400">
              Print this badge or download the high-resolution vector (SVG) to use on windshields, service books, or test rigs.
            </p>
            
            {/* Live badge SVG preview */}
            <div className="flex justify-center bg-[#060608] p-4 rounded-2xl border border-neutral-900 mx-auto w-fit">
              <div 
                className="w-64 h-64 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: getBadgeSVGMarkup() }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/15 cursor-pointer"
              >
                Print Badge
              </button>
              <button
                onClick={handleDownloadSVG}
                className="py-3 bg-transparent hover:bg-white/5 border border-white text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Download SVG
              </button>
            </div>

            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white text-sm font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
