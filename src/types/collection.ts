export type CollectionVisibility = 'Public' | 'Private' | 'Unlisted' | 'Team';

export interface Collection {
    id: string;
    name: string;
    description?: string | null;
    owner_type: 'user' | 'team';
    owner_id: string;
    location?: string | null;
    type?: string | null;
    visibility: CollectionVisibility;
    created_at: string;
    updated_at: string;
}
