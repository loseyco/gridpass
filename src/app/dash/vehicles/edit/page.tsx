'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, addDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, ArrowLeft, Camera, Trash2, Plus, Image, User, Mail } from 'lucide-react';
import Link from 'next/link';
import { compressImage } from '@/lib/utils/imageCompressor';

interface ModItem {
  category?: string;
  brand: string;
  name: string;
  cost?: number;
  install_date?: string;
}

export default function EditVehiclePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('id');
  const isNew = !vehicleId || vehicleId === 'new';

  const isMock = typeof window !== 'undefined' && !!(window as any).__PLAYWRIGHT_MOCK__;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [year, setYear] = useState('2024');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [vin, setVin] = useState('');

  // Specs
  const [engine, setEngine] = useState('');
  const [transmission, setTransmission] = useState('');
  const [hp, setHp] = useState('');
  const [torque, setTorque] = useState('');

  // Modifications list
  const [mods, setMods] = useState<ModItem[]>([]);
  const [newModBrand, setNewModBrand] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newModCost, setNewModCost] = useState('');
  const [newModInstallDate, setNewModInstallDate] = useState('');

  // Story & Gallery
  const [story, setStory] = useState('');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);

  // Purchase & Ownership
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [ownershipSplit, setOwnershipSplit] = useState('');
  const [titleStatus, setTitleStatus] = useState('');
  const [stickerStatus, setStickerStatus] = useState('');
  const [engineHours, setEngineHours] = useState('');
  const [coOwners, setCoOwners] = useState<Array<{ name: string, split: string, member_id: string, email?: string }>>([]);
  const [coOwnerSearch, setCoOwnerSearch] = useState('');
  const [matchedMembers, setMatchedMembers] = useState<Array<{ uid: string, display_name: string, username?: string }>>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [customCoOwnerName, setCustomCoOwnerName] = useState('');
  const [customCoOwnerEmail, setCustomCoOwnerEmail] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isNew) return;

    if (isMock) {
      const stored = localStorage.getItem('__mock_vehicles__');
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.find((v: any) => v.id === vehicleId);
        if (match) {
          populateForm(match);
        }
      }
      setLoading(false);
      return;
    }

    async function loadVehicle() {
      try {
        const docRef = doc(db, 'vehicles', vehicleId!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const vData = docSnap.data();
          populateForm({ id: docSnap.id, ...vData });
        } else {
          alert('Vehicle not found.');
          router.push('/dash');
        }
      } catch (err) {
        console.error('Error loading vehicle:', err);
      } finally {
        setLoading(false);
      }
    }

    loadVehicle();
  }, [vehicleId, isNew]);

  const populateForm = (data: any) => {
    setYear(String(data.year || 2024));
    setMake(data.make || '');
    setModel(data.model || '');
    setTrim(data.trim || '');
    setPhotoUrl(data.photo_url || data.imageUrl || data.image_url || data.photoUrl || (data.images && data.images[0]) || '');
    setVin(data.vin || '');

    setEngine(data.specs?.engine || '');
    setTransmission(data.specs?.transmission || '');
    setHp(String(data.specs?.hp || ''));
    setTorque(String(data.specs?.torque || ''));

    setStory(data.story || '');

    // Parse mods
    let mList: ModItem[] = [];
    if (Array.isArray(data.mods)) {
      mList = data.mods.map((m: any) => {
        if (typeof m === 'string') {
          return { brand: '', name: m, cost: undefined, install_date: undefined };
        }
        return {
          brand: m.brand || '',
          name: m.name || '',
          cost: m.cost ? parseFloat(String(m.cost)) || undefined : undefined,
          install_date: m.install_date || m.installDate || undefined,
          category: m.category || undefined
        };
      });
    } else if (typeof data.mods === 'string' && data.mods) {
      mList = data.mods.split('\n').map((line: string) => {
        const parts = line.split('|').map((x: string) => x.trim());
        if (parts.length >= 3) {
          return {
            brand: parts[1],
            name: parts[2],
            cost: parts[3] ? parseFloat(parts[3]) || undefined : undefined,
            install_date: undefined,
            category: parts[0]
          };
        }
        return {
          brand: '',
          name: line,
          cost: undefined,
          install_date: undefined,
          category: 'Upgrade'
        };
      }).filter((m: ModItem) => m.name.trim() !== '');
    }
    setMods(mList);

    // Parse additional photos
    if (Array.isArray(data.additional_photos)) {
      setAdditionalPhotos(data.additional_photos);
    } else if (Array.isArray(data.images)) {
      setAdditionalPhotos(data.images);
    } else {
      setAdditionalPhotos([]);
    }

    setPurchaseDate(data.purchase_date || '');
    setPurchasePrice(String(data.purchase_price || ''));
    setOwnershipSplit(data.ownership_split || '');
    setTitleStatus(data.title_status || '');
    setStickerStatus(data.sticker_status || '');
    setEngineHours(String(data.engine_hours || ''));

    // Parse co-owners
    if (Array.isArray(data.co_owners)) {
      setCoOwners(data.co_owners.map((co: any) => {
        if (typeof co === 'string') {
          return { name: co, split: '50%', member_id: '' };
        }
        return {
          name: co.name || '',
          split: co.split || '50%',
          member_id: co.member_id || '',
          email: co.email || ''
        };
      }));
    } else if (typeof data.co_owners === 'string' && data.co_owners) {
      const names = data.co_owners.split(',').map((x: string) => x.trim()).filter(Boolean);
      setCoOwners(names.map((name: string) => ({ name, split: '50%', member_id: '' })));
    } else {
      setCoOwners([]);
    }
  };

  const handleMainPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingMain(true);

    let uploadFile = file;
    try {
      uploadFile = await compressImage(file);
    } catch (compressErr) {
      console.warn("Image compression failed, using original file:", compressErr);
    }

    if (isMock) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(uploadFile);
      setUploadingMain(false);
      return;
    }

    try {
      const storageRef = ref(storage, `vehicles/${user.uid}/${Date.now()}_${uploadFile.name}`);
      const uploadResult = await uploadBytes(storageRef, uploadFile);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      setPhotoUrl(downloadUrl);
    } catch (err) {
      console.error("Firebase storage upload failed, keeping base64 preview:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(uploadFile);
    } finally {
      setUploadingMain(false);
    }
  };

  const handleAdditionalPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAdditional(true);

    let uploadFile = file;
    try {
      uploadFile = await compressImage(file);
    } catch (compressErr) {
      console.warn("Image compression failed, using original file:", compressErr);
    }

    if (isMock) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAdditionalPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(uploadFile);
      setUploadingAdditional(false);
      return;
    }

    try {
      const storageRef = ref(storage, `vehicles/${user.uid}/${Date.now()}_${uploadFile.name}`);
      const uploadResult = await uploadBytes(storageRef, uploadFile);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      setAdditionalPhotos(prev => [...prev, downloadUrl]);
    } catch (err) {
      console.error("Firebase storage upload failed:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAdditionalPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(uploadFile);
    } finally {
      setUploadingAdditional(false);
    }
  };

  const handleRemoveAdditionalPhoto = (idx: number) => {
    setAdditionalPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // Debounced search for site members
  useEffect(() => {
    if (!coOwnerSearch.trim()) {
      setMatchedMembers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingMembers(true);
      
      if (isMock) {
        const mockMembers = [
          { uid: 'm1', display_name: 'MARCUS VANE', username: 'marcus' },
          { uid: 'm2', display_name: 'SARAH JENKINS', username: 'sarah' },
          { uid: 'm3', display_name: 'RANGER DAVE', username: 'rangerdave' },
          { uid: 'm4', display_name: 'STEVE COLLINS', username: 'steve' },
          { uid: 'm5', display_name: 'BILLY BOSTON', username: 'billy' },
          { uid: 'm6', display_name: 'RICHARD GATES', username: 'rich' },
          { uid: 'm7', display_name: 'CHLOE MILLER', username: 'chloe' },
        ];
        const match = mockMembers.filter(m => 
          m.display_name.toLowerCase().includes(coOwnerSearch.toLowerCase()) ||
          m.username.toLowerCase().includes(coOwnerSearch.toLowerCase())
        );
        setMatchedMembers(match);
        setSearchingMembers(false);
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(query(usersRef, limit(100)));
        const list: any[] = [];
        snap.forEach(docSnap => {
          const u = docSnap.data();
          const dName = u.display_name || '';
          const uName = u.username || '';
          if (
            dName.toLowerCase().includes(coOwnerSearch.toLowerCase()) ||
            uName.toLowerCase().includes(coOwnerSearch.toLowerCase())
          ) {
            list.push({
              uid: docSnap.id,
              display_name: dName,
              username: uName
            });
          }
        });
        setMatchedMembers(list.slice(0, 5));
      } catch (err) {
        console.error("Error searching members:", err);
      } finally {
        setSearchingMembers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [coOwnerSearch]);

  const handleAddMemberCoOwner = (member: { uid: string, display_name: string, username?: string }) => {
    if (coOwners.some(co => co.member_id === member.uid)) {
      setCoOwnerSearch('');
      setMatchedMembers([]);
      return;
    }
    setCoOwners(prev => [...prev, {
      name: member.display_name,
      split: '50%',
      member_id: member.uid
    }]);
    setCoOwnerSearch('');
    setMatchedMembers([]);
  };

  const handleAddCustomCoOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCoOwnerName.trim()) return;

    setCoOwners(prev => [...prev, {
      name: customCoOwnerName.trim(),
      split: '50%',
      member_id: customCoOwnerEmail.trim() ? 'invited' : '',
      email: customCoOwnerEmail.trim() || undefined
    }]);
    
    setCustomCoOwnerName('');
    setCustomCoOwnerEmail('');
  };

  const handleRemoveCoOwner = (idx: number) => {
    setCoOwners(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSplit = (idx: number, val: string) => {
    setCoOwners(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], split: val };
      return copy;
    });
  };

  const handleAddMod = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newModName.trim()) return;

    setMods(prev => [...prev, {
      brand: newModBrand.trim(),
      name: newModName.trim(),
      cost: newModCost.trim() ? parseFloat(newModCost) || undefined : undefined,
      install_date: newModInstallDate.trim() || undefined
    }]);

    setNewModBrand('');
    setNewModName('');
    setNewModCost('');
    setNewModInstallDate('');
  };

  const handleRemoveMod = (idx: number) => {
    setMods(prev => prev.filter((_, i) => i !== idx));
  };

  const handleModKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMod();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !make || !model) return;
    setSaving(true);

    const finalMods = [...mods];
    if (newModName.trim()) {
      finalMods.push({
        brand: newModBrand.trim(),
        name: newModName.trim(),
        cost: newModCost.trim() ? parseFloat(newModCost) || undefined : undefined,
        install_date: newModInstallDate.trim() || undefined
      });
    }

    const vehicleData: any = {
      owner_id: user.uid,
      year: parseInt(year) || 2024,
      make: make.trim(),
      model: model.trim(),
      trim: trim.trim(),
      photo_url: photoUrl.trim(),
      imageUrl: photoUrl.trim(),
      vin: vin.trim(),
      specs: {
        engine: engine.trim(),
        transmission: transmission.trim(),
        hp: hp.trim() ? parseInt(hp) || hp : '',
        torque: torque.trim() ? parseInt(torque) || torque : ''
      },
      mods: finalMods,
      co_owners: coOwners,
      purchase_date: purchaseDate.trim(),
      purchase_price: purchasePrice.trim() ? parseFloat(purchasePrice) || purchasePrice : '',
      ownership_split: ownershipSplit.trim(),
      title_status: titleStatus.trim(),
      sticker_status: stickerStatus.trim(),
      engine_hours: engineHours.trim() ? parseFloat(engineHours) || engineHours : '',
      story: story.trim(),
      additional_photos: additionalPhotos
    };

    const cleanObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(cleanObject);
      } else if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const key of Object.keys(obj)) {
          if (obj[key] !== undefined) {
            cleaned[key] = cleanObject(obj[key]);
          }
        }
        return cleaned;
      }
      return obj;
    };

    const cleanedData = cleanObject(vehicleData);

    if (isMock) {
      const stored = localStorage.getItem('__mock_vehicles__');
      const list = stored ? JSON.parse(stored) : [
        {
          id: 'v1',
          year: 2024,
          make: 'Chevrolet',
          model: 'Corvette Z06',
          specs: { engine: '5.5L V8', hp: 670 }
        }
      ];

      if (isNew) {
        const newV = {
          id: 'mock-' + Date.now(),
          ...cleanedData
        };
        list.push(newV);
      } else {
        const idx = list.findIndex((v: any) => v.id === vehicleId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...cleanedData };
        }
      }

      localStorage.setItem('__mock_vehicles__', JSON.stringify(list));
      setSaving(false);
      router.push('/dash');
      return;
    }

    try {
      if (isNew) {
        await addDoc(collection(db, 'vehicles'), cleanedData);
      } else {
        await updateDoc(doc(db, 'vehicles', vehicleId!), cleanedData);
      }
      router.push('/dash');
    } catch (err) {
      console.error('Failed to save vehicle:', err);
      alert('Error saving vehicle configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col max-w-2xl mx-auto w-full p-4 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <Link href="/dash" className="text-xs font-mono text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 uppercase font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-xs font-black text-neutral-900 uppercase tracking-widest">
          {isNew ? 'Register New Vehicle' : 'Edit Vehicle Passport'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-[#ff3b30] uppercase tracking-wider border-b border-neutral-100 pb-1">Basic Information</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Year</label>
              <input 
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                required
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Make</label>
              <input 
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Chevrolet"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Model</label>
              <input 
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Corvette Z06"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Trim Package</label>
              <input 
                type="text"
                value={trim}
                onChange={(e) => setTrim(e.target.value)}
                placeholder="e.g. Z07 Performance"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Main Photo</label>
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center transition-colors hover:bg-neutral-100/70 group">
              {photoUrl ? (
                <>
                  <img src={photoUrl} alt="Vehicle main" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="bg-white text-neutral-900 hover:bg-neutral-100 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm">
                      Change Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleMainPhotoChange} 
                        className="hidden" 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer p-6 text-center w-full h-full">
                  {uploadingMain ? (
                    <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-neutral-400 mb-2 group-hover:text-neutral-600 transition-colors" />
                      <span className="text-xs font-bold text-neutral-600 uppercase">Click to upload photo</span>
                      <span className="text-[9px] text-neutral-400 mt-1 font-mono">PNG, JPG, or WEBP</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleMainPhotoChange} 
                    className="hidden" 
                    disabled={uploadingMain}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">VIN (17 Characters)</label>
            <input 
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="17-Digit Vehicle Identification Number"
              className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
        </div>

        {/* Section 2: Specifications */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-[#ff3b30] uppercase tracking-wider border-b border-neutral-100 pb-1">Specifications</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Engine</label>
              <input 
                type="text"
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                placeholder="5.5L V8"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Transmission</label>
              <input 
                type="text"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                placeholder="e.g. 8-Speed Dual Clutch"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Horsepower (HP)</label>
              <input 
                type="text"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                placeholder="670"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Torque (LB-FT)</label>
              <input 
                type="text"
                value={torque}
                onChange={(e) => setTorque(e.target.value)}
                placeholder="460"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Modifications */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-1">
            <h3 className="text-xs font-black text-[#ff3b30] uppercase tracking-wider">Modifications List</h3>
            <span className="text-[8px] text-neutral-400 font-mono font-bold">Manage separate build items</span>
          </div>

          {/* List of current mods */}
          {mods.length > 0 && (
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200 overflow-hidden bg-white shadow-sm">
              {mods.map((mod, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 gap-3 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-neutral-950 truncate">
                      {mod.brand ? `${mod.brand} ` : ''}{mod.name}
                    </span>
                    {mod.install_date && (
                      <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded shrink-0">
                        Installed: {mod.install_date}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {mod.cost && (
                      <span className="text-xs font-mono font-bold text-neutral-600">${mod.cost}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMod(idx)}
                      className="p-1 hover:text-[#ff3b30] text-neutral-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Modification Form */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-4">
            <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Add Modification Item</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Brand / Manufacturer</label>
                <input 
                  type="text"
                  value={newModBrand}
                  onChange={(e) => setNewModBrand(e.target.value)}
                  placeholder="e.g. Corsa"
                  onKeyDown={handleModKeyDown}
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Mod Name / Description</label>
                <input 
                  type="text"
                  value={newModName}
                  onChange={(e) => setNewModName(e.target.value)}
                  placeholder="e.g. Sport Catback Exhaust"
                  onKeyDown={handleModKeyDown}
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Price / Cost ($)</label>
                <input 
                  type="number"
                  value={newModCost}
                  onChange={(e) => setNewModCost(e.target.value)}
                  placeholder="e.g. 1800"
                  onKeyDown={handleModKeyDown}
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Install Date</label>
                <input 
                  type="date"
                  value={newModInstallDate}
                  onChange={(e) => setNewModInstallDate(e.target.value)}
                  onKeyDown={handleModKeyDown}
                  className="w-full p-2.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleAddMod()}
                disabled={!newModName.trim()}
                className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white text-[9px] font-bold uppercase px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Modification
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Bio & Photos */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-[#ff3b30] uppercase tracking-wider border-b border-neutral-100 pb-1">Vehicle Story & Photo Gallery</h3>
          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Vehicle Story (Bio)</label>
            <textarea 
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tell the community about this vehicle's heritage, adventure story, or track history..."
              rows={4}
              className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Additional Photo Gallery</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {additionalPhotos.map((url, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-neutral-200 group bg-neutral-100">
                  <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveAdditionalPhoto(idx)}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {/* Upload card */}
              <label className="relative aspect-video rounded-lg border-2 border-dashed border-neutral-300 hover:border-[#ff3b30] bg-neutral-50 hover:bg-neutral-100/50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                {uploadingAdditional ? (
                  <Loader2 className="w-5 h-5 text-[#ff3b30] animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-neutral-400 group-hover:text-[#ff3b30] transition-colors" />
                    <span className="text-[9px] font-bold text-neutral-500 uppercase mt-1">Upload Photo</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAdditionalPhotoChange} 
                  className="hidden" 
                  disabled={uploadingAdditional}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Purchase & Ownership */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-[#ff3b30] uppercase tracking-wider border-b border-neutral-100 pb-1">Purchase & Ownership</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Purchase Date</label>
              <input 
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Purchase Price ($)</label>
              <input 
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Ownership Split (%)</label>
              <input 
                type="text"
                value={ownershipSplit}
                onChange={(e) => setOwnershipSplit(e.target.value)}
                placeholder="e.g. 50/50"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Engine Hours / Mileage</label>
              <input 
                type="text"
                value={engineHours}
                onChange={(e) => setEngineHours(e.target.value)}
                placeholder="e.g. 120"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Title Status</label>
              <input 
                type="text"
                value={titleStatus}
                onChange={(e) => setTitleStatus(e.target.value)}
                placeholder="Clean / Salvage / Leased"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Sticker Status</label>
              <input 
                type="text"
                value={stickerStatus}
                onChange={(e) => setStickerStatus(e.target.value)}
                placeholder="Valid / Expired"
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Co-Owners</label>

            {/* List of current co-owners */}
            {coOwners.length > 0 && (
              <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200 overflow-hidden bg-white">
                {coOwners.map((co, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {co.member_id && co.member_id !== 'invited' ? (
                        <div className="w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-[#ff3b30]" />
                        </div>
                      ) : co.email ? (
                        <div className="w-7 h-7 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-neutral-500" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                            {co.name.slice(0, 2)}
                          </span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-neutral-900 uppercase truncate">{co.name}</span>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            co.member_id && co.member_id !== 'invited'
                              ? 'bg-red-50 text-[#ff3b30] border border-red-100'
                              : co.email
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-neutral-50 text-neutral-500 border border-neutral-200'
                          }`}>
                            {co.member_id && co.member_id !== 'invited' ? 'Linked Member' : co.email ? 'Invited' : 'Custom'}
                          </span>
                        </div>
                        {co.email && (
                          <div className="text-[9px] text-neutral-400 font-mono font-bold truncate">
                            {co.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Split Percentage Input */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold">Split:</span>
                        <input
                          type="text"
                          value={co.split}
                          onChange={(e) => handleUpdateSplit(idx, e.target.value)}
                          placeholder="50%"
                          className="w-12 p-1 bg-neutral-50 border border-neutral-200 rounded text-center text-[10px] font-mono font-bold focus:outline-none focus:border-[#ff3b30]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCoOwner(idx)}
                        className="p-1 hover:text-[#ff3b30] text-neutral-400 transition-colors cursor-pointer animate-in fade-in duration-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search/Add Section */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-4">
              {/* Site Member Search */}
              <div className="space-y-1.5 relative">
                <label className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Search Site Members</label>
                <div className="relative">
                  <input
                    type="text"
                    value={coOwnerSearch}
                    onChange={(e) => setCoOwnerSearch(e.target.value)}
                    placeholder="Search by display name or username..."
                    className="w-full p-2.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] pr-8"
                  />
                  {searchingMembers && (
                    <div className="absolute right-2.5 top-3 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-[#ff3b30] animate-spin" />
                    </div>
                  )}
                </div>

                {/* matched dropdown list */}
                {matchedMembers.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg divide-y divide-neutral-100 overflow-hidden z-20 animate-in fade-in duration-100">
                    {matchedMembers.map((member) => (
                      <button
                        key={member.uid}
                        type="button"
                        onClick={() => handleAddMemberCoOwner(member)}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-neutral-50 text-left text-xs text-neutral-950 transition-colors font-bold uppercase"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#ff3b30]" />
                          <span>{member.display_name}</span>
                          {member.username && (
                            <span className="text-[9px] font-mono text-neutral-400 font-bold lowercase">
                              @{member.username}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#ff3b30] font-mono font-bold">Link Driver</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom / Invited Co-owner */}
              <div className="border-t border-neutral-200 pt-3.5 space-y-2">
                <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase block">Or, Add Co-Owner Manually</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customCoOwnerName}
                    onChange={(e) => setCustomCoOwnerName(e.target.value)}
                    placeholder="Owner Full Name (e.g. Sarah Jenkins)"
                    className="p-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                  <input
                    type="email"
                    value={customCoOwnerEmail}
                    onChange={(e) => setCustomCoOwnerEmail(e.target.value)}
                    placeholder="Email Address (Optional, to invite)"
                    className="p-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCustomCoOwner}
                    disabled={!customCoOwnerName.trim()}
                    className="bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white text-[9px] font-bold uppercase px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Co-Owner
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
          <Link
            href="/dash"
            className="py-3 bg-transparent hover:bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="py-3 bg-red-600 hover:bg-red-500 disabled:bg-neutral-200 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Passport'}
          </button>
        </div>

      </form>
    </div>
  );
}
