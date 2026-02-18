
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
}
