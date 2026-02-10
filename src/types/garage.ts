export type VehicleType = 'Sim Rig' | 'Race Car' | 'Street Car' | 'Trailer' | 'Kart' | 'Other';
export type PartStatus = 'good' | 'worn' | 'failed' | 'replaced';
export type LogType = 'maintenance' | 'repair' | 'upgrade' | 'setup';

export interface Vehicle {
    id: string;
    user_id: string;
    name?: string; // Optional in DB schema, but good to have
    type: VehicleType;
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    sim_platform?: string;
    description?: string;
    photo_url?: string; // Matches DB column
    metadata?: Record<string, any>;
    specs?: Record<string, any>; // Used in VehicleCard
    is_for_sale?: boolean;
    price?: number;
    currency?: string;
    sale_description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Tool {
    id: string;
    user_id: string;
    name: string;
    brand?: string;
    category?: string;
    description?: string;
    created_at: string;
    updated_at?: string;
}

export interface Part {
    id: string;
    vehicle_id: string;
    name: string;
    part_number?: string;
    category?: string;
    status: PartStatus;
    installation_date?: string;
    mileage_at_install?: number;
    hours_at_install?: number;
    current_mileage?: number;
    current_hours?: number;
    lifespan_mileage?: number;
    lifespan_hours?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface MaintenanceLog {
    id: string;
    vehicle_id: string;
    date: string;
    title: string;
    description?: string;
    mileage?: number;
    hours?: number;
    cost?: number;
    currency: string;
    performed_by?: string;
    attachment_urls?: string[];
    type: LogType;
    created_at: string;
}

export interface Setup {
    id: string;
    vehicle_id: string;
    name: string;
    track?: string;
    conditions?: string;
    file_url?: string;
    data?: any;
    notes?: string;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}
