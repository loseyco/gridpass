import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface VehicleClassItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  active: boolean;
  order?: number;
}

export const DEFAULT_VEHICLE_CLASSES: VehicleClassItem[] = [
  { id: 'classics', name: 'Classics', description: 'Pre-1975 Classic Cars & Vintage Hot Rods', icon: '🚗', active: true, order: 1 },
  { id: 'hot-rods', name: 'Hot Rods', description: 'Custom Rods, Street Rods & Kustoms', icon: '🔥', active: true, order: 2 },
  { id: 'muscle', name: 'Muscle', description: 'American Muscle, Drag Builds & Pro Touring', icon: '⚡', active: true, order: 3 },
  { id: 'off-road', name: 'Off-Road / Trucks', description: 'Trucks, SUVs, Jeeps, 4x4 & Overland Builds', icon: '🛻', active: true, order: 4 },
  { id: 'imports', name: 'Imports', description: 'JDM, Euro, Tuners, Drift & Stance Builds', icon: '🎌', active: true, order: 5 },
  { id: 'motorcycles', name: 'Motorcycles', description: 'Bikes, Trikes, Choppers & Cruisers', icon: '🏍️', active: true, order: 6 },
  { id: 'exotics', name: 'Exotics & Supercars', description: 'Supercars, Hypercars & Exotic Customs', icon: '🏎️', active: true, order: 7 },
  { id: 'pwc', name: 'PWC / Marine', description: 'Jet-Skis, Powerboats & Marine Watercraft', icon: '🚤', active: true, order: 8 },
  { id: 'ev-modern', name: 'EV & Modern', description: 'Electric Vehicles & Modern Performance', icon: '🔋', active: true, order: 9 },
  { id: 'bicycles', name: 'Bicycles & E-Bikes', description: 'Road, Mountain, BMX, Gravel & E-Bikes', icon: '🚲', active: true, order: 10 },
  { id: 'pevs', name: 'Onewheels & PEVs', description: 'Onewheels, Electric Skateboards, EUCs & Scooters', icon: '🛹', active: true, order: 11 },
  { id: 'aviation', name: 'Aviation & Aircraft', description: 'Airplanes, Helicopters, Ultralights & Gliders', icon: '🛩️', active: true, order: 12 },
  { id: 'commercial-fleets', name: 'Commercial & Service Fleets', description: 'Plumbing, Electrical, HVAC, Service Trucks & Work Vans', icon: '🚛', active: true, order: 13 },
  { id: 'construction', name: 'Construction & Heavy Equipment', description: 'Excavators, Skid Steers, Loaders, Tractors & Machinery', icon: '🏗️', active: true, order: 14 },
  { id: 'trailers', name: 'Trailers & Utility Rigs', description: 'Enclosed Trailers, Car Haulers, Flatbeds & Rigs', icon: '🚚', active: true, order: 15 }
];

const LOCAL_KEY = 'gp_global_vehicle_classes';

// Fetch global vehicle classes (Firestore sync + localStorage fallback)
export async function getGlobalVehicleClasses(): Promise<VehicleClassItem[]> {
  // 1. Try local storage cache first for zero-latency UI
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached vehicle classes:", e);
    }
  }

  // 2. Fetch live settings document from Firestore
  try {
    const docRef = doc(db, 'system_settings', 'vehicle_classes');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.classes) {
      const classes = snap.data()?.classes as VehicleClassItem[];
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(classes));
      }
      return classes;
    }
  } catch (err) {
    console.warn("Using default vehicle classes fallback:", err);
  }

  // 3. Fallback to system defaults
  return DEFAULT_VEHICLE_CLASSES;
}

// Save updated global vehicle classes to Firestore & local cache
export async function saveGlobalVehicleClasses(classes: VehicleClassItem[]): Promise<boolean> {
  // Update local cache immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(classes));
    } catch (e) {}
  }

  try {
    const docRef = doc(db, 'system_settings', 'vehicle_classes');
    await setDoc(docRef, {
      classes,
      updated_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("Failed to save global vehicle classes to Firestore:", err);
    return false;
  }
}

// Smart helper to infer vehicle category from specs, make, model or year
export function inferVehicleCategory(year?: number | string, make?: string, model?: string): string {
  const yearNum = Number(year) || 0;
  const mMake = (make || '').toLowerCase();
  const mModel = (model || '').toLowerCase();

  if (mMake.includes('sea-doo') || mMake.includes('seadoo') || (mMake.includes('yamaha') && mModel.includes('waverunner')) || mModel.includes('pwc') || mModel.includes('boat') || mModel.includes('jet ski')) {
    return 'PWC / Marine';
  }
  if (mMake.includes('harley') || mMake.includes('ducati') || mMake.includes('kawasaki') || (mMake.includes('honda') && (mModel.includes('ninja') || mModel.includes('cbr'))) || (mMake.includes('yamaha') && (mModel.includes('r1') || mModel.includes('r6'))) || mModel.includes('motorcycle') || mModel.includes('bike')) {
    return 'Motorcycles';
  }
  if (mMake.includes('onewheel') || mModel.includes('pev') || mModel.includes('euc') || mModel.includes('skateboard') || mModel.includes('scooter')) {
    return 'Onewheels & PEVs';
  }
  if (mMake.includes('trek') || mMake.includes('specialized') || mMake.includes('cannondale') || mModel.includes('e-bike') || mModel.includes('bicycle')) {
    return 'Bicycles & E-Bikes';
  }
  if (mModel.includes('plumbing') || mModel.includes('hvac') || mModel.includes('electrical') || mModel.includes('sprinter') || mModel.includes('transit') || mModel.includes('promaster') || mModel.includes('work van') || mModel.includes('service van') || mModel.includes('box truck') || mMake.includes('isuzu')) {
    return 'Commercial & Service Fleets';
  }
  if (mMake.includes('caterpillar') || mMake.includes('cat') || mMake.includes('bobcat') || mMake.includes('john deere') || mMake.includes('komatsu') || mModel.includes('excavator') || mModel.includes('loader') || mModel.includes('skid steer') || mModel.includes('backhoe')) {
    return 'Construction & Heavy Equipment';
  }
  if (mMake.includes('ferrari') || mMake.includes('lamborghini') || mMake.includes('mclaren') || mMake.includes('bugatti') || mMake.includes('pagani') || mMake.includes('koenigsegg')) {
    return 'Exotics & Supercars';
  }
  if (mMake.includes('tesla') || mModel.includes('ev') || mModel.includes('electric') || mModel.includes('taycan') || mModel.includes('rivian')) {
    return 'EV & Modern';
  }
  if (mMake.includes('jeep') || mModel.includes('f-150') || mModel.includes('f150') || mModel.includes('silverado') || mModel.includes('ram') || mModel.includes('tacoma') || mModel.includes('bronco') || mModel.includes('truck') || mModel.includes('4x4')) {
    return 'Off-Road / Trucks';
  }
  if (mMake.includes('nissan') || mMake.includes('toyota') || mMake.includes('subaru') || mMake.includes('mazda') || mMake.includes('honda') || mMake.includes('bmw') || mMake.includes('audi')) {
    return 'Imports';
  }
  if (mModel.includes('mustang') || mModel.includes('camaro') || mModel.includes('challenger') || mModel.includes('charger') || mModel.includes('corvette') || mModel.includes('viper')) {
    return 'Muscle';
  }
  if (yearNum > 0 && yearNum <= 1975) {
    return 'Classics';
  }
  return 'Classics';
}
