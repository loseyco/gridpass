export interface Service {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    price: number | null;
    currency: string;
    image_url: string | null;
    category: string | null;
    tags: string[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ServiceFormData {
    title: string;
    description?: string;
    price?: number;
    currency?: string;
    image_url?: string;
    category?: string;
    tags?: string[];
    is_active?: boolean;
}

export interface ServiceFilters {
    category?: string;
    search?: string;
    userId?: string;
}
