import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GridpassEvent } from '../types/events';

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

  // Clean undefined keys before saving to avoid Firestore exceptions
  const cleanData: any = {
    ...eventData,
    id: eventId
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
    return snap.data() as GridpassEvent;
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
    list.push(docSnap.data() as GridpassEvent);
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
    list.push(docSnap.data() as GridpassEvent);
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
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Event does not exist.');
  }

  const entrantKey = `entrants.${vehicleId}`;
  const newEntrantData = {
    vehicle_id: vehicleId,
    make: vehicleData.make,
    model: vehicleData.model,
    year: vehicleData.year,
    owner_name: vehicleData.owner_name,
    photo_url: vehicleData.photo_url || '',
    status: 'registered',
    staging_group: vehicleData.staging_group || 'Pending',
    registered_at: new Date().toISOString()
  };

  await updateDoc(ref, {
    [entrantKey]: newEntrantData
  });
}
