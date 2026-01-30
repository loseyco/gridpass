export type CareerEntry = {
    id: string;
    title: string;
    organization: string;
    type: 'employment' | 'event' | 'contract';
    location?: string;
    start_date: string; // ISO date or YYYY-MM
    end_date?: string;  // ISO date or YYYY-MM
    is_current?: boolean;
    event_name?: string; // Specific for 'event' type, e.g. "Daytona 500"
    description?: string; // Markdown supported or plain text
    highlights?: string[]; // Array of key accomplishments
    vehicle_info?: string; // e.g. "Porsche 911 GT3 R"
};

export const MOCK_CAREER_HISTORY: CareerEntry[] = [
    {
        id: '1',
        title: 'Shop Manager',
        organization: 'GridPass Auto',
        type: 'employment',
        location: 'Austin, TX',
        start_date: '2024-01',
        is_current: true,
        description: 'Managing daily operations of a 5-bay performance shop.',
        highlights: ['Increased revenue by 20%', 'Implemented new inventory system']
    },
    {
        id: '2',
        title: 'Data Engineer',
        organization: 'Generic Racing Team',
        event_name: 'Rolex 24 at Daytona',
        type: 'event',
        location: 'Daytona Beach, FL',
        start_date: '2024-01-25',
        end_date: '2024-01-29',
        description: 'Managed telemetry and fuel strategy for the 24 hour endurance race.',
        highlights: ['Zero data dropouts', 'Strategy call resulted in podium finish']
    }
]
