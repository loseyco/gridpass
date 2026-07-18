import { Metadata } from 'next';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { VehicleProfileClient } from './VehicleProfileClient';

interface SpecItem {
  engine?: string;
  transmission?: string;
  hp?: number | string;
  torque?: number | string;
}

interface CoOwner {
  name: string;
  member_id?: string;
  split?: string;
}

interface DocItem {
  name: string;
  status: string;
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
  specs?: SpecItem;
  mods?: any;
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

async function getVehicleData(vehicleId: string): Promise<VehicleData | null> {
  if (!vehicleId) return null;

  try {
    const docSnap = await getDoc(doc(db, 'vehicles', vehicleId));
    if (docSnap.exists()) {
      const vData = docSnap.data();
      return {
        id: docSnap.id,
        tag_id: vData.tag_id || '',
        owner_id: vData.owner_id || null,
        owner_email: vData.owner_email,
        year: vData.year || 2024,
        make: vData.make || '',
        model: vData.model || '',
        trim: vData.trim,
        vin: vData.vin || '',
        vin_checked: vData.vin_checked === true,
        vin_report: vData.vin_report || null,
        thumbs_up: vData.thumbs_up || 0,
        thumbs_down: vData.thumbs_down || 0,
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
    }
  } catch (err) {
    console.error("Error retrieving server-side vehicle data:", err);
  }
  return null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const vehicle = await getVehicleData(resolvedParams.id);
  
  if (!vehicle) {
    return {
      title: "Vehicle Passport Not Found | Gridpass",
      description: "This Gridpass digital vehicle passport registry does not exist or has been moved."
    };
  }

  const title = `${vehicle.year} ${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()} | Vehicle Passport | Gridpass`;
  const description = vehicle.story 
    ? `Verified Gridpass Vehicle Passport for ${vehicle.year} ${vehicle.make} ${vehicle.model}: "${vehicle.story}"`
    : `Check out this verified ${vehicle.year} ${vehicle.make} ${vehicle.model} on Gridpass. Specs, modifications, maintenance logs, and digital registry details.`;

  const ogImages = vehicle.photo_url ? [{ url: vehicle.photo_url }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://gridpass.app/v/${resolvedParams.id}`,
      siteName: "Gridpass",
      type: "website",
      images: ogImages
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: vehicle.photo_url ? [vehicle.photo_url] : []
    }
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const vehicle = await getVehicleData(resolvedParams.id);

  return (
    <VehicleProfileClient initialVehicle={vehicle} vehicleId={resolvedParams.id} />
  );
}
