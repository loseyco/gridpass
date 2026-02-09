export type VehicleType = 'Sim Rig' | 'Race Car' | 'Street Car' | 'Trailer' | 'Kart' | 'Other';

export interface Vehicle {
    id: string;
    user_id: string;
    type: VehicleType;
    year?: number;
    make: string;
    model: string;
    description?: string;
    specs?: {
        [key: string]: string | number | boolean;
    };
    photo_url?: string;
    created_at: string;
}

export interface Tool {
    id: string;
    user_id: string;
    category?: string;
    name: string;
    brand?: string;
    description?: string;
    photo_url?: string;
    created_at: string;
}
