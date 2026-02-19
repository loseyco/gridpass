
export interface AgencyJob {
    id: string;
    user_id: string;
    title: string;
    company_name: string | null;
    role: string | null;
    description: string | null;
    location: string | null;
    salary_range: string | null;
    commission_config: {
        type: 'percentage' | 'fixed';
        value: number;
    } | null;
    status: 'open' | 'closed' | 'filled';
    requirements: string[] | null;
    external_url: string | null;
    created_at: string;
}

export interface AgencyCandidate {
    id: string;
    user_id: string;
    name: string;
    role: string | null;
    primary_skill: string | null;
    skills: string[] | null;
    status: 'new' | 'approved' | 'contacted' | 'claimed' | 'archived';
    source_type?: 'lead' | 'profile'; // defaults to 'lead' if undefined for backward compat
    source_link: string | null;
    resume_url: string | null;
    linkedin_url: string | null;
    desired_salary: string | null;
    notes: string | null;
    contact_info: any; // Too flexible to type strictly right now
    created_at: string;
    username?: string; // For profiles
    // Extended Profile Data
    date_of_birth?: string | null;
    availability?: string | null;
    relocation_prefs?: {
        willing: boolean;
        locations?: string[];
    } | null;
    logistics_info?: {
        hometown?: string;
        home_airport?: string;
        passport_status?: boolean;
        drivers_license_state?: string;
    } | null;
    physical_info?: {
        height?: string;
        weight?: string;
        helmet_size?: string;
        suit_size?: string;
        shoe_size?: string;
        glove_size?: string;
    } | null;
    social_links?: Record<string, string> | null;
    work_history?: any[] | null;
}

export interface AgencyPlacement {
    id: string;
    job_id: string;
    lead_id: string;
    recruiter_id: string;
    status: 'pending' | 'applied' | 'interviewing' | 'offered' | 'hired' | 'invoiced' | 'paid' | 'rejected';
    fee_amount: number;
    currency: string;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    job?: AgencyJob;
    candidate?: AgencyCandidate;
}

export interface AgencyGig {
    id: string;
    organization_id?: string;
    created_by: string;
    title: string;
    role: string;
    description?: string;
    location?: string;
    start_date: string;
    end_date: string;
    is_urgent: boolean;
    daily_rate?: number;
    currency: string;
    status: 'open' | 'filled' | 'cancelled' | 'completed';
    requirements?: string[];
    created_at: string;
    updated_at: string;
}

export interface UserAvailability {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    status: 'available' | 'booked' | 'unavailable';
    notes?: string;
    created_at: string;
    updated_at: string;
}
