export type OwnerType = 'user' | 'team';
export type CollectionType = 'Private' | 'Museum' | 'Commercial Fleet' | 'Racing Team' | 'Other';

export interface Collection {
    id: string;
    name: string;
    description?: string | null;
    owner_type: OwnerType;
    owner_id: string;
    location?: string | null;
    type?: CollectionType | null;
    created_at: string;
    updated_at: string;
    // Computed/Joined fields
    vehicle_count?: number;
    image_url?: string | null; // For cover image if we add it later
}

export interface CollectionVehicle {
    id: string;
    collection_id: string | null;
    user_id: string;
    type: string;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    vin?: string | null;
    status?: 'Ready' | 'Service Scheduled' | 'In Transit' | 'Track Prep' | 'Restoration' | 'Storage' | 'Other' | null;
    location?: string | null;
    acquisition_date?: string | null;
    purchase_price?: number | null;
    current_value?: number | null;
    photo_url?: string | null;
    description?: string | null;
    created_at: string;
    updated_at?: string;
}
