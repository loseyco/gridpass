export type EventFrequency = 'one_time' | 'repeating' | 'permanent_venue';

export interface GridpassEvent {
  id: string;
  host_uid?: string; // The user ID of the creator
  organizer_id?: string;
  owner_id?: string;
  creatorId?: string; // Alternative creator field in Firestore
  host_business_id?: string; // Optional: Link to a business profile ID (e.g. "nielsens")
  host_name?: string; // Optional: Display name of the host organization/business
  host_type?: string; // Optional: Host entity type (e.g. "car_club", "racetrack")
  title?: string;
  name?: string; // Support camelCase name from Firestore
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  frequency?: EventFrequency;
  banner_url?: string;
  cover_url?: string; // Support cover_url alias from Firestore / Facebook style events
  exampleImageUrl?: string; // Support exampleImageUrl field from Firestore
  
  // Staging Staggering Schedule
  date?: string;
  event_date?: string;
  time?: string;
  category?: string;
  start_date?: string; // One-time: Start time
  startDate?: string;  // Support camelCase startDate from Firestore
  start_time?: string;
  start_datetime?: string; // ISO combined datetime-local
  end_date?: string;   // One-time: End time
  endDate?: string;     // Support camelCase endDate from Firestore
  end_time?: string;
  end_datetime?: string; // ISO combined datetime-local
  end_date_text?: string;
  recurrence_rule?: string; // Repeating: e.g. "Every Saturday, 8 AM - 12 PM"
  operating_hours?: string; // Permanent Venue: e.g. "Daily 8 AM - Sunset"
  
  // Location
  location_name?: string; // e.g. "Badlands Trailhead A", "Road America Staging"
  locationName?: string;  // Support camelCase locationName from Firestore
  physical_address?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  geofence_enabled?: boolean;
  geofence_radius_miles?: number; // e.g. 0.25, 0.5, 1.0, 2.0, 5.0
  
  // Gridpass Gate Admission & Registration Entry Rules
  allow_vehicles?: boolean; // Default true: Drivers can stage vehicles on grid
  allow_spectators?: boolean; // Default true: Spectators can RSVP "Going" / "Interested"
  allow_individuals?: boolean; // Support allow_individuals alias
  allow_vendors?: boolean; // Default true: Businesses can submit Vendor Exhibitor RSVPs
  allow_businesses?: boolean; // Support allow_businesses alias
  require_waiver?: boolean; // Driver must sign safety/liability waivers
  require_tech_check?: boolean; // Driver must pass safety/tech checks
  staging_groups?: string[]; // Custom classes e.g. ["Novice", "Advanced", "Main Row"]

  // Event Monetization & Registration Pricing (Default $0.00 Free Entry)
  registration_fee?: number;
  allow_paid_registration?: boolean;
  entry_fee_vehicle?: number; // Fee per vehicle staged (e.g. $0 or $15)
  entry_fee_vendor?: number; // Fee per business exhibitor booth (e.g. $0 or $50)
  entry_fee_spectator?: number; // Fee per spectator ticket (e.g. $0 or $5)
  
  // Reschedule & Weather Alerts
  is_rescheduled?: boolean; // True if event was moved/rescheduled
  original_date?: string; // e.g. "Friday, July 31, 2026"
  original_date_text?: string;
  original_start_date?: string;
  original_start_date_picker?: string;
  original_start_time?: string;
  original_start_datetime?: string;
  original_end_date?: string;
  original_end_date_picker?: string;
  original_end_time?: string;
  original_end_datetime?: string;
  reschedule_notice?: string; // Reason e.g. "Rescheduled due to thunderstorm & lightning forecast"

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
  attendees?: Record<string, {
    uid: string;
    name: string;
    photo_url?: string;
    timestamp: string;
  }>;
  interested?: Record<string, {
    uid: string;
    name: string;
    timestamp: string;
  }>;
  announcements?: Array<{
    id: string;
    author_name: string;
    text: string;
    timestamp: string;
  }>;
  news_items?: EventNewsItem[];
  vendors?: string[]; // Array of Business Profile slug IDs attending/sponsoring
  is_claimed?: boolean; // True if the actual host has claimed ownership of the page
  claim_status?: 'unclaimed' | 'pending_verification' | 'verified';
  is_pro?: boolean; // True if the event has been upgraded to a paid Pro staging tier
  is_archived?: boolean; // True if event has been manually archived or ended
  status?: string; // Status field from Firestore e.g. 'draft', 'upcoming', 'archived', 'completed'
}

export interface EventNewsItem {
  id: string;
  event_id: string;
  title: string;
  url: string;
  source_name?: string; // e.g. "97.7 WMOI Prairie Communications"
  submitted_by_name: string;
  submitted_by_uid: string;
  reports_count: number;
  reported_uids?: string[];
  is_hidden?: boolean;
  timestamp: string;
}

export interface EventClaimRequest {
  id: string;
  event_id: string;
  event_title: string;
  user_uid: string;
  user_name: string;
  role_title: string; // e.g. "Club President", "Event Director"
  contact_email: string;
  contact_phone?: string;
  proof_notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

export interface EventGPSPin {
  id: string;
  event_id: string;
  type: 'vehicle' | 'vendor' | 'attendee' | 'amenity';
  amenity_category?: 'restroom' | 'water' | 'food' | 'parking' | 'first_aid' | 'info';
  name: string;
  label: string; // e.g. "1969 Chevy Camaro", "Keith Patterson Food Truck", "Public Restrooms"
  lat?: number;
  lng?: number;
  address_text?: string;
  zone_name?: string; // e.g. "Monmouth Public Square North"
  photo_url?: string;
  timestamp: string;
  expires_at?: string; // Optional timestamp when live attendee signal auto-fades
}

export interface EventDiscussionPost {
  id: string;
  eventId: string;
  author_uid: string;
  author_name: string;
  author_handle?: string;
  author_avatar?: string;
  category: 'general' | 'question' | 'build' | 'announcement' | 'spot';
  content: string;
  photo_url?: string;
  created_at: string;
  pinned?: boolean;
  likes_count?: number;
  liked_by?: string[];
  reactions?: Record<string, string[]>; // e.g. { fire: ['uid1'], heart: ['uid2'], flag: ['uid3'], clap: [] }
  reported_by?: string[]; // Array of user UIDs who reported this post
  status?: 'active' | 'archived';
  comments?: Array<{
    id: string;
    author_uid: string;
    author_name: string;
    author_avatar?: string;
    text: string;
    created_at: string;
    pinned?: boolean;
  }>;
}
