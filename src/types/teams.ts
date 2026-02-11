export type MemberRole = 'owner' | 'admin' | 'driver' | 'mechanic' | 'spotter' | 'guest';
export type MemberStatus = 'invited' | 'active' | 'suspended';
export type EventType = 'race' | 'test' | 'track_day' | 'meeting' | 'sim_race';
export type LogisticsCategory = 'general' | 'transport' | 'tools' | 'parts' | 'catering' | 'accommodation';
export type LogisticsStatus = 'needed' | 'assigned' | 'packed' | 'ready';

export interface Team {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    logo_url?: string;
    description?: string;
    invite_code?: string;
    created_at: string;
    updated_at: string;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: MemberRole;
    status: MemberStatus;
    joined_at: string;
    // Joins
    profiles?: {
        full_name: string;
        username: string;
        avatar_url: string;
    };
}

export interface TeamEvent {
    id: string;
    team_id: string;
    name: string;
    type: EventType;
    start_date: string;
    end_date: string;
    location?: string;
    description?: string;
    created_at: string;
    created_by: string;
}

export interface LogisticsItem {
    id: string;
    event_id: string;
    name: string;
    category: LogisticsCategory;
    assigned_to_user_id?: string;
    status: LogisticsStatus;
    quantity: number;
    notes?: string;
    created_at: string;
    // Joins
    assigned_to?: {
        full_name: string;
        avatar_url: string;
    }
}
