export interface Service {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    price: number;
    currency: string; // Added
    unit: 'fixed' | 'hourly' | 'daily' | 'project' | 'consultation';
    category: string | null; // Added
    tags: string[]; // Added
    photo_url: string | null; // Standardized on photo_url
    is_active: boolean; // Added
    created_at: string;
}

export type ServiceFormData = Omit<Service, 'id' | 'user_id' | 'created_at' | 'price'> & {
    price: number | undefined; // Allow undefined for form inputs
    image_url?: string; // Legacy support or alias if needed, but prefer photo_url
};
