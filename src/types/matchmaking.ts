export type RacingSeat = {
    id: string;
    owner_id: string;
    team_id?: string;
    vehicle_id?: string;
    title: string;
    description: string | null;
    price: number | null;
    currency: string;
    event_name: string | null;
    event_date: string | null;
    track_name: string | null;
    car_info: {
        make?: string;
        model?: string;
        class?: string;
        transponder?: string;
    };
    included_items: string[] | null;
    requirements: string[] | null;
    status: 'available' | 'pending' | 'filled' | 'cancelled' | 'expired';
    contact_info: {
        email?: string;
        phone?: string;
        discord?: string;
    } | null;
    created_at: string;
    updated_at: string;
};

export type DriverRequest = {
    id: string;
    user_id: string;
    title: string;
    bio: string | null;
    experience_level: 'rookie' | 'intermediate' | 'advanced' | 'pro' | null;
    budget: number | null;
    currency: string;
    preferred_region: string | null;
    availability_start: string | null;
    availability_end: string | null;
    unavailability_dates: string[] | null;
    willing_to_travel: boolean;
    status: 'active' | 'matched' | 'inactive';
    created_at: string;
    updated_at: string;
};
