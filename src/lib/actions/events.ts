import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GridpassEvent } from '../types/events';

/**
 * Calculates distance in miles between two GPS coordinates using Haversine formula.
 */
export function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Publishes a new motorsport event or updates an existing one.
 */
export async function publishEvent(eventData: Omit<GridpassEvent, 'id'> & { id?: string }): Promise<string> {
  let ref;
  let eventId = eventData.id;

  if (eventId) {
    ref = doc(db, 'events', eventId);
  } else {
    // Generate an automatic doc reference
    const coll = collection(db, 'events');
    ref = doc(coll);
    eventId = ref.id;
  }

  const nowIso = new Date().toISOString();
  const cleanData: any = {
    ...eventData,
    id: eventId,
    updatedAt: nowIso,
    createdAt: eventData.createdAt || nowIso
  };
  
  for (const key of Object.keys(cleanData)) {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  }

  await setDoc(ref, cleanData);
  return eventId;
}

/**
 * Fetches an event by its ID.
 */
export async function getEvent(id: string): Promise<GridpassEvent | null> {
  const ref = doc(db, 'events', id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return {
      id: snap.id,
      ...snap.data()
    } as GridpassEvent;
  }
  return null;
}

/**
 * Fetches all events created by a specific user UID.
 */
export async function getEventsByHost(hostUid: string): Promise<GridpassEvent[]> {
  const ref = collection(db, 'events');
  const q = query(ref, where('host_uid', '==', hostUid));
  const snap = await getDocs(q);
  const list: GridpassEvent[] = [];
  snap.forEach(docSnap => {
    list.push({
      id: docSnap.id,
      ...docSnap.data()
    } as GridpassEvent);
  });
  return list;
}

/**
 * Fetches all events hosted by a specific Business profile slug ID.
 */
export async function getEventsByBusiness(businessId: string): Promise<GridpassEvent[]> {
  const ref = collection(db, 'events');
  const q = query(ref, where('host_business_id', '==', businessId));
  const snap = await getDocs(q);
  const list: GridpassEvent[] = [];
  snap.forEach(docSnap => {
    list.push({
      id: docSnap.id,
      ...docSnap.data()
    } as GridpassEvent);
  });
  return list;
}

/**
 * Registers a vehicle as an entrant to a motorsport event.
 */
export async function registerVehicleToEvent(
  eventId: string,
  vehicleId: string,
  driverUid: string,
  vehicleData: {
    make: string;
    model: string;
    year: number;
    owner_name: string;
    photo_url: string;
    staging_group?: string;
  }
): Promise<void> {
  const ref = doc(db, 'events', eventId);

  const newEntrantData = {
    vehicle_id: vehicleId,
    owner_uid: driverUid,
    make: vehicleData.make,
    model: vehicleData.model,
    year: vehicleData.year,
    owner_name: vehicleData.owner_name,
    photo_url: vehicleData.photo_url || '',
    status: 'registered',
    staging_group: vehicleData.staging_group || 'Pending',
    registered_at: new Date().toISOString()
  };

  await setDoc(ref, {
    entrants: {
      [vehicleId]: newEntrantData
    }
  }, { merge: true });
}
