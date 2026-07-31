export type EventFrequency = 'one_time' | 'repeating' | 'permanent_venue';

export interface GridpassEvent {
  id: string;
  host_uid: string; // The user ID of the creator
  host_business_id?: string; // Optional: Link to a business profile ID (e.g. "nielsens")
  title: string;
  description: string;
  frequency: EventFrequency;
  banner_url?: string;
  
  // Staging Staggering Schedule
  start_date?: string; // One-time: Start time
  end_date?: string;   // One-time: End time
  recurrence_rule?: string; // Repeating: e.g. "Every Saturday, 8 AM - 12 PM"
  operating_hours?: string; // Permanent Venue: e.g. "Daily 8 AM - Sunset"
  
  // Location
  location_name: string; // e.g. "Badlands Trailhead A", "Road America Staging"
  physical_address?: string;
  
  // Gridpass Gate Admission Rules
  require_waiver: boolean; // Driver must sign safety/liability waivers
  require_tech_check: boolean; // Driver must pass safety/tech checks
  staging_groups: string[]; // Custom classes e.g. ["Novice", "Advanced", "Main Row"]
  
  // Entrants list (active Gridpasses)
  entrants?: Record<string, {
    vehicle_id: string;
    make: string;
    model: string;
    year: number;
    owner_name: string;
    photo_url: string;
    status: 'registered' | 'checked_in' | 'tech_passed';
    staging_group?: string;
    checked_in_at?: string;
  }>;
  vendors?: string[]; // Array of Business Profile slug IDs attending/sponsoring
  is_claimed?: boolean; // True if the actual host has claimed ownership of the page
  is_pro?: boolean; // True if the event has been upgraded to a paid Pro staging tier
}
