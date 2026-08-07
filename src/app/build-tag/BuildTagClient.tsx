'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Check, Shield, Sparkles, Cpu, Wrench, 
  ArrowRight, Landmark, CreditCard, ChevronDown, CheckCircle2, Car, Printer,
  User, Building2, Download, Package, Mail, MapPin, Loader2, Sparkle
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface ProfileOption {
  id: string;
  name: string;
  type: string;
  details?: string;
  rawData?: any;
}

export default function BuildTagClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryVehicleId = searchParams.get('vehicleId') || searchParams.get('id') || '';

  // Step state: 1 = Design, 2 = Destination/Target, 3 = Fulfillment (Print/Order), 4 = Success
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Step 1: Design States ---
  const [layout, setLayout] = useState<'round' | 'square' | 'keytag' | 'windshield'>('square');
  const [accentColor, setAccentColor] = useState<string>('#bd2925');
  const [borderTheme, setBorderTheme] = useState<'carbon' | 'crimson' | 'gold'>('carbon');
  const [includeMods, setIncludeMods] = useState<boolean>(true);
  const [customMods, setCustomMods] = useState<string>('Carbon splitter, Cat-back exhaust, Coilovers, Intake');

  // Stable random Tag ID for the current session
  const [tagId, setTagId] = useState<string>('GP-DIY-XXXXXX');
  useEffect(() => {
    document.title = "Build a Tag | Gridpass";
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTagId(`GP-DIY-${randomPart}`);
  }, []);

  // Pre-load vehicle/profile specs from query param
  useEffect(() => {
    if (!queryVehicleId) return;

    const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

    const prefillData = async () => {
      try {
        if (isMock) {
          setDestType('vehicle');
          setVehicleYear('2007');
          setVehicleMake('SEA DOO');
          setVehicleModel('GTI SE 155');
          setVehicleEngine('1.5L Rotax');
          setVehicleHp('155');
          setCustomMods('Solas Impeller, RIVA intake');
          setTagId('GP-DIY-MOCKV1');
          return;
        }

        const docRef = doc(db, 'vehicles', queryVehicleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDestType('vehicle');
          setVehicleYear(String(data.year || '2024'));
          setVehicleMake(data.make || '');
          setVehicleModel(data.model || '');
          setVehicleEngine(data.specs?.engine || data.engine || '');
          setVehicleHp(String(data.specs?.hp || data.hp || ''));
          
          if (Array.isArray(data.mods)) {
            setCustomMods(data.mods.join(', '));
          } else if (data.mods) {
            setCustomMods(data.mods);
          }

          if (data.tag_id) {
            setTagId(data.tag_id);
          }

          if (user && user.uid === data.owner_id) {
            setDestMode('pick');
            setSelectedProfileId(queryVehicleId);
          } else {
            setDestMode('create');
          }
        }
      } catch (err) {
        console.error("Failed to prefill builder data from URL:", err);
      }
    };

    prefillData();
  }, [queryVehicleId, user]);

  // --- Step 2: Destination States ---
  const [destType, setDestType] = useState<'vehicle' | 'person' | 'business'>('vehicle');
  const [destMode, setDestMode] = useState<'pick' | 'create'>('create');
  
  // Existing profile options (fetched if logged in)
  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);

  // New Profile Form fields
  const [vehicleYear, setVehicleYear] = useState<string>('2024');
  const [vehicleMake, setVehicleMake] = useState<string>('');
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [vehicleEngine, setVehicleEngine] = useState<string>('');
  const [vehicleHp, setVehicleHp] = useState<string>('');

  const [personName, setPersonName] = useState<string>('');
  const [personBio, setPersonBio] = useState<string>('Enthusiast, driver, creator.');
  const [personInstagram, setPersonInstagram] = useState<string>('');
  const [personTiktok, setPersonTiktok] = useState<string>('');

  const [businessName, setBusinessName] = useState<string>('');
  const [businessServices, setBusinessServices] = useState<string>('Detailing, performance tuning');
  const [businessLocation, setBusinessLocation] = useState<string>('');

  // --- Step 3: Fulfillment States ---
  const [fulfillmentType, setFulfillmentType] = useState<'print' | 'ship'>('print');
  const [shippingName, setShippingName] = useState<string>('');
  const [shippingEmail, setShippingEmail] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [shippingCity, setShippingCity] = useState<string>('');
  const [shippingState, setShippingState] = useState<string>('');
  const [shippingZip, setShippingZip] = useState<string>('');

  // Fetch user profiles when entering Step 2 or when destType changes
  useEffect(() => {
    if (!user || step !== 2) return;

    async function fetchUserProfiles() {
      setLoadingProfiles(true);
      try {
        const options: ProfileOption[] = [];
        const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

        if (isMock) {
          if (destType === 'vehicle') {
            options.push({
              id: 'mock-v1',
              name: '2007 SEA DOO GTI SE 155',
              type: 'vehicle',
              details: 'Tag: None linked',
              rawData: {
                year: 2007,
                make: 'SEA DOO',
                model: 'GTI SE 155',
                specs: { engine: '1.5L Rotax', hp: 155 },
                mods: 'Solas Impeller, RIVA intake',
                tag_id: ''
              }
            });
            options.push({
              id: 'mock-v2',
              name: '2017 JEEP WRANGLER',
              type: 'vehicle',
              details: 'Tag: 1001',
              rawData: {
                year: 2017,
                make: 'JEEP',
                model: 'WRANGLER',
                specs: { engine: '3.6L V6', hp: 285 },
                mods: '35" tires, 2.5" lift',
                tag_id: '1001'
              }
            });
            options.push({
              id: 'mock-v3',
              name: '2021 SUZUKI DRZ400S',
              type: 'vehicle',
              details: 'Tag: None linked',
              rawData: {
                year: 2021,
                make: 'SUZUKI',
                model: 'DRZ400S',
                specs: { engine: '398cc single', hp: 39 },
                mods: 'Yoshimura exhaust, JD Jetting kit',
                tag_id: ''
              }
            });
          } else if (destType === 'business') {
            options.push({
              id: 'mock-b1',
              name: 'Redline Dyno Performance',
              type: 'business',
              details: 'Location: Seattle, WA',
              rawData: {
                name: 'Redline Dyno Performance',
                services: 'Dyno tuning, racing alignments',
                location: 'Seattle, WA'
              }
            });
          } else {
            options.push({
              id: 'pjlosey',
              name: 'PJ LOSEY',
              type: 'person',
              details: 'Primary Member Passport',
              rawData: {
                name: 'PJ LOSEY',
                bio: 'Time-attack competitor. Track days enthusiast.',
                instagram: '@pjlosey',
                tiktok: '@pjlosey'
              }
            });
          }
        } else {
          if (destType === 'vehicle') {
            const qVehicles = query(collection(db, 'vehicles'), where('owner_id', '==', user!.uid));
            const snap = await getDocs(qVehicles);
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              options.push({
                id: docSnap.id,
                name: `${data.year || ''} ${data.make || ''} ${data.model || ''}`,
                type: 'vehicle',
                details: `Tag: ${data.tag_id || 'None linked'}`,
                rawData: data
              });
            });
          } else if (destType === 'business') {
            const qBusinesses = query(collection(db, 'businesses'), where('owner_id', '==', user!.uid));
            const snap = await getDocs(qBusinesses);
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              options.push({
                id: docSnap.id,
                name: data.name || 'Unnamed Business',
                type: 'business',
                details: `Location: ${data.location || 'N/A'}`,
                rawData: data
              });
            });
          } else {
            // Person driver profile
            const userDocRef = doc(db, 'users', user!.uid);
            const userDocSnap = await getDoc(userDocRef);
            let rawData: any = {};
            let name = user!.email?.split('@')[0].toUpperCase() || 'My Profile';
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              rawData = data;
              name = data.display_name || data.name || name;
            } else {
              rawData = {
                name: name,
                bio: 'Enthusiast, driver, creator.',
                instagram: '',
                tiktok: ''
              };
            }
            options.push({
              id: user!.uid,
              name: name,
              type: 'person',
              details: 'Primary Member Passport',
              rawData: rawData
            });
          }
        }

        setProfileOptions(options);
        if (options.length > 0) {
          setSelectedProfileId(options[0].id);
          setDestMode('pick');
        } else {
          setDestMode('create');
        }
      } catch (err) {
        console.error("Error loading user profiles:", err);
      } finally {
        setLoadingProfiles(false);
      }
    }

    fetchUserProfiles();
  }, [user, destType, step]);

  // Color preset helpers
  const presets = [
    { name: 'Crimson', hex: '#bd2925' },
    { name: 'Cobalt', hex: '#2563eb' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Purple', hex: '#8b5cf6' }
  ];

  // QR Redirect URL Mocking
  const qrRedirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/qr/${tagId}`
    : `https://gridpass.app/qr/${tagId}`;
  
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrRedirectUrl)}`;

  // Border selection handler
  const handleBorderSelect = (theme: 'carbon' | 'crimson' | 'gold') => {
    setBorderTheme(theme);
  };

  const getBorderColorHex = () => {
    if (borderTheme === 'crimson') return '#bd2925';
    if (borderTheme === 'gold') return '#ffd700';
    return '#262626'; // carbon
  };

  const getBorderClasses = () => {
    if (borderTheme === 'crimson') return 'border-[#bd2925]';
    if (borderTheme === 'gold') return 'border-yellow-500 gold-glow-ring';
    return 'border-neutral-850';
  };

  const getActiveProfileData = () => {
    if (destMode === 'pick') {
      const opt = profileOptions.find(o => o.id === selectedProfileId);
      if (opt && opt.rawData) {
        return opt.rawData;
      }
    }
    return null;
  };

  // Helper summary labels for live preview text
  const getPreviewTitle = () => {
    const activeData = getActiveProfileData();
    if (destType === 'vehicle') {
      if (activeData) {
        return `${activeData.year || ''} ${activeData.make || ''}`.trim() || 'VEHICLE';
      }
      return vehicleMake ? `${vehicleYear} ${vehicleMake}` : '2024 Chevrolet';
    } else if (destType === 'person') {
      if (activeData) {
        return activeData.display_name || activeData.name || 'MEMBER IDENTITY';
      }
      return personName ? personName : 'MEMBER IDENTITY';
    } else {
      if (activeData) {
        return activeData.name || 'PARTNER SERVICES';
      }
      return businessName ? businessName : 'PARTNER SERVICES';
    }
  };

  const getPreviewSubtitle = () => {
    const activeData = getActiveProfileData();
    if (destType === 'vehicle') {
      if (activeData) {
        return activeData.model || 'SPEC SHEET';
      }
      return vehicleModel ? vehicleModel : 'Corvette Z06';
    } else if (destType === 'person') {
      return 'MEMBER PROFILE';
    } else {
      if (activeData) {
        return activeData.services || 'Auto Shop & Racetrack';
      }
      return businessServices ? businessServices : 'Auto Shop & Racetrack';
    }
  };

  const activeData = getActiveProfileData();
  
  const resolvedVehicleEngine = activeData
    ? (activeData.specs?.engine || activeData.engine || 'N/A')
    : (vehicleEngine || 'N/A');

  const resolvedVehicleHp = activeData
    ? (activeData.specs?.hp || activeData.hp || '')
    : vehicleHp;

  const resolvedPersonBio = activeData
    ? (activeData.bio || 'N/A')
    : (personBio || 'N/A');

  const resolvedPersonInstagram = activeData
    ? (activeData.instagram || 'N/A')
    : (personInstagram || 'N/A');

  const resolvedBusinessServices = activeData
    ? (activeData.services || 'N/A')
    : (businessServices || 'N/A');

  const resolvedBusinessLocation = activeData
    ? (typeof activeData.location === 'string' ? activeData.location : activeData.location_name || 'N/A')
    : (businessLocation || 'N/A');

  const resolvedModsString = activeData
    ? (Array.isArray(activeData.mods) ? activeData.mods.join(', ') : (activeData.mods || ''))
    : customMods;


  // Download SVG blob helper
  const handleDownloadSVG = () => {
    const titleVal = getPreviewTitle();
    const subtitleVal = getPreviewSubtitle();
    const bColor = getBorderColorHex();
    const escapedQrCodeImgSrc = qrCodeImgSrc.replace(/&/g, '&amp;');

    const miniLogoSvg = (x: number, y: number, w: number, h: number) => {
      return `
        <rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="4" fill="#ffffff" />
        <g transform="translate(${x}, ${y}) scale(${w / 120}, ${h / 100})">
          <path d="M10 70 L42 22 L65 52 L88 28 L110 70 Z" fill="url(#mGrad)" stroke="#1c1c1f" stroke-width="6" stroke-linejoin="round" />
          <path d="M42 22 L52 42 M88 28 L98 48" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
          <path d="M18 86 C 48 86, 56 59, 96 59" stroke="#bd2925" stroke-width="12" stroke-linecap="round" />
        </g>
      `;
    };

    const logoDefs = `
      <defs>
        <linearGradient id="mGrad" x1="60" y1="22" x2="60" y2="70" gradientUnits="userSpaceOnUse">
          <stop stop-color="#bd2925" />
          <stop offset="1" stop-color="#1c1c1f" />
        </linearGradient>
      </defs>
    `;

    let svgContent = '';

    if (layout === 'round') {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        ${logoDefs}
        <circle cx="150" cy="150" r="145" fill="none" stroke="${bColor}" stroke-width="8"/>
        <circle cx="150" cy="150" r="130" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="6,4"/>
        <image href="${escapedQrCodeImgSrc}" x="85" y="75" width="130" height="130"/>
        ${miniLogoSvg(136, 126, 28, 28)}
        <text x="150" y="52" fill="#1c1c1f" font-family="sans-serif" font-size="14" font-weight="900" letter-spacing="3" text-anchor="middle">GRIDPASS</text>
        <text x="150" y="235" fill="#1c1c1f" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">${tagId}</text>
        <text x="150" y="260" fill="${accentColor}" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="1" text-anchor="middle">SCAN FOR SPECS</text>
      </svg>`;
    } else if (layout === 'square') {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        ${logoDefs}
        <rect x="5" y="5" width="290" height="290" rx="20" fill="none" stroke="${bColor}" stroke-width="8"/>
        <rect x="20" y="20" width="260" height="260" rx="12" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="8,4"/>
        <image href="${escapedQrCodeImgSrc}" x="85" y="75" width="130" height="130"/>
        ${miniLogoSvg(136, 126, 28, 28)}
        <text x="150" y="52" fill="#1c1c1f" font-family="sans-serif" font-size="16" font-weight="900" letter-spacing="4" text-anchor="middle">GRIDPASS</text>
        <text x="150" y="230" fill="#1c1c1f" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${titleVal} ${subtitleVal}</text>
        <text x="150" y="255" fill="${accentColor}" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">${tagId}</text>
      </svg>`;
    } else if (layout === 'keytag') {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150" width="300" height="150">
        ${logoDefs}
        <rect x="5" y="5" width="290" height="140" rx="10" fill="none" stroke="${bColor}" stroke-width="6"/>
        <image href="${escapedQrCodeImgSrc}" x="20" y="25" width="100" height="100"/>
        ${miniLogoSvg(59, 64, 22, 22)}
        <text x="135" y="50" fill="#1c1c1f" font-family="sans-serif" font-size="16" font-weight="900" letter-spacing="2">GRIDPASS</text>
        <text x="135" y="80" fill="#1c1c1f" font-family="monospace" font-size="12" font-weight="bold">${tagId}</text>
        <text x="135" y="110" fill="${accentColor}" font-family="sans-serif" font-size="10" font-weight="bold">${titleVal} ${subtitleVal}</text>
      </svg>`;
    } else if (layout === 'windshield') {
      const specLines = destType === 'vehicle' 
        ? `<text x="80" y="320" fill="#737373" font-family="sans-serif" font-size="14">Engine / Motor:</text>
           <text x="240" y="320" fill="#1c1c1f" font-family="sans-serif" font-size="14" font-weight="bold">${resolvedVehicleEngine}</text>
           <text x="80" y="355" fill="#737373" font-family="sans-serif" font-size="14">Output Power:</text>
           <text x="240" y="355" fill="#1c1c1f" font-family="sans-serif" font-size="14" font-weight="bold">${resolvedVehicleHp ? `${resolvedVehicleHp} HP` : 'N/A'}</text>`
        : destType === 'person'
        ? `<text x="80" y="320" fill="#737373" font-family="sans-serif" font-size="14">Member Bio:</text>
           <text x="240" y="320" fill="#1c1c1f" font-family="sans-serif" font-size="14" font-weight="bold">${resolvedPersonBio}</text>
           <text x="80" y="355" fill="#737373" font-family="sans-serif" font-size="14">Instagram:</text>
           <text x="240" y="355" fill="#1c1c1f" font-family="sans-serif" font-size="14" font-weight="bold">${resolvedPersonInstagram}</text>`
        : `<text x="80" y="320" fill="#737373" font-family="sans-serif" font-size="14">Specialty:</text>
           <text x="240" y="320" fill="#1c1c1f" font-family="sans-serif" font-size="14" font-weight="bold">${resolvedBusinessServices}</text>
           <text x="80" y="355" fill="#737373" font-family="sans-serif" font-size="14">Location:</text>
           <text x="240" y="355" fill="#1c1c1f" font-family="sans-serif" font-size="14" font-weight="bold">${resolvedBusinessLocation}</text>`;
 
      const modsLines = includeMods ? resolvedModsString.split(',').slice(0, 4).map((m: string, idx: number) => {
        return `<text x="80" y="${460 + idx * 30}" fill="#1c1c1f" font-family="sans-serif" font-size="14">• ${m.trim()}</text>`;
      }).join('') : '';
 
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 792" width="612" height="792">
        ${logoDefs}
        <rect x="15" y="15" width="582" height="762" rx="30" fill="none" stroke="${bColor}" stroke-width="12"/>
        <rect x="35" y="35" width="542" height="722" rx="20" fill="none" stroke="${accentColor}" stroke-width="3" stroke-dasharray="10,5"/>
        <text x="306" y="90" fill="#1c1c1f" font-family="sans-serif" font-size="28" font-weight="900" letter-spacing="6" text-anchor="middle">GRIDPASS PASSPORT</text>
        <text x="306" y="160" fill="#1c1c1f" font-family="sans-serif" font-size="34" font-weight="900" text-anchor="middle">${titleVal}</text>
        <text x="306" y="210" fill="${accentColor}" font-family="sans-serif" font-size="40" font-weight="900" text-anchor="middle">${subtitleVal}</text>
        <text x="80" y="280" fill="#1c1c1f" font-family="sans-serif" font-size="16" font-weight="bold">DETAILS</text>
        <line x1="80" y1="290" x2="532" y2="290" stroke="#cccccc" stroke-width="2"/>
        ${specLines}
        <text x="80" y="390" fill="#737373" font-family="sans-serif" font-size="14">Registry Tag:</text>
        <text x="240" y="390" fill="${accentColor}" font-family="monospace" font-size="14" font-weight="bold">${tagId}</text>
        ${includeMods ? `
        <text x="80" y="440" fill="#1c1c1f" font-family="sans-serif" font-size="16" font-weight="bold">MODIFICATIONS / BIO NOTES</text>
        <line x1="80" y1="450" x2="532" y2="450" stroke="#cccccc" stroke-width="2"/>
        ${modsLines}
        ` : ''}
        <rect x="80" y="660" width="280" height="50" rx="10" fill="${accentColor}"/>
        <text x="220" y="690" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="black" letter-spacing="1" text-anchor="middle">SCAN FOR PASS PORTAL</text>
        <image href="${escapedQrCodeImgSrc}" x="400" y="600" width="130" height="130"/>
        ${miniLogoSvg(451, 651, 28, 28)}
      </svg>`;
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gridpass-${layout}-${tagId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Submit and create profiles / order
  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let createdProfileId = '';

      // Check if we are running mock mode
      const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

      // 1. Save target profile if 'create' mode selected
      if (destMode === 'create') {
        if (destType === 'vehicle') {
          const vehicleData = {
            owner_id: user ? user.uid : '', // Blank if anonymous to allow claiming later
            year: parseInt(vehicleYear) || 2024,
            make: vehicleMake || 'DIY Spec',
            model: vehicleModel || 'Build',
            specs: {
              engine: vehicleEngine || 'N/A',
              hp: parseInt(vehicleHp) || 0
            },
            mods: customMods,
            tag_id: tagId,
            created_at: new Date()
          };

          if (!isMock) {
            const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);
            createdProfileId = docRef.id;
          } else {
            createdProfileId = 'mock-v-' + tagId;
          }

        } else if (destType === 'business') {
          const businessData = {
            owner_id: user ? user.uid : '',
            name: businessName || 'DIY Shop',
            services: businessServices,
            location: businessLocation,
            tag_id: tagId,
            created_at: new Date()
          };

          if (!isMock) {
            const docRef = await addDoc(collection(db, 'businesses'), businessData);
            createdProfileId = docRef.id;
          } else {
            createdProfileId = 'mock-b-' + tagId;
          }
        } else {
          // Person driver profile
          // Since users docs are keyed by UID, we store in localStorage if anonymous, or update user doc if logged in
          if (user) {
            // Logged in, we'll link tagId directly to user document when they finish the flow
            createdProfileId = user.uid;
          } else {
            // Save driver details to localStorage for later account claiming
            localStorage.setItem('gridpass_pending_driver_profile', JSON.stringify({
              name: personName,
              bio: personBio,
              instagram: personInstagram,
              tiktok: personTiktok,
              tagId: tagId
            }));
            createdProfileId = 'pending-driver';
          }
        }
      } else {
        // 'pick' mode -> link tag to existing profile
        createdProfileId = selectedProfileId;
      }

      // 2. Log order if shipping selected
      if (fulfillmentType === 'ship') {
        const orderData = {
          user_id: user ? user.uid : 'anonymous',
          shipping: {
            name: shippingName,
            email: shippingEmail,
            address: shippingAddress,
            city: shippingCity,
            state: shippingState,
            zip: shippingZip
          },
          tag_id: tagId,
          decal_layout: {
            layout,
            accentColor,
            borderTheme,
            includeMods
          },
          linked_profile: {
            type: destType,
            id: createdProfileId
          },
          created_at: new Date()
        };

        if (!isMock) {
          await addDoc(collection(db, 'orders'), orderData);
        }
      }

      // 3. Save pending tag layout details locally for anonymous claiming validation
      if (!user) {
        localStorage.setItem('gridpass_pending_tag_setup', JSON.stringify({
          tagId: tagId,
          type: destType,
          profileId: createdProfileId,
          layout,
          accentColor,
          borderTheme
        }));
      }

      setStep(4);
    } catch (err) {
      console.error("Fulfillment error:", err);
      alert("Something went wrong saving your tag. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans relative overflow-hidden flex flex-col justify-between selection:bg-rose-500/30">
      
      {/* Inline styles for browser print overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html, main {
            background: white !important;
            color: #1c1c1f !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: 100% !important;
            background: transparent !important;
            color: #1c1c1f !important;
            padding: 0 !important;
            margin: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999;
          }
          .print-sheet-card {
            background: transparent !important;
            color: #1c1c1f !important;
            border: 4px solid #1c1c1f !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
          }
          .print-sheet-card text,
          .print-sheet-card span,
          .print-sheet-card h1,
          .print-sheet-card h2,
          .print-sheet-card h3,
          .print-sheet-card h4,
          .print-sheet-card li,
          .print-sheet-card p,
          .print-sheet-card div {
            color: #1c1c1f !important;
          }
          .print-sheet-card .text-white {
            color: #1c1c1f !important;
          }
          .print-sheet-card .text-neutral-300,
          .print-sheet-card .text-neutral-400,
          .print-sheet-card .text-neutral-500 {
            color: #525252 !important;
          }
          .print-sheet-card .bg-neutral-950,
          .print-sheet-card .bg-neutral-900 {
            background: transparent !important;
          }
          .print-sheet-card .border-neutral-800,
          .print-sheet-card .border-neutral-900 {
            border-color: #cccccc !important;
          }
        }
      `}} />

      {/* Background Mesh Glow */}
      <div className="mesh-glow no-print" />

      {/* Global Header */}
      <div className="no-print">
        <Navbar />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 w-full flex-1 relative z-10 flex flex-col justify-center">
        
        {/* Wizard Progress Bar */}
        <div className="no-print flex items-center justify-between mb-8 max-w-xl mx-auto w-full">
          {[
            { num: 1, label: 'Design' },
            { num: 2, label: 'Passport' },
            { num: 3, label: 'Fulfill' },
            { num: 4, label: 'Complete' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-1.5">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step >= s.num 
                      ? 'bg-[#bd2925] text-white' 
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-505'
                  }`}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider font-mono ${step >= s.num ? 'text-white' : 'text-neutral-505'}`}>
                  {s.label}
                </span>
              </div>
              {s.num !== 4 && (
                <div className={`h-[1px] flex-1 mx-2 ${step > s.num ? 'bg-[#bd2925]' : 'bg-neutral-850'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Wizard Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Controls / Forms */}
          <div className="lg:col-span-5 space-y-6 no-print">
            
            {/* STEP 1: Design Decal */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest block">Step 01 / Decal Studio</span>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tight">Design Your Tag</h1>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    Select your accent color for the physical QR badge. Print it instantly or download the high-resolution vector file.
                  </p>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-6">
                  
                  {/* Accent Color Picker */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Theme Color</label>
                      <span className="text-[10px] font-mono font-bold text-neutral-400">{accentColor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {presets.map((c) => (
                          <button
                            key={c.hex}
                            onClick={() => setAccentColor(c.hex)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border border-neutral-900 transition-colors cursor-pointer"
                            style={{ backgroundColor: c.hex + '15', borderColor: accentColor === c.hex ? c.hex : 'transparent', color: c.hex }}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Next Step */}
                  <button
                    onClick={() => setStep(2)}
                    className="btn-glow w-full py-4 bg-[#bd2925] hover:bg-[#bd2925]/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    Setup Passport Link <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Target Binding */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest block">Step 02 / Registry Link</span>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tight">Configure Destination</h1>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    What should people see when they scan your physical QR tag? Choose whether it links to a vehicle, a member profile, or a local business.
                  </p>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-6">
                  
                  {/* Destination Type Tabs */}
                  <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-950/80 border border-neutral-900 rounded-xl">
                    {[
                      { id: 'vehicle', label: 'Vehicle', icon: Car },
                      { id: 'person', label: 'Member', icon: User },
                      { id: 'business', label: 'Business', icon: Building2 }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setDestType(item.id as any);
                          }}
                          className={`py-2 px-3 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            destType === item.id 
                              ? 'bg-neutral-900 text-white font-bold' 
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-mono tracking-wider">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pick or Create option (only available if logged in) */}
                  {user ? (
                    <div className="grid grid-cols-2 gap-2 pb-2">
                      <button
                        onClick={() => setDestMode('pick')}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          destMode === 'pick'
                            ? 'border-neutral-100 bg-neutral-900 text-white'
                            : 'border-neutral-850 hover:border-neutral-700 text-neutral-400'
                        }`}
                      >
                        Link Existing Profile
                      </button>
                      <button
                        onClick={() => setDestMode('create')}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          destMode === 'create'
                            ? 'border-neutral-100 bg-neutral-900 text-white'
                            : 'border-neutral-850 hover:border-neutral-700 text-neutral-400'
                        }`}
                      >
                        Create New Profile
                      </button>
                    </div>
                  ) : null}

                  {/* Pick Mode List */}
                  {user && destMode === 'pick' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Select Existing Profile</label>
                      {loadingProfiles ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-5 h-5 text-[#bd2925] animate-spin" />
                        </div>
                      ) : profileOptions.length === 0 ? (
                        <div className="p-4 border border-neutral-900 rounded-2xl text-center text-xs text-neutral-500">
                          No profiles found. Select &quot;Create New Profile&quot; to create one.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {profileOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setSelectedProfileId(opt.id)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                selectedProfileId === opt.id
                                  ? 'border-[#bd2925] bg-[#bd2925]/5 text-white'
                                  : 'border-neutral-900 bg-neutral-950/20 text-neutral-400'
                              }`}
                            >
                              <div>
                                <p className="text-xs font-bold uppercase">{opt.name}</p>
                                <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{opt.details}</p>
                              </div>
                              {selectedProfileId === opt.id && <Check className="w-4 h-4 text-[#bd2925] shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create Mode Form */}
                  {(!user || destMode === 'create') && (
                    <div className="space-y-4">
                      
                      {/* Vehicle Inputs */}
                      {destType === 'vehicle' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Year</label>
                              <input 
                                type="number" 
                                value={vehicleYear} 
                                onChange={(e) => setVehicleYear(e.target.value)}
                                className="w-full p-2.5 rounded-xl glass-input text-xs font-bold bg-neutral-900 border border-neutral-800 text-white" 
                                placeholder="2024"
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Make</label>
                              <input 
                                type="text" 
                                value={vehicleMake} 
                                onChange={(e) => setVehicleMake(e.target.value)}
                                className="w-full p-2.5 rounded-xl glass-input text-xs font-bold bg-neutral-900 border border-neutral-800 text-white" 
                                placeholder="Chevrolet"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Model</label>
                            <input 
                              type="text" 
                              value={vehicleModel} 
                              onChange={(e) => setVehicleModel(e.target.value)}
                              className="w-full p-2.5 rounded-xl glass-input text-xs font-bold bg-neutral-900 border border-neutral-800 text-white" 
                              placeholder="Corvette Z06"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Engine Specs</label>
                              <input 
                                type="text" 
                                value={vehicleEngine} 
                                onChange={(e) => setVehicleEngine(e.target.value)}
                                className="w-full p-2.5 rounded-xl glass-input text-xs font-bold bg-neutral-900 border border-neutral-800 text-white" 
                                placeholder="5.5L V8"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Horsepower</label>
                              <input 
                                type="number" 
                                value={vehicleHp} 
                                onChange={(e) => setVehicleHp(e.target.value)}
                                className="w-full p-2.5 rounded-xl glass-input text-xs font-bold bg-neutral-900 border border-neutral-800 text-white" 
                                placeholder="670"
                              />
                            </div>
                          </div>

                          {/* Mods/Bio input */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Modifications List (comma-separated)</label>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-mono text-neutral-400">Include</span>
                                <input 
                                  type="checkbox" 
                                  checked={includeMods} 
                                  onChange={(e) => setIncludeMods(e.target.checked)}
                                  className="w-3.5 h-3.5 accent-[#bd2925]"
                                />
                              </div>
                            </div>
                            <textarea 
                              value={customMods} 
                              onChange={(e) => setCustomMods(e.target.value)}
                              rows={2}
                              className="w-full p-2.5 rounded-xl glass-input text-xs font-medium bg-neutral-900 border border-neutral-800 text-white" 
                              placeholder="e.g. Catback exhaust, Coilovers, Intake"
                            />
                          </div>
                        </div>
                      )}

                      {/* Driver Inputs */}
                      {destType === 'person' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Member Name</label>
                            <input 
                              type="text" 
                              value={personName} 
                              onChange={(e) => setPersonName(e.target.value)}
                              className="w-full p-2.5 rounded-xl glass-input text-xs font-bold bg-neutral-900 border border-neutral-800 text-white" 
                              placeholder="Marcus Rossi"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Member Short Bio</label>
                            <textarea 
                              value={personBio} 
                              onChange={(e) => setPersonBio(e.target.value)}
                              rows={2}
                              className="w-full p-2.5 rounded-xl glass-input text-xs font-medium bg-neutral-900 border border-neutral-800 text-white" 
                              placeholder="Time-attack competitor. Track days enthusiast."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Instagram</label>
                              <input 
                                type="text" 
                                value={personInstagram} 
                                onChange={(e) => setPersonInstagram(e.target.value)}
                                className="w-full p-2.5 rounded-xl glass-input text-xs font-medium bg-neutral-900 border border-neutral-800 text-white" 
                                placeholder="@username"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">TikTok</label>
                              <input 
                                type="text" 
                                value={personTiktok} 
                                onChange={(e) => setPersonTiktok(e.target.value)}
                                className="w-full p-2.5 rounded-xl glass-input text-xs font-medium bg-neutral-900 border border-neutral-800 text-white" 
                                placeholder="@username"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Business Inputs */}
                      {destType === 'business' && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Business / Venue Name</label>
                            <input 
                              type="text" 
                              value={businessName} 
                              onChange={(e) => setBusinessName(e.target.value)}
                              className="w-full p-2.5 rounded-xl glass-input text-xs font-bold bg-neutral-900 border border-neutral-800 text-white" 
                              placeholder="Redline Dyno Performance"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Specialty & Services</label>
                            <input 
                              type="text" 
                              value={businessServices} 
                              onChange={(e) => setBusinessServices(e.target.value)}
                              className="w-full p-2.5 rounded-xl glass-input text-xs font-medium bg-neutral-900 border border-neutral-800 text-white" 
                              placeholder="Dyno tuning, racing alignments"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold text-neutral-505 uppercase">Location / Address</label>
                            <input 
                              type="text" 
                              value={businessLocation} 
                              onChange={(e) => setBusinessLocation(e.target.value)}
                              className="w-full p-2.5 rounded-xl glass-input text-xs font-medium bg-neutral-900 border border-neutral-800 text-white" 
                              placeholder="Seattle, WA"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="py-3 bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer min-h-[50px] px-4"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={destMode === 'create' && (destType === 'vehicle' ? (!vehicleMake || !vehicleModel) : destType === 'person' ? !personName : !businessName)}
                      className="btn-glow flex-1 py-3 bg-[#bd2925] hover:bg-[#bd2925]/90 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg min-h-[50px]"
                    >
                      Choose Print & Ship <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Fulfill */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Fulfillment Method</h3>
                  <p className="text-xs text-neutral-450 leading-relaxed font-medium">
                    Download print templates completely free to print on your own home printer, or generate high-res SVG vectors to display or order decals from any local/online printing service.
                  </p>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-6">
                  {/* Print Free Panel */}
                  <div className="space-y-4">
                    <div className="bg-[#bd2925]/5 border border-[#bd2925]/15 p-4 rounded-2xl text-[11.5px] leading-relaxed text-neutral-300 space-y-2">
                      <p className="font-bold text-white uppercase flex items-center gap-1 text-xs">
                        <Sparkles className="w-4 h-4 text-yellow-500" /> Free Self-Print Studio
                      </p>
                      <p>
                        You can download high-resolution vectors in SVG format matching standard Avery sticker paper or print the layout directly using your home color printer.
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-neutral-400 text-[11px]">
                        <li>Fits standard 3"x3" square sticker sheets or Avery 22806 templates.</li>
                        <li>Ideal for windshields, toolboxes, or keyrings.</li>
                        {user ? (
                          <li>Your active profile will be instantly linked to this tag upon completion.</li>
                        ) : (
                          <li>Join with a free account at the next step to activate and link your digital passport.</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handlePrint}
                        className="flex-1 py-3 bg-white text-black hover:bg-neutral-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[50px]"
                      >
                        <Printer className="w-4 h-4" /> Print At Home
                      </button>
                      <button
                        onClick={handleDownloadSVG}
                        className="flex-1 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[50px]"
                      >
                        <Download className="w-4 h-4" /> Download SVG
                      </button>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleFulfillSubmit}
                        disabled={isSubmitting}
                        className="btn-glow w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Complete DIY Tag Setup <CheckCircle2 className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-neutral-900/60">
                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-2 bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-500 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Go back to Passport links
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">Tag Activated</span>
                  <h1 className="text-3xl font-black text-white uppercase tracking-tight">Tag Setup Complete</h1>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    Your QR tag design was saved and linked to your digital destination!
                  </p>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-6 text-center">
                  <div className="space-y-2 text-left bg-neutral-950/60 border border-neutral-900 p-4 rounded-2xl">
                    <h3 className="text-xs font-black text-white uppercase">Decal Summary</h3>
                    <div className="h-[1px] bg-neutral-900 my-2" />
                    <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                      <span className="text-neutral-505 font-bold">Serial Tag ID</span>
                      <span className="text-white font-mono font-bold">{tagId}</span>
                      <span className="text-neutral-550 font-bold">Accent Color</span>
                      <span className="font-mono font-bold" style={{ color: accentColor }}>{accentColor}</span>
                      <span className="text-neutral-550 font-bold">Format / Layout</span>
                      <span className="text-white font-bold uppercase">{layout}</span>
                      <span className="text-neutral-550 font-bold">Linked to</span>
                      <span className="text-white font-bold uppercase">{destType} Passport</span>
                    </div>
                  </div>

                  {/* Anonymous redirect claim notice */}
                  {!user ? (
                    <div className="space-y-4 pt-2">
                      <div className="bg-[#bd2925]/5 border border-[#bd2925]/15 p-4 rounded-2xl text-[11.5px] leading-relaxed text-left text-neutral-300 space-y-1.5">
                        <p className="font-bold text-white uppercase text-xs flex items-center gap-1">
                          <Sparkle className="w-4 h-4 text-yellow-500 animate-spin" style={{ animationDuration: '6s' }} /> Claim Your Digital Page
                        </p>
                        <p>
                          Your physical tags are ready, but the digital passport is still unclaimed. Create a free account now to activate your spec sheet so that when spectators scan your tag, they see your ride details!
                        </p>
                      </div>

                      <Link
                        href={`/login?redirect=${encodeURIComponent(`/join?id=${tagId}`)}`}
                        className="btn-glow w-full py-4 bg-[#bd2925] hover:bg-[#bd2925]/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        Claim Digital Passport Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-neutral-400 font-medium">
                        Your tag is successfully linked to your digital garage dashboard.
                      </p>
                      <Link
                        href="/dash"
                        className="btn-glow w-full py-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Return to Garage Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Interactive live preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#07070a] border border-neutral-900/60 p-8 rounded-3xl min-h-[540px] relative overflow-hidden">
            
            {/* Ambient glows behind preview */}
            <div className="absolute inset-0 bg-radial-gradient from-neutral-950 via-transparent to-transparent pointer-events-none opacity-40" />

            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest no-print">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Decal Studio Preview
            </div>

            {/* Print Area isolated on print trigger */}
            <div className="print-area w-full flex items-center justify-center p-2">
              
              {/* Layout: Round Decal */}
              {layout === 'round' && (
                <div 
                  className={`w-64 h-64 rounded-full border-8 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center relative print-sheet-card ${getBorderClasses()}`}
                  style={{ borderColor: borderTheme !== 'gold' ? getBorderColorHex() : undefined }}
                >
                  <div 
                    className="absolute inset-3 rounded-full border-2 border-dashed pointer-events-none opacity-60" 
                    style={{ borderColor: accentColor }}
                  />
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <span className="text-xs font-black text-white tracking-widest uppercase">GRIDPASS</span>
                    
                    {/* Mock QR Code */}
                    <div className="w-28 h-28 my-3 bg-white p-1.5 rounded-xl shadow-lg flex items-center justify-center relative">
                      <img src={qrCodeImgSrc} alt="Tag QR Code" className="w-full h-full" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-7 h-7 bg-white p-0.5 rounded-md shadow flex items-center justify-center border border-neutral-100">
                          <LogoSvg />
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">{tagId}</span>
                    <span className="text-[8px] font-black mt-1 uppercase tracking-widest" style={{ color: accentColor }}>Scan for specs</span>
                  </div>
                </div>
              )}

              {/* Layout: Square Sheet */}
              {layout === 'square' && (
                <div 
                  className={`w-72 h-72 rounded-3xl border-8 bg-neutral-950 flex flex-col items-center justify-between p-6 text-center relative print-sheet-card ${getBorderClasses()}`}
                  style={{ borderColor: borderTheme !== 'gold' ? getBorderColorHex() : undefined }}
                >
                  <div 
                    className="absolute inset-3 rounded-2xl border-2 border-dashed pointer-events-none opacity-60" 
                    style={{ borderColor: accentColor }}
                  />
                  <span className="text-sm font-black text-white tracking-widest uppercase relative z-10">GRIDPASS DECAL</span>
                  <div className="w-28 h-28 bg-white p-1.5 rounded-xl shadow-lg flex items-center justify-center relative z-10">
                    <img src={qrCodeImgSrc} alt="Tag QR Code" className="w-full h-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-7 h-7 bg-white p-0.5 rounded-md shadow flex items-center justify-center border border-neutral-100">
                        <LogoSvg />
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-black text-white uppercase">{getPreviewTitle()}</h4>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mt-1" style={{ color: accentColor }}>{tagId}</span>
                  </div>
                </div>
              )}

              {/* Layout: Keytag */}
              {layout === 'keytag' && (
                <div 
                  className={`w-80 h-40 rounded-2xl border-4 bg-neutral-950 flex items-center p-5 relative print-sheet-card ${getBorderClasses()}`}
                  style={{ borderColor: borderTheme !== 'gold' ? getBorderColorHex() : undefined }}
                >
                  <div className="w-24 h-24 bg-white p-1.5 rounded-xl shadow-lg flex items-center justify-center shrink-0 relative">
                    <img src={qrCodeImgSrc} alt="Tag QR Code" className="w-full h-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white p-0.5 rounded-md shadow flex items-center justify-center border border-neutral-100">
                        <LogoSvg />
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-1 flex flex-col justify-center space-y-1">
                    <span className="text-xs font-black text-white tracking-widest uppercase">GRIDPASS</span>
                    <span className="text-xs font-mono font-bold text-neutral-400">{tagId}</span>
                    <span className="text-[9px] font-bold uppercase mt-2 line-clamp-2" style={{ color: accentColor }}>
                      {getPreviewTitle()}<br />{getPreviewSubtitle()}
                    </span>
                  </div>
                </div>
              )}

              {/* Layout: Windshield poster */}
              {layout === 'windshield' && (
                <div 
                  className={`w-[450px] min-h-[600px] rounded-3xl border-[10px] bg-neutral-950 flex flex-col justify-between p-8 relative print-sheet-card ${getBorderClasses()}`}
                  style={{ borderColor: borderTheme !== 'gold' ? getBorderColorHex() : undefined }}
                >
                  <div 
                    className="absolute inset-4 rounded-[20px] border-2 border-dashed pointer-events-none opacity-40" 
                    style={{ borderColor: accentColor }}
                  />

                  {/* Header info */}
                  <div className="text-center space-y-3 relative z-10 pt-2">
                    <span className="text-xs font-mono font-black text-neutral-500 uppercase tracking-[6px] block">GRIDPASS PASSPORT</span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                      {getPreviewTitle()}
                    </h2>
                    <h1 className="text-3xl font-black uppercase tracking-tight leading-none" style={{ color: accentColor }}>
                      {getPreviewSubtitle()}
                    </h1>
                  </div>

                  {/* Middle specs */}
                  <div className="space-y-4 my-6 relative z-10 px-4">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Specifications</h4>
                      <div className="h-[1px] bg-neutral-800 mt-1" />
                    </div>

                    <div className="grid grid-cols-3 gap-y-2 text-xs font-semibold">
                      {destType === 'vehicle' ? (
                        <>
                          <span className="text-neutral-500">Engine / Motor</span>
                          <span className="col-span-2 text-white font-bold">{resolvedVehicleEngine}</span>
                          <span className="text-neutral-500">Output Power</span>
                          <span className="col-span-2 text-white font-bold">{resolvedVehicleHp ? `${resolvedVehicleHp} HP` : 'N/A'}</span>
                        </>
                      ) : destType === 'person' ? (
                        <>
                          <span className="text-neutral-500">Member Bio</span>
                          <span className="col-span-2 text-white font-bold">{resolvedPersonBio}</span>
                          <span className="text-neutral-500">Instagram</span>
                          <span className="col-span-2 text-white font-bold">{resolvedPersonInstagram}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-neutral-500">Specialty</span>
                          <span className="col-span-2 text-white font-bold">{resolvedBusinessServices}</span>
                          <span className="text-neutral-500">Location</span>
                          <span className="col-span-2 text-white font-bold">{resolvedBusinessLocation}</span>
                        </>
                      )}

                      <span className="text-neutral-500">Registry Tag</span>
                      <span className="col-span-2 font-mono font-bold" style={{ color: accentColor }}>{tagId}</span>
                    </div>

                    {/* Modifications block */}
                    {includeMods && (
                      <div className="space-y-2 pt-2">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Modifications / Notes</h4>
                          <div className="h-[1px] bg-neutral-800 mt-1" />
                        </div>
                        <ul className="space-y-1.5 text-xs text-neutral-300">
                          {destType === 'vehicle' ? (
                            resolvedModsString.split(',').slice(0, 4).map((mod: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-neutral-500">•</span>
                                <span>{mod.trim()}</span>
                              </li>
                            ))
                          ) : destType === 'person' ? (
                            <li className="flex items-start gap-1.5">
                              <span className="text-neutral-500">•</span>
                              <span>Member Profile active on Gridpass.</span>
                            </li>
                          ) : (
                            <li className="flex items-start gap-1.5">
                              <span className="text-neutral-500">•</span>
                              <span>Verified performance partner.</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer Check-in code */}
                  <div className="flex items-end justify-between relative z-10 pt-4 border-t border-neutral-900">
                    <div className="space-y-2 max-w-[200px]">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: accentColor }}>
                        Scan for Pass Portal
                      </div>
                      <p className="text-[9px] text-neutral-500 font-bold leading-normal uppercase">
                        Scan the code on the right with any phone camera to access registries.
                      </p>
                    </div>
                    <div className="w-24 h-24 bg-white p-1.5 rounded-xl shadow-lg flex items-center justify-center shrink-0 relative">
                      <img src={qrCodeImgSrc} alt="Tag QR Code" className="w-full h-full" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white p-0.5 rounded-md shadow flex items-center justify-center border border-neutral-100">
                          <LogoSvg />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Global Footer */}
      <div className="no-print">
        <Footer />
      </div>
    </main>
  );
}

function LogoSvg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 120 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M10 70 L42 22 L65 52 L88 28 L110 70 Z" 
        fill="url(#mountainGradLogo)" 
        stroke="#1c1c1f" 
        strokeWidth="6" 
        strokeLinejoin="round" 
      />
      <path 
        d="M42 22 L52 42 M88 28 L98 48" 
        stroke="#ffffff" 
        strokeWidth="4" 
        strokeLinecap="round" 
      />
      <path 
        d="M18 86 C 48 86, 56 59, 96 59" 
        stroke="#bd2925" 
        strokeWidth="12" 
        strokeLinecap="round" 
      />
      <defs>
        <linearGradient id="mountainGradLogo" x1="60" y1="22" x2="60" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bd2925" />
          <stop offset="1" stopColor="#1c1c1f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

