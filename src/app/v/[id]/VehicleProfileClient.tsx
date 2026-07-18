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
  Settings, Award, Printer, DollarSign, Trash2, Plus, Coins, Fuel, CreditCard, Pencil,
  CheckCircle, Users, Save, Anchor, ThumbsUp, ThumbsDown, Share2
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
  vin?: string;
  vin_checked?: boolean;
  vin_report?: {
    status: string;
    accident_history: string;
    theft_records: string;
    recall_status: string;
    database_registry: string;
    audited_at: string;
  } | null;
  thumbs_up?: number;
  thumbs_down?: number;
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

interface ExpenseParticipant {
  name: string;
  paid: number;
  owed: number;
  active: boolean;
}

interface VehicleExpense {
  id?: string;
  vehicle_id: string;
  owner_id: string;
  title: string;
  category: 'purchase' | 'license' | 'fees' | 'fuel' | 'addon' | 'service' | 'insurance' | 'other';
  cost: number;
  date: string;
  notes?: string;
  paid_by?: string;
  created_at?: any;
  is_split?: boolean;
  split_between?: string[];
  split_details?: ExpenseParticipant[];
  photo_url?: string;
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

export function VehicleProfileClient({ initialVehicle, vehicleId }: { initialVehicle: VehicleData | null, vehicleId: string }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Data States
  const [vehicle, setVehicle] = useState<VehicleData | null>(initialVehicle);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(!initialVehicle);
  const [activeTab, setActiveTab] = useState<'specs' | 'telemetry' | 'service' | 'expenses' | 'settings'>('specs');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Expense Tracker States
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'purchase' | 'license' | 'fees' | 'fuel' | 'addon' | 'service' | 'insurance' | 'other'>('fuel');
  const [expenseCost, setExpenseCost] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseSplitDetails, setExpenseSplitDetails] = useState<ExpenseParticipant[]>([]);
  const [expenseIsSplit, setExpenseIsSplit] = useState(false);
  const [expenseSplitBetween, setExpenseSplitBetween] = useState<string[]>([]);
  const [customSplitName, setCustomSplitName] = useState('');
  const [expensePhotoUrl, setExpensePhotoUrl] = useState('');
  const [customPaidByActive, setCustomPaidByActive] = useState(false);
  const [customSplitActive, setCustomSplitActive] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [paidBySelect, setPaidBySelect] = useState('');

  // Inline VIN states
  const [ownerProfile, setOwnerProfile] = useState<{ displayName: string, username: string } | null>(null);
  const [isEditingVin, setIsEditingVin] = useState(false);
  const [savingVin, setSavingVin] = useState(false);

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
      setEditVin(vehicle.vin || '');

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

    const hasVinChanged = editVin.trim() !== (vehicle?.vin || '');
    const updatedData = {
      photo_url: editPhotoUrl.trim(),
      year: parseInt(editYear) || vehicle?.year || 2024,
      make: editMake.trim(),
      model: editModel.trim(),
      trim: editTrim.trim(),
      vin: editVin.trim(),
      vin_checked: hasVinChanged ? false : (vehicle?.vin_checked || false),
      vin_report: hasVinChanged ? null : (vehicle?.vin_report || null),
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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://gridpass.app';
    const qrRedirectUrl = `${origin}/qr/${tagId}`;
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
  const [thumbsUp, setThumbsUp] = useState(12);
  const [thumbsDown, setThumbsDown] = useState(2);
  const [voteType, setVoteType] = useState<'up' | 'down' | null>(null);
  const [voting, setVoting] = useState(false);
  const [shareText, setShareText] = useState('Share Passport');

  // VIN Checker States
  const [editVin, setEditVin] = useState('');
  const [vinAuditing, setVinAuditing] = useState(false);
  const [vinAuditReport, setVinAuditReport] = useState<any>(null);
  const [vinAuditProgress, setVinAuditProgress] = useState('');

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
          vin: '1FA6P8CF5R5123456',
          vin_checked: true,
          vin_report: {
            status: 'CLEAN',
            accident_history: '0 Incidents Reported',
            theft_records: 'No Active Theft Alerts',
            recall_status: '0 Active Recalls',
            database_registry: 'Registered with Gridpass Ledger',
            audited_at: new Date().toLocaleDateString()
          },
          thumbs_up: 18,
          thumbs_down: 1,
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
            notes: 'Standard marina gas fill',
            paid_by: 'Marcus Mustang'
          },
          {
            id: 'exp-2',
            vehicle_id: vehicleId,
            owner_id: ownerId,
            title: 'Roush Cat-Back Exhaust Installation',
            category: 'addon',
            cost: 1200,
            date: '2025-10-12',
            notes: 'Installed Roush exhaust',
            paid_by: 'Marcus Mustang'
          },
          {
            id: 'exp-3',
            vehicle_id: vehicleId,
            owner_id: ownerId,
            title: 'Yearly Sticker & Decal',
            category: 'license',
            cost: 120,
            date: '2026-06-02',
            notes: 'Registration renewal',
            paid_by: 'Kristina'
          }
        ];

        if (isMounted) {
          setOwnerProfile({ displayName: 'Marcus Mustang', username: 'pjlosey-mock' });
          setVehicle(mockVehicle);
          setServiceLogs(mockLogs);
          setSightings(mockSightings);
          setExpenses(mockExpenses);
          setThumbsUp(mockVehicle.thumbs_up || 18);
          setThumbsDown(mockVehicle.thumbs_down || 1);
          setVinAuditReport(mockVehicle.vin_report || null);
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
            due_maintenance: vData.due_maintenance || [],
            vin: vData.vin || '',
            vin_checked: vData.vin_checked === true,
            vin_report: vData.vin_report || null,
            thumbs_up: vData.thumbs_up || 0,
            thumbs_down: vData.thumbs_down || 0,
          };

          if (loadedVehicle.owner_id) {
            getDoc(doc(db, 'users', loadedVehicle.owner_id)).then((uSnap) => {
              if (uSnap.exists()) {
                const uData = uSnap.data();
                if (isMounted) {
                  setOwnerProfile({
                    displayName: uData.display_name || uData.name || 'Marcus Mustang',
                    username: uData.username || loadedVehicle.owner_id || ''
                  });
                }
              }
            }).catch(err => {
              console.error("Error loading owner profile:", err);
            });
          }

          if (isMounted) {
            setVehicle(loadedVehicle);
            setThumbsUp(vData.thumbs_up ?? 12);
            setThumbsDown(vData.thumbs_down ?? 2);
            setVinAuditReport(vData.vin_report ?? null);
          }

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
                  notes: eData.notes || '',
                  paid_by: eData.paid_by || ''
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

    if (typeof window !== 'undefined') {
      const localVote = localStorage.getItem(`gridpass_vote_${vehicleId}`);
      if (localVote) {
        setVoteType(localVote as 'up' | 'down');
      }
    }

    loadVehicleData();

    return () => { isMounted = false; };
  }, [vehicleId, user, authLoading, isMock]);

  // Share Passport URL handler
  const handleShare = async () => {
    const passportUrl = typeof window !== 'undefined' ? window.location.href : '';
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: `${vehicle?.year} ${vehicle?.make} ${vehicle?.model} Passport`,
          text: `Check out this verified ${vehicle?.year} ${vehicle?.make} ${vehicle?.model} on Gridpass!`,
          url: passportUrl,
        });
        return;
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(passportUrl);
      setShareText('Copied Link!');
      setTimeout(() => setShareText('Share Passport'), 2000);
    } catch (err) {
      console.error('Failed to copy passport link:', err);
    }
  };

  // Thumbs Up / Down voting handler
  const handleVote = async (type: 'up' | 'down') => {
    if (voteType || voting) return;
    setVoting(true);

    if (isMock) {
      if (type === 'up') setThumbsUp(prev => prev + 1);
      else setThumbsDown(prev => prev + 1);
      setVoteType(type);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`gridpass_vote_${vehicleId}`, type);
      }
      setVoting(false);
      return;
    }

    try {
      // Record a sighting as the rating document
      await addDoc(collection(db, 'sightings'), {
        vehicle_id: vehicleId,
        spotted_by: user?.displayName || 'Passerby Spectator',
        location_name: type === 'up' ? 'Thumbs Up Rating' : 'Thumbs Down Rating',
        description: type === 'up' ? 'Liked this build!' : 'Disliked this build!',
        timestamp: serverTimestamp()
      });

      // Update the vehicle's thumbs_up/down in Firestore
      const updatedFields: any = {};
      if (type === 'up') {
        updatedFields.thumbs_up = (vehicle?.thumbs_up || 0) + 1;
        setThumbsUp(prev => prev + 1);
      } else {
        updatedFields.thumbs_down = (vehicle?.thumbs_down || 0) + 1;
        setThumbsDown(prev => prev + 1);
      }

      await updateDoc(doc(db, 'vehicles', vehicleId), updatedFields);
      setVehicle(prev => prev ? { ...prev, ...updatedFields } : null);
      setVoteType(type);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`gridpass_vote_${vehicleId}`, type);
      }

      await logEvent('info', 'scan', `Vehicle [${vehicleId}] rated ${type} by ${user?.email || 'Anonymous'}`);
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setVoting(false);
    }
  };

  // VIN Verification Audit simulator
  const handleRunVinAudit = async () => {
    if (vinAuditing || !vehicle?.vin) return;
    setVinAuditing(true);

    const steps = [
      "Querying NMVTIS title database...",
      "Analyzing theft registry records...",
      "Searching manufacturer recall registry...",
      "Validating digital provenance ledger...",
      "Decoding factory specifications from VIN...",
      "Finalizing verification certificate..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setVinAuditProgress(steps[i]);
      await new Promise(r => setTimeout(r, 450));
    }

    // Decode mock vehicle properties from the input VIN
    let decodedYear = 2024;
    let decodedMake = 'Ford';
    let decodedModel = 'Mustang GT';
    let decodedTrim = 'Premium';
    let decodedEngine = '5.0L Coyote V8';
    let decodedTransmission = '6-Speed Manual';
    let decodedHp = 480;
    let decodedTorque = 415;

    const vinInput = vehicle.vin.trim().toUpperCase();
    if (vinInput.startsWith('1FA')) {
      decodedYear = 2024;
      decodedMake = 'Ford';
      decodedModel = 'Mustang GT';
      decodedTrim = 'Premium';
      decodedEngine = '5.0L Coyote V8';
      decodedTransmission = '6-Speed Manual';
      decodedHp = 480;
      decodedTorque = 415;
    } else if (vinInput.startsWith('1G1')) {
      decodedYear = 2023;
      decodedMake = 'Chevrolet';
      decodedModel = 'Corvette Z06';
      decodedTrim = '3LZ Coupe';
      decodedEngine = '5.5L LT6 V8';
      decodedTransmission = '8-Speed Dual Clutch';
      decodedHp = 670;
      decodedTorque = 460;
    } else if (vinInput.startsWith('5UX')) {
      decodedYear = 2022;
      decodedMake = 'BMW';
      decodedModel = 'X5 M';
      decodedTrim = 'Competition';
      decodedEngine = '4.4L Twin-Turbo V8';
      decodedTransmission = '8-Speed Automatic';
      decodedHp = 617;
      decodedTorque = 553;
    } else {
      decodedYear = 2025;
      decodedMake = 'Porsche';
      decodedModel = '911 GT3';
      decodedTrim = 'RS';
      decodedEngine = '4.0L Flat-6';
      decodedTransmission = '7-Speed PDK';
      decodedHp = 518;
      decodedTorque = 342;
    }

    const report = {
      status: 'CLEAN',
      accident_history: '0 Incidents Reported',
      theft_records: 'No Active Theft Alerts',
      recall_status: '0 Active Recalls',
      database_registry: 'Registered with Gridpass Ledger',
      audited_at: new Date().toLocaleDateString()
    };

    const updatedVehicleData = {
      vin_checked: true,
      vin_report: report,
      year: decodedYear,
      make: decodedMake,
      model: decodedModel,
      trim: decodedTrim,
      specs: {
        engine: decodedEngine,
        transmission: decodedTransmission,
        hp: decodedHp,
        torque: decodedTorque
      }
    };

    if (isMock) {
      setVinAuditReport(report);
      setVehicle(prev => prev ? { ...prev, ...updatedVehicleData } : null);
      setVinAuditing(false);
      await logEvent('success', 'system', `VIN history audited and decoded for mock vehicle`);
      return;
    }

    try {
      const docRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(docRef, updatedVehicleData);
      setVinAuditReport(report);
      setVehicle(prev => prev ? { ...prev, ...updatedVehicleData } : null);
      await logEvent('success', 'system', `VIN history audited and decoded for vehicle [${vehicleId}]`);
    } catch (err) {
      console.error("Failed to save VIN audit report:", err);
    } finally {
      setVinAuditing(false);
    }
  };

  // Inline VIN saving handler
  const handleSaveVinOnly = async () => {
    if (!editVin.trim()) return;
    setSavingVin(true);

    const hasVinChanged = editVin.trim() !== (vehicle?.vin || '');
    const updatedFields = {
      vin: editVin.trim(),
      vin_checked: hasVinChanged ? false : (vehicle?.vin_checked || false),
      vin_report: hasVinChanged ? null : (vehicle?.vin_report || null)
    };

    if (isMock) {
      setVehicle(prev => prev ? { ...prev, ...updatedFields } : null);
      if (hasVinChanged) {
        setVinAuditReport(null);
      }
      setIsEditingVin(false);
      setSavingVin(false);
      await logEvent('success', 'system', `Updated vehicle VIN in mock`);
      return;
    }

    try {
      const docRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(docRef, updatedFields);
      setVehicle(prev => prev ? { ...prev, ...updatedFields } : null);
      if (hasVinChanged) {
        setVinAuditReport(null);
      }
      setIsEditingVin(false);
      await logEvent('success', 'system', `Updated vehicle VIN [${editVin}]`);
    } catch (err) {
      console.error("Failed to save VIN:", err);
    } finally {
      setSavingVin(false);
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
    const resolvedPaidBy = expensePaidBy.trim() || user?.displayName || user?.email?.split('@')[0] || 'Owner';

    const splitPayload = {
      is_split: expenseIsSplit,
      split_between: expenseIsSplit ? expenseSplitBetween : [],
      split_details: expenseIsSplit ? expenseSplitDetails.map(d => ({ name: d.name, paid: d.paid, owed: d.owed, active: d.active })) : [],
      photo_url: expensePhotoUrl
    };

    if (editingExpenseId) {
      // EDIT MODE
      if (isMock) {
        setExpenses(prev => prev.map(exp => exp.id === editingExpenseId ? {
          ...exp,
          title: expenseTitle.trim(),
          category: expenseCategory,
          cost: costNum,
          date: expenseDate,
          notes: expenseNotes.trim(),
          paid_by: resolvedPaidBy,
          ...splitPayload
        } : exp));
        setExpenseTitle('');
        setExpenseCost('');
        setExpenseNotes('');
        setExpensePaidBy('');
        setExpenseIsSplit(false);
        setExpenseSplitBetween([]);
        setExpenseSplitDetails([]);
        setExpensePhotoUrl('');
        setCustomSplitName('');
        setPaidBySelect('');
        setEditingExpenseId(null);
        setSubmittingExpense(false);
        return;
      }

      try {
        const expenseDocRef = doc(db, 'expenses', editingExpenseId);
        await updateDoc(expenseDocRef, {
          title: expenseTitle.trim(),
          category: expenseCategory,
          cost: costNum,
          date: expenseDate,
          notes: expenseNotes.trim(),
          paid_by: resolvedPaidBy,
          ...splitPayload
        });

        setExpenses(prev => prev.map(exp => exp.id === editingExpenseId ? {
          ...exp,
          title: expenseTitle.trim(),
          category: expenseCategory,
          cost: costNum,
          date: expenseDate,
          notes: expenseNotes.trim(),
          paid_by: resolvedPaidBy,
          ...splitPayload
        } : exp));

        setExpenseTitle('');
        setExpenseCost('');
        setExpenseNotes('');
        setExpensePaidBy('');
        setExpenseIsSplit(false);
        setExpenseSplitBetween([]);
        setExpenseSplitDetails([]);
        setExpensePhotoUrl('');
        setCustomSplitName('');
        setPaidBySelect('');
        setEditingExpenseId(null);
        await logEvent('success', 'system', `Expense updated for vehicle [${vehicleId}]: ${expenseTitle.trim()} ($${costNum})`);
      } catch (error) {
        console.error("Failed to update expense:", error);
        alert("Failed to update expense record.");
      } finally {
        setSubmittingExpense(false);
      }
    } else {
      // ADD MODE
      if (isMock) {
        const newExpense: VehicleExpense = {
          id: `exp-mock-${Date.now()}`,
          vehicle_id: vehicleId,
          owner_id: ownerUid,
          title: expenseTitle.trim(),
          category: expenseCategory,
          cost: costNum,
          date: expenseDate,
          notes: expenseNotes.trim(),
          paid_by: resolvedPaidBy,
          ...splitPayload
        };
        setExpenses(prev => [newExpense, ...prev]);
        setExpenseTitle('');
        setExpenseCost('');
        setExpenseNotes('');
        setExpensePaidBy('');
        setExpenseIsSplit(false);
        setExpenseSplitBetween([]);
        setExpenseSplitDetails([]);
        setExpensePhotoUrl('');
        setCustomSplitName('');
        setPaidBySelect('');
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
          paid_by: resolvedPaidBy,
          created_at: serverTimestamp(),
          ...splitPayload
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
          notes: payload.notes,
          paid_by: payload.paid_by,
          ...splitPayload
        };

        setExpenses(prev => [newExpense, ...prev]);
        setExpenseTitle('');
        setExpenseCost('');
        setExpenseNotes('');
        setExpensePaidBy('');
        setExpenseIsSplit(false);
        setExpenseSplitBetween([]);
        setExpenseSplitDetails([]);
        setExpensePhotoUrl('');
        setCustomSplitName('');
        setPaidBySelect('');

        await logEvent('success', 'system', `Expense logged for vehicle [${vehicleId}]: ${payload.title} ($${payload.cost})`);
      } catch (error) {
        console.error("Failed to save expense:", error);
        alert("Failed to save expense record.");
      } finally {
        setSubmittingExpense(false);
      }
    }
  };

  const recalculateEqualSplit = (totalCost: number, currentParticipants: ExpenseParticipant[], payerName: string) => {
    const activeList = currentParticipants.filter(p => p.active);
    const count = activeList.length;
    const equalShare = count > 0 ? Math.round((totalCost / count) * 100) / 100 : 0;
    
    // Resolve canonical name of payer
    const payerCanonical = resolveCanonicalMember(payerName).map(p => p.toLowerCase());
    
    return currentParticipants.map(p => {
      if (!p.active) {
        return { ...p, owed: 0, paid: 0 };
      }
      const pCanonical = resolveCanonicalMember(p.name).map(pn => pn.toLowerCase());
      const isPayer = pCanonical.some(pn => payerCanonical.includes(pn));
      
      return {
        ...p,
        owed: equalShare,
        paid: isPayer ? totalCost : 0
      };
    });
  };

  const handleToggleMemberSelection = (name: string, checked: boolean) => {
    setExpenseSplitDetails(prev => {
      let list = [...prev];
      const index = list.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
      if (index >= 0) {
        list[index] = { ...list[index], active: checked };
      } else {
        list.push({ name, active: checked, paid: 0, owed: 0 });
      }
      const updated = recalculateEqualSplit(Number(expenseCost) || 0, list, expensePaidBy);
      setExpenseSplitBetween(updated.filter(p => p.active).map(p => p.name));
      return updated;
    });
  };

  const handleToggleSplit = (checked: boolean) => {
    setExpenseIsSplit(checked);
    if (checked && expenseSplitDetails.length === 0) {
      const initialNames = getSplitMembersForVehicle(vehicle, user);
      const initialParticipants = initialNames.map(name => {
        const pCanonical = resolveCanonicalMember(name).map(pn => pn.toLowerCase());
        const payerCanonical = resolveCanonicalMember(expensePaidBy).map(p => p.toLowerCase());
        const isPayer = pCanonical.some(pn => payerCanonical.includes(pn));
        return {
          name,
          active: true,
          paid: isPayer ? (Number(expenseCost) || 0) : 0,
          owed: 0
        };
      });
      const updated = recalculateEqualSplit(Number(expenseCost) || 0, initialParticipants, expensePaidBy);
      setExpenseSplitDetails(updated);
      setExpenseSplitBetween(updated.map(p => p.name));
    }
  };

  const handleAddCustomSplitter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSplitName.trim()) return;
    const newName = customSplitName.trim();
    
    setExpenseSplitDetails(prev => {
      if (prev.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
        alert("This participant is already in the split.");
        return prev;
      }
      const newList = [...prev, { name: newName, active: true, paid: 0, owed: 0 }];
      const updated = recalculateEqualSplit(Number(expenseCost) || 0, newList, expensePaidBy);
      setExpenseSplitBetween(updated.filter(p => p.active).map(p => p.name));
      return updated;
    });
    setCustomSplitName('');
  };

  const handleRemoveCustomSplitter = (name: string) => {
    setExpenseSplitDetails(prev => {
      const newList = prev.filter(p => p.name.toLowerCase() !== name.toLowerCase());
      const updated = recalculateEqualSplit(Number(expenseCost) || 0, newList, expensePaidBy);
      setExpenseSplitBetween(updated.filter(p => p.active).map(p => p.name));
      return updated;
    });
  };

  const handleUpdatePaid = (name: string, value: number) => {
    setExpenseSplitDetails(prev =>
      prev.map(p => p.name === name ? { ...p, paid: value } : p)
    );
  };

  const handleUpdateOwed = (name: string, value: number) => {
    setExpenseSplitDetails(prev =>
      prev.map(p => p.name === name ? { ...p, owed: value } : p)
    );
  };

  const handleCostChange = (val: string) => {
    setExpenseCost(val);
    const costNum = Number(val) || 0;
    setExpenseSplitDetails(prev => {
      const updated = recalculateEqualSplit(costNum, prev, expensePaidBy);
      return updated;
    });
  };

  const handlePayerChange = (val: string) => {
    setExpensePaidBy(val);
    setExpenseSplitDetails(prev => {
      const updated = recalculateEqualSplit(Number(expenseCost) || 0, prev, val);
      return updated;
    });
  };

  const handlePaidBySelectChange = (val: string) => {
    setPaidBySelect(val);
    if (val !== 'custom') {
      handlePayerChange(val);
    } else {
      handlePayerChange('');
    }
  };

  const resolveCanonicalMember = (nameOrEmail: string): string[] => {
    if (!nameOrEmail) return [];
    const clean = nameOrEmail.trim().toLowerCase();
    if (clean.includes('&') || clean.includes(' and ')) {
      const parts = clean.split(/&| and /);
      return parts.flatMap(p => resolveCanonicalMember(p));
    }
    if (clean === 'pjlosey@outlook.com' || clean === 'pjlosey@gmail.com' || clean === 'pj') {
      return ['PJ'];
    }
    if (clean === 'kristinaandersonmm@gmail.com' || clean === 'kristina.andersonmm@gmail.com' || clean === 'kristina') {
      return ['Kristina'];
    }
    return [nameOrEmail.trim()];
  };

  const getDisplayName = (nameOrEmail: string): string => {
    if (!nameOrEmail) return '';
    const canonical = resolveCanonicalMember(nameOrEmail);
    if (canonical.length > 0) return canonical.join(' & ');
    return nameOrEmail;
  };

  const getSplitMembersForVehicle = (v: VehicleData | null, u: any): string[] => {
    const names = new Set<string>();
    if (v && v.owner_id) {
      if (v.id === 'mock-v1') {
        names.add('Marcus Mustang');
      } else {
        names.add('PJ');
      }
    }
    if (v && v.co_owners) {
      if (Array.isArray(v.co_owners)) {
        v.co_owners.forEach((co: any) => {
          const name = typeof co === 'string' ? co : co.name;
          if (name) names.add(name);
        });
      } else if (typeof v.co_owners === 'string') {
        v.co_owners.split('&').forEach(n => {
          const name = n.trim();
          if (name) names.add(name);
        });
      }
    }
    return Array.from(names);
  };

  const getSplitMembers = () => {
    const names = new Set<string>();
    const vehicleMembers = getSplitMembersForVehicle(vehicle, user);
    vehicleMembers.forEach(n => names.add(n));
    
    expenseSplitDetails.forEach(d => {
      if (d.name) names.add(d.name);
    });
    
    if (expensePaidBy) {
      resolveCanonicalMember(expensePaidBy).forEach(n => names.add(n));
    }
    
    return Array.from(names);
  };

  const getMemberExpenseCalculations = (exp: VehicleExpense, memberName: string) => {
    const memberCanonical = resolveCanonicalMember(memberName);
    let paid = 0;
    let share = 0;

    const ownerName = vehicle?.owner_id === 'user-marcus-123' ? 'Marcus Mustang' : 'Owner';
    const payer = exp.paid_by || ownerName;
    const payerCanonical = resolveCanonicalMember(payer);

    if (exp.is_split) {
      if (Array.isArray(exp.split_details) && exp.split_details.length > 0) {
        exp.split_details.forEach(d => {
          const dCanonical = resolveCanonicalMember(d.name);
          if (dCanonical.some(dc => memberCanonical.some(mc => mc.toLowerCase() === dc.toLowerCase()))) {
            share += (Number(d.owed) || 0) / dCanonical.length;
            paid += (Number(d.paid) || 0) / dCanonical.length;
          }
        });

        const sumPaidDetails = exp.split_details.reduce((sum, d) => sum + (Number(d.paid) || 0), 0);
        if (Math.abs(sumPaidDetails - exp.cost) > 0.01) {
          const diff = exp.cost - sumPaidDetails;
          if (payerCanonical.some(pc => memberCanonical.some(mc => mc.toLowerCase() === pc.toLowerCase()))) {
            paid += diff / payerCanonical.length;
          }
        }

        const sumSharesDetails = exp.split_details.reduce((sum, d) => sum + (Number(d.owed) || 0), 0);
        if (sumSharesDetails < 0.01) {
          if (payerCanonical.some(pc => memberCanonical.some(mc => mc.toLowerCase() === pc.toLowerCase()))) {
            share += exp.cost / payerCanonical.length;
          }
        }
      } else if (Array.isArray(exp.split_between) && exp.split_between.length > 0) {
        if (payerCanonical.some(pc => memberCanonical.some(mc => mc.toLowerCase() === pc.toLowerCase()))) {
          paid = exp.cost / payerCanonical.length;
        }
        
        const splitBetweenCanonical = exp.split_between.flatMap(p => resolveCanonicalMember(p));
        const isIncluded = splitBetweenCanonical.some(sc => memberCanonical.some(mc => mc.toLowerCase() === sc.toLowerCase()));
        if (isIncluded) {
          const count = splitBetweenCanonical.filter(sc => memberCanonical.some(mc => mc.toLowerCase() === sc.toLowerCase())).length;
          share = (exp.cost / splitBetweenCanonical.length) * count;
        }
      } else {
        if (payerCanonical.some(pc => memberCanonical.some(mc => mc.toLowerCase() === pc.toLowerCase()))) {
          paid = exp.cost / payerCanonical.length;
          share = exp.cost / payerCanonical.length;
        }
      }
    } else {
      if (payerCanonical.some(pc => memberCanonical.some(mc => mc.toLowerCase() === pc.toLowerCase()))) {
        paid = exp.cost / payerCanonical.length;
        share = exp.cost / payerCanonical.length;
      }
    }

    const roundedPaid = Math.round(paid * 100) / 100;
    const roundedShare = Math.round(share * 100) / 100;
    const owes = Math.max(0, roundedShare - roundedPaid);

    return {
      paid: roundedPaid,
      share: roundedShare,
      owes: Math.round(owes * 100) / 100
    };
  };

  const getConciseSplitSummary = (exp: VehicleExpense) => {
    const members = getSplitMembers();
    const paidParts: string[] = [];
    const owesParts: string[] = [];

    members.forEach(member => {
      const calc = getMemberExpenseCalculations(exp, member);
      const displayName = getDisplayName(member);
      if (calc.paid > 0.005) {
        paidParts.push(`${displayName} paid $${calc.paid.toFixed(2)}`);
      }
      if (calc.owes > 0.005) {
        owesParts.push(`${displayName} owes $${calc.owes.toFixed(2)}`);
      }
    });

    const paidStr = paidParts.join(' & ');
    const owesStr = owesParts.join(' & ');

    if (!paidStr && !owesStr) return null;

    return (
      <div 
        className="text-[10px] text-neutral-450 mt-1 font-mono flex items-center gap-1.5" 
        data-testid={`expense-split-details-${exp.id}`}
      >
        <span>Split Details:</span>
        {paidStr && <span className="text-neutral-300 font-bold">{paidStr}</span>}
        {paidStr && owesStr && <span className="text-neutral-600">•</span>}
        {owesStr && <span className="text-amber-400 font-semibold">{owesStr}</span>}
      </div>
    );
  };

  const renderFriendlyCards = () => {
    const members = getSplitMembers();
    if (members.length !== 2) return null;
    const nameA = members[0];
    const nameB = members[1];
    const totalOwedA = expenses.reduce((sum, e) => sum + getMemberExpenseCalculations(e, nameA).owes, 0);
    const totalOwedB = expenses.reduce((sum, e) => sum + getMemberExpenseCalculations(e, nameB).owes, 0);
    const owesDiff = totalOwedA - totalOwedB;

    const displayNameA = getDisplayName(nameA);
    const displayNameB = getDisplayName(nameB);

    let cardA = "";
    let cardB = "";

    if (owesDiff < -0.005) {
      const amt = Math.abs(owesDiff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      cardA = `${displayNameA} is currently covering $${amt} for ${displayNameB}. Settle up whenever convenient, no rush! 😊`;
      cardB = `${displayNameB} is catching up by $${amt}. ${displayNameA} has got it covered for now – thank you! 🙏`;
    } else if (owesDiff > 0.005) {
      const amt = owesDiff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      cardA = `${displayNameA} is catching up by $${amt}. ${displayNameB} has got it covered for now – thank you! 🙏`;
      cardB = `${displayNameB} is currently covering $${amt} for ${displayNameA}. Settle up whenever convenient, no rush! 😊`;
    } else {
      cardA = `${displayNameA} is perfectly settled up! Everything is square. ✨`;
      cardB = `${displayNameB} is perfectly settled up! Everything is square. ✨`;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2" id="friendly-balance-cards">
        <div className="glass-card p-5 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
          <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">{displayNameA}'s Status</span>
          <p className="text-xs font-semibold text-neutral-200 mt-2 leading-relaxed">{cardA}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
          <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">{displayNameB}'s Status</span>
          <p className="text-xs font-semibold text-neutral-200 mt-2 leading-relaxed">{cardB}</p>
        </div>
      </div>
    );
  };

  const handleSettleUp = async () => {
    const members = getSplitMembers();
    if (members.length !== 2) return;
    const nameA = members[0];
    const nameB = members[1];
    const totalOwedA = expenses.reduce((sum, e) => sum + getMemberExpenseCalculations(e, nameA).owes, 0);
    const totalOwedB = expenses.reduce((sum, e) => sum + getMemberExpenseCalculations(e, nameB).owes, 0);
    const owesDiff = totalOwedA - totalOwedB;

    if (Math.abs(owesDiff) < 0.01) {
      alert("Balances are already settled!");
      return;
    }

    const debtor = owesDiff > 0 ? nameA : nameB;
    const creditor = owesDiff > 0 ? nameB : nameA;
    const amount = Math.round(Math.abs(owesDiff) * 100) / 100;

    const payload: VehicleExpense = {
      vehicle_id: vehicleId,
      owner_id: isMock ? 'user-marcus-123' : (user?.uid || 'unknown-uid'),
      title: `Settle Up: ${debtor} paid ${creditor}`,
      category: 'other',
      cost: amount,
      date: new Date().toISOString().split('T')[0],
      notes: `Settled up net balance of $${amount.toFixed(2)}`,
      paid_by: debtor,
      is_split: true,
      split_between: [debtor, creditor],
      split_details: [
        { name: debtor, paid: amount, owed: 0, active: true },
        { name: creditor, paid: 0, owed: amount, active: true }
      ]
    };

    if (isMock) {
      setExpenses(prev => [{ ...payload, id: `exp-settle-${Date.now()}` }, ...prev]);
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...payload,
        created_at: serverTimestamp()
      });
      setExpenses(prev => [{ ...payload, id: docRef.id }, ...prev]);
      await logEvent('success', 'system', `Settlement logged for vehicle [${vehicleId}]: $${amount.toFixed(2)}`);
    } catch (error) {
      console.error("Failed to settle up:", error);
      alert("Failed to record settlement payment.");
    }
  };

  const handleStartEditExpense = (exp: VehicleExpense) => {
    if (!exp.id) return;
    setEditingExpenseId(exp.id);
    setExpenseTitle(exp.title);
    setExpenseCategory(exp.category);
    setExpenseCost(String(exp.cost));
    setExpenseDate(exp.date);
    setExpenseNotes(exp.notes || '');
    setExpensePaidBy(exp.paid_by || '');
    setExpenseIsSplit(exp.is_split || false);
    setExpenseSplitBetween(exp.split_between || []);
    setExpenseSplitDetails(exp.split_details || []);
    setExpensePhotoUrl(exp.photo_url || '');

    const coOwnersList = getSplitMembersForVehicle(vehicle, user);
    const isPayerCoOwner = coOwnersList.includes(exp.paid_by || '');
    setPaidBySelect(isPayerCoOwner ? (exp.paid_by || '') : (exp.paid_by ? 'custom' : ''));
    
    const formEl = document.getElementById('expenses-tab-content');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setExpenseTitle('');
    setExpenseCost('');
    setExpenseNotes('');
    setExpensePaidBy('');
    setExpenseIsSplit(false);
    setExpenseSplitBetween([]);
    setExpenseSplitDetails([]);
    setExpensePhotoUrl('');
    setCustomSplitName('');
    setPaidBySelect('');
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
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  // Math for Expenses Tab
  const purchasePriceVal = vehicle?.purchase_price ? parseFloat(String(vehicle.purchase_price)) || 0 : 0;
  const fuelTotal = expenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.cost, 0);
  const licenseTotal = expenses.filter(e => e.category === 'license').reduce((sum, e) => sum + e.cost, 0);
  const feesTotal = expenses.filter(e => e.category === 'fees').reduce((sum, e) => sum + e.cost, 0);
  const addonTotal = expenses.filter(e => e.category === 'addon').reduce((sum, e) => sum + e.cost, 0);
  const serviceTotal = expenses.filter(e => e.category === 'service').reduce((sum, e) => sum + e.cost, 0);
  const insuranceTotal = expenses.filter(e => e.category === 'insurance').reduce((sum, e) => sum + e.cost, 0);
  const otherTotal = expenses.filter(e => e.category === 'other').reduce((sum, e) => sum + e.cost, 0);
  const loggedPurchaseTotal = expenses.filter(e => e.category === 'purchase').reduce((sum, e) => sum + e.cost, 0);
  const finalPurchasePrice = loggedPurchaseTotal || purchasePriceVal;
  const totalTCO = finalPurchasePrice + fuelTotal + licenseTotal + feesTotal + addonTotal + serviceTotal + insuranceTotal + otherTotal;

  const CATEGORY_MAP = {
    purchase: { label: 'Purchase Price', color: 'bg-yellow-50 border border-yellow-150 text-yellow-600' },
    license: { label: 'Title & Registration', color: 'bg-purple-55/10 border-purple-200 text-purple-600' },
    fees: { label: 'Launches & Slips', color: 'bg-indigo-50 border border-indigo-150 text-indigo-600' },
    fuel: { label: 'Fuel & Gas', color: 'bg-cyan-50 border border-cyan-150 text-cyan-600' },
    addon: { label: 'Add-ons & Mods', color: 'bg-pink-50 border border-pink-150 text-pink-600' },
    service: { label: 'Inspections & Repairs', color: 'bg-emerald-50 border border-emerald-150 text-emerald-600' },
    insurance: { label: 'Insurance', color: 'bg-blue-50 border border-blue-150 text-blue-600' },
    other: { label: 'Other', color: 'bg-neutral-50 border border-neutral-200 text-neutral-600' }
  };

  if (!vehicle) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex flex-col items-center justify-center space-y-4 p-8">
        <CarFront className="w-16 h-16 text-neutral-300" />
        <h2 className="text-xl font-black text-neutral-900 uppercase">Vehicle Profile Not Found</h2>
        <Link href="/vehicles" className="text-xs font-bold text-[#ff3b30] uppercase hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Browse Vehicles
        </Link>
      </div>
    );
  }

  const isMarcus = isMock && user?.email === 'marcus@enthusiast.com';
  const isMike = isMock && user?.email === 'mike@performancetuning.com';
  
  const showTelemetryTab = isOwner || isMarcus;
  const showServiceTab = isOwner || isShop || isMarcus || isMike;
  const showExpensesTab = isOwner || isMarcus;

  const showTabsBar = showTelemetryTab || showServiceTab || showExpensesTab;

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8">
      
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link href="/vehicles" className="text-xs font-mono text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 uppercase font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Vehicles Directory
        </Link>
        <div className="flex items-center gap-3">
          {vehicle.partner_dealer && (
            <span className="text-[10px] font-mono font-bold bg-[#10b981]/5 border border-[#10b981]/15 text-[#10b981] px-3 py-1 rounded-full uppercase tracking-wider">
              Verified Lot: {vehicle.partner_dealer}
            </span>
          )}
          <button 
            onClick={handleShare}
            className="text-[10px] font-mono font-bold text-[#ff3b30] hover:text-[#bd2925] flex items-center gap-1.5 uppercase transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> {shareText}
          </button>
        </div>
      </div>

      {/* Dynamic Photo Banner */}
      {vehicle.photo_url && (
        <div className="relative w-full h-64 md:h-96 rounded-[2.5rem] overflow-hidden border border-neutral-200 shadow-sm animate-in fade-in duration-300">
          <img 
            src={vehicle.photo_url} 
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Hero Specs Title Card */}
      <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
              {vehicle.tag_id}
            </span>
            {vehicle.is_verified_provenance && (
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-150 px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Provenance Verified
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-neutral-900 uppercase tracking-tight leading-none pt-1">
            {vehicle.year} {vehicle.make} <span className="text-[#ff3b30]">{vehicle.model}</span>
          </h1>
          {vehicle.trim && <p className="text-xs text-neutral-500 uppercase font-mono font-bold tracking-widest">{vehicle.trim} Package</p>}
        </div>

        {/* Rating Up/Down Panel */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-mono font-black text-emerald-600 leading-none">{thumbsUp}</div>
              <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-mono font-black text-red-500 leading-none">{thumbsDown}</div>
              <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-1">Dislikes</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote('up')}
              disabled={voteType !== null || voting}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer ${
                voteType === 'up' 
                  ? 'bg-emerald-55 border border-emerald-250 text-emerald-700 font-black animate-pulse' 
                  : 'bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-850'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${voteType === 'up' ? 'fill-emerald-600' : ''}`} />
              {voteType === 'up' ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={() => handleVote('down')}
              disabled={voteType !== null || voting}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer ${
                voteType === 'down' 
                  ? 'bg-red-55 border border-red-250 text-red-700 font-black animate-pulse' 
                  : 'bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-850'
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${voteType === 'down' ? 'fill-red-650' : ''}`} />
              {voteType === 'down' ? 'Disliked' : 'Dislike'}
            </button>
          </div>
        </div>
      </div>

        {/* Content Area */}
        <div className="space-y-6">

          (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200">
              
              {/* Left Column: Specifications & Ownership */}
              <div className="md:col-span-5 space-y-6">
                
                {/* Factory Specifications */}
                <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-3xl space-y-4">
                  <h3 className="text-xs font-black text-neutral-555 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" /> Factory Specifications
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs font-bold pt-2">
                    <span className="text-neutral-450 uppercase">Engine</span>
                    <span className="text-neutral-900 text-right truncate">{vehicle.specs?.engine || 'N/A'}</span>

                    <span className="text-neutral-450 uppercase">Transmission</span>
                    <span className="text-neutral-900 text-right truncate">{vehicle.specs?.transmission || 'N/A'}</span>

                    <span className="text-neutral-450 uppercase">Output Power</span>
                    <span className="text-neutral-900 text-right">{vehicle.specs?.hp ? `${vehicle.specs.hp} HP` : 'N/A'}</span>

                    <span className="text-neutral-450 uppercase">Peak Torque</span>
                    <span className="text-neutral-900 text-right">{vehicle.specs?.torque ? `${vehicle.specs.torque} lb-ft` : 'N/A'}</span>

                    {vehicle.vin && (
                      <>
                        <span className="text-neutral-450 uppercase">VIN / Serial</span>
                        <span className="text-neutral-900 text-right font-mono tracking-wider truncate">{vehicle.vin}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Owners */}
                <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-3xl space-y-4">
                  <h3 className="text-xs font-black text-neutral-555 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-200 pb-3">
                    <User className="w-4 h-4 text-[#ff3b30]" /> Owners
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Primary Owner Link Card */}
                    <Link href={`/u/${ownerProfile?.username || vehicle.owner_id || ''}`} className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-2xl hover:border-[#ff3b30] hover:shadow-sm transition-all group cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-black text-[#ff3b30] uppercase text-sm">
                        {(ownerProfile?.displayName || 'Marcus Mustang').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-neutral-900 uppercase text-xs group-hover:text-[#ff3b30] transition-colors">{ownerProfile?.displayName || 'Marcus Mustang'}</h4>
                        <p className="text-[10px] text-neutral-450 uppercase font-mono font-bold">Primary Owner</p>
                      </div>
                    </Link>

                    {/* Co-Owners Cards (if co-owners exist) */}
                    {(() => {
                      let list: { name: string; split: string; memberId: string }[] = [];
                      if (Array.isArray(vehicle.co_owners)) {
                        list = vehicle.co_owners.map((co) => {
                          const name = typeof co === 'string' ? co : co.name;
                          const split = typeof co === 'string' ? '50%' : co.split || '50%';
                          const memberId = typeof co === 'string' ? '' : co.member_id || '';
                          return { name, split, memberId };
                        });
                      } else if (typeof vehicle.co_owners === 'string' && vehicle.co_owners.trim()) {
                        const str = vehicle.co_owners.trim();
                        const match = str.match(/(.*?)\((.*?)\)/);
                        const name = match ? match[1].trim() : str;
                        const split = match ? match[2].trim() : '50%';
                        list = [{ name, split, memberId: name.toLowerCase().includes('kristina') ? 'kristina-mock' : '' }];
                      }

                      return list.map((co, idx) => {
                        return co.memberId ? (
                          <Link 
                            href={`/u/${co.memberId}`} 
                            key={idx} 
                            className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-2xl hover:border-[#ff3b30] hover:shadow-sm transition-all group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-black text-neutral-550 uppercase text-sm">
                              {co.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-black text-neutral-900 uppercase text-xs group-hover:text-[#ff3b30] transition-colors">{co.name}</h4>
                              <p className="text-[10px] text-neutral-450 uppercase font-mono font-bold">Joint Owner ({co.split})</p>
                            </div>
                          </Link>
                        ) : (
                          <div 
                            key={idx} 
                            className="flex items-center gap-3 p-3 bg-neutral-100 border border-neutral-200 rounded-2xl"
                          >
                            <div className="w-10 h-10 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center font-black text-neutral-550 uppercase text-sm">
                              {co.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-black text-neutral-900 uppercase text-xs">{co.name}</h4>
                              <p className="text-[10px] text-neutral-450 uppercase font-mono font-bold">Joint Owner ({co.split})</p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

              </div>

              {/* Right Column: Modifications, Photo Album */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Modification List */}
                <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-3xl space-y-6">
                  <h3 className="text-xs font-black text-neutral-555 uppercase tracking-widest flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-[#ff3b30]" /> Modification List
                  </h3>

                  {Array.isArray(vehicle.mods) && vehicle.mods.length > 0 ? (
                    <div className="space-y-3">
                      {vehicle.mods.map((mod, idx) => (
                        <div key={idx} className="p-4 bg-neutral-100 border border-neutral-200 rounded-2xl flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider bg-neutral-200 border border-neutral-300 px-2 py-0.5 rounded">
                              {mod.category}
                            </span>
                            <h4 className="font-bold text-neutral-900 pt-1">{mod.brand} {mod.name}</h4>
                          </div>
                          {mod.cost && (
                            <span className="font-mono font-bold text-neutral-600">${mod.cost}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : typeof vehicle.mods === 'string' && vehicle.mods ? (
                    <p className="text-sm text-neutral-600 font-medium whitespace-pre-line leading-relaxed">{vehicle.mods}</p>
                  ) : (
                    <div className="text-center py-8 text-neutral-400 space-y-2">
                      <CarFront className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs uppercase font-mono font-bold">No modifications logged yet.</p>
                    </div>
                  )}
                </div>

                {/* Photo Album */}
                <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-3xl space-y-4">
                  <h3 className="text-xs font-black text-emerald-650 uppercase tracking-widest flex items-center gap-1.5">
                    <CarFront className="w-4 h-4 text-emerald-600" /> Photo Album
                  </h3>
                  
                  {Array.isArray(vehicle.additional_photos) && vehicle.additional_photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(vehicle.additional_photos as string[]).map((photo, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-neutral-200 group">
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
          )

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

    </div>
  </div>
  );
}
